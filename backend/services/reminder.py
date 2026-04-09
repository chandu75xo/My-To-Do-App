from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta

_scheduler = None


def _due_dt_utc(due_date, due_time, utc_offset_minutes):
    if not due_date or not due_time:
        return None
    try:
        local_dt = datetime.strptime(f"{due_date} {due_time}", "%Y-%m-%d %H:%M")
        return local_dt - timedelta(minutes=(utc_offset_minutes or 0))
    except ValueError:
        return None


def check_reminders(app):
    with app.app_context():
        try:
            from models import Task, User, PushSubscription
            from app_instance import db
            from services.email_service import send_reminder_email
            from services.push_service import send_push_notification

            now_utc = datetime.utcnow()
            print(f'[Scheduler] Tick UTC={now_utc.strftime("%H:%M:%S")}', flush=True)

            tasks_with_time = Task.query.filter(
                Task.done     == False,
                Task.due_date != None,
                Task.due_time != None,
            ).all()

            for task in tasks_with_time:
                offset  = getattr(task, 'utc_offset_minutes', 0) or 0
                due_utc = _due_dt_utc(task.due_date, task.due_time, offset)
                if not due_utc:
                    continue

                diff = (due_utc - now_utc).total_seconds()

                # 15-min advance: 14–16 min window
                if task.important and not task.reminder_sent and 840 <= diff <= 960:
                    user = User.query.get(task.user_id)
                    if user:
                        try:
                            send_reminder_email(user.email, user.preferred_name, task.title, task.due_time)
                            task.reminder_sent = True
                            print(f'[Reminder] Email → {user.email}: {task.title}', flush=True)
                        except Exception as e:
                            print(f'[Reminder] Email failed: {e}', flush=True)

                if task.important and not task.push_sent and 840 <= diff <= 960:
                    user = user if 'user' in dir() else User.query.get(task.user_id)
                    user = User.query.get(task.user_id)
                    if user:
                        subs = PushSubscription.query.filter_by(user_id=task.user_id).all()
                        sent = 0
                        for sub in subs:
                            r = send_push_notification(sub.to_dict(), '⏰ Due in 15 minutes', task.title)
                            if r == '410': db.session.delete(sub)
                            elif r: sent += 1
                        task.push_sent = True
                        print(f'[Reminder] 15-min push → {sent}: {task.title}', flush=True)

                # Exact due: ±60s window
                if not task.due_push_sent and -60 <= diff <= 60:
                    user = User.query.get(task.user_id)
                    if user:
                        subs = PushSubscription.query.filter_by(user_id=task.user_id).all()
                        sent = 0
                        for sub in subs:
                            r = send_push_notification(sub.to_dict(), '🔔 Task is due now!', task.title)
                            if r == '410': db.session.delete(sub)
                            elif r: sent += 1
                        task.due_push_sent = True
                        print(f'[Reminder] Due-now push → {sent}: {task.title}', flush=True)

            db.session.commit()

        except Exception as e:
            print(f'[Reminder] Error: {e}', flush=True)
            import traceback; traceback.print_exc()


def start_scheduler(app):
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        return _scheduler
    _scheduler = BackgroundScheduler()
    _scheduler.add_job(check_reminders, args=[app], trigger='interval',
                       seconds=30, id='reminder_check', max_instances=1)
    _scheduler.start()
    print('[Scheduler] Started — every 30s', flush=True)
    return _scheduler
