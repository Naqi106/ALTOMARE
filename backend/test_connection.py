"""
Quick test: confirms the Supabase connection actually works and lists
the tables Ayantika created. Run this once, then delete it (or keep
it around for future debugging — it's harmless either way).

Run with: python test_connection.py
"""

from app.db import get_db
from sqlalchemy import text

db = next(get_db())

print("Connection successful. Checking tables...\n")

result = db.execute(text("""
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
"""))

tables = [row[0] for row in result]
print("Tables found in Supabase:")
for t in tables:
    print(f"  - {t}")

# Bonus: pull actual zone data to confirm it's really Ayantika's data
print("\nSample data from 'zones' table:")
zones = db.execute(text("SELECT zone_id, name, pipe_age_years, population FROM zones LIMIT 5;"))
for row in zones:
    print(f"  {row}")

db.close()
