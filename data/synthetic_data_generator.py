"""
synthetic_data_generator.py — Creates data with zone_id as VARCHAR strings like "zone_1", "zone_2"
"""

import psycopg2
from datetime import datetime, timedelta
import random
from dotenv import load_dotenv
import os

load_dotenv('.env.local')
DATABASE_URL = os.getenv('DATABASE_URL')

conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

print("📍 Creating 10 zones...")
zones = []
zone_specs = [
    ("zone_1", "Downtown Core", 45, 12000, 1),
    ("zone_2", "Suburban North", 28, 8500, 0),
    ("zone_3", "Industrial Belt", 60, 3000, 1),
    ("zone_4", "Residential East", 35, 15000, 0),
    ("zone_5", "Hillside Extension", 15, 6000, 0),
    ("zone_6", "Downtown West", 50, 9000, 1),
    ("zone_7", "Rural Junction", 55, 2500, 0),
    ("zone_8", "Satellite Colony", 12, 5500, 0),
    ("zone_9", "Commerce Park", 40, 1200, 1),
    ("zone_10", "Riverside District", 38, 7000, 0),
]

for zone_id, name, pipe_age, population, data_level in zone_specs:
    cursor.execute(
        "INSERT INTO zones (zone_id, name, pipe_age_years, population, data_level) VALUES (%s, %s, %s, %s, %s)",
        (zone_id, name, pipe_age, population, data_level)
    )
    zones.append(zone_id)
    print(f"  ✓ {zone_id}: {name}")

conn.commit()

print("\n Creating households with benchmarks...")
households = {}
for zone_id in zones:
    num_households = random.randint(5, 15)
    theft_households_this_zone = []
    
    # Intentionally seed 2-3 theft households per zone
    if zone_id in ["zone_1", "zone_4"]:
        theft_households_this_zone = [2, 4]  # Households 2 & 4 are tampered
    elif zone_id == "zone_2":
        theft_households_this_zone = [3]  # Household 3 is tampered
    
    for h_idx in range(1, num_households + 1):
        household_id = f"{zone_id}_H{h_idx:02d}"
        household_size = random.choice([3, 4, 4, 5, 5, 6, 6, 7, 8])
        benchmark_litres = household_size * 150
        
        # If this is a theft household, bill it way below benchmark
        if h_idx in theft_households_this_zone:
            billed_litres = benchmark_litres * random.uniform(0.3, 0.6)  # 30-60% of benchmark
        else:
            billed_litres = benchmark_litres * random.uniform(0.85, 1.05)
        
        households[household_id] = {
            'zone_id': zone_id,
            'benchmark_litres': benchmark_litres,
            'billed_litres': billed_litres
        }

print(f"  ✓ {len(households)} households created")

print("\n💳 Populating 3 months of billing records...")
base_date = datetime.now() - timedelta(days=90)

for household_id, house_info in households.items():
    zone_id = house_info['zone_id']
    for month in range(1, 4):
        billing_date = base_date + timedelta(days=30 * (month - 1))
        billing_period = billing_date.strftime("%Y-%m")
        daily_variation = random.uniform(0.95, 1.05)
        monthly_billed = house_info['billed_litres'] * 30 * daily_variation
        
        cursor.execute(
            "INSERT INTO billing_records (zone_id, household_id, billed_litres, benchmark_litres, billing_period) VALUES (%s, %s, %s, %s, %s)",
            (zone_id, household_id, monthly_billed, house_info['benchmark_litres'] * 30, billing_period)
        )

conn.commit()
print(f"  ✓ {len(households) * 3} billing records created")

print("\n📊 Populating raw inflow readings (90 days)...")
for zone_id in zones:
    total_zone_billed = sum(
        h['billed_litres'] * 30 
        for h in households.values() 
        if h['zone_id'] == zone_id
    )
    leak_multiplier = 1.35 if zone_id == "zone_3" else 1.05
    
    for day_offset in range(90):
        reading_date = base_date + timedelta(days=day_offset)
        daily_inflow = (total_zone_billed / 30) * leak_multiplier * random.uniform(0.95, 1.05)
        
        cursor.execute(
            "INSERT INTO raw_readings (zone_id, type, value, unit, timestamp, source) VALUES (%s, %s, %s, %s, %s, %s)",
            (zone_id, 'inflow', daily_inflow, 'litres', reading_date, 'manual')
        )

conn.commit()
print(f"  ✓ {len(zones) * 90} inflow readings created")

print("\n🧪 Populating quality readings...")
for zone_id in zones:
    for week in range(13):
        reading_date = base_date + timedelta(days=week * 7)
        is_alert_week = (zone_id == "zone_3" and week >= 8)
        
        ph = 7.2
        turbidity = 8 if is_alert_week else 0.5
        tds = 250
        chlorine = 0.8
        bacteria_cfu = 0
        hardness = 100
        
        cursor.execute(
            "INSERT INTO quality_readings (zone_id, ph, turbidity, tds, chlorine, bacteria_cfu, hardness, timestamp, source) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (zone_id, ph, turbidity, tds, chlorine, bacteria_cfu, hardness, reading_date, 'manual')
        )

conn.commit()
print(f"  ✓ {len(zones) * 13} quality readings created")

print("\n✅ SYNTHETIC DATA READY!")
print(f"  Zones: {len(zones)}")
print(f"  Households: {len(households)}")
print(f"  Billing records: {len(households) * 3}")
print(f"  Raw readings: {len(zones) * 90}")
print(f"  Quality readings: {len(zones) * 13}")

conn.close()
