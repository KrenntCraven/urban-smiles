from datetime import date, datetime, time
from typing import Literal, Optional

from pydantic import BaseModel, Field


class ProofOut(BaseModel):
    kind: str
    filename: str
    url: str


class AdminBookingOut(BaseModel):
    id: str
    patient_name: str
    phone: str
    email: Optional[str] = None
    branch_id: str
    branch_name: str
    service_slug: str
    service_name: str
    appointment_date: date
    appointment_time: time
    coverage_type: str
    hmo_provider: Optional[str] = None
    hmo_member_id: Optional[str] = None
    is_new_patient: bool = False
    notes: Optional[str] = None
    submitted_at: Optional[datetime] = None
    status: Literal["pending", "approved", "rejected"]
    proofs: list[ProofOut]
    review_note: Optional[str] = None


class BookingListOut(BaseModel):
    items: list[AdminBookingOut]


class RejectIn(BaseModel):
    reason: str = Field(min_length=3, max_length=500)
