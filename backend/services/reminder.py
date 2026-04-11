# reminder.py — definitive fix
#
# ISSUES FIXED:
# 1. Scheduler thread reset in gunicorn.conf.py post_fork (see that file)
# 2. push_sent / reminder_sent flags: tasks already tested have these=True
#    forever. Fix: reset them when due time is updated (already in tasks.py).
#    For brand new tasks they start as False — correct.
# 3. UTC offset: tasks with utc_offset_minutes=0 (old tasks or UTC users)
#    are compared against server UTC directly — works when offset is genuinely 0.
#    For IST users with old tasks, use debug/fix-offsets endpoint (see debug.py).
# 4. Wide matching window: ±90 seconds for exact due, 13-17 min for advance.
#    This absorbs any scheduler drift (runs every 30s).

from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta

_scheduler = None   # reset to None in gunicorn post_fork before calling start_scheduler


def _to_utc(due_date, due_time, utc_offset_minutes):
    """Convert local due datetime to UTC. Returns None if inputs invalid."""
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
            print(f'[Scheduler] Tick {now_utc.strftime("%H:%M:%S")} UTC', flush=True)

            active = Task.query.filter(
                Task.done     == False,
                Task.due_date != None,
                Task.due_time != None,
            ).all()

            print(f'[Scheduler] {len(active)} active tasks with due time', flush=True)

            for task in active:
                offset  = getattr(task, 'utc_offset_minutes', 0) or 0
                due_utc = _to_utc(task.due_date, task.due_time, offset)
                if not due_utc:
                    continue

                diff = (due_utc - now_utc).total_seconds()

                # ── 15-min advance push (window: 13–17 min = 780–1020s) ──────
                if task.important and not task.push_sent and 780 <= diff <= 1020:
                    user = User.query.get(task.user_id)
                    if user:
                        subs = PushSubscription.query.filter_by(user_id=task.user_id).all()
                        sent = 0
                        for sub in subs:
                            r = send_push_notification(
                                sub.to_dict(), '⏰ Due in 15 minutes', task.title)
                            if r == '410': db.session.delete(sub)
                            elif r: sent += 1
                        task.push_sent = True
                        db.session.commit()
                        print(f'[Reminder] 15-min push → {sent} device(s): "{task.title}"', flush=True)

                # ── 15-min advance email (same window, independent flag) ──────
                if task.important and not task.reminder_sent and 780 <= diff <= 1020:
                    user = User.query.get(task.user_id)
                    if user:
                        try:
                            send_reminder_email(user.email, user.preferred_name,
                                                task.title, task.due_time)
                            task.reminder_sent = True
                            db.session.commit()
                            print(f'[Reminder] Email → {user.email}: "{task.title}"', flush=True)
                        except Exception as e:
                            print(f'[Reminder] Email FAILED: {e}', flush=True)

                # ── Exact due-time push (window: ±90 seconds) ────────────────
                if not task.due_push_sent and -90 <= diff <= 90:
                    user = User.query.get(task.user_id)
                    if user:
                        subs = PushSubscription.query.filter_by(user_id=task.user_id).all()
                        sent = 0
                        for sub in subs:
                            r = send_push_notification(
                                sub.to_dict(), '🔔 Task is due now!', task.title)
                            if r == '410': db.session.delete(sub)
                            elif r: sent += 1
                        task.due_push_sent = True
                        db.session.commit()
                        print(f'[Reminder] Due-now push → {sent} device(s): "{task.title}"', flush=True)

        except Exception as e:
            print(f'[Reminder] EXCEPTION: {e}', flush=True)
            import traceback; traceback.print_exc()


def start_scheduler(app):
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        print('[Scheduler] Already running — skip', flush=True)
        return _scheduler
    _scheduler = BackgroundScheduler(daemon=True)
    _scheduler.add_job(
        func=check_reminders, args=[app],
        trigger='interval', seconds=30,
        id='reminder_check', max_instances=1, coalesce=True,
    )
    _scheduler.start()
    print('[Scheduler] Started — every 30s', flush=True)
    return _scheduler
