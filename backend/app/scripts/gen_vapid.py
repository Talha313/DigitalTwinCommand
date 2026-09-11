"""Generate a VAPID keypair for web push. Run: uv run python -m app.scripts.gen_vapid"""

from __future__ import annotations

import base64

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def main() -> None:
    key = ec.generate_private_key(ec.SECP256R1())
    priv = key.private_numbers().private_value.to_bytes(32, "big")
    pub = key.public_key().public_bytes(
        serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint
    )
    print("VAPID_PRIVATE_KEY=" + _b64(priv))
    print("VAPID_PUBLIC_KEY=" + _b64(pub))


if __name__ == "__main__":
    main()
