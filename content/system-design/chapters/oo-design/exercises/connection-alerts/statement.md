# Classes for connection issues and alerts

When syncs fail, your platform records the problem as an issue code, like `auth_revoked` or `provider_timeout`, and tells the customer. Design the classes for the part of the platform that turns sync outcomes into issues and alerts. Write it in TypeScript: interfaces, key method signatures, and the code for the main flow.

It should:

- Take each sync outcome for a connection: a success, or a failure with an issue code.
- Keep at most one open issue per connection and code, with when it was first seen, when it was last seen, and how many times it happened.
- Resolve a connection's open issues when one of its syncs succeeds.
- Alert each tenant through the channels it picked, like email, a webhook, or a chat integration, for the issue codes it picked.
- Send one alert when an issue opens and one when it resolves, never one per failed sync. Some codes, like `auth_revoked`, alert at once. Others, like `provider_timeout`, alert only after several failures in a row.
- Hold back alerts for connections whose provider has an open incident.
- Make adding a new channel a small change, and be testable without sending anything.

Assume one service with a relational database. Writing the message text and the details of delivering to each channel are out of scope.

You have 45 minutes. Clarify the requirements, list the entities, write the interfaces, and walk one flow in detail: a connection's third `provider_timeout` in a row, followed by a successful sync. In the last 10 minutes, extend the design with a daily digest option, so a tenant can get one summary a day instead of each alert.
