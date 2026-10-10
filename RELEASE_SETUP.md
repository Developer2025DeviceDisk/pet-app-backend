# Backend release setup

Branch codex/release-security contains local changes; nothing has been deployed.

The replacement app uses POST /auth/password/signup and /auth/password/login. Passwords use salted scrypt hashes; accounts have authMethod=password and do not claim email verification. Password changes revoke older token versions. New UI has no verification-code flow. Legacy OTP routes remain for old-client compatibility and require provider configuration if used; they are not required for new password signup.

Before deployment: back up MongoDB, inspect scripts/prepare-indexes.js in dry-run mode, then apply required sparse phone/referral/invitation/message indexes. Configure JWT_SECRET, database connection, persistent UPLOAD_DIRECTORY and copy existing uploads before changing paths. Provision ADMIN_USER_IDS explicitly. Configure trusted proxy and shared rate limiting before scaling. Do not clear customer records.

Socket joins, history and media require conversation membership; blocked sends are rejected. Text messages require clientId, with a compound unique index for retry deduplication. Test with two real staging accounts and reconnect/timeout cases.

Notifications require signed-app credentials and stored Expo device tokens. Referral rewards count completed referred accounts with pets; reminders are optional and at most weekly. Validate logout/device-token cleanup before release.

npm test runs 19 isolated tests without connecting to production. Native type checking also passes. Staging integration, password recovery, moderation operation, persistence, deletion/retention review, dependency audit fixes and TestFlight remain release gates.

GitHub write authentication is currently unavailable. Never commit hosting credentials or database secrets. The root RELEASE_READINESS.md records account/build blockers.
