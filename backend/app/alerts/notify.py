"""
ALERTS — owned by Piyush (built by Naqi covering for him, Day 3)
WhatsApp Business API / Twilio SMS alert delivery.

FALLBACK BEHAVIOUR: if Twilio credentials aren't set in .env yet
(TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM), send_alert()
does NOT crash — it logs what would have been sent and returns a "mock_sent"
status. This means the demo still works end-to-end even before anyone sets
up a real Twilio sandbox. Once real credentials are added to .env, delivery
becomes real automatically, no code change needed.
"""

import os
from twilio.rest import Client

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM")  # e.g. "whatsapp:+14155238886" (Twilio sandbox number)
FIELD_STAFF_WHATSAPP_TO = os.getenv("FIELD_STAFF_WHATSAPP_TO")  # e.g. "whatsapp:+91XXXXXXXXXX"


def format_alert_message(alert: dict) -> str:
    """
    Turns a leak_alerts row into a clear, human-readable field message.
    """
    zone = alert.get("zone_id", "unknown zone")
    loss = alert.get("estimated_loss_litres")
    confidence = alert.get("confidence_score")
    method = alert.get("method", "unknown method")

    loss_str = f"{loss:,.0f} litres/day" if loss is not None else "an unknown volume"
    confidence_str = f"{confidence * 100:.0f}%" if confidence is not None else "unknown"

    return (
        f"ALTOMARE ALERT — {zone}\n"
        f"Estimated loss: {loss_str}\n"
        f"Detection method: {method}\n"
        f"Confidence: {confidence_str}\n"
        f"Action: Dispatch field team to inspect {zone} for leak/tampering."
    )


def send_alert(alert_id: int, message: str, channel: str = "whatsapp") -> dict:
    """
    Sends via Twilio WhatsApp/SMS sandbox if credentials are configured.
    Falls back to a safe no-crash mock response otherwise.
    """
    if not (TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_WHATSAPP_FROM and FIELD_STAFF_WHATSAPP_TO):
        print(f"[MOCK ALERT — Twilio not configured] Would send via {channel}:\n{message}")
        return {
            "status": "mock_sent (Twilio not configured yet)",
            "alert_id": alert_id,
            "channel": channel,
            "message": message,
        }

    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        sent = client.messages.create(
            from_=TWILIO_WHATSAPP_FROM,
            to=FIELD_STAFF_WHATSAPP_TO,
            body=message,
        )
        return {
            "status": "sent",
            "alert_id": alert_id,
            "channel": channel,
            "message": message,
            "twilio_sid": sent.sid,
        }
    except Exception as e:
        # Don't crash the whole request if Twilio itself errors — degrade
        # to the same mock response so the demo keeps moving.
        print(f"[ALERT SEND FAILED] {e}")
        return {
            "status": f"failed ({str(e)})",
            "alert_id": alert_id,
            "channel": channel,
            "message": message,
        }
