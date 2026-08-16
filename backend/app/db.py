"""
DATABASE CONNECTION — owned by Naqi
Connects the backend to Ayantika's Supabase (PostgreSQL) instance.

Everyone: do NOT write raw connection strings directly in your own
files. Import get_db() from here, so credentials live in one place
(the .env file, which is gitignored) and are easy to update.

Usage in a router or engine file:

    from app.db import get_db
    from sqlalchemy import text

    def some_function():
        db = next(get_db())
        result = db.execute(text("SELECT * FROM zones")).fetchall()
        db.close()
        return result
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL not found. Make sure a .env file exists in the "
        "backend/ folder with a line like:\n"
        "DATABASE_URL=postgresql://user:password@host:port/dbname"
    )

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI-style dependency / simple generator for a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
