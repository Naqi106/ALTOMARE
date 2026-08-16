"""
db_schema.py — Creates all 7 AltoMare tables with zone_id as VARCHAR
"""

import psycopg2
from dotenv import load_dotenv
import os

load_dotenv('.env.local')
DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in .env.local")
    exit(1)

print(f"Connecting to database...")

try:
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    print("✓ Connected!")
    
    print("Enabling PostGIS...")
    cursor.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
    print("✓ PostGIS enabled")
    
    print("Creating zones table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS zones (
            zone_id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            geometry geometry(Polygon, 4326),
            pipe_age_years INT,
            population INT,
            data_level INT CHECK (data_level IN (0, 1, 2)),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    print("✓ zones")
    
    print("Creating raw_readings table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS raw_readings (
            reading_id SERIAL PRIMARY KEY,
            zone_id VARCHAR(50) NOT NULL REFERENCES zones(zone_id),
            type VARCHAR(50) CHECK (type IN ('inflow', 'pressure', 'flow')),
            value FLOAT NOT NULL,
            unit VARCHAR(50),
            timestamp TIMESTAMP NOT NULL,
            source VARCHAR(50) CHECK (source IN ('sensor', 'manual')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_raw_readings_zone_time ON raw_readings(zone_id, timestamp);
    """)
    print("✓ raw_readings + index")
    
    print("Creating billing_records table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS billing_records (
            record_id SERIAL PRIMARY KEY,
            zone_id VARCHAR(50) NOT NULL REFERENCES zones(zone_id),
            household_id VARCHAR(100) NOT NULL,
            billed_litres FLOAT NOT NULL,
            benchmark_litres FLOAT,
            billing_period VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_billing_zone ON billing_records(zone_id, household_id);
    """)
    print("✓ billing_records + index")
    
    print("Creating leak_alerts table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS leak_alerts (
            alert_id SERIAL PRIMARY KEY,
            zone_id VARCHAR(50) NOT NULL REFERENCES zones(zone_id),
            estimated_loss_litres FLOAT,
            confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
            method VARCHAR(50) CHECK (method IN ('water_balance', 'mnf', 'ppa')),
            timestamp TIMESTAMP NOT NULL,
            status VARCHAR(50) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_leak_alerts_zone_time ON leak_alerts(zone_id, timestamp);
    """)
    print("✓ leak_alerts + index")
    
    print("Creating quality_readings table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS quality_readings (
            reading_id SERIAL PRIMARY KEY,
            zone_id VARCHAR(50) NOT NULL REFERENCES zones(zone_id),
            ph FLOAT,
            turbidity FLOAT,
            tds FLOAT,
            chlorine FLOAT,
            bacteria_cfu INT,
            hardness FLOAT,
            timestamp TIMESTAMP NOT NULL,
            source VARCHAR(50) CHECK (source IN ('sensor', 'manual')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_quality_zone_time ON quality_readings(zone_id, timestamp);
    """)
    print("✓ quality_readings + index")
    
    print("Creating correlation_events table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS correlation_events (
            event_id SERIAL PRIMARY KEY,
            zone_id VARCHAR(50) NOT NULL REFERENCES zones(zone_id),
            leak_alert_id INT REFERENCES leak_alerts(alert_id),
            quality_reading_id INT REFERENCES quality_readings(reading_id),
            leak_caused_contamination BOOLEAN,
            risk_level VARCHAR(50) CHECK (risk_level IN ('SAFE', 'WARNING', 'ALERT', 'CRITICAL')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_correlation_zone ON correlation_events(zone_id);
    """)
    print("✓ correlation_events + index")
    
    print("Creating revenue_log table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS revenue_log (
            log_id SERIAL PRIMARY KEY,
            zone_id VARCHAR(50) NOT NULL REFERENCES zones(zone_id),
            leak_alert_id INT REFERENCES leak_alerts(alert_id),
            litres_recovered FLOAT,
            amount_recovered FLOAT,
            billing_cycle VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_revenue_zone ON revenue_log(zone_id);
    """)
    print("✓ revenue_log + index")
    
    conn.commit()
    print("\n✅ All 7 tables created successfully with zone_id as VARCHAR!")
    conn.close()
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
    try:
        conn.rollback()
        conn.close()
    except:
        pass
    exit(1)