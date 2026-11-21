# Model answer

This answer comes from Dana, a made-up backend engineer who leads the integrations area at a company that sells scheduling software to clinics. Use it to see the shape, then tell your own story.

"While I was debugging something else, I noticed our nightly billing export had fewer records than the appointments table on some days. Billing wasn't my team, and they were deep in a migration, so I told their lead I'd take it from start to finish.

I compared a week of exports against the source and found the gap was always late-evening bookings for clinics in western time zones. The export picked records by calendar date in UTC, but it ran on a local-time schedule, so a few hours each day fell between two runs and were never sent. I thought about just widening the window, but that risks sending records twice, which is worse for invoices. Instead I changed the export to track the last record it sent and pick up from there, so no window can be missed.

Then I cleaned up. I wrote a script that found every missed record from the past fourteen months, and worked with finance to reissue the invoices. I also asked account managers to give affected clinics a heads-up, so a corrected invoice wouldn't come as a surprise. Finally, I added a nightly check that compares counts on both sides and alerts on any gap, and wrote a short runbook for it.

We corrected 312 invoices and recovered about 41,000 dollars of under-billing. In the eight months since, the export hasn't missed a record, and the check has caught two unrelated problems early.

One thing I'd change is that I built the alert before agreeing who owned it, so it paged me for two weeks until I handed it to billing. Now I settle ownership of an alert before I build it."

## Why it works

- **Situation:** Two sentences, and it says why the problem was hers to take.
- **Actions:** Specific steps in the first person, including the option she rejected and why.
- **Result:** Numbers for invoices, money, and time, plus a sign that the fix lasted.
- **Reflection:** A real misstep with a concrete change in how she works.
- **Length:** About two minutes out loud, which leaves room for follow-ups like "How did you find the cause?"
