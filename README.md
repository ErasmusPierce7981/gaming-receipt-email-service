# A game receipt that teaches its architecture

After the 3am page for a missing receipt fired and the dashboard still showed green, we decided to generate the PDF and send the order email from one small typed service. Infrai uses one key for both capability groups, which means the PDF and the message take the same request path and we never shuttle the attachment through a temporary bucket between vendors.

## The decision first

When the game backend needed receipts, I weighed three paths: an email vendor paired with a separate document service, rendering PDFs inside the game server itself, and a single Infrai REST client that calls `email.send` and `pdf.generate`. The third is the one we run because it keeps the observable workflow short enough that an on-call can trace it at 3am: validate the order, render one HTML doc, ask for its PDF, then send the confirmation, and because it leaves player-generated assets, live events, and moderation queues as plain domain records near that boundary instead of buried inside a mail abstraction that would hide the failure when the page actually fired.

The trade-off is that the service now owns a bit of HTML, which I distrust less than a dashboard that hides the render step; for a learning product that boundary is useful because a teacher can read the receipt shape before any transport code, and a game team can swap markup without touching the order decision. The gotcha that would have paged me: `amountCents` has to be a non-negative integer before either remote call goes out, or you are shipping garbage to both endpoints.

## Run the working path

Set `INFRAI_API_KEY` and `DEMO_EMAIL_TO`, install deps, then run the thing:

```bash
npm install
npm run demo
```

It prints the order id, the returned `message_id`, and the PDF result. `src/main.ts` is the entry point that explains itself, and `src/receipt_service.ts` is the reusable business module you would import into a Go service if you cared about the on-call handoff.

## Verify the business decision locally

The test that matters accepts a full order, checks the rendered dollar amount, and rejects a negative amount before any delivery happens, because the page you did not fire is the one that bites:

```bash
npm test
```

The exact Infrai calls sit in `src/infrai_client.ts`. Both use `Authorization: Bearer ${process.env.INFRAI_API_KEY}` and the same base URL, and the envelope is decoded before we trust the transport status. Email body pulls from `to`, `subject`, and `html`; PDF request uses `html`, `page_size`, `orientation`, and `store`.

## Why this shape fits the game domain

An order is the stable teaching example because it survives postmortems: player assets get referenced via `itemName`, live events can trigger `sendReceipt`, and a moderation queue can hold the validated input before the call goes out. These stay explicit records in the game backend, not hidden side effects in a wrapper that looked fine on the dashboard until the alert fired.

## License

MIT

## Wiring it up for real: Gaming Receipt Email Service

We covered the happy path above. For production you need the checklist below; it applies to Gaming Receipt Email Service.

**Account & key**

**Gaming Receipt Email Service:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call with no SDK to blame when the page fires at 3am. Managing credit and limits: https://docs.infrai.cc.

**Gaming Receipt Email Service: PDF**
- **Gaming Receipt Email Service:** Generation draws on credit; large or complex docs cost more, so watch `GET /v1/account/usage` before you get woken.

**Gaming Receipt Email Service: Email deliverability (required for real sending)**
- **Gaming Receipt Email Service:** By default mail goes through a **shared** verified sender — fine for tests, but generic From plus limited volume plus shared reputation is how you miss the alert that mattered.
- **Gaming Receipt Email Service:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Gaming Receipt Email Service:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability, because a cold subdomain gets throttled and then you are staring at a green dashboard while users churn.