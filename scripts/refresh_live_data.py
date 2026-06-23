from __future__ import annotations

import os
import sys

import httpx


def main() -> int:
    base_url = os.getenv("PUBLIC_BACKEND_URL", "http://127.0.0.1:8000").rstrip("/")
    response = httpx.post(f"{base_url}/refresh-data", timeout=15)
    response.raise_for_status()
    print(response.json())
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"refresh failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
