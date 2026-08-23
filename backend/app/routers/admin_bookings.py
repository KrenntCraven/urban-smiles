import re
from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy import ColumnElement, Select, String, and_, cast, func, or_, select
from sqlalchemy.orm import Session, selectinload

from ..auth import require_admin
from ..db import get_db
from ..models import Booking, BookingFile, BookingStatus
from ..schemas import AdminBookingOut, BookingListOut, ProofOut, RejectIn

router = APIRouter(prefix="/api/v1/admin/bookings", tags=["admin-bookings"])


def serialize(booking: Booking) -> AdminBookingOut:
    return AdminBookingOut(
        id=booking.id,
        patient_name=booking.patient_name,
        phone=booking.phone,
        email=booking.email,
        branch_id=booking.branch_id,
        branch_name=booking.branch_name,
        service_slug=booking.service_slug,
        service_name=booking.service_name,
        appointment_date=booking.appointment_date,
        appointment_time=booking.appointment_time,
        coverage_type=booking.coverage_type,
        hmo_provider=booking.hmo_provider,
        hmo_member_id=booking.hmo_member_id,
        is_new_patient=booking.is_new_patient,
        notes=booking.notes,
        submitted_at=booking.created_at,
        status=booking.status,  # type: ignore[arg-type]
        proofs=[
            ProofOut(
                kind=file.kind,
                filename=file.filename,
                url=f"/api/v1/admin/bookings/{booking.id}/files/{file.kind}",
            )
            for file in booking.files
        ],
        review_note=booking.review_note,
    )


MIN_PHONE_DIGITS = 3


def national_number(digits: str) -> str:
    """Reduce a Philippine mobile to its national number, as the UI does."""
    trimmed = digits.lstrip("0")
    if trimmed.startswith("63"):
        trimmed = trimmed[2:]
    return trimmed


def search_clause(term: str) -> Optional[ColumnElement[bool]]:
    """
    Every word must match, but each word may match a different column, so
    "cruz maxicare" finds the Cruz record covered by Maxicare. Phone and member
    ID are also compared digits-only: the stored mobile keeps whichever prefix
    the patient typed (+639... or 09...), which a plain LIKE would miss.
    """
    tokens = [token for token in term.strip().split() if token]
    if not tokens:
        return None

    clauses: list[ColumnElement[bool]] = []
    for token in tokens:
        needle = f"%{token}%"
        options: list[ColumnElement[bool]] = [
            Booking.patient_name.ilike(needle),
            Booking.email.ilike(needle),
            Booking.phone.ilike(needle),
            Booking.id.ilike(needle),
            Booking.service_name.ilike(needle),
            Booking.branch_name.ilike(needle),
            Booking.hmo_provider.ilike(needle),
            Booking.hmo_member_id.ilike(needle),
            Booking.notes.ilike(needle),
            cast(Booking.appointment_date, String).ilike(needle),
        ]

        digits = re.sub(r"\D+", "", token)
        if digits:
            national = national_number(digits)
            if len(national) >= MIN_PHONE_DIGITS:
                options.append(
                    func.regexp_replace(Booking.phone, r"^(\+?63|0)", "").ilike(
                        f"%{national}%"
                    )
                )
            options.append(
                func.regexp_replace(Booking.hmo_member_id, r"\D", "", "g").ilike(
                    f"%{digits}%"
                )
            )

        clauses.append(or_(*options))

    return and_(*clauses)


def load_booking(db: Session, booking_id: str) -> Booking:
    booking = db.scalar(
        select(Booking)
        .options(selectinload(Booking.files))
        .where(Booking.id == booking_id)
    )
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found.")
    return booking


@router.get("", response_model=BookingListOut)
def list_bookings(
    _: str = Depends(require_admin),
    db: Session = Depends(get_db),
    status_filter: Optional[Literal["pending", "approved", "rejected"]] = Query(
        default="pending",
        alias="status",
    ),
    q: Optional[str] = None,
    branch: Optional[str] = None,
    sort: Literal["date_asc", "date_desc"] = "date_desc",
) -> BookingListOut:
    stmt: Select[tuple[Booking]] = select(Booking).options(
        selectinload(Booking.files)
    )
    if status_filter:
        stmt = stmt.where(Booking.status == status_filter)
    if branch:
        stmt = stmt.where(Booking.branch_id == branch)
    if q:
        clause = search_clause(q)
        if clause is not None:
            stmt = stmt.where(clause)

    order = Booking.appointment_date.asc() if sort == "date_asc" else Booking.appointment_date.desc()
    time_order = (
        Booking.appointment_time.asc()
        if sort == "date_asc"
        else Booking.appointment_time.desc()
    )
    rows = db.scalars(stmt.order_by(order, time_order, Booking.id.asc())).all()
    return BookingListOut(items=[serialize(row) for row in rows])


@router.post("/{booking_id}/approve", response_model=AdminBookingOut)
def approve_booking(
    booking_id: str,
    _: str = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminBookingOut:
    booking = load_booking(db, booking_id)
    booking.status = BookingStatus.approved.value
    booking.review_note = None
    booking.decided_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(booking)
    return serialize(booking)


@router.post("/{booking_id}/reject", response_model=AdminBookingOut)
def reject_booking(
    booking_id: str,
    payload: RejectIn,
    _: str = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminBookingOut:
    booking = load_booking(db, booking_id)
    booking.status = BookingStatus.rejected.value
    booking.review_note = payload.reason.strip()
    booking.decided_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(booking)
    return serialize(booking)


@router.get("/{booking_id}/files/{kind}")
def booking_file(
    booking_id: str,
    kind: str,
    _: str = Depends(require_admin),
    db: Session = Depends(get_db),
) -> FileResponse:
    file = db.scalar(
        select(BookingFile).where(
            BookingFile.booking_id == booking_id,
            BookingFile.kind == kind,
        )
    )
    if file is None:
        raise HTTPException(status_code=404, detail="File not found.")
    return FileResponse(
        file.storage_path,
        media_type=file.mime_type,
        filename=file.filename,
        content_disposition_type="inline",
    )
