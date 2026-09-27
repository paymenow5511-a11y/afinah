# afinah Core Engine

afinah is being built as a natural-language Life Operating System with user agency, consent, privacy and source-grounding as first-class controls.

## Implemented on this branch
- Domain registry for Heal, Mind, Execute, Money, Learn, Legal Research and Dreams & Goals.
- Natural-language domain routing and deterministic next-action plans.
- Consent gates and high-stakes response requirements.
- Text, PDF and structured-content intake planning.
- Life Map planning across the seven core domains.
- Authoritative-source research contract with jurisdiction, effective-date and citation requirements.
- Adaptive learning and vocabulary mastery planning.
- Energy-aware focus and accountability planning.
- Consent-gated voice session contract with raw-audio retention off by default.
- User-directed stability planning.
- Core profile, consent, goal and task record contracts.
- Storage binding contract that reports persistence as unconfigured until a real database is attached.
- Capability-gated tool policy for specialized agents.
- Runtime facade joining the core modules without exposing them publicly before authentication and persistence are ready.
- Automated tests plus Wrangler dry-run verification in GitHub Actions.

## Design rules
- User agency is sovereign.
- Sensitive domains activate only with explicit user consent.
- High-stakes outputs require source-grounding and visible uncertainty.
- Attention and focus support must remain functional support, not diagnosis.
- Agents operate through least-privilege capabilities rather than unrestricted production access.
- Raw voice data is not retained by default.
- Automated code changes must pass tests and deployment gates before production.

## Not connected yet
- Authentication and account/session management.
- Durable production database and migrations.
- Document extraction/indexing and retrieval store.
- External authoritative research providers.
- Live model, speech-to-text or text-to-speech providers.
- Production audit store and privacy-request workflows.

Those integrations must not be represented as complete until their bindings, tests and deployment state are verified.
