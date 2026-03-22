# debug_push.py — run this in venv to diagnose the push issue
# Usage: python debug_push.py

import os, base64
from dotenv import load_dotenv
load_dotenv()

print("=== Step 1: Check pywebpush version ===")
import pywebpush
print("Version:", pywebpush.__version__)

print("\n=== Step 2: Check what vapid_private_key accepts ===")
import inspect
from pywebpush import webpush
# Find Vapid class and check how it loads keys
try:
    from pywebpush import Vapid
    src = inspect.getsource(Vapid.__init__)
    print(src[:500])
except:
    pass

print("\n=== Step 3: Try sending with raw base64url key directly ===")
# pywebpush 2.x may accept the raw base64url key as-is
vapid_priv = os.getenv('VAPID_PRIVATE_KEY', '')
vapid_email = os.getenv('VAPID_CLAIM_EMAIL', '')

padding   = '=' * (4 - len(vapid_priv) % 4)
raw_bytes = base64.urlsafe_b64decode(vapid_priv + padding)
print(f"Raw key bytes: {len(raw_bytes)}")

# Try loading with different methods
print("\nTrying PKCS8 PEM format...")
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.serialization import (
    Encoding, PrivateFormat, PublicFormat, NoEncryption
)
num = int.from_bytes(raw_bytes, 'big')
key = ec.derive_private_key(num, ec.SECP256R1())

# Try PKCS8 format (different from TraditionalOpenSSL)
pkcs8_pem = key.private_bytes(Encoding.PEM, PrivateFormat.PKCS8, NoEncryption()).decode()
print("PKCS8 PEM length:", len(pkcs8_pem))
print(pkcs8_pem[:80])

# Try TraditionalOpenSSL  
trad_pem = key.private_bytes(Encoding.PEM, PrivateFormat.TraditionalOpenSSL, NoEncryption()).decode()
print("\nTraditionalOpenSSL PEM length:", len(trad_pem))
print(trad_pem[:80])

print("\n=== Step 4: Test webpush with a fake subscription (will fail with 401/403, not key error) ===")
from pywebpush import WebPushException
fake_sub = {
    "endpoint": "https://fcm.googleapis.com/fcm/send/test",
    "keys": {
        "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtBPe7fxYn4XGQVqSqoJhfGCjJ88BI-ShKLKcfMEuVWMJHvWRNRRHFPuBq4kP4Y",
        "auth": "tBHItJI5zvbpez2U5VlM1g"
    }
}
try:
    webpush(
        subscription_info = fake_sub,
        data              = '{"title":"test","body":"test"}',
        vapid_private_key = pkcs8_pem,
        vapid_claims      = {'sub': f'mailto:{vapid_email}'},
    )
except WebPushException as e:
    code = e.response.status_code if e.response else 'no response'
    print(f"WebPushException (expected): HTTP {code}")
    if code in [400, 401, 403, 404, 410]:
        print("✅ Key format is VALID — got HTTP error not key error")
        print("   PKCS8 PEM format works!")
    else:
        print(f"Body: {e.response.text[:200] if e.response else str(e)}")
except Exception as e:
    err = str(e)
    if 'deserialize' in err or 'ASN.1' in err:
        print("❌ PKCS8 format also failed — trying raw base64url...")
        try:
            webpush(
                subscription_info = fake_sub,
                data              = '{"title":"test","body":"test"}',
                vapid_private_key = vapid_priv,
                vapid_claims      = {'sub': f'mailto:{vapid_email}'},
            )
        except WebPushException as e2:
            code = e2.response.status_code if e2.response else 'no response'
            print(f"WebPushException with raw key: HTTP {code}")
            if code in [400, 401, 403, 404, 410]:
                print("✅ Raw base64url key format works!")
            else:
                print(f"Still failing: {e2}")
        except Exception as e2:
            print(f"Raw key also failed: {e2}")
    else:
        print(f"Different error: {e}")
