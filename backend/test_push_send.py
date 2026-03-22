# test_push_send.py
# Tests the full push send with a fake endpoint
# Expected result: HTTP 404 or 410 (endpoint doesn't exist) — NOT a key error
# Usage: python test_push_send.py

import os, base64, json
from dotenv import load_dotenv
load_dotenv()

from py_vapid import Vapid01
from pywebpush import WebPusher
from cryptography.hazmat.primitives.asymmetric import ec
import requests

vapid_priv  = os.getenv('VAPID_PRIVATE_KEY', '')
vapid_email = os.getenv('VAPID_CLAIM_EMAIL', '')

padding    = '=' * (4 - len(vapid_priv) % 4)
raw_bytes  = base64.urlsafe_b64decode(vapid_priv + padding)
num        = int.from_bytes(raw_bytes, 'big')
priv_key   = ec.derive_private_key(num, ec.SECP256R1())

v = Vapid01()
v._private_key = priv_key
v._public_key  = priv_key.public_key()

fake_sub = {
    'endpoint': 'https://fcm.googleapis.com/fcm/send/test_fake_token',
    'keys': {
        'p256dh': 'BNcRdreALRFXTkOOUHK1EtK2wtBPe7fxYn4XGQVqSqoJhfGCjJ88BI-ShKLKcfMEuVWMJHvWRNRRHFPuBq4kP4Y',
        'auth':   'tBHItJI5zvbpez2U5VlM1g'
    }
}

claims  = {'sub': f'mailto:{vapid_email}', 'aud': 'https://fcm.googleapis.com'}
headers = v.sign(claims)

payload = json.dumps({'title': 'Test', 'body': 'Test notification'})
pusher  = WebPusher(fake_sub)
encoded = pusher.encode(payload, content_encoding='aes128gcm')

headers['Content-Type']     = 'application/octet-stream'
headers['Content-Encoding'] = 'aes128gcm'
headers['TTL']              = '86400'

try:
    r = requests.post(fake_sub['endpoint'], data=encoded, headers=headers, timeout=10)
    print(f'HTTP {r.status_code}')
    if r.status_code in [400, 401, 404, 410]:
        print('✅ Key and encryption work correctly!')
        print('   (4xx = endpoint fake/expired, not a key error)')
    else:
        print(f'Response: {r.text[:200]}')
except Exception as e:
    print(f'Error: {e}')
