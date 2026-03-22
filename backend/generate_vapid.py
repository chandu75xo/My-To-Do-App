# generate_vapid.py — run this once in your backend folder to get fresh VAPID keys
# Usage:  python generate_vapid.py
#
# Then copy the two lines printed into your .env file and restart Flask.

from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
import base64

key = ec.generate_private_key(ec.SECP256R1())

pub_bytes  = key.public_key().public_bytes(Encoding.X962, PublicFormat.UncompressedPoint)
priv_bytes = key.private_numbers().private_value.to_bytes(32, 'big')

pub_b64  = base64.urlsafe_b64encode(pub_bytes).decode().rstrip('=')
priv_b64 = base64.urlsafe_b64encode(priv_bytes).decode().rstrip('=')

print('\n# Copy these two lines into your .env file:\n')
print(f'VAPID_PUBLIC_KEY={pub_b64}')
print(f'VAPID_PRIVATE_KEY={priv_b64}')
print('\n# Then stop Flask, delete instance/todo.db, and restart: python app.py\n')
