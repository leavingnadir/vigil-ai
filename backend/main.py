import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Firewall & ACL Generator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(http_options={"timeout": 60000})  # 60-second timeout

class FirewallAuditResponse(BaseModel):
    cisco_ios_acl: str = Field(description="Valid Cisco IOS Extended ACL commands")
    linux_iptables: str = Field(description="Valid Linux iptables CLI commands")
    palo_alto_cli: str = Field(description="Valid Palo Alto PAN-OS set security rule command")
    risk_score: int = Field(description="Security risk score from 1 (safest) to 10 (critical danger)")
    risk_level: str = Field(description="One of: LOW, MEDIUM, HIGH, CRITICAL")
    security_warnings: List[str] = Field(description="List of specific security risks or best-practice tips")
    hardened_suggestion: str = Field(description="Safer alternative rule if risk_score >= 6, else 'Rule follows least-privilege principles.'")

class RuleRequest(BaseModel):
    prompt: str
    environment: str = "Production Enterprise"

SYSTEM_PROMPT = """
You are a Senior Network Security Architect (CCIE / PCNSE).
Convert the user's plain-English network traffic request into accurate firewall configurations for:
1. Cisco IOS Extended ACL
2. Linux iptables
3. Palo Alto Networks CLI

Then perform a strict zero-trust security audit:
- Flag overly permissive rules (e.g., 0.0.0.0/0, 'any', unencrypted ports like Telnet/HTTP/FTP, or exposed SSH/RDP).
- Always enforce explicit 'deny ip any any' or default-drop posture where appropriate.
- Assign an honest risk_score from 1 to 10.
"""

MODELS_TO_TRY = [
    "gemini-3.5-flash-lite",
    "gemini-4-hydrogen",
    "gemini-3.8-flash",
]

@app.post("/api/generate", response_model=FirewallAuditResponse)
def generate_firewall_rules(req: RuleRequest):
    last_error = None
    for model_name in MODELS_TO_TRY:
        try:
            config_args = {
                "system_instruction": SYSTEM_PROMPT,
                "response_mime_type": "application/json",
                "response_schema": FirewallAuditResponse,
                "temperature": 0.2,
            }
            # Keep latency under 2 seconds on reasoning models
            if model_name in ("gemini-4-hydrogen", "gemini-3.8-flash"):
                config_args["thinking_config"] = types.ThinkingConfig(thinking_level="low")

            response = client.models.generate_content(
                model=model_name,
                contents=f"Environment: {req.environment}\nTraffic Request: {req.prompt}",
                config=types.GenerateContentConfig(**config_args),
            )
            return FirewallAuditResponse.model_validate_json(response.text)
        except Exception as e:
            last_error = e
            continue
    raise HTTPException(status_code=503, detail=f"Gemini API error: {last_error}")