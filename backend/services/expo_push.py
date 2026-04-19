# expo_push.py — Send push via Expo's push service
# Expo acts as the FCM gateway for React Native apps.
# Free, no account needed beyond the Expo project.
# Sends to Android via FCM and iOS via APNs automatically.

import json
import urllib.request
import urllib.error


def send_expo_push(token, title, body, data=None):
    """
    Send a push notification via Expo's push service.
    Works for both Android (FCM) and iOS (APNs).
    token: Expo push token (starts with ExponentPushToken[...])
    """
    if not token or not token.startswith('ExponentPushToken'):
        print(f'[Expo Push] Invalid token: {token[:30]}', flush=True)
        return False

    payload = json.dumps({
        'to':    token,
        'title': title,
        'body':  body,
        'sound': 'default',
        'data':  data or {},
        'priority':             'high',
        'channelId':            'default',
        'categoryIdentifier':   'task_reminder',
        '_displayInForeground': True,
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://exp.host/--/api/v2/push/send',
        data    = payload,
        headers = {
            'Accept':           'application/json',
            'Content-Type':     'application/json',
            'Accept-Encoding':  'gzip, deflate',
        },
        method = 'POST',
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read().decode('utf-8'))
            status = result.get('data', {}).get('status')
            if status == 'ok':
                return True
            elif status == 'DeviceNotRegistered':
                print(f'[Expo Push] Token expired: {token[:30]}', flush=True)
                return '410'  # same convention as VAPID push
            else:
                print(f'[Expo Push] Non-ok status: {result}', flush=True)
                return False
    except Exception as e:
        print(f'[Expo Push] Error: {e}', flush=True)
        return False
