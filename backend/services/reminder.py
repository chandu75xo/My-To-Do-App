# reminder.py — v6a
#
# NOTIFICATION SCHEDULE PER TASK:
#
#   T-15 min  → push (all) + email (important only)
#   T+0       → push (all) + email (important only)
#   T+15      → push (all) + email (important only)    [first overdue]
#   T+15 + 4h → push (all) + email (important only)    [repeat every 4h until done]
#   T+15 + 8h → push (all) + email (important only)
#   ...continues every 4h until task.done = True
#
#   DAILY EMAIL (important tasks): once per calendar day at task's due time
#              (or random 8am-6pm if no time set) until task is done
#
# All times in UTC, converted from user's stored utc_offset_minutes.
# push_after_sent = True means T+15 already fired.
# overdue_push_last_at  = last 4h-repeat push UTC datetime (None = none yet)
# overdue_email_last_date = YYYY-MM-DD of last daily email (None = none yet)

import os, random
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta

_scheduler = None
OVERDUE_REPEAT_HOURS = 4   # push every N hours while overdue


def _to_utc(due_date, due_time, offset_minutes):
    if not due_date or not due_time:
        return None
    try:
        local_dt = datetime.strptime(f"{due_date} {due_time}", "%Y-%m-%d %H:%M")
        return local_dt - timedelta(minutes=int(offset_minutes or 0))
    except (ValueError, TypeError):
        return None


def _local_now(offset_minutes):
    """Current local datetime for the user's timezone."""
    return datetime.utcnow() + timedelta(minutes=int(offset_minutes or 0))


def _send_push(task, user_id, title, subs, db):
    from services.push_service import send_push_notification
    frontend_url = os.getenv('FRONTEND_URL', 'https://done-todoapp.netlify.app')
    sent = 0
    for sub in subs:
        r = send_push_notification(
            sub.to_dict(), title, task.title,
            url=f"{frontend_url}?task={task.id}",
            task_id=task.id, user_id=user_id,
        )
        if r == '410': db.session.delete(sub)
        elif r: sent += 1
    return sent


