# push_service.py — FIXED for Chrome + Edge
# Edge uses Windows Push Notification Service (WNS) which needs aesgcm encoding
# Chrome uses FCM which accepts aes128gcm
# We detect which service based on the endpoint URL and use the right encoding

import json
import base64
import os
import requests as req_lib
from urllib.parse import urlparse


def _get_private_key(vapid_private_b64):
    from cryptography.hazmat.primitives.asymmetric import ec
    padding   = '=' * (4 - len(vapid_private_b64) % 4)
    raw_bytes = base64.urlsafe_b64decode(vapid_private_b64 + padding)
    num       = int.from_bytes(raw_bytes, 'big')
    return ec.derive_private_key(num, ec.SECP256R1())


def _pad(s):
    return s + '=' * (4 - len(s) % 4)


def send_push_notification(subscription_dict, title, body, url='/', icon='/favicon.svg'):
    from flask import current_app
    from py_vapid import Vapid01
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
    import http_ece

    vapid_private_b64 = current_app.config.get('VAPID_PRIVATE_KEY')
    vapid_email       = current_app.config.get('VAPID_CLAIM_EMAIL')

    if not all([vapid_private_b64, vapid_email]):
        print('[Push] VAPID keys not configured')
        return False

    try:
        # ── VAPID signing ───────────────────────────────────────────────────
        private_key    = _get_private_key(vapid_private_b64)
        v              = Vapid01()
        v._private_key = private_key
        v._public_key  = private_key.public_key()

        endpoint = subscription_dict['endpoint']
        parsed   = urlparse(endpoint)
        audience = f'{parsed.scheme}://{parsed.netloc}'
        claims   = {'sub': f'mailto:{vapid_email}', 'aud': audience}
        vapid_headers = v.sign(claims)

        # ── Detect push service ─────────────────────────────────────────────
        # Edge/Windows uses notify.windows.com → needs aesgcm encoding
        # Chrome/Firefox use FCM/autopush → use aes128gcm
        is_edge = 'notify.windows.com' in endpoint or 'windows.com' in endpoint
        encoding = 'aesgcm' if is_edge else 'aes128gcm'
        print(f'[Push] Endpoint: {endpoint[:60]}...')
        print(f'[Push] Using encoding: {encoding}')

        # ── Decrypt subscription keys ───────────────────────────────────────
        p256dh_bytes = base64.urlsafe_b64decode(_pad(subscription_dict['keys']['p256dh']))
        auth_bytes   = base64.urlsafe_b64decode(_pad(subscription_dict['keys']['auth']))

        # ── Receiver public key ─────────────────────────────────────────────
        receiver_pub = ec.EllipticCurvePublicKey.from_encoded_point(ec.SECP256R1(), p256dh_bytes)

        # ── Ephemeral sender key pair ───────────────────────────────────────
        sender_key = ec.generate_private_key(ec.SECP256R1())
        sender_pub = sender_key.public_key().public_bytes(Encoding.X962, PublicFormat.UncompressedPoint)
        sender_pub_b64 = base64.urlsafe_b64encode(sender_pub).decode().rstrip('=')

        # ── Payload ─────────────────────────────────────────────────────────
        payload = json.dumps({'title': title, 'body': body, 'url': url, 'icon': icon})
        salt    = os.urandom(16)

        encrypted = http_ece.encrypt(
            payload.encode('utf-8'),
            salt        = salt,
            private_key = sender_key,
            dh          = receiver_pub,
            auth_secret = auth_bytes,
            version     = encoding,
        )

        # ── Build headers ───────────────────────────────────────────────────
        crypto_key = vapid_headers.get('Crypto-Key', '')
        if encoding == 'aesgcm':
            # aesgcm requires dh key in Crypto-Key header and salt in Encryption header
            salt_b64 = base64.urlsafe_b64encode(salt).decode().rstrip('=')
            if crypto_key:
                crypto_key = crypto_key + ';dh=' + sender_pub_b64
            else:
                crypto_key = 'dh=' + sender_pub_b64
            headers = {
                'Authorization':  vapid_headers['Authorization'],
                'Crypto-Key':     crypto_key,
                'Encryption':     f'salt={salt_b64}',
                'Content-Type':   'application/octet-stream',
                'Content-Encoding': 'aesgcm',
                'TTL':            '86400',
            }
        else:
            # aes128gcm — salt and sender key embedded in ciphertext, simpler headers
            if crypto_key:
                headers = {
                    'Authorization':  vapid_headers['Authorization'],
                    'Crypto-Key':     crypto_key,
                    'Content-Type':   'application/octet-stream',
                    'Content-Encoding': 'aes128gcm',
                    'TTL':            '86400',
                }
            else:
                headers = {
                    'Authorization':  vapid_headers['Authorization'],
                    'Content-Type':   'application/octet-stream',
                    'Content-Encoding': 'aes128gcm',
                    'TTL':            '86400',
                }

        # ── Send ────────────────────────────────────────────────────────────
        response = req_lib.post(endpoint, data=encrypted, headers=headers, timeout=10)

        if response.status_code in [200, 201, 202]:
            print(f'[Push] ✅ Sent: {title} (HTTP {response.status_code})')
            return True
        elif response.status_code in [404, 410]:
            print(f'[Push] Subscription gone ({response.status_code})')
            return '410'
        else:
            print(f'[Push] HTTP {response.status_code}: {response.text[:300]}')
            return False

    except Exception as e:
        print(f'[Push] Error: {e}')
        import traceback
        traceback.print_exc()
        return False
