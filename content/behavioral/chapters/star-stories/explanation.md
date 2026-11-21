# Stories with STAR

A behavioral interview asks about what you've done, not what you would do. The idea is simple: how you handled real situations is the best guide to how you'll handle the next ones. For senior and staff roles, the same answers also tell the interviewer what level you work at. A senior story shows a hard problem solved well. A staff story usually shows a problem that crossed teams, a decision other people followed, and something that kept working after you moved on.

This chapter covers how to tell one story well, how to pick stories for the themes interviewers ask about, and how to keep a small bank of stories you can reuse. It ends with the parts of a culture loop that aren't stories at all: your short pitch, "why this company," the questions you ask, and how to talk with people at a casual company event.

## STAR, plus a reflection

STAR is a shape for answering any question that starts with "Tell me about a time" or "Give me an example of." It keeps you from rambling, and it makes sure the listener hears the part they care about.

| Part | What it covers | Rough share of your time |
|---|---|---|
| Situation | Where you were and what was going on, in a sentence or two | About a fifth |
| Task | What you were responsible for, or the goal you set yourself | A sentence |
| Action | What you did, step by step, and why | Most of it, around 60 percent |
| Result | What changed because of it, with numbers where you have them | A sentence or two |
| Reflection | What you learned, or what you'd do differently | A sentence or two |

The split comes from MIT's career office, which suggests spending the bulk of your answer on actions. That makes sense, because the actions are the behaviors the interview is named after. The company isn't hiring you to repeat your old project. It's hiring you to make the same kind of decisions on its problems.

A few habits make each part stronger.

- **Say "I," not "we."** Teamwork matters, but "we fixed it" hides what you did. Credit the team, then say what your part was.
- **Name decisions, not just tasks.** "I added a retry" is a task. "I added a retry with a cap and jitter, because the first version without jitter made the outage worse" is a decision with a reason.
- **Mention the options you didn't take.** One sentence like "I thought about rolling back, but that would have lost a day of orders" shows judgment.
- **Give numbers.** Minutes saved, errors cut, customers affected, money recovered. An honest estimate is fine if you say it's an estimate.
- **End with a reflection.** It's the easiest place to show growth, and for a failure story it's the most important part.

Don't say the letters out loud. Nobody needs to hear "So the situation was." The shape should be invisible.

## A worked example

Here is a story from Dana, a made-up backend engineer, answering a question about speed and quality.

**Question:** "Tell me about a time you had to move fast without lowering the bar."

**Situation and task.** "A prospect we'd been talking to for months asked to see bulk import in a live demo, ten days out. We didn't have a bulk import API, and I was the backend lead for that area, so it was mine to scope."

**Action.** "I started by asking sales what the prospect would actually do in the demo. It turned out they only needed to upload one CSV of about 5,000 patients and see the results. That let me cut the scope hard. I dropped the progress screen and the email summary, and wrote them up as tickets so they wouldn't get lost. What I refused to cut was validation and idempotency. I added a per-row check that rejects bad rows with a clear reason instead of failing the whole file, and an import key so a retried upload can't create duplicates. I shipped it behind a feature flag on day eight and ran the demo file through it on staging twice with the sales engineer."

**Result.** "The demo went smoothly and the prospect signed a month later. In the first week of real use, the row checks rejected 140 bad rows across three customers, and none of them turned into bad data or support tickets. We finished the two cut features in the next sprint."

**Reflection.** "I learned that asking what the demo really needs is the fastest way to cut scope safely. Now I ask that before I estimate anything with a deadline."

Why this works:

- The situation is two sentences, and it says why the story is hers.
- Most of the time is on actions, and each one has a reason.
- It shows both values in tension: she moved fast and kept the quality where it mattered.
- The result has numbers and a business outcome.
- It runs about ninety seconds out loud, which leaves room for follow-up questions.

## Common themes

Most behavioral questions fall into a handful of themes. Companies that publish values often ask one question per value, so read them as a list of likely themes. Amazon's published Leadership Principles are a well-known example, with entries like Customer Obsession, Ownership, and Bias for Action, each of which maps to a "Tell me about a time" question.

| Theme | What they're checking | A strong story shows |
|---|---|---|
| Ownership | Do you treat problems outside your lane as yours? | You saw it, took it on, fixed it, and made sure it stayed fixed |
| Customer work | Do you understand what the customer is trying to do? | Direct contact with a customer, the real goal behind the bug, a measured outcome for them |
| Conflict and disagreement | Can you disagree well and then commit? | You listened first, argued with evidence, and kept the relationship |
| Failure and mistakes | Can you own a real mistake? | A real failure, what you did right after, and what you changed |
| Ambiguity and scoping | Can you make progress without a full spec? | Questions you asked, a small first step, and how you narrowed it |
| Speed vs quality | Do you know which corners are safe to cut? | What you cut, what you protected, and why |
| Influencing without authority | Can you change a decision you don't own? | Data, a small proof, allies, and a change that others adopted |

For a failure story, pick a real failure with real cost. "I care too much" isn't a failure, and interviewers hear it as dodging the question. The story still ends well, because the ending is what you learned and changed.

For a conflict story, the other person should come across as reasonable. If they sound like a villain, the interviewer starts to wonder how you'd describe them next year.

For roles where engineers join customer demos, implementation calls, and support threads, expect more than one customer question. Have a story where you talked to a customer yourself, not just one where you fixed a ticket someone else triaged.

## Build a story bank

You can't predict every question, and you don't need to. Most strong candidates go in with a few rich stories and bend each one to fit the question. Tech Interview Handbook suggests picking three to five projects with high impact, high complexity, and heavy personal involvement. For a senior or staff loop, aim for five to seven, so you never have to tell the same story twice to the same panel.

