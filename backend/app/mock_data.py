"""
Day 1 ONLY: fake in-memory data so every endpoint returns something
realistic before Ayantika's real PostgreSQL database is wired in
(that happens Day 2 for /zones and /readings, later for the rest).

Nothing here is permanent - this whole file gets deleted once real
DB calls replace it.
"""

from datetime import datetime, timedelta

MOCK_ZONES = [
    {"zone_id": "zone_1", "name": "Zone 1 - Near Treatment Plant", "pipe_age_years": 8, "population": 4200, "data_level": 2},
    {"zone_id": "zone_2", "name": "Zone 2 - Market Area", "pipe_age_years": 15, "population": 6100, "data_level": 1},
    {"zone_id": "zone_3", "name": "Zone 3 - Residential East", "pipe_age_years": 22, "population": 5300, "data_level": 0},
    {"zone_id": "zone_4", "name": "Zone 4 - Old Town", "pipe_age_years": 41, "population": 3800, "data_level": 0},
    {"zone_id": "zone_5", "name": "Zone 5 - Outer Village Cluster", "pipe_age_years": 12, "population": 2600, "data_level": 1},
]

MOCK_ALERTS = [
    {
        "alert_id": "alert_1",
        "zone_id": "zone_4",
        "estimated_loss_litres": 3200.0,
        "confidence_score": 82.0,
        "method": "water_balance",
        "timestamp": (datetime.utcnow() - timedelta(hours=6)).isoformat(),
        "status": "active",
    },
    {
        "alert_id": "alert_2",
        "zone_id": "zone_2",
        "estimated_loss_litres": 950.0,
        "confidence_score": 61.0,
        "method": "mnf",
        "timestamp": (datetime.utcnow() - timedelta(hours=20)).isoformat(),
        "status": "monitoring",
    },
]

MOCK_CORRELATIONS = {
    "zone_4": {
        "event_id": "corr_1",
        "zone_id": "zone_4",
        "leak_alert_id": "alert_1",
        "quality_reading_id": "qr_9",
        "leak_caused_contamination": True,
        "risk_level": "critical",
    },
    "zone_2": {
        "event_id": "corr_2",
        "zone_id": "zone_2",
        "leak_alert_id": "alert_2",
        "quality_reading_id": None,
        "leak_caused_contamination": False,
        "risk_level": "monitor",
    },
}

MOCK_REVENUE_SUMMARY = {
    "total_recovered": 184500.0,
    "by_zone": {
        "zone_1": 12000.0,
        "zone_2": 41500.0,
        "zone_3": 9000.0,
        "zone_4": 98000.0,
        "zone_5": 24000.0,
    },
}
