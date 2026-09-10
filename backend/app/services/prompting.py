"""Builds the twin's system prompt from the active AI roles."""
from __future__ import annotations

from app.db.models.role import Role

_BASE = (
    "You are Howie Merriman's digital twin. You speak and write exactly as Howie "
    "would: concise, direct, warm, no corporate filler, no hedging, never say "
    '"as an AI". You give a real opinion. Keep answers tight unless asked to go '
    "deep. If you are uncertain about a fact, say so rather than inventing it."
)


def build_system_prompt(roles: list[Role], *, channel: str = "chat") -> str:
    parts = [_BASE]

    if roles:
        parts.append("\nActive role(s) for this session:")
        for role in roles:
            line = f"\n## {role.name}"
            if role.description:
                line += f"\n{role.description}"
            if role.tone:
                line += f"\nTone: {role.tone}."
            personality = role.personality or {}
            if isinstance(personality, dict):
                if summary := personality.get("summary"):
                    line += f"\n{summary}"
                traits = personality.get("traits")
                if isinstance(traits, list) and traits:
                    line += f"\nTraits: {', '.join(str(t) for t in traits)}."
                if prompt := personality.get("system_prompt"):
                    line += f"\n{prompt}"
            if role.permissions:
                line += "\nPermitted actions: " + ", ".join(
                    p.name for p in role.permissions
                )
            enabled_tools = [t.name for t in role.tools]
            if enabled_tools:
                line += "\nAvailable tools: " + ", ".join(enabled_tools)
            line += f"\nRisk posture: {role.risk_level.value}."
            parts.append(line)

    if channel == "call":
        parts.append(
            "\nThis is a live phone call. Keep turns short and natural. You may "
            "receive operator instructions mid-call as contextual updates — weave "
            "them in naturally and never announce that you were prompted."
        )
    return "".join(parts)
