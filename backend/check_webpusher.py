# check_webpusher.py — inspect the actual WebPusher API
import inspect
from pywebpush import WebPusher

print("=== WebPusher.encode signature ===")
print(inspect.signature(WebPusher.encode))
print()
print("=== WebPusher.encode source ===")
print(inspect.getsource(WebPusher.encode))
