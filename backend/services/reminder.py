# services/reminder.py
#
# WHAT IS A BACKGROUND SCHEDULER?
# Your Flask app normally only does work when a request comes in.
# But email reminders need to fire at a specific TIME — not triggered by a request.
# APScheduler runs a function on a schedule in a background thread.
#
# A "thread" is like a second worker running alongside your main Flask server.
# The main thread handles HTTP requests.
# The scheduler thread silently checks for due tasks every 60 seconds.
#
# How the 15-minute reminder works:
#   Every minute → find tasks where:
#     - important = True
#     - done = False
#     - reminder_sent = False
#     - due_time is exactly 15 minutes from now (within a 1-min window)
#   → send email → mark reminder_sent = True (so we don't send it again)

from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone


def check_reminders(app):
    """
    Checks all important tasks and sends emails for ones due in ~15 minutes.
    Called every 60 seconds by the scheduler.

    'app' is passed in so we can push an application context.
    Flask needs an "app context" to access the database outside of a request.
    """
    # app.app_context() makes Flask's db, mail, etc. available in this thread
    with app.app_context():
        try:
            from models import Task, User
            from app_instance import db
            from services.email_service import send_reminder_email

            now = datetime.now()
            current_hour   = now.hour
            current_minute = now.minute

            # Target time = 15 minutes from now
            target_minute = current_minute + 15
            target_hour   = current_hour

            # Handle minute overflow (e.g. 11:50 + 15 = 12:05)
            if target_minute >= 60:
                target_minute -= 60
                target_hour   += 1
            if target_hour >= 24:
                target_hour = 0

            # Format as "HH:MM" to match what we store in the database
            target_time = f"{target_hour:02d}:{target_minute:02d}"

            # Find all important, incomplete tasks due at the target time
            # that haven't had a reminder sent yet
            tasks_due = Task.query.filter_by(
                due_time      = target_time,
                important     = True,
                done          = False,
                reminder_sent = False,
            ).all()

            for task in tasks_due:
                # Get the task owner's details for the email
                user = User.query.get(task.user_id)
                if not user:
                    continue

                try:
                    send_reminder_email(
                        to_email       = user.email,
                        preferred_name = user.preferred_name,
                        task_title     = task.title,
                        due_time       = task.due_time,
                    )
                    # Mark as sent so we don't email them again this minute
                    task.reminder_sent = True
                    db.session.commit()
                    print(f"[Reminder] Email sent to {user.email} for task: {task.title}")

                except Exception as e:
                    # Don't crash the whole scheduler if one email fails
                    print(f"[Reminder] Failed to send email for task {task.id}: {e}")

        except Exception as e:
            print(f"[Reminder] Scheduler error: {e}")


def start_scheduler(app):
    """
    Creates and starts the background scheduler.
    Called once from app.py on startup.
    """
    scheduler = BackgroundScheduler()

    # 'interval' trigger: run check_reminders every 60 seconds
    # We pass 'app' as an argument so the function can push an app context
    scheduler.add_job(
        func     = check_reminders,
        args     = [app],
        trigger  = 'interval',
        seconds  = 60,
        id       = 'reminder_check',
    )

    scheduler.start()
    print("[Scheduler] Reminder scheduler started — checking every 60s")
    return scheduler
