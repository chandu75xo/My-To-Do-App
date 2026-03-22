# email_service.py — UPDATED to use Brevo HTTP API
# Render free tier blocks all SMTP ports (587, 465).
# Brevo sends email over HTTPS which always works.
# Free tier: 300 emails/day — plenty for personal use.

import threading
import json
import os
import urllib.request
import urllib.error


def _send_via_brevo(to_email, to_name, subject, html, text):
    """
    Send email via Brevo's HTTP API.
    Uses only stdlib urllib — no extra packages needed.
    """
    api_key = os.getenv('BREVO_API_KEY', '')
    sender_email = os.getenv('MAIL_USERNAME', 'done.todoapp1@gmail.com')
    sender_name  = 'done. app'

    if not api_key:
        print('[Email] BREVO_API_KEY not set — skipping email')
        return False

    payload = json.dumps({
        'sender':    {'name': sender_name, 'email': sender_email},
        'to':        [{'email': to_email, 'name': to_name}],
        'subject':   subject,
        'htmlContent': html,
        'textContent': text,
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.brevo.com/v3/smtp/email',
        data    = payload,
        headers = {
            'accept':       'application/json',
            'api-key':      api_key,
            'content-type': 'application/json',
        },
        method = 'POST',
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            print(f'[Email] Sent to {to_email} — HTTP {resp.status}')
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='ignore')
        print(f'[Email] Brevo HTTP error {e.code}: {body[:200]}')
        return False
    except Exception as e:
        print(f'[Email] Send failed: {e}')
        return False


def _send_async(to_email, to_name, subject, html, text):
    """Dispatch email in a background thread so requests never block."""
    thread = threading.Thread(
        target = _send_via_brevo,
        args   = (to_email, to_name, subject, html, text),
        daemon = True,
    )
    thread.start()


# ── Public functions ──────────────────────────────────────────────────────────

def send_reminder_email(to_email, preferred_name, task_title, due_time):
    subject = f"⏰ Reminder: '{task_title}' is due in 15 minutes"
    text    = f"Hi {preferred_name},\n\nYour task '{task_title}' is due at {due_time}.\n\n— done. app"
    html    = f"""
<div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
  <p style="font-family:Georgia,serif;font-size:28px;color:#111;margin:0 0 16px;font-weight:500">done.</p>
  <h2 style="font-size:20px;color:#111;margin:0 0 8px;font-weight:500">Hi {preferred_name} 👋</h2>
  <p style="color:#555;margin:0 0 24px">You have an important task due in <strong>15 minutes</strong>:</p>
  <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:12px;padding:16px 20px;margin-bottom:24px">
    <p style="font-size:16px;font-weight:600;color:#92400e;margin:0 0 4px">⭐ {task_title}</p>
    <p style="font-size:14px;color:#b45309;margin:0">Due at {due_time}</p>
  </div>
  <p style="color:#888;font-size:13px;margin:0">Open your <strong>done.</strong> app to mark it complete.</p>
</div>"""
    _send_async(to_email, preferred_name, subject, html, text)


def send_otp_email(to_email, preferred_name, otp_code, purpose):
    if purpose == 'verify':
        subject = "Your done. verification code"
        heading = "Verify your email"
        subtext = "Enter this code in the app to verify your email address."
        validity = "This code expires in 10 minutes."
    else:
        subject = "Reset your done. password"
        heading = "Password reset code"
        subtext = "Enter this code in the app to reset your password."
        validity = "This code expires in 10 minutes. If you didn't request this, ignore this email."

    text = f"Hi {preferred_name},\n\n{subtext}\n\nYour code: {otp_code}\n\n{validity}\n\n— done. app"
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
    _send_async(to_email, preferred_name, subject, html, text)
