# services/reminder.py — v3.1
# Changes:
#   1. Scheduler runs every 15s instead of 60s — much faster delivery
#   2. Exact due-time notification: "Task is due now!" fires at HH:MM
#   3. 15-min reminder still fires as before
#
# New flags used: push_sent (15-min push), due_push_sent (exact-time push)
# reminder_sent = email at 15 mins before

from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime


def check_reminders(app):
    with app.app_context():
        try:
            from models import Task, User, PushSubscription
            from app_instance import db
            from services.email_service import send_reminder_email
            from services.push_service import send_push_notification

            now           = datetime.now()
            current_time  = f"{now.hour:02d}:{now.minute:02d}"

            # ── Target time for 15-min advance reminder ─────────────────────
            adv_minute = now.minute + 15
            adv_hour   = now.hour
            if adv_minute >= 60:
                adv_minute -= 60
                adv_hour   += 1
            if adv_hour >= 24:
                adv_hour = 0
            advance_time = f"{adv_hour:02d}:{adv_minute:02d}"

            # ── 15-min advance: email + push ────────────────────────────────
            advance_tasks = Task.query.filter_by(
                due_time  = advance_time,
                important = True,
                done      = False,
            ).all()

            for task in advance_tasks:
                user = User.query.get(task.user_id)
                if not user: continue

                # Email
                if not task.reminder_sent:
                    try:
                        send_reminder_email(
                            to_email       = user.email,
                            preferred_name = user.preferred_name,
                            task_title     = task.title,
                            due_time       = task.due_time,
                        )
                        task.reminder_sent = True
                        print(f'[Reminder] Email → {user.email}: {task.title}')
                    except Exception as e:
                        print(f'[Reminder] Email failed: {e}')

                # Push
                if not task.push_sent:
                    subs = PushSubscription.query.filter_by(user_id=task.user_id).all()
                    sent = 0
                    for sub in subs:
                        result = send_push_notification(
                            subscription_dict = sub.to_dict(),
                            title             = f'⏰ {task.title}',
                            body              = f'Due in 15 minutes at {task.due_time}',
                            url               = '/',
                        )
                        if result == '410': db.session.delete(sub)
                        elif result: sent += 1
                    task.push_sent = True
                    print(f'[Reminder] 15-min push → {sent} device(s): {task.title}')

                db.session.commit()

            # ── Exact due time: push for ALL tasks (not just important) ──────
            # Important tasks: also get email
            # All tasks with due_time = now: get a push saying "due now"
            due_now_tasks = Task.query.filter_by(
                due_time      = current_time,
                done          = False,
                due_push_sent = False,
            ).all()

            for task in due_now_tasks:
                user = User.query.get(task.user_id)
                if not user: continue

                # Push to all devices
                subs = PushSubscription.query.filter_by(user_id=task.user_id).all()
                sent = 0
                for sub in subs:
                    result = send_push_notification(
                        subscription_dict = sub.to_dict(),
                        title             = f'🔔 Task is due now!',
                        body              = task.title,
                        url               = '/',
                    )
                    if result == '410': db.session.delete(sub)
                    elif result: sent += 1

                task.due_push_sent = True
                db.session.commit()
                print(f'[Reminder] Due-now push → {sent} device(s): {task.title}')

        except Exception as e:
            print(f'[Reminder] Scheduler error: {e}')
            import traceback
            traceback.print_exc()


def start_scheduler(app):
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        func    = check_reminders,
        args    = [app],
        trigger = 'interval',
        seconds = 15,          # v3.1: was 60s, now 15s for faster delivery
        id      = 'reminder_check',
    )
    scheduler.start()
    print('[Scheduler] Started — checking every 15s')
    return scheduler
