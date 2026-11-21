# A unified API over hundreds of data providers

Your company sells one API that gives business customers a single, consistent view of data held by more than 300 outside providers, such as vehicle, payroll, or banking data providers. A customer's end users connect their accounts at those providers, and the customer then reads the data through your API without writing a separate integration for each provider.

The providers are a mixed bunch. Some use OAuth, some API keys, and some only a username and password. Most offer REST APIs, a few still use SOAP, and each has its own rate limits and its own way of paging through results. They go down, change their responses without warning, and sometimes send data hours late.

Design the system. It should:

- Let customers connect end-user accounts at any supported provider and see whether each connection is working.
- Keep each connection's data fresh by syncing on a schedule, let customers ask for a fresh sync on demand, and load history when a connection is first made.
- Turn every provider's data into one common model, while keeping what the provider originally sent.
- Deliver data to customers through an API, through webhooks when data changes, and through bulk exports to their own storage or stream.
- Keep every customer's data isolated, and keep one customer or one provider from slowing down the rest.
- Show clearly when a connection is disconnected, when syncs are failing, and when the data itself has problems, and spot when a whole provider is having an outage.

Assume about 2 TB of provider data arrives per day across all customers. The company runs TypeScript services on AWS and uses serverless and event-driven tools where they fit.

You have 45 minutes. Work through requirements, estimates, the API, a high-level design, and deep dives, then wrap up with trade-offs and failure modes.
