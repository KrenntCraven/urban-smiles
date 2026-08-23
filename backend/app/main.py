from fastapi import FastAPI

from .db import init_db
from .routers.admin_bookings import router as admin_bookings_router

app = FastAPI(title="Urban Smiles API")
app.include_router(admin_bookings_router)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
