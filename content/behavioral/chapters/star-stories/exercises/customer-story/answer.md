# Model answer

This answer comes from Dana, a made-up backend engineer who leads the integrations area at a company that sells scheduling software to clinics. Use it to see the shape, then tell your own story.

"Our largest customer, a network of about forty clinics, kept reporting that appointment sync to their records system failed every Monday morning. Their renewal was two months away and their IT lead had started copying our VP on tickets. Integrations was my area, so I joined the support thread and asked for a call with their IT lead.

Before the call I pulled our logs. About 18 percent of Monday morning sync calls failed, mostly with rate-limit errors followed by timeouts. On the call, I asked what Monday meant for them, and learned that's when every front desk books the week. I also learned their endpoint sat behind a shared gateway that allowed 50 requests a second per client. Nobody had told us that. Our retries fired right away with no backoff, so after the first burst every retry hit at once and made it worse.

Asking them to raise the limit wasn't an option, because the gateway served other vendors too. So I added a rate limiter per customer, set just under their limit, switched retries to exponential backoff with jitter, and moved the big Monday loads to their batch endpoint. I shipped it behind a flag for them first, and for the next two Mondays I watched the dashboards with their IT lead in a shared channel.

Monday failures dropped from 18 percent to 0.4 percent, tickets from that account went from about thirty a month to three, and they renewed for two years. The per-customer limit became a setting, and six other customers use it now.

Looking back, we never asked about rate limits during onboarding. I added that question to our implementation checklist, so it now comes up on every implementation call."

## Why it works

- **Situation:** Who the customer was, what was failing, and what was at stake, in a few sentences.
- **Actions:** Direct contact with the customer, the goal behind the problem, how she found the cause, and the option she ruled out.
- **Result:** Numbers for failures, tickets, and the renewal, plus a fix that helped other customers too.
- **Reflection:** A change to the process, so the next customer doesn't hit the same problem.
- **Length:** About two minutes out loud, which leaves room for follow-ups like "Why jitter?"
