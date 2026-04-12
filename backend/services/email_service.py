# email_service.py — v5d
# Professional HTML email templates with app branding.
# No emoji — uses Unicode symbols and CSS styling.
# Emails include "View Task" and "Mark as Complete" action links.

import threading, json, os, urllib.request, urllib.error


def _send_via_brevo(to_email, to_name, subject, html, text):
    api_key      = os.getenv('BREVO_API_KEY', '')
    sender_email = os.getenv('MAIL_USERNAME', 'done.todoapp1@gmail.com')
    if not api_key:
        print('[Email] BREVO_API_KEY not set — skipping', flush=True)
        return False

    payload = json.dumps({
        'sender':      {'name': 'done.', 'email': sender_email},
        'to':          [{'email': to_email, 'name': to_name}],
        'subject':     subject,
        'htmlContent': html,
        'textContent': text,
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.brevo.com/v3/smtp/email',
        data=payload,
        headers={'accept': 'application/json', 'api-key': api_key, 'content-type': 'application/json'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            print(f'[Email] Sent to {to_email} — HTTP {resp.status}', flush=True)
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='ignore')
        print(f'[Email] Brevo error {e.code}: {body[:200]}', flush=True)
        return False
    except Exception as e:
        print(f'[Email] Send failed: {e}', flush=True)
        return False


def _async(to_email, to_name, subject, html, text):
    t = threading.Thread(target=_send_via_brevo, args=(to_email, to_name, subject, html, text), daemon=True)
    t.start()


# ── Shared template shell ─────────────────────────────────────────────────────

def _email_shell(content_html, subject):
    """Wraps content in the branded done. email shell."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

  <!-- Header bar -->
  <tr>
    <td style="background:#111827;padding:24px 32px;">
      <p style="margin:0;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#ffffff;letter-spacing:-0.5px;">done.</p>
      <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.45);letter-spacing:0.12em;text-transform:uppercase;">your personal todo</p>
    </td>
  </tr>

  <!-- Content -->
  <tr>
    <td style="padding:32px 32px 24px;">
      {content_html}
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:16px 32px 28px;border-top:1px solid #f0f0f0;">
      <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.6;">
        You are receiving this because you have tasks with due times in <strong>done.</strong><br>
        Manage your notification preferences in the app settings.
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>"""


def _btn(label, url, style='primary'):
    bg   = '#111827' if style == 'primary' else '#ffffff'
    fg   = '#ffffff' if style == 'primary' else '#111827'
    bdr  = '#111827'
    return f"""<a href="{url}" style="display:inline-block;padding:11px 24px;background:{bg};color:{fg};border:1.5px solid {bdr};border-radius:10px;font-size:13px;font-weight:600;text-decoration:none;letter-spacing:0.01em;">{label}</a>"""


def _status_badge(label, color):
    colors = {
        'before': ('#fffbeb', '#92400e', '#fcd34d'),
        'due':    ('#fef2f2', '#991b1b', '#fca5a5'),
        'after':  ('#f3f4f6', '#374151', '#d1d5db'),
    }
    bg, fg, bd = colors.get(color, colors['before'])
    return f"""<span style="display:inline-block;padding:4px 12px;background:{bg};color:{fg};border:1px solid {bd};border-radius:99px;font-size:12px;font-weight:600;letter-spacing:0.04em;">{label}</span>"""


# ── Public functions ──────────────────────────────────────────────────────────

def send_reminder_email(to_email, preferred_name, task_title, due_time,
                        task_id=None, timing='before'):
    """
    timing: 'before' (15 min advance), 'due' (exact time), 'after' (15 min overdue)
    """
    frontend_url  = os.getenv('FRONTEND_URL', 'https://done-todoapp.netlify.app')
    backend_url   = os.getenv('BACKEND_URL',  'https://done-todo-api.onrender.com').rstrip('/')
    view_url      = f"{frontend_url}?task={task_id}" if task_id else frontend_url

    if timing == 'before':
        badge_html  = _status_badge('Due in 15 minutes', 'before')
        headline    = f"Your task is due soon"
        subtext     = f"You have <strong>15 minutes</strong> before this task is due."
        subject     = f"[done.] Due in 15 min — {task_title}"
    elif timing == 'due':
        badge_html  = _status_badge('Due now', 'due')
        headline    = f"Your task is due right now"
        subtext     = f"This task is due at <strong>{due_time}</strong>."
        subject     = f"[done.] Due now — {task_title}"
    else:  # after
        badge_html  = _status_badge('15 min overdue', 'after')
        headline    = f"Task still pending"
        subtext     = f"This task was due at <strong>{due_time}</strong> and is now overdue."
        subject     = f"[done.] Overdue — {task_title}"

    # Generate completion token for the "Mark as Complete" button
    complete_section = ''
    if task_id:
        try:
            from services.push_service import generate_completion_token
            from models import Task
            task = Task.query.get(task_id)
            if task:
                token        = generate_completion_token(task_id, task.user_id)
                complete_url = f"{backend_url}/api/tasks/complete-email?token={token}"
                complete_section = f"""
<div style="margin-top:20px;padding-top:20px;border-top:1px solid #f0f0f0;">
  <p style="margin:0 0 12px;font-size:12px;color:#6b7280;">Actions</p>
  <div style="display:flex;gap:10px;flex-wrap:wrap;">
    {_btn('View task', view_url, 'primary')}
    &nbsp;&nbsp;
    {_btn('Mark as complete', complete_url, 'secondary')}
  </div>
</div>"""
        except Exception as e:
            print(f'[Email] Could not generate completion link: {e}', flush=True)
            complete_section = f"""
<div style="margin-top:20px;padding-top:20px;border-top:1px solid #f0f0f0;">
  {_btn('View task in done.', view_url, 'primary')}
</div>"""
    else:
        complete_section = f"""
<div style="margin-top:20px;padding-top:20px;border-top:1px solid #f0f0f0;">
  {_btn('Open done.', view_url, 'primary')}
</div>"""

    content = f"""
<p style="margin:0 0 16px 0;">{badge_html}</p>
<p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Hi {preferred_name},</p>
<p style="margin:0 0 20px;font-size:22px;font-weight:600;color:#111827;line-height:1.3;">{headline}</p>

<div style="background:#f9fafb;border:1px solid #e5e7eb;border-left:3px solid #111827;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:20px;">
  <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#111827;">{task_title}</p>
  <p style="margin:0;font-size:13px;color:#6b7280;">Due at {due_time}</p>
</div>

<p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">{subtext}</p>
{complete_section}
"""
    text = f"Hi {preferred_name},\n\n{task_title} — due at {due_time}.\n\nOpen done.: {view_url}"
    _async(to_email, preferred_name, subject, _email_shell(content, subject), text)


def send_otp_email(to_email, preferred_name, otp_code, purpose):
    if purpose == 'verify':
        subject  = '[done.] Verify your email'
        heading  = 'Verify your email address'
        subtext  = 'Enter this code in the app to complete your registration.'
        validity = 'This code expires in 10 minutes.'
    else:
        subject  = '[done.] Password reset code'
        heading  = 'Reset your password'
        subtext  = 'Enter this code in the app to set a new password.'
        validity = 'This code expires in 10 minutes. If you did not request this, ignore this email.'

    content = f"""
<p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Hi {preferred_name},</p>
<p style="margin:0 0 24px;font-size:20px;font-weight:600;color:#111827;">{heading}</p>
<p style="margin:0 0 24px;font-size:14px;color:#374151;">{subtext}</p>

<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:28px;text-align:center;margin-bottom:24px;">
  <p style="margin:0 0 8px;font-size:11px;color:#9ca3af;letter-spacing:0.1em;text-transform:uppercase;">Your code</p>
  <p style="margin:0;font-size:40px;font-weight:700;color:#111827;letter-spacing:10px;font-family:'Courier New',monospace;">{otp_code}</p>
</div>

<p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">{validity}</p>
"""
    text = f"Hi {preferred_name},\n\n{subtext}\n\nCode: {otp_code}\n\n{validity}"
    _async(to_email, preferred_name, subject, _email_shell(content, subject), text)
