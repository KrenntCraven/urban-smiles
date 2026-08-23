from __future__ import annotations

from datetime import date, datetime, time
from enum import Enum
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, Text, Time
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class BookingStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class CoverageType(str, Enum):
    hmo = "hmo"
    self_pay = "self-pay"


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    patient_name: Mapped[str] = mapped_column(String(160))
    phone: Mapped[str] = mapped_column(String(20))
    email: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    branch_id: Mapped[str] = mapped_column(String(32), index=True)
    branch_name: Mapped[str] = mapped_column(String(120))
    service_slug: Mapped[str] = mapped_column(String(80))
    service_name: Mapped[str] = mapped_column(String(160))
    appointment_date: Mapped[date] = mapped_column(Date, index=True)
    appointment_time: Mapped[time] = mapped_column(Time)
    coverage_type: Mapped[str] = mapped_column(String(16))
    hmo_provider: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    hmo_member_id: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    is_new_patient: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(16), index=True, default=BookingStatus.pending.value)
    review_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    decided_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    files: Mapped[list["BookingFile"]] = relationship(
        back_populates="booking",
        cascade="all, delete-orphan",
    )


class BookingFile(Base):
    __tablename__ = "booking_files"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    booking_id: Mapped[str] = mapped_column(ForeignKey("bookings.id"), index=True)
    kind: Mapped[str] = mapped_column(String(32))
    filename: Mapped[str] = mapped_column(String(255))
    mime_type: Mapped[str] = mapped_column(String(80))
    storage_path: Mapped[str] = mapped_column(String(500))

    booking: Mapped[Booking] = relationship(back_populates="files")
