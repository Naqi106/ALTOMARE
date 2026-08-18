"""
REVENUE ENGINE — owned by Piyush (built by Naqi covering for him, Day 3)
Revenue Recovered tracker + ROI-based repair prioritization.

Formulas from Section 7.2 / 7.3 of the Master Execution Document:
    Revenue Recovered = Litres recovered after fix x Local water tariff rate
    Payback period ~= Estimated repair cost / Daily revenue loss from that zone

TARIFF_RATE is a placeholder (Rs 5 per 1000 litres = Rs 0.005/litre, a
common Indian municipal rate) — change this one constant if the team
wants a different number for the demo.
"""

TARIFF_RATE_PER_LITRE = 0.005  # Rs per litre — adjust here if needed


def calculate_revenue_recovered(litres_recovered: float, tariff_rate: float = TARIFF_RATE_PER_LITRE) -> float:
    """
    Section 7.2: Revenue Recovered = Litres recovered after fix x tariff rate.
    """
    return round(litres_recovered * tariff_rate, 2)


def calculate_payback_period(repair_cost_estimate: float, daily_revenue_loss: float) -> float:
    """
    Section 7.3: Payback period (in days) = repair cost / daily revenue loss.
    daily_revenue_loss is estimated_loss_litres (from leak_alerts, treated as
    a per-day estimate) x tariff_rate.
    Returns float('inf') if there's no daily loss to recover against (avoids
    a divide-by-zero crash if a zone has no measurable loss).
    """
    if daily_revenue_loss <= 0:
        return float("inf")
    return round(repair_cost_estimate / daily_revenue_loss, 1)
