import os
import hashlib
import secrets
from datetime import datetime, timedelta

def hash_password(password: str, salt: str = None) -> tuple[str, str]:
    """Hashes password using PBKDF2 with SHA-256 and a random salt."""
    if not salt:
        salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        120000  # 120,000 iterations for high security
    )
    return key.hex(), salt

def verify_password(password: str, password_hash: str, salt: str) -> bool:
    """Verifies a plaintext password against the stored hash and salt."""
    computed_hash, _ = hash_password(password, salt)
    return secrets.compare_digest(computed_hash, password_hash)

def generate_session_token() -> str:
    """Generates a secure cryptographically random URL-safe session token."""
    return secrets.token_urlsafe(36)

def get_session_expiry(days: int = 7) -> datetime:
    """Returns expiration timestamp for user sessions."""
    return datetime.utcnow() + timedelta(days=days)
