from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Optional

import httpx

from .schemas import AdminBookingOut, BookingListOut, ProofOut


def supabase_configured() -> bool:
    return bool(
        os.environ.get("SUPABASE_URL", "").strip()
        and os.environ.get("SUPABASE_SECRET_KEY", "").strip()
    )


def _base() -> str:
    return os.environ["SUPABASE_URL"].rstrip("/")


def _key() -> str:
    return os.environ["SUPABASE_SECRET_KEY"].strip()


def _headers() -> dict[str, str]:
    key = _key()
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def _client() -> httpx.Client:
    return httpx.Client(headers=_headers(), timeout=30.0)


def _admin_status(status: str) -> str:
    return "pending" if status == "pending_verification" else status


def serialize_row(row: dict[str, Any]) -> AdminBookingOut:
    booking_id = str(row["id"])
    files = row.get("booking_files") or []
    return AdminBookingOut(
        id=booking_id,
        patient_name=row["patient_name"],
        phone=row["phone"],
        email=row.get("email"),
        branch_id=row["branch_id"],
        branch_name=row["branch_name"],
        service_slug=row["service_slug"],
        service_name=row["service_name"],
        appointment_date=row["appointment_date"],
        appointment_time=row["appointment_time"],
        coverage_type=row["coverage_type"],
        hmo_provider=row.get("hmo_provider"),
        hmo_member_id=row.get("hmo_member_id"),
        is_new_patient=bool(row.get("is_new_patient")),
        notes=row.get("notes"),
        submitted_at=row.get("created_at"),
        status=_admin_status(str(row.get("status") or "pending")),  # type: ignore[arg-type]
        proofs=[
            ProofOut(
                kind=file["kind"],
                filename=file["filename"],
                url=f"/api/v1/admin/bookings/{booking_id}/files/{file['kind']}",
            )
            for file in files
        ],
        review_note=row.get("review_note"),
        decided_at=row.get("decided_at"),
    )


def fetch_booking(booking_id: str) -> dict[str, Any]:
    with _client() as client:
        response = client.get(
            f"{_base()}/rest/v1/bookings",
            params={"id": f"eq.{booking_id}", "select": "*,booking_files(*)"},
        )
        response.raise_for_status()
        rows = response.json()
    if not rows:
        raise LookupError("Booking not found.")
    return rows[0]


def list_rows(
    status: Optional[str],
    q: Optional[str],
    branch: Optional[str],
    sort: str,
) -> BookingListOut:
    params: dict[str, str] = {
        "select": "*,booking_files(*)",
        "order": "appointment_date.asc,appointment_time.asc"
        if sort == "date_asc"
        else "appointment_date.desc,appointment_time.desc",
    }
    stored_status = (
        "pending_verification" if status == "pending" else status
    )
    if stored_status and stored_status != "all":
        params["status"] = f"eq.{stored_status}"
    if branch:
        params["branch_id"] = f"eq.{branch}"

    with _client() as client:
        response = client.get(f"{_base()}/rest/v1/bookings", params=params)
        response.raise_for_status()
        rows: list[dict[str, Any]] = response.json()

    items = [serialize_row(row) for row in rows]
    if q:
        needle = q.strip().lower()
        items = [
            item
            for item in items
            if needle
            in " ".join(
                [
                    item.patient_name,
                    item.phone,
                    item.email or "",
                    item.id,
                    item.service_name,
                    item.branch_name,
                    item.hmo_provider or "",
                    item.hmo_member_id or "",
                    item.notes or "",
                ]
            ).lower()
        ]
    return BookingListOut(items=items)


def set_status(booking_id: str, status: str, note: Optional[str]) -> AdminBookingOut:
    payload = {
        "status": "approved" if status == "approved" else "rejected",
        "decision": "approved" if status == "approved" else "rejected",
        "review_note": note,
        "decided_at": datetime.now(timezone.utc).isoformat(),
    }
    with _client() as client:
        response = client.patch(
            f"{_base()}/rest/v1/bookings",
            params={"id": f"eq.{booking_id}"},
            json=payload,
        )
        response.raise_for_status()
    return serialize_row(fetch_booking(booking_id))


def download_file(booking_id: str, kind: str) -> tuple[bytes, str, str]:
    row = fetch_booking(booking_id)
    match = next((file for file in (row.get("booking_files") or []) if file["kind"] == kind), None)
    if match is None:
        raise LookupError("File not found.")

    with _client() as client:
        response = client.get(
            f"{_base()}/storage/v1/object/{match['bucket']}/{match['storage_path']}",
            headers={"Accept": "*/*"},
        )
        response.raise_for_status()
        return response.content, match["mime_type"], match["filename"]
