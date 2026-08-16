"""
ALERTS — owned by Piyush
WhatsApp Business API / Twilio SMS alert delivery.

HOW THIS CONNECTS TO THE REST OF THE SYSTEM:
- Naqi's POST /alerts/notify endpoint (app/routers/core.py) will call
  your send_alert() function once it exists.
- Trigger source: when a CorrelationEvent (from Palak's engine) or a
  LeakAlert (from Kushagra's engine) crosses a priority threshold.

Suggested function signature:

    def send_alert(alert_id: str, message: str, channel: str = "whatsapp") -> dict:
        # calls Twilio/WhatsApp Business API sandbox
        # returns delivery status
        ...

    def format_alert_message(alert: dict) -> str:
        # turns a LeakAlert or CorrelationEvent into a clear,
        # human-readable field message (zone, loss, urgency, action)
        ...

Day 1: set up Twilio + WhatsApp sandbox, send one dummy test message.
Day 2: build format_alert_message(). Day 4: wire real triggers so a
CRITICAL correlation event fires an actual sandbox message.
"""

# Your code starts here.
