# Afinah architecture

## Product invariant
Afinah is user-directed. Sensitive domain modules activate only from explicit user intent or disclosure.

## Initial platform layers
1. Experience: responsive web shell, followed by low-latency voice.
2. Orchestration: intent routing and domain-scoped agents.
3. Safety and consent: activation gates, consent ledger, provenance and audit events.
4. Data: strict separation of identity, conversation, biometric, and financial domains.
5. Edge: Cloudflare Worker entrypoint with services added behind explicit interfaces.

## Build order
Foundation -> voice session -> identity/consent -> action engine -> domain modules -> wearable connectors -> peer network -> enterprise controls.
