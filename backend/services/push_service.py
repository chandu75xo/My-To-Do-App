# push_service.py — v5d
# Updated to include task_id and complete_token in payload
# so the Service Worker can offer "Mark as complete" action.

import json, os
from pywebpush import webpush, WebPushException


def generate_completion_token(task_id, user_id):
    """Short-lived JWT that authorises completing one specific task."""
    from flask_jwt_extended import create_access_token
    from datetime import timedelta
    return create_access_token(
        identity=str(user_id),
        additional_claims={'purpose': 'complete', 'task_id': task_id},
        expires_delta=timedelta(hours=6),
    )


def send_push_notification(subscription_dict, title, body,
                           url='/', task_id=None, user_id=None):
    from flask import current_app

    vapid_private = current_app.config.get('VAPID_PRIVATE_KEY')
    vapid_email   = current_app.config.get('VAPID_CLAIM_EMAIL')

    if not vapid_private or not vapid_email:
        print('[Push] VAPID keys not configured — skipping', flush=True)
        return False

    backend_url = os.getenv('BACKEND_URL', '').rstrip('/')

    # Build payload — service worker reads all these fields
    data = {
        'title': title,
        'body':  body,
        'url':   url,
        'icon':  '/favicon.svg',
        'badge': '/favicon.svg',
        'tag':   f'task-{task_id}' if task_id else 'done-app',
    }

    # Include completion token if we have task + user
    if task_id and user_id and backend_url:
        try:
            token = generate_completion_token(task_id, user_id)
            data['completeToken'] = token
            data['completeUrl']   = f'{backend_url}/api/tasks/complete-token'
            data['taskId']        = task_id
        except Exception as e:
            print(f'[Push] Could not generate completion token: {e}', flush=True)

    payload = json.dumps(data)

    try:
        webpush(
            subscription_info = subscription_dict,
            data              = payload,
            vapid_private_key = vapid_private,
            vapid_claims      = {'sub': f'mailto:{vapid_email}'},
            content_encoding  = 'aes128gcm',
        )
        return True

    except WebPushException as e:
        if e.response and e.response.status_code == 410:
            print(f'[Push] Subscription expired (410)', flush=True)
            return '410'
        print(f'[Push] WebPushException: {e}', flush=True)
        return False

    except Exception as e:
        print(f'[Push] Unexpected error: {e}', flush=True)
        return False
