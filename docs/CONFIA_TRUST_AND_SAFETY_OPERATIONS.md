# CONFIA — Trust, Safety & Privacy Operations

Updated: 2 November 2026
Status: implementation baseline; operational owner approval and production verification required.

## 1. Data inventory and deletion scope

| Data | Location | Deletion behavior |
|---|---|---|
| Anonymous Firebase identity | Firebase Auth | Deleted after remote user-owned records are processed |
| Habit journal and private preferences/devices | `users/{uid}/...` | Paginated deletion |
| Community posts and reactions | `posts` | Own posts deleted; reactions removed from other posts |
| Private chats | `chats/{id}/messages` | Own messages removed; owned chats deleted; remaining chats detach the deleted participant |
| Listening requests/profile | `listeningRequests`, `listeningProfiles` | Requests where requester/accepted listener is the account are deleted; own profile deleted |
| Experience matching | `communityMatchProfiles`, `communityMatchRequests` | Own profile and incoming/outgoing requests deleted |
| Experience circles | `experienceMatchCircles/{id}/messages` | Own messages deleted; account removed from participant list |
| Community polls | `communityPolls` | Polls authored by the account are deleted; the account is removed from vote lists on other polls |
| Blocks | `blocks` | Blocks created by the account are deleted; blocks created by other people may remain as their private safety preference and retain the technical target identifier |
| Reports | `reports` | Reports filed by the account are deleted; reports about the account remain under the safety retention rule below |
| Local app state | browser/device storage | Cleared after remote deletion succeeds and Auth deletion completes |

Firestore subcollections do not cascade-delete when a parent document is deleted. Account deletion now runs through the authenticated `deleteAccountData` callable using the Admin SDK, explicitly processes message collection groups and recursively deletes owned chat/user trees. Query cleanup uses batches below Firestore's 500-operation limit. The callable must be deployed before the in-app deletion action can succeed.

## 2. Moderation report retention

- New reports enter `pending` and must be visible to an authorized moderator.
- Pending reports are never automatically purged by the scheduled retention task.
- A moderator decision must set `status` to `reviewed`, `actioned`, or `dismissed`, plus `reviewedAt` and `reviewedBy`.
- Finalized reports are automatically deleted 180 days after `reviewedAt`.
- If a report is connected to an ongoing legal/safety incident, an authorized moderator can activate a justified `legalHold` from the moderation dashboard. The scheduled cleanup skips held reports. The hold should be removed when the preservation need ends; access and reasons remain visible to moderators.
- A daily Cloud Scheduler-backed function runs in `europe-west1` at 03:20 Europe/Lisbon. Deployment and scheduler availability must be verified.

## 3. Moderation response procedure

1. Review the report queue at least once every 24 hours while the Community is open to users.
2. Prioritize credible threats, exploitation, harassment, disclosure of personal data, and content indicating immediate danger.
3. Restrict access to the report and related conversation to authorized moderators only.
4. Record a concise factual decision; do not copy unnecessary sensitive content into moderator notes.
5. Where appropriate, remove content, suspend the relevant interaction, and preserve only the minimum evidence needed for the incident.
6. For imminent danger, use the approved emergency escalation procedure for the user's country. The app's SOS button is self-regulation only and is not an emergency dispatch service.
7. Never promise a response time or emergency intervention that the service cannot staff and deliver.

**Operational blocker:** the product code cannot guarantee a human moderator is on duty. Before opening or scaling peer support, the operator must designate coverage, escalation contacts, a response rota, and a process for appeals and false reports.

## 4. App Check production gate

- Register the web app in Firebase App Check and configure reCAPTCHA Enterprise.
- Set `VITE_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY` in the production build environment; never commit the key.
- Confirm `initAppCheck()` completes and that valid App Check tokens are attached to Firebase requests.
- Monitor App Check metrics in Firebase Console before enabling enforcement.
- Enable enforcement separately for each supported Firebase product only after legitimate app traffic is verified.
- Test Android/web production builds and debug builds with their respective App Check providers.

The code can initialize App Check; it cannot configure Firebase Console enforcement. Missing key or missing enforcement means the production gate is not complete.

## 5. Privacy publication checklist

- Review `public/privacy-policy.html` with the actual Firebase project region, Google/Firebase service configuration, data processing terms, and controller contact details.
- Replace the contact placeholder with an official monitored address.
- Confirm lawful bases, international transfer safeguards, rights-request handling, and any legally required representative/DPO details with qualified counsel.
- Publish the policy at a stable public HTTPS URL.
- Update the Google Play Console privacy-policy URL and verify the link from the store listing and in-app Settings.
- Confirm the policy describes all current app features and matches the Play Data safety declaration.

## 6. Release acceptance checklist

- [ ] Account deletion tested with posts, reactions, direct chats, listening requests, match requests, circles, blocks, reports, devices and habit records.
- [ ] No deleted UID remains in active profiles, participant arrays, unread lists, or authored messages except report audit records within the approved retention period.
- [ ] Private one-to-one, peer-listening and group conversations all expose report/block controls.
- [ ] Firestore rules tests prove blocked pairs cannot create chats or send messages.
- [ ] Moderator workflow tested with authorized and unauthorized accounts.
- [ ] App Check configured, metrics reviewed, and enforcement enabled for production services.
- [ ] Privacy policy publicly hosted and Play Console URL updated.
- [ ] SOS completion does not claim recovery or award XP; it asks the user how they feel after the exercise.
- [ ] Calendar dates without a log are displayed as “No record”, never as rest.
- [ ] Typecheck, lint, unit tests, Firestore emulator tests, Android build and device tests pass.

## 7. Known limits

This document is not legal advice or a clinical safety certification. Retention cleanup only handles finalized reports. A production moderation team, incident escalation process, legal-hold capability, Firebase Console App Check enforcement and public privacy-policy publication remain operational requirements.
