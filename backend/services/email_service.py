# email_service.py — UPDATED for v2.2
# Now handles 3 types of emails:
#   1. Task reminder (existing)
#   2. OTP verification on signup (new)
#   3. Password reset OTP (new)

from flask_mail import Message
from app_instance import mail


def send_reminder_email(to_email, preferred_name, task_title, due_time):
    """15-minute reminder for important tasks."""
    subject = f"⏰ Reminder: '{task_title}' is due in 15 minutes"
    body = f"Hi {preferred_name},\n\nYour task '{task_title}' is due at {due_time}.\n\n— done. app"
    html = f"""
<div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
  <h2 style="font-size:20px;color:#111;margin:0 0 8px">Hi {preferred_name} 👋</h2>
  <p style="color:#555;margin:0 0 24px">You have an important task due in <strong>15 minutes</strong>:</p>
  <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:12px;padding:16px 20px;margin-bottom:24px">
    <p style="font-size:16px;font-weight:600;color:#92400e;margin:0 0 4px">⭐ {task_title}</p>
    <p style="font-size:14px;color:#b45309;margin:0">Due at {due_time}</p>
  </div>
  <p style="color:#888;font-size:13px;margin:0">Open your <strong>done.</strong> app to mark it complete.</p>
</div>"""
    msg = Message(subject=subject, recipients=[to_email], body=body, html=html)
    mail.send(msg)


def send_otp_email(to_email, preferred_name, otp_code, purpose):
    """
    Sends a 6-digit OTP code.
    purpose = 'verify' → email verification on signup
    purpose = 'reset'  → password reset request
    """
    if purpose == 'verify':
        subject  = "Your done. verification code"
        heading  = "Verify your email"
        subtext  = "Enter this code in the app to verify your email address."
        validity = "This code expires in 10 minutes."
    else:
        subject  = "Reset your done. password"
        heading  = "Password reset code"
        subtext  = "Enter this code in the app to reset your password."
        validity = "This code expires in 10 minutes. If you didn't request this, ignore this email."

    body = f"Hi {preferred_name},\n\n{subtext}\n\nYour code: {otp_code}\n\n{validity}\n\n— done. app"

    html = f"""
<div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
  <p style="font-family:Georgia,serif;font-size:28px;color:#111;margin:0 0 8px;font-weight:500">done.</p>
  <h2 style="font-size:20px;color:#111;margin:0 0 8px;font-weight:500">{heading}</h2>
  <p style="color:#555;margin:0 0 28px;font-size:15px">Hi {preferred_name}, {subtext}</p>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:16px;padding:28px;text-align:center;margin-bottom:24px">
    <p style="font-size:13px;color:#6b7280;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.1em">Your code</p>
    <p style="font-size:42px;font-weight:700;color:#111;letter-spacing:10px;margin:0;font-family:monospace">{otp_code}</p>
  </div>

  <p style="color:#9ca3af;font-size:13px;margin:0;text-align:center">{validity}</p>
</div>"""

    msg = Message(subject=subject, recipients=[to_email], body=body, html=html)
    mail.send(msg)
