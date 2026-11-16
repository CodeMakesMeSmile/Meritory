# Sending test email through Amazon SES

Locally, every email goes to Mailpit. To see them in real Gmail and Outlook inboxes, send them through Amazon SES instead.

SES stays in its [sandbox](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html), so it only delivers to addresses you verify, at most 200 a day. Test mail comes from `no-reply@meritory.app`, through the `ca-central-1` region, with DNS in Cloudflare.

## 1. Verify the domain

1. In the SES console, switch to Canada (Central).
2. Under Identities, create a domain identity for `meritory.app`.
3. Tick Use a custom MAIL FROM domain, enter `bounce`, and set Behavior on MX failure to Reject message. A [custom MAIL FROM domain](https://docs.aws.amazon.com/ses/latest/dg/mail-from.html) makes SPF match our domain as well as DKIM.
4. Under Advanced DKIM settings, choose [Easy DKIM](https://docs.aws.amazon.com/ses/latest/dg/send-email-authentication-dkim-easy.html) with `RSA_2048_BIT`.
5. Untick both Publish DNS records to Route53 boxes, since our DNS is in Cloudflare.
6. SES lists three DKIM CNAME records and two for the bounce subdomain. Add each one in Cloudflare, in the `meritory.app` zone, with the proxy set to DNS only. Cloudflare adds `meritory.app` to each name, so enter only the part before it.

| Type | Name | Value |
|---|---|---|
| MX | `bounce` | `feedback-smtp.ca-central-1.amazonses.com`, priority 10 |
| TXT | `bounce` | `v=spf1 include:amazonses.com ~all` |

7. Wait until SES shows the identity as Verified, and DKIM and the MAIL FROM domain as Successful.

## 2. Turn on DMARC reports

In the `meritory.app` zone in Cloudflare, go to Email, then DMARC Management, and enable it. Cloudflare adds a `_dmarc` record with `p=none` and its own report address, and shows the reports there. Keep `p=none` while testing.

## 3. Verify the test inboxes

In the sandbox, SES only sends to verified addresses. Under Identities, create an email address identity for each test inbox, then open the link SES sends to it. A work mailbox may hold that email in quarantine.

## 4. Create SMTP credentials

In the SES console, open SMTP settings, choose IAM SMTP credentials, then Create IAM credentials. Mail Manager SMTP, the other choice, adds its own processing charges. This makes an IAM user that can only send email (`ses:SendRawEmail`). The SMTP password isn't an AWS secret key, it's shown only once, and it only works in this region ([SMTP credentials](https://docs.aws.amazon.com/ses/latest/dg/smtp-credentials.html)).

Put them in your `.env`, never in a committed file:

```
SMTP_HOST=email-smtp.ca-central-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=<SMTP user name>
SMTP_PASSWORD=<SMTP password>
MAIL_FROM=Meritory <no-reply@meritory.app>
```

The mailer refuses to send to any server other than Mailpit unless the connection is encrypted.

## 5. Send and check

```bash
pnpm mail:preview <verified inbox>
```

In Gmail, open each email and choose More, then [Show original](https://support.google.com/mail/answer/29436). SPF, DKIM, and DMARC should all say PASS. In Outlook, open the message headers and look for `spf=pass`, `dkim=pass`, and `dmarc=pass` in the `Authentication-Results` header. Nothing should land in spam.

To go back to Mailpit, put the local values from `.env.example` back in your `.env`.
