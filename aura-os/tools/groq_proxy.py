#!/usr/bin/env python3
"""
AuraOS Groq Proxy
=================
Bridges the AuraOS kernel (running in QEMU) to the Groq API over serial.

The kernel sends requests over COM1 using the protocol:
    GROQ_REQ:<json payload>\n

This script forwards them to api.groq.com and writes back:
    GROQ_RES:<response text>\n   on success
    GROQ_ERR:<error message>\n   on failure

Created by Precious Adedokun — https://preciousadedokun.com.ng
Project: https://auraos.com

Usage:
    pip install pyserial requests
    export GROQ_API_KEY=your_key_here
    python3 tools/groq_proxy.py [--port /dev/ttyS0] [--baud 38400]

With QEMU, use a PTY or named pipe instead of a real serial port:
    QEMU flag:  -serial pty          (QEMU prints the PTY path on start)
    Then run:   python3 tools/groq_proxy.py --port /dev/pts/X
"""

import os
import sys
import json
import time
import argparse
import threading

try:
    import serial
except ImportError:
    print("ERROR: pyserial not installed. Run: pip install pyserial")
    sys.exit(1)

try:
    import requests
except ImportError:
    print("ERROR: requests not installed. Run: pip install requests")
    sys.exit(1)

# ---- Config -----------------------------------------------------------------

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL   = "llama-3.3-70b-versatile"
MAX_TOKENS   = 512
TIMEOUT_SEC  = 10

REQ_PREFIX = "GROQ_REQ:"
RES_PREFIX = "GROQ_RES:"
ERR_PREFIX = "GROQ_ERR:"

# ---- Groq call --------------------------------------------------------------

def call_groq(api_key: str, payload: dict) -> str:
    """Send a chat completion request to Groq and return the response text."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type":  "application/json",
    }
    resp = requests.post(
        GROQ_API_URL,
        headers=headers,
        json=payload,
        timeout=TIMEOUT_SEC,
    )
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"].strip()

# ---- Serial loop ------------------------------------------------------------

def run_proxy(port: str, baud: int, api_key: str, verbose: bool):
    print(f"[AuraOS Groq Proxy]")
    print(f"  Serial port : {port}")
    print(f"  Baud rate   : {baud}")
    print(f"  Model       : {GROQ_MODEL}")
    print(f"  API key     : {'*' * 8}{api_key[-4:] if len(api_key) > 4 else '****'}")
    print(f"  Waiting for kernel requests...\n")

    try:
        ser = serial.Serial(port, baud, timeout=1)
    except serial.SerialException as e:
        print(f"ERROR: Could not open serial port {port}: {e}")
        sys.exit(1)

    while True:
        try:
            line = ser.readline().decode("utf-8", errors="replace").strip()
        except Exception as e:
            print(f"[proxy] Serial read error: {e}")
            time.sleep(0.1)
            continue

        if not line:
            continue

        # Pass through non-request lines as kernel log output
        if not line.startswith(REQ_PREFIX):
            print(f"[kernel] {line}")
            continue

        # Extract JSON payload
        raw_json = line[len(REQ_PREFIX):]
        if verbose:
            print(f"[proxy] Request: {raw_json[:120]}...")

        t0 = time.time()
        try:
            payload = json.loads(raw_json)
            # Ensure our model and token limit are set
            payload["model"]      = GROQ_MODEL
            payload["max_tokens"] = MAX_TOKENS

            response_text = call_groq(api_key, payload)
            latency_ms    = int((time.time() - t0) * 1000)

            # Sanitise response for single-line protocol (replace newlines)
            response_text = response_text.replace("\n", " ").replace("\r", "")

            reply = f"{RES_PREFIX}{response_text}\n"
            ser.write(reply.encode("utf-8"))
            ser.flush()

            print(f"[proxy] OK  ({latency_ms}ms) → {response_text[:80]}...")

        except requests.HTTPError as e:
            err = f"HTTP {e.response.status_code}: {e.response.text[:100]}"
            print(f"[proxy] ERR {err}")
            ser.write(f"{ERR_PREFIX}{err}\n".encode("utf-8"))
            ser.flush()

        except json.JSONDecodeError as e:
            err = f"Invalid JSON from kernel: {e}"
            print(f"[proxy] ERR {err}")
            ser.write(f"{ERR_PREFIX}{err}\n".encode("utf-8"))
            ser.flush()

        except Exception as e:
            err = str(e)[:120]
            print(f"[proxy] ERR {err}")
            ser.write(f"{ERR_PREFIX}{err}\n".encode("utf-8"))
            ser.flush()

# ---- Entry point ------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="AuraOS Groq serial proxy — bridges QEMU serial to Groq API"
    )
    parser.add_argument("--port",    default="/dev/ttyS0",
                        help="Serial port (default: /dev/ttyS0). "
                             "Use the PTY path printed by QEMU when using -serial pty.")
    parser.add_argument("--baud",    default=38400, type=int,
                        help="Baud rate (default: 38400, must match kernel serial driver)")
    parser.add_argument("--verbose", action="store_true",
                        help="Print full request JSON")
    args = parser.parse_args()

    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        print("ERROR: GROQ_API_KEY environment variable not set.")
        print("  Get a free key at https://console.groq.com")
        print("  Then run: export GROQ_API_KEY=your_key_here")
        sys.exit(1)

    run_proxy(args.port, args.baud, api_key, args.verbose)

if __name__ == "__main__":
    main()
