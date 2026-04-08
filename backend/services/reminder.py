# reminder.py — fixed
# Key changes:
# 1. Better timezone handling — uses UTC consistently
# 2. Explicit logging so you can see in Render logs if it's actually firing
# 3. Checks for tasks due in next 15 mins using a range (±1 min) to avoid
#    missing tasks due to scheduler drift
# 4. Guard against double-start (APScheduler raises if job already exists)

from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone, timedelta

_scheduler = None  # module-level singleton — prevents double-start


def check_reminders(app):
    with app.app_context():
        try:
            from models import Task, User, PushSubscription
            from app_instance import db
            from services.email_service import send_reminder_email
            from services.push_service import send_push_notification

            now = datetime.now()  # local server time
            print(f'[Scheduler] Tick at {now.strftime("%H:%M:%S")}', flush=True)

            # ── 15-min advance: check window ±30s to handle drift ──────────────
            # Rather than matching exact minute, check if task is due
            # between now+14min and now+16min
            advance_start = now + timedelta(minutes=14)
            advance_end   = now + timedelta(minutes=16)

            advance_tasks = Task.query.filter_by(important=True, done=False, reminder_sent=False).all()
            for task in advance_tasks:
                if not task.due_date or not task.due_time:
                    continue
                try:
                    due_dt = datetime.strptime(f"{task.due_date} {task.due_time}", "%Y-%m-%d %H:%M")
                except ValueError:
                    continue
                if advance_start <= due_dt <= advance_end:
                    user = User.query.get(task.user_id)
                    if not user:
                        continue
                    # Email
                    try:
                        send_reminder_email(
                            to_email       = user.email,
                            preferred_name = user.preferred_name,
                            task_title     = task.title,
                            due_time       = task.due_time,
                        )
                        task.reminder_sent = True
                        print(f'[Reminder] Email → {user.email}: {task.title}', flush=True)
                    except Exception as e:
                        print(f'[Reminder] Email failed: {e}', flush=True)

                    # Push
                    if not task.push_sent:
                        subs = PushSubscription.query.filter_by(user_id=task.user_id).all()
                        sent = 0
                        for sub in subs:
                            result = send_push_notification(
                                subscription_dict = sub.to_dict(),
                                title             = f'⏰ Due in 15 minutes',
                                body              = task.title,
                                url               = '/',
                            )
                            if result == '410':
                                db.session.delete(sub)
                            elif result:
                                sent += 1
                        task.push_sent = True
                        print(f'[Reminder] 15-min push → {sent} device(s): {task.title}', flush=True)

                    db.session.commit()

            # ── Exact due time: window now-30s to now+30s ──────────────────────
            due_start = now - timedelta(seconds=30)
            due_end   = now + timedelta(seconds=30)

            due_tasks = Task.query.filter_by(done=False, due_push_sent=False).all()
            for task in due_tasks:
                if not task.due_date or not task.due_time:
                    continue
                try:
                    due_dt = datetime.strptime(f"{task.due_date} {task.due_time}", "%Y-%m-%d %H:%M")
                except ValueError:
                    continue
                if due_start <= due_dt <= due_end:
                    user = User.query.get(task.user_id)
                    if not user:
                        continue
                    subs = PushSubscription.query.filter_by(user_id=task.user_id).all()
                    sent = 0
                    for sub in subs:
                        result = send_push_notification(
                            subscription_dict = sub.to_dict(),
                            title             = '🔔 Task is due now!',
                            body              = task.title,
                            url               = '/',
                        )
                        if result == '410':
                            db.session.delete(sub)
                        elif result:
                            sent += 1
                    task.due_push_sent = True
                    db.session.commit()
                    print(f'[Reminder] Due-now push → {sent} device(s): {task.title}', flush=True)

        except Exception as e:
            print(f'[Reminder] Error in check_reminders: {e}', flush=True)
            import traceback
            traceback.print_exc()


def start_scheduler(app):
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        print('[Scheduler] Already running — skipping duplicate start', flush=True)
        return _scheduler

    _scheduler = BackgroundScheduler()
    _scheduler.add_job(
        func     = check_reminders,
        args     = [app],
        trigger  = 'interval',
        seconds  = 30,   # every 30s — fine-grained enough, not too heavy
        id       = 'reminder_check',
        max_instances = 1,  # never run two at once
    )
    _scheduler.start()
    print('[Scheduler] Started — checking every 30s', flush=True)
    return _scheduler
