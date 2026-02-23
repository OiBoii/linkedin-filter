# Analytics Decision for v1

Decision: **NO analytics in v1**.

Rationale:
- Core value is deterministic local filtering and can be validated through direct QA and user feedback.
- Adding analytics increases privacy/legal surface area and policy complexity with little launch-critical value.
- Chrome Web Store install/crash/review metrics are sufficient for initial rollout.

Revisit criteria for v1.1+:
- If reproducibility of field bugs is low, consider opt-in telemetry only.
- Telemetry must remain off by default and collect no page content, no identifiers, no URLs with params.
