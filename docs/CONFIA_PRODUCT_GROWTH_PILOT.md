# CONFIA — Product, Monetization & Adult Pilot Plan

Updated: 2 November 2026

## 1. Product positioning to validate

**CONFIA helps adults understand their own emotional patterns and discover small self-care actions that they personally find useful.** It is a self-care and reflection product, not a diagnostic or treatment service.

Primary differentiator to test: a transparent personal learning loop connecting check-ins, daily habits, self-reported intervention outcomes, insight feedback and a revisable Personal Manual.

## 2. Activation and retention metrics

The client now records the following lifecycle events locally on the device: `app_opened`, `activation_completed`, `retention_d1`, `retention_d7`, `retention_d30`, and existing check-in/feature events. These local records do not leave the device. They are useful for validating event definitions and personal debugging, but they are **not an investor-grade aggregate analytics system**.

Before remote measurement is added, implement a clear analytics opt-in, data minimization, retention schedule, processor review and an aggregate-only pipeline. Never transmit diary text, emotional scores, messages, health details, personal notes or raw insight content as product analytics.

Metric definitions:
- Activation: a new installation completes its first daily check-in.
- D1/D7/D30 retention: the installation is opened on the exact day 1/7/30 after its first recorded open; missed cohort days are not backfilled. Report the cohort denominator and timezone in dashboards.
- Habit adoption: a user records at least one optional habit event after activation.
- Personal insight usefulness: proportion of explicitly rated insights marked useful, reported only in sufficiently large anonymous cohorts.
- SOS outcome: self-reported before/after intensity is descriptive only; never call it clinical efficacy.
- Community safety: report volume, time to first review, final decision time, repeat reports and blocks; exclude report text from marketing analytics.

## 3. Adult pilot protocol

Recommended first pilot: 30–50 adults, 18+, over four weeks, recruited voluntarily. Do not recruit people in acute crisis as a product experiment cohort.

1. Explain the product, data categories, privacy controls and the peer-support limitations before onboarding.
2. Obtain explicit informed consent for participation and separate consent for any research interview or analytics sharing.
3. Keep essential SOS/self-regulation tools, reporting, blocking and deletion free and available.
4. Ask participants to use the app naturally; do not prescribe emotional or health behaviour changes.
5. Conduct short interviews at baseline, week 2 and week 4. Ask what was useful, confusing, repetitive, intrusive or difficult to trust.
6. Provide a direct support contact for pilot questions and a clear incident escalation process.
7. Stop the pilot if moderation coverage, privacy controls or account deletion are not functioning.
8. Publish only aggregate findings with a minimum cohort threshold; do not quote personal diary or message content.

Interview questions:
- What did you expect the app to help you do?
- What was the first moment that felt genuinely useful?
- Which screen or feature felt repetitive or confusing?
- Did any insight feel inaccurate, overconfident or intrusive?
- Did the app make it easy to return without guilt?
- Which tools would you miss if they disappeared?
- What would you never want the app to store or infer?
- Would you pay for deeper personal reports or longer-term learning? Why or why not?

## 4. Freemium hypothesis — not yet a billing implementation

Keep the core safety and self-care layer free:
- Daily check-in and basic emotional history.
- Core self-regulation/SOS exercises.
- Basic objectives and habits.
- Reporting, blocking, privacy controls and data deletion.
- Basic community access while it can be safely moderated.

Potential Plus value to test:
- Longitudinal Personal Map and extended comparisons.
- Monthly and quarterly reports.
- More personal experiments and reusable templates.
- Expanded Personal Manual export and backup.
- Companion customization and optional advanced reflection journeys.

Do not gate safety, crisis guidance, moderation or deletion behind payment. Do not sell emotional data or use it for advertising. Test willingness to pay with interviews and a non-binding concept page before selecting price, billing provider or implementing purchases. No live billing/subscription flow is currently included in this work.

## 5. International readiness

The application has Portuguese, English, Spanish and French production locales. Before country expansion:
- Review all safety, privacy, onboarding, SOS and peer-support language with native reviewers.
- Separate language from country; language selection must not be used to infer emergency jurisdiction.
- Maintain country-specific emergency/support resources only when verified against official providers and reviewed periodically. The current peer-support copy uses local emergency services as a safe fallback; the country directory and user-selectable jurisdiction are not yet implemented. Never infer a country from language alone.
- Do not present a peer listener as a crisis service.
- Confirm age policy, store declarations and privacy-policy language in each target market.

## 6. Decisions required before commercial launch

- Select official privacy contact and confirm controller details.
- Confirm Firebase project region and processor/subprocessor configuration.
- Choose analytics opt-in and aggregate backend approach.
- Approve a Plus feature set and pricing test.
- Select a billing provider and tax/refund handling.
- Name moderation owners and define coverage/escalation.
- Approve country-specific emergency resource list.