Start with a list of projects, incidents, launches, and hard conversations from the last few years. For each, write STAR notes as bullet points, not a script. Then mark which themes it could answer. A good story usually covers two or three.

Here is a template, with one of Dana's stories filled in as an example.

| Story | One line | Ownership | Customer | Conflict | Failure | Ambiguity | Speed vs quality | Influence | Key numbers |
|---|---|---|---|---|---|---|---|---|---|
| Bulk import demo | Shipped a safe import API in ten days for a demo | x | x | | | x | x | | 10 days, 140 bad rows caught, deal signed |
| | | | | | | | | | |
| | | | | | | | | | |
| | | | | | | | | | |
| | | | | | | | | | |

When you reuse a story for a different theme, keep the situation the same and change the emphasis. Told for ambiguity, Dana's import story spends more time on the questions she asked sales. Told for customer work, it spends more on what the prospect needed. Told for speed vs quality, it spends more on what she cut and what she protected.

Once the table is full, look for empty columns. An empty column is a gap to fill before the interview, not during it.

## Telling it in about two minutes

Two minutes is roughly 250 to 300 spoken words. That's long enough for real detail and short enough that the interviewer can still ask follow-ups, which is where much of the signal comes from.

- **Practice out loud.** A story that reads well can still run four minutes when you say it. Time yourself.
- **Use notes, not a script.** A memorized answer sounds recited and breaks when the question is a little different. Know the beats and the numbers, and let the words change.
- **Take a breath before you start.** Saying "Let me think of a good example" is fine. A few seconds of thought beats the wrong story.
- **Stop at the end.** Finish with the reflection, then stop. "Happy to go deeper on any part" is a fine last line.
- **Expect to be asked why.** Follow-ups like "What else did you consider?" or "What would you do differently?" are normal. Know your stories well enough to answer them.

## Your short pitch

"Tell me about yourself" opens almost every round. Treat it as a short pitch in three parts.

1. **Past.** One or two highlights that lead to this role. Skip the year-by-year history.
2. **Present.** What you do now and one recent result you're proud of.
3. **Why this role.** What draws you to it and what you'd bring.

Keep it to about a minute. Here is Dana's version:

"I'm a backend engineer with about eight years in B2B software, mostly on APIs and data pipelines. For the last three years I've led the integrations area at a scheduling company, where I spend a fair bit of time on calls with customers' IT teams. Recently I cut sync failures for our largest customer from 18 percent to under one percent. I'm looking for a smaller team where engineers work this close to customers every day, which is a big part of why this role caught my eye."

Also keep a 30-second version. It's the same three parts with one sentence each, and you'll use it at the start of a panel and at social events.

## Why this company

"Why do you want to work here?" is easy to answer badly. Praise like "I love your mission" could be said about any company. A strong answer is specific, based on real research, and tied to your own experience.

Good places to research:

- **The product.** Sign up for a trial if there is one, or read the public docs, the API reference, and the changelog.
- **The customers.** Read case studies, public reviews, and support forums. Notice what customers praise and what they complain about.
- **The values and the job post.** Companies tell you what they'll ask about. Match each value to a story in your bank.
- **What the team writes.** Engineering blog posts, talks, and open source repositories show how they think.

Then build the answer from three pieces: something specific you found, why it matters to you, and a story or skill that connects. For example: "I read your API changelog and saw you ship small changes almost every week. I like working that way, and the import project I mentioned was the same kind of short loop with customers."

## Questions to ask

You'll almost always get "Do you have any questions for us?" Saying no can come across as low interest. Your questions also tell the team what you care about, and they help you find out whether you'd be happy there.

Bring more questions than you need, since earlier rounds may answer some. Good ones for a backend role that works close to customers:

**Customers**

- Who are your most demanding customers, and what do they push you on?
- How do engineers hear from customers today, and how often?
- What's a recent change you made because of a customer conversation?

**On-call and incidents**

- What does on-call look like, and how often is someone paged at night?
- Can you walk me through a recent incident and what changed afterward?
- Who joins a customer call when something breaks?

**How decisions get made**

- How does the team decide what to build next?
- When two engineers disagree on a design, how does it get settled?
- What's a technical decision from early on that you'd make differently now?

**What success looks like**

- What would a great first 90 days look like for this role?
- What's the most important problem you'd want this person to take on?
- How will I know I'm doing well, and who tells me?

Pick questions that fit the person. An engineer can tell you about on-call. A founder can tell you about direction. Listen to the answer and ask one follow-up, which shows you were listening.

## At a company social event

A small in-person company may invite you to lunch, drinks, or a team event as part of the loop. It isn't a formal interview, but people will remember how talking with you felt. The goal is to be easy and interesting to talk to.

- **Listen more than you talk.** Aim for the other person to do most of the talking.
- **Ask about their work.** "What are you working on this week?" or "What's the hardest part of your job right now?" leads to real conversation.
- **Follow the thread.** Ask a follow-up about what they just said instead of jumping to your next question.
- **Have your 30-second version ready.** When someone asks what you do, give the short pitch, then turn the question back to them.
- **Keep it human.** Talk about weekend plans, the city, or a book if that's where it goes. Not every sentence has to sell you.
- **Remember names and one detail.** A thank-you note that mentions their project is a nice touch.

Avoid turning the chat into an interview, complaining about a past employer, or pushing for inside information about the hiring decision.

## Before the day

- Five to seven stories in your bank, with every theme covered at least once.
- Each story said out loud and timed at about two minutes.
- A one-minute pitch and a 30-second pitch.
- A "why this company" answer built from something specific you found.
- A list of questions, grouped by who you might ask.
