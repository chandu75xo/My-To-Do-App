# reminder.py — v6 FULL (replaces existing reminder.py)
# Sends BOTH VAPID web push (for browser) AND Expo FCM push (for native app)
# All 3 timing points for both channels

from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta

_scheduler = None


def _to_utc(due_date, due_time, utc_offset_minutes):
    if not due_date or not due_time:
        return None
    try:
        local_dt = datetime.strptime(f"{due_date} {due_time}", "%Y-%m-%d %H:%M")
        return local_dt - timedelta(minutes=int(utc_offset_minutes or 0))
    except (ValueError, TypeError):
        return None


def _send_vapid(task, user_id, title, subs, db):
    """Send Web Push to browser subscribers."""
    from services.push_service import send_push_notification
    import os
    frontend_url = os.getenv('FRONTEND_URL', 'https://done-todoapp.netlify.app')
    sent = 0
    for sub in subs:
        r = send_push_notification(
            sub.to_dict(), title, task.title,
            url     = f"{frontend_url}?task={task.id}",
            task_id = task.id, user_id = user_id,
        )
        if r == '410': db.session.delete(sub)
        elif r: sent += 1
    return sent


def _send_expo(task, user_id, title, db):
    """Send FCM push to React Native app via Expo gateway."""
    from models import FcmToken
    from services.expo_push import send_expo_push
    import os
    frontend_url = os.getenv('FRONTEND_URL', 'https://done-todoapp.netlify.app')
    fcm_tokens = FcmToken.query.filter_by(user_id=user_id).all()
    sent = 0
    for fcm in fcm_tokens:
        r = send_expo_push(
            token = fcm.token,
            title = title,
            body  = task.title,
            data  = { 'taskId': task.id, 'url': f"{frontend_url}?task={task.id}" },
        )
        if r == '410': db.session.delete(fcm)
        elif r: sent += 1
    return sent


def check_reminders(app):
    with app.app_context():
        try:
            from models import Task, User, PushSubscription
            from app_instance import db
            from services.email_service import send_reminder_email

            now_utc = datetime.utcnow()
            print(f'[Scheduler] Tick {now_utc.strftime("%H:%M:%S")} UTC', flush=True)

            active = Task.query.filter(
                Task.done     == False,
                Task.due_date != None,
                Task.due_time != None,
            ).all()

            print(f'[Scheduler] {len(active)} active tasks with due time', flush=True)
            changed = False

            for task in active:
                offset  = getattr(task, 'utc_offset_minutes', 0) or 0
                due_utc = _to_utc(task.due_date, task.due_time, offset)
                if not due_utc:
                    continue

                diff = (due_utc - now_utc).total_seconds()
                user = None
                subs = None

                def get_user_and_subs():
                    nonlocal user, subs
                    if user is None:
                        user = User.query.get(task.user_id)
                        if user:
                            subs = PushSubscription.query.filter_by(user_id=task.user_id).all()

                # ── T−15: 13–17 min before ────────────────────────────────
                if 780 <= diff <= 1020:
                    if not getattr(task, 'push_before_sent', False):
                        get_user_and_subs()
                        if user:
                            v = _send_vapid(task, user.id, 'Due in 15 minutes', subs or [], db)
                            e = _send_expo(task, user.id, 'Due in 15 minutes', db)
                            task.push_before_sent = True; changed = True
                            print(f'[T-15 Push] VAPID:{v} Expo:{e} "{task.title}"', flush=True)

                    if task.important and not getattr(task, 'email_before_sent', False):
                        get_user_and_subs()
                        if user:
                            send_reminder_email(user.email, user.preferred_name, task.title, task.due_time, task_id=task.id, timing='before')
                            task.email_before_sent = True; changed = True
                            print(f'[T-15 Email] → {user.email}: "{task.title}"', flush=True)

                # ── T+0: ±90 seconds ──────────────────────────────────────
                if -90 <= diff <= 90:
                    if not getattr(task, 'push_due_sent', False):
                        get_user_and_subs()
                        if user:
                            v = _send_vapid(task, user.id, 'Task is due now', subs or [], db)
                            e = _send_expo(task, user.id, 'Task is due now', db)
                            task.push_due_sent = True; changed = True
                            print(f'[T+0 Push] VAPID:{v} Expo:{e} "{task.title}"', flush=True)

                    if task.important and not getattr(task, 'email_due_sent', False):
                        get_user_and_subs()
                        if user:
                            send_reminder_email(user.email, user.preferred_name, task.title, task.due_time, task_id=task.id, timing='due')
                            task.email_due_sent = True; changed = True
                            print(f'[T+0 Email] → {user.email}: "{task.title}"', flush=True)

                # ── T+15: 13–17 min after (overdue) ──────────────────────
                if -1020 <= diff <= -780:
                    if not getattr(task, 'push_after_sent', False):
                        get_user_and_subs()
                        if user:
                            v = _send_vapid(task, user.id, 'Task is overdue', subs or [], db)
                            e = _send_expo(task, user.id, 'Task is overdue', db)
                            task.push_after_sent = True; changed = True
                            print(f'[T+15 Push] VAPID:{v} Expo:{e} "{task.title}"', flush=True)

                    if task.important and not getattr(task, 'email_after_sent', False):
                        get_user_and_subs()
                        if user:
                            send_reminder_email(user.email, user.preferred_name, task.title, task.due_time, task_id=task.id, timing='after')
                            task.email_after_sent = True; changed = True
                            print(f'[T+15 Email] → {user.email}: "{task.title}"', flush=True)

            if changed:
                db.session.commit()

        except Exception as e:
            print(f'[Reminder] EXCEPTION: {e}', flush=True)
            import traceback; traceback.print_exc()


def start_scheduler(app):
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        return _scheduler
    _scheduler = BackgroundScheduler(daemon=True)
    _scheduler.add_job(check_reminders, args=[app], trigger='interval',
                       seconds=30, id='reminder_check', max_instances=1, coalesce=True)
    _scheduler.start()
    print('[Scheduler] Started — every 30s (VAPID + Expo FCM)', flush=True)
    return _scheduler
