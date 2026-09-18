# Confia — Production Readiness

## Quality gates

The repository has automated gates for TypeScript, unit tests, Firestore Rules tests, runtime dependency audit and production build. CI also runs browser smoke tests on Chromium and a mobile viewport.

## Firebase security

- Firestore Rules are version-controlled and tested against the Firestore Emulator.
- Community reactions are constrained to the authenticated user's own transition.
- Chat reads are restricted to participants and chat creation is tied to a real post.
- App Check support is implemented in `src/firebaseAppCheck.ts`.
- Set `VITE_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY` after registering the web app in Firebase App Check. Enforcement must be enabled in the Firebase Console after verifying legitimate traffic.

## Privacy

Ephemeral wellbeing inputs such as Blind Vent, voice journal text and catastrophic-thought drafts are not written to Firestore by these features. Exports intentionally omit ephemeral voice/thought content.

Before public launch, publish the final privacy notice, retention policy, deletion/contact process and data-processing agreements appropriate to the operating jurisdiction.

## Observability

`AppErrorBoundary` prevents a render failure from leaving a blank application and records a structured, non-sensitive console event. For production telemetry, connect the optional error-reporting boundary to an approved provider without sending message contents, journal text, biometrics or authentication tokens.

## Browser QA

Run `npm run test:e2e` locally after installing Chromium with Playwright. CI installs the browser and runs desktop + mobile smoke coverage. The current Cloud Shell has insufficient disk space for the Chromium download, so that browser binary is intentionally not retained in the project environment.

## Release checklist

1. Configure and enforce Firebase App Check.
2. Review Firestore Rules in the Firebase Console and deploy the exact version in the repository.
3. Confirm authentication, Firestore and App Check quotas/alerts.
4. Verify the privacy notice and account-deletion flow in the target jurisdiction.
5. Run the CI quality workflow and inspect the Playwright report.
6. Perform a final real-device pass on Android and supported mobile browsers.
