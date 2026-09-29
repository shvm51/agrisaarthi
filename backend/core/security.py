"""Supabase JWT auth dependency.

Dev mode: decodes the token payload without signature verification so the
mobile demo can run with a dummy token. PROD MUST verify the signature
against the Supabase JWKS and enforce role checks.
"""
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.config import get_settings

_bearer = HTTPBearer(auto_error=False)


def _decode_dev(token: str) -> dict:
    # TODO(PROD): verify signature via Supabase JWKS (https://<project>.supabase.co/auth/v1/.well-known/jwks.json),
    # check exp/aud, and enforce roles. Never ship decode-without-verify to production.
    return jwt.decode(token, options={"verify_signature": False})


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict:
    """Return {'sub': user_id, 'role': ...}. Auth is optional in dev/demo."""
    if creds is None:
        settings = get_settings()
        if settings.ENV == "production":
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing token")
        return {"sub": "demo-user", "role": "farmer"}  # dev fallback
    try:
        payload = _decode_dev(creds.credentials)
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")
    user_id = payload.get("sub") or payload.get("user_id")
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")
    return {
        "sub": user_id,
        "role": payload.get("role", payload.get("app_metadata", {}).get("role", "farmer")),
        "email": payload.get("email"),
    }
