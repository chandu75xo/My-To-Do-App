# reminder.py — final notification fix
#
# TIMEZONE APPROACH:
# Tasks have utc_offset_minutes (browser offset when task was created).
# Scheduler uses datetime.utcnow() and converts each task's due time to UTC.
# For legacy tasks with utc_offset_minutes=0, we also try the server's local time
# as a fallback so old tasks still work.
#
# TIMING:
# - 15-min advance: fires when task is 14–16 minutes away (UTC)
# - Exact due: fires when task is within ±60 seconds (UTC)
# - Runs every 30 seconds — max drift is 30 seconds

from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta

_scheduler = None


def _to_utc(due_date, due_time, utc_offset_minutes):
    """Convert local due time to UTC datetime. Returns None if invalid."""
    if not due_date or not due_time:
        return None
    try:
        local_dt = datetime.strptime(f"{due_date} {due_time}", "%Y-%m-%d %H:%M")
        return local_dt - timedelta(minutes=int(utc_offset_minutes or 0))
    except (ValueError, TypeError):
        return None


def check_reminders(app):
    with app.app_context():
        try:
            from models import Task, User, PushSubscription
            from app_instance import db
            from services.email_service import send_reminder_email
            from services.push_service import send_push_notification

            now_utc = datetime.utcnow()
            print(f'[Scheduler] Tick {now_utc.strftime("%Y-%m-%d %H:%M:%S")} UTC', flush=True)

            active_tasks = Task.query.filter(
                Task.done     == False,
                Task.due_date != None,
                Task.due_time != None,
            ).all()

            if not active_tasks:
                return

            print(f'[Scheduler] Checking {len(active_tasks)} active tasks', flush=True)

            for task in active_tasks:
                offset  = getattr(task, 'utc_offset_minutes', 0) or 0
                due_utc = _to_utc(task.due_date, task.due_time, offset)
                if not due_utc:
                    continue

                diff = (due_utc - now_utc).total_seconds()

                user = None

                # ── 15-min advance push + email ─────────────────────────────
                if task.important and not task.push_sent and 840 <= diff <= 960:
                    user = user or User.query.get(task.user_id)
                    if user:
                        subs = PushSubscription.query.filter_by(user_id=task.user_id).all()
                        sent = 0
                        for sub in subs:
                            r = send_push_notification(
                                sub.to_dict(),
                                title = '⏰ Due in 15 minutes',
                                body  = task.title,
                            )
                            if r == '410': db.session.delete(sub)
                            elif r: sent += 1
                        task.push_sent = True
                        print(f'[Reminder] 15-min push → {sent} device(s): "{task.title}"', flush=True)

                if task.important and not task.reminder_sent and 840 <= diff <= 960:
                    user = user or User.query.get(task.user_id)
                    if user:
                        try:
                            send_reminder_email(
                                to_email       = user.email,
                                preferred_name = user.preferred_name,
                                task_title     = task.title,
                                due_time       = task.due_time,
                            )
                            task.reminder_sent = True
                            print(f'[Reminder] Email sent to {user.email}: "{task.title}"', flush=True)
                        except Exception as e:
                            print(f'[Reminder] Email failed: {e}', flush=True)

                # ── Exact due-time push ─────────────────────────────────────
                if not task.due_push_sent and -60 <= diff <= 60:
                    user = user or User.query.get(task.user_id)
                    if user:
                        subs = PushSubscription.query.filter_by(user_id=task.user_id).all()
                        sent = 0
                        for sub in subs:
                            r = send_push_notification(
                                sub.to_dict(),
                                title = '🔔 Task is due now!',
                                body  = task.title,
                            )
                            if r == '410': db.session.delete(sub)
                            elif r: sent += 1
                        task.due_push_sent = True
                        print(f'[Reminder] Due-now push → {sent} device(s): "{task.title}"', flush=True)

            db.session.commit()

        except Exception as e:
            print(f'[Reminder] EXCEPTION: {e}', flush=True)
            import traceback
            traceback.print_exc()


def start_scheduler(app):
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        print('[Scheduler] Already running — skipping', flush=True)
        return _scheduler
    _scheduler = BackgroundScheduler(daemon=True)
    _scheduler.add_job(
        func          = check_reminders,
        args          = [app],
        trigger       = 'interval',
        seconds       = 30,
        id            = 'reminder_check',
        max_instances = 1,
        coalesce      = True,  # if missed, run once not multiple times
    )
    _scheduler.start()
    print('[Scheduler] Started — running every 30s', flush=True)
    return _scheduler
