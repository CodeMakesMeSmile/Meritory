# A webhook delivery service for many customers

Your platform produces events whenever customer data changes, like a record being created or a connection losing access. Thousands of customers want to hear about these events at their own HTTPS endpoints, and many register several endpoints, each subscribed to different event types.

Customer endpoints are not under your control. Some answer in milliseconds, some take 20 seconds, some are down for days, and a few return errors for every request.

Design the service that delivers these webhooks. It should:

- Fan each event out to every endpoint subscribed to its type.
- Sign every delivery so customers can verify it came from you and wasn't replayed.
- Retry failed deliveries with backoff for up to three days, without letting slow or dead endpoints delay delivery to healthy ones.
- Say what ordering customers can rely on, and offer per-endpoint ordering if you think it's worth it.
- Disable endpoints that keep failing, and tell their owners.
- Let customers replay a single event or every event in a time range.
- Give customers a dashboard of each endpoint's deliveries, failures, and latency.

Assume about 50 million events per day, each going to three endpoints on average. The platform runs on AWS with TypeScript services.

You have 45 minutes. Work through requirements, estimates, the API, a high-level design, and deep dives, then wrap up with trade-offs and failure modes.
