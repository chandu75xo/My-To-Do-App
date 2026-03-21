# services/email_service.py
#
# Handles sending emails using Flask-Mail via Gmail SMTP.
#
# SMTP = Simple Mail Transfer Protocol — the standard for sending email.
# Gmail lets you use their servers to send mail from your own code,
# but you must use an "App Password" (not your real Gmail password).
#
# How to get a Gmail App Password:
#   1. Go to myaccount.google.com
#   2. Security → 2-Step Verification (must be enabled first)
#   3. Scroll down → App passwords
#   4. Select app: Mail, Select device: Other → name it "done-app"
#   5. Copy the 16-character password into your .env as MAIL_PASSWORD

from flask_mail import Message
from app_instance import mail


def send_reminder_email(to_email: str, preferred_name: str, task_title: str, due_time: str):
    """
    Sends a 15-minute reminder email for an important task.

    Parameters:
        to_email       : recipient's email address
        preferred_name : their first/preferred name for personalisation
        task_title     : the task they need to be reminded about
        due_time       : "HH:MM" string of when the task is due
    """
    subject = f"⏰ Reminder: '{task_title}' is due in 15 minutes"

    # The email body — plain text version
    body = f"""Hi {preferred_name},

This is your 15-minute reminder for an important task:

  📌 {task_title}
  ⏰ Due at: {due_time}

Open your done. app to check it off when you're done.

— done. app
"""

    # HTML version — shown in email clients that support HTML
    html = f"""
<div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
  <h2 style="font-size: 20px; color: #111; margin: 0 0 8px;">Hi {preferred_name} 👋</h2>
  <p style="color: #555; margin: 0 0 24px;">You have an important task due in <strong>15 minutes</strong>:</p>

  <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
    <p style="font-size: 16px; font-weight: 600; color: #92400e; margin: 0 0 4px;">⭐ {task_title}</p>
    <p style="font-size: 14px; color: #b45309; margin: 0;">Due at {due_time}</p>
  </div>

  <p style="color: #888; font-size: 13px; margin: 0;">
    Open your <strong>done.</strong> app to mark it complete.
  </p>
</div>
"""

    # Message() creates the email object
    # recipients is a list — you can CC multiple people in the future
    msg = Message(
        subject    = subject,
        recipients = [to_email],
        body       = body,   # plain text fallback
        html       = html,   # HTML version (shown if client supports it)
    )

    # mail.send() actually delivers the email via SMTP
    # This can raise an exception if SMTP credentials are wrong —
    # the caller (reminder.py) catches that.
    mail.send(msg)