def check_reminders(app):
    with app.app_context():
        try:
            from models import Task, User, PushSubscription
            from app_instance import db
            from services.email_service import send_reminder_email

            now_utc  = datetime.utcnow()
            today_str = now_utc.strftime('%Y-%m-%d')
            print(f'[Scheduler] Tick {now_utc.strftime("%H:%M:%S")} UTC', flush=True)

            active = Task.query.filter(
                Task.done     == False,
                Task.due_date != None,
            ).all()

            print(f'[Scheduler] {len(active)} active tasks', flush=True)
            changed = False

            for task in active:
                if not task.due_time and not task.due_date:
                    continue

                offset = getattr(task, 'utc_offset_minutes', 0) or 0

                # due_utc is None if task has no due_time
                due_utc = _to_utc(task.due_date, task.due_time, offset) if task.due_time else None
                diff    = (due_utc - now_utc).total_seconds() if due_utc else None

                user = None
                subs = None

                def get_user_subs():
                    nonlocal user, subs
                    if user is None:
                        user = User.query.get(task.user_id)
                        if user:
                            subs = PushSubscription.query.filter_by(user_id=task.user_id).all()

                # ── T-15: push + email ────────────────────────────────────
                if diff is not None and 780 <= diff <= 1020:
                    if not getattr(task, 'push_before_sent', False):
                        get_user_subs()
                        if user and subs:
                            n = _send_push(task, user.id, 'Due in 15 minutes', subs, db)
                            task.push_before_sent = True; changed = True
                            print(f'[T-15 push] {n}: "{task.title}"', flush=True)

                    if task.important and not getattr(task, 'email_before_sent', False):
                        get_user_subs()
                        if user:
                            send_reminder_email(user.email, user.preferred_name,
                                task.title, task.due_time, task_id=task.id, timing='before')
                            task.email_before_sent = True; changed = True
                            print(f'[T-15 email] → {user.email}: "{task.title}"', flush=True)

                # ── T+0: push + email ─────────────────────────────────────
                if diff is not None and -90 <= diff <= 90:
                    if not getattr(task, 'push_due_sent', False):
                        get_user_subs()
                        if user and subs:
                            n = _send_push(task, user.id, 'Task is due now', subs, db)
                            task.push_due_sent = True; changed = True
                            print(f'[T+0 push] {n}: "{task.title}"', flush=True)

                    if task.important and not getattr(task, 'email_due_sent', False):
                        get_user_subs()
                        if user:
                            send_reminder_email(user.email, user.preferred_name,
                                task.title, task.due_time, task_id=task.id, timing='due')
                            task.email_due_sent = True; changed = True
                            print(f'[T+0 email] → {user.email}: "{task.title}"', flush=True)

                # ── T+15: first overdue push + email ──────────────────────
                if diff is not None and -1020 <= diff <= -780:
                    if not getattr(task, 'push_after_sent', False):
                        get_user_subs()
                        if user and subs:
                            n = _send_push(task, user.id, 'Task is overdue', subs, db)
                            task.push_after_sent = True; changed = True
                            # Record first overdue push time for 4h repeat cadence
                            task.overdue_push_last_at = now_utc
                            print(f'[T+15 push] {n}: "{task.title}"', flush=True)

                    if task.important and not getattr(task, 'email_after_sent', False):
                        get_user_subs()
                        if user:
                            send_reminder_email(user.email, user.preferred_name,
                                task.title, task.due_time, task_id=task.id,
                                notes=getattr(task, 'notes', '') or '', timing='after')
                            task.email_after_sent = True; changed = True
                            print(f'[T+15 email] → {user.email}: "{task.title}"', flush=True)

                # ── OVERDUE REPEAT: every 4 hours after T+15 ─────────────
                # Fires when:
                #   1. T+15 has already fired (push_after_sent = True)
                #   2. Task is still incomplete
                #   3. 4 hours have passed since last overdue push
                is_overdue = due_utc is not None and now_utc > due_utc + timedelta(minutes=15)
                if not is_overdue and due_utc is None:
                    # Tasks with no time — treat as overdue if due_date < today
                    local_now = _local_now(offset)
                    local_due_end = datetime.strptime(task.due_date, '%Y-%m-%d').replace(
                        hour=23, minute=59, second=59)
                    is_overdue = local_now > local_due_end + timedelta(minutes=15)

                if is_overdue and getattr(task, 'push_after_sent', False):
                    last_push = getattr(task, 'overdue_push_last_at', None)
                    hours_since = (now_utc - last_push).total_seconds() / 3600 if last_push else 999

                    if hours_since >= OVERDUE_REPEAT_HOURS:
                        get_user_subs()
                        if user and subs:
                            # Calculate how many hours overdue for messaging
                            if due_utc:
                                hrs_overdue = int((now_utc - due_utc).total_seconds() / 3600)
                            else:
                                hrs_overdue = int(hours_since)

                            repeat_count = max(1, hrs_overdue // OVERDUE_REPEAT_HOURS)
                            n = _send_push(
                                task, user.id,
                                f'Still overdue — {hrs_overdue}h pending',
                                subs, db,
                            )
                            task.overdue_push_last_at = now_utc; changed = True
                            print(f'[OD push {hrs_overdue}h] {n}: "{task.title}"', flush=True)

                # ── DAILY EMAIL: once per calendar day while overdue ──────
                # Fires at:
                #   - Task's due time if it has one (converted to local)
                #   - Random time between 8am-6pm local if no due time
                # Only for important tasks. Fires once per calendar day.
                if is_overdue and task.important:
                    last_date = getattr(task, 'overdue_email_last_date', None)
                    local_now  = _local_now(offset)
                    local_date = local_now.strftime('%Y-%m-%d')

                    # Haven't sent today's email yet
                    if last_date != local_date:
                        should_fire = False

                        if task.due_time:
                            # Fire at same hour:minute as original due time
                            fire_hour   = int(task.due_time.split(':')[0])
                            fire_minute = int(task.due_time.split(':')[1])
                            if local_now.hour == fire_hour and local_now.minute == fire_minute:
                                should_fire = True
                        else:
                            # No time set — use a deterministic "random" slot
                            # based on task.id so it's consistent per task per day
                            import hashlib
                            seed = int(hashlib.md5(f"{task.id}{local_date}".encode()).hexdigest(), 16)
                            # Random hour 8–17 (8am–5pm so email arrives before 6pm)
                            fire_hour = 8 + (seed % 10)
                            if local_now.hour == fire_hour and local_now.minute < 30:
                                should_fire = True

                        if should_fire:
                            get_user_subs()
                            if user:
                                if due_utc:
                                    hrs_overdue = int((now_utc - due_utc).total_seconds() / 3600)
                                else:
                                    hrs_overdue = 0
                                send_reminder_email(
                                    user.email, user.preferred_name,
                                    task.title, task.due_time or '',
                                    task_id   = task.id,
                                    notes     = getattr(task, 'notes', '') or '',
                                    timing    = 'daily_overdue',
                                    overdue_count = hrs_overdue // OVERDUE_REPEAT_HOURS,
                                )
                                task.overdue_email_last_date = local_date
                                changed = True
                                print(f'[Daily email] → {user.email}: "{task.title}"', flush=True)

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
    print('[Scheduler] Started — every 30s', flush=True)
    return _scheduler
