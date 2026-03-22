# test_push_key.py
# Run this to verify your VAPID key is valid before testing push
# Usage: python test_push_key.py

import os
from dotenv import load_dotenv
load_dotenv()

vapid_private = os.getenv('VAPID_PRIVATE_KEY', '')
vapid_public  = os.getenv('VAPID_PUBLIC_KEY', '')
vapid_email   = os.getenv('VAPID_CLAIM_EMAIL', '')

print(f'Private key length (chars): {len(vapid_private)}')
print(f'Public key length (chars):  {len(vapid_public)}')
print(f'Email:                      {vapid_email}')
print()

import base64
try:
    padding   = '=' * (4 - len(vapid_private) % 4)
    raw_bytes = base64.urlsafe_b64decode(vapid_private + padding)
    print(f'Decoded private key: {len(raw_bytes)} bytes')
    
    if len(raw_bytes) == 32:
        print('✅ Key is raw 32-byte scalar — correct format')
        from cryptography.hazmat.primitives.asymmetric import ec
        num = int.from_bytes(raw_bytes, 'big')
        key = ec.derive_private_key(num, ec.SECP256R1())
        print('✅ EC key derived successfully')
        
        from cryptography.hazmat.primitives.serialization import (
            Encoding, PrivateFormat, NoEncryption
        )
        pem = key.private_bytes(Encoding.PEM, PrivateFormat.TraditionalOpenSSL, NoEncryption())
        print(f'✅ PEM generated: {len(pem)} bytes')
        print()
        print('Key is valid — push should work!')
    else:
        print(f'⚠️  Key is {len(raw_bytes)} bytes — expected 32')
        print('Run: python generate_vapid.py  to get fresh keys')
except Exception as e:
    print(f'❌ Error: {e}')
    print('Run: python generate_vapid.py  to get fresh keys')
