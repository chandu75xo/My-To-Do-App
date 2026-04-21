# email_service.py — v6a
# Professional branded email templates — app-native look, no generic emojis
# Uses app's dark #111827 color scheme, serif wordmark, clean typography

import threading, json, os, urllib.request, urllib.error


def _brevo(to_email, to_name, subject, html, text):
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
        headers={'accept':'application/json','api-key':api_key,'content-type':'application/json'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            print(f'[Email] Sent to {to_email} — {resp.status}', flush=True)
            return True
    except urllib.error.HTTPError as e:
        print(f'[Email] Brevo error {e.code}: {e.read().decode()[:200]}', flush=True)
        return False
    except Exception as e:
        print(f'[Email] Failed: {e}', flush=True)
        return False


def _async(to_email, to_name, subject, html, text):
    threading.Thread(target=_brevo, args=(to_email,to_name,subject,html,text), daemon=True).start()


# ── Design system ─────────────────────────────────────────────────────────────
# Colors: #111827 (near-black), #1f2937 (card bg), #374151 (borders),
#         #f9fafb (light bg), #6b7280 (muted text)
# Typography: Georgia serif for wordmark, system-ui for body

def _shell(content, subject, accent='#111827'):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{subject}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation"
  style="background:#f3f4f6;padding:32px 12px;">
<tr><td align="center">
<table width="100%" style="max-width:520px;">

  <!-- Wordmark row -->
  <tr>
    <td style="padding:0 0 12px 2px;">
      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;
                font-weight:400;color:#111827;letter-spacing:-0.5px;">done.</p>
    </td>
  </tr>

  <!-- Card -->
  <tr>
    <td style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;
               overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">

      <!-- Accent bar -->
      <div style="height:3px;background:{accent};"></div>

      <!-- Body -->
      <div style="padding:28px 28px 24px;">
        {content}
      </div>

      <!-- Footer -->
      <div style="padding:16px 28px 20px;border-top:1px solid #f3f4f6;">
        <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6;">
          You are receiving this because you have tasks in <strong style="color:#6b7280;">done.</strong>
          with due times set. To stop these reminders, complete or delete the task.
        </p>
      </div>

    </td>
  </tr>

  <!-- Bottom spacer -->
  <tr><td style="height:24px;"></td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""


def _badge(label, bg, fg, border):
    return f"""<span style="display:inline-block;padding:3px 10px;background:{bg};color:{fg};
border:1px solid {border};border-radius:99px;font-size:11px;font-weight:600;
letter-spacing:0.04em;text-transform:uppercase;">{label}</span>"""


def _task_card(title, due_time, notes=''):
    notes_row = f'<p style="margin:8px 0 0;font-size:12px;color:#9ca3af;line-height:1.5;">{notes}</p>' if notes else ''
    return f"""<div style="background:#f9fafb;border:1px solid #e5e7eb;border-left:3px solid #111827;
border-radius:0 10px 10px 0;padding:14px 16px;margin:16px 0;">
  <p style="margin:0;font-size:16px;font-weight:600;color:#111827;line-height:1.3;">{title}</p>
  {'<p style="margin:4px 0 0;font-size:12px;color:#6b7280;font-variant-numeric:tabular-nums;">Due ' + due_time + '</p>' if due_time else ''}
  {notes_row}
</div>"""


def _action_btn(label, url, primary=True):
    if primary:
        return f"""<a href="{url}" style="display:inline-block;padding:10px 22px;
background:#111827;color:#ffffff;border-radius:9px;font-size:13px;font-weight:600;
text-decoration:none;letter-spacing:0.01em;">{label}</a>"""
    return f"""<a href="{url}" style="display:inline-block;padding:10px 22px;
background:#ffffff;color:#111827;border:1.5px solid #d1d5db;border-radius:9px;
font-size:13px;font-weight:600;text-decoration:none;letter-spacing:0.01em;">{label}</a>"""


# ── Public functions ──────────────────────────────────────────────────────────

def send_reminder_email(to_email, preferred_name, task_title, due_time,
                        task_id=None, timing='before', notes='', overdue_count=0):
    """
    timing: 'before' | 'due' | 'after' | 'overdue_repeat' | 'daily_overdue'
    overdue_count: how many overdue repeat notifications have been sent (for messaging)
    """
    frontend_url = os.getenv('FRONTEND_URL', 'https://done-todoapp.netlify.app')
    backend_url  = os.getenv('BACKEND_URL',  'https://done-todo-api.onrender.com').rstrip('/')
    view_url     = f"{frontend_url}?task={task_id}" if task_id else frontend_url

    # Generate completion link
    complete_html = ''
    if task_id:
        try:
            from services.push_service import generate_completion_token
            from models import Task
            task = Task.query.get(task_id)
            if task:
                token        = generate_completion_token(task_id, task.user_id)
                complete_url = f"{backend_url}/api/tasks/complete-email?token={token}"
                complete_html = f"""
<div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap;">
  {_action_btn('View task', view_url, primary=True)}
  &nbsp;&nbsp;
  {_action_btn('Mark as complete', complete_url, primary=False)}
</div>"""
        except Exception as e:
            print(f'[Email] Completion link error: {e}', flush=True)
            complete_html = f"""<div style="margin-top:20px;">{_action_btn('Open done.', view_url)}</div>"""
    else:
        complete_html = f"""<div style="margin-top:20px;">{_action_btn('Open done.', view_url)}</div>"""

    due_display = due_time or ''

    if timing == 'before':
        accent   = '#d97706'
        badge    = _badge('Due in 15 minutes', '#fffbeb', '#92400e', '#fde68a')
        headline = 'Heads up — task due soon'
        body     = f'This task is due in <strong>15 minutes</strong>. Time to wrap up.'
        subject  = f'[done.] Due soon — {task_title}'

    elif timing == 'due':
        accent   = '#dc2626'
        badge    = _badge('Due now', '#fef2f2', '#991b1b', '#fca5a5')
        headline = 'Task is due right now'
        body     = f'This task has reached its due time.'
        subject  = f'[done.] Due now — {task_title}'

    elif timing == 'after':
        accent   = '#6b7280'
        badge    = _badge('15 min overdue', '#f3f4f6', '#374151', '#d1d5db')
        headline = 'Task is overdue'
        body     = f'This task was due at <strong>{due_display}</strong> and is still pending.'
        subject  = f'[done.] Overdue — {task_title}'

    elif timing == 'overdue_repeat':
        hours    = overdue_count * 4
        accent   = '#7c3aed'
        badge    = _badge(f'{hours}h overdue', '#f5f3ff', '#5b21b6', '#ddd6fe')
        headline = 'Task still pending'
        body     = f'This task has been overdue for <strong>{hours} hours</strong> and is still incomplete.'
        subject  = f'[done.] Still pending ({hours}h) — {task_title}'

    else:  # daily_overdue
        accent   = '#1f2937'
        badge    = _badge('Daily reminder', '#f9fafb', '#374151', '#e5e7eb')
        headline = 'Overdue task reminder'
        body     = f'This task is still incomplete. Take a moment to either complete it or reschedule.'
        subject  = f'[done.] Reminder — {task_title}'

    content = f"""
<p style="margin:0 0 14px;">{badge}</p>
<p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Hi {preferred_name}</p>
<p style="margin:0 0 16px;font-size:20px;font-weight:600;color:#111827;line-height:1.3;">{headline}</p>
{_task_card(task_title, due_display, notes)}
<p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">{body}</p>
{complete_html}
"""
    text = f"Hi {preferred_name},\n\n{headline}\n\nTask: {task_title}\nDue: {due_display}\n\nOpen done.: {view_url}"
    _async(to_email, preferred_name, subject, _shell(content, subject, accent), text)


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
        validity = 'This code expires in 10 minutes. Ignore if you did not request this.'

    content = f"""
<p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Hi {preferred_name}</p>
<p style="margin:0 0 20px;font-size:20px;font-weight:600;color:#111827;">{heading}</p>
<p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">{subtext}</p>
<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:24px;text-align:center;margin:0 0 20px;">
  <p style="margin:0 0 6px;font-size:11px;color:#9ca3af;letter-spacing:0.1em;text-transform:uppercase;">Verification code</p>
  <p style="margin:0;font-size:36px;font-weight:700;color:#111827;letter-spacing:10px;font-family:'Courier New',Courier,monospace;">{otp_code}</p>
</div>
<p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">{validity}</p>
"""
    text = f"Hi {preferred_name},\n\n{subtext}\n\nCode: {otp_code}\n\n{validity}"
    _async(to_email, preferred_name, subject, _shell(content, subject), text)
