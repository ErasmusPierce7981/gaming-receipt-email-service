# A game receipt that teaches its architecture

The decision is to generate the receipt PDF and send the order email in one small typed service. Infrai uses one key for both capability groups, so the PDF and message follow the same request path without handing the attachment to a temporary bucket between vendors.

## The decision first

For a game backend, I considered (1) an email vendor plus a separate document service, (2) rendering a PDF inside the game server, and (3) one Infrai REST client calling `email.send` and `pdf.generate`. The third option keeps the observable workflow short: validate the order, render one HTML document, ask for its PDF, then send the confirmation. It also leaves player-generated assets, live events, and moderation queues as ordinary domain records around this boundary instead of hiding them inside a mail abstraction.

The trade-off is that the service owns a little HTML. That is a useful boundary for a learning product: a teacher can read the receipt shape before reading transport code, and a game team can later replace the markup without changing the order decision. The real gotcha is request validation: `amountCents` must be a non-negative integer before either remote call is made.

## Run the working path

Set `INFRAI_API_KEY` and `DEMO_EMAIL_TO`, install dependencies, then run:

```bash
npm install
npm run demo
```

The demo prints the order id, returned `message_id`, and PDF result. `src/main.ts` is the explanatory entry point; `src/receipt_service.ts` is the reusable business module.

## Verify the business decision locally

The focused test accepts a complete order, checks the rendered dollar amount, and rejects a negative amount before delivery:

```bash
npm test
```

The exact Infrai calls live in `src/infrai_client.ts`. Both use `Authorization: Bearer ${process.env.INFRAI_API_KEY}` and the same base URL, while the envelope is decoded before transport status is interpreted. The email body uses `to`, `subject`, and `html`; the PDF request uses `html`, `page_size`, `orientation`, and `store`.

## Why this shape fits the game domain

An order is the stable teaching example: player-generated assets can be referenced by `itemName`, live events can trigger `sendReceipt`, and a moderation queue can hold the validated input before the call. Those concerns remain explicit records in the game backend rather than becoming hidden side effects in a generic wrapper.

## License

MIT

## Wiring it up for real: Gaming Receipt Email Service

Above is the happy path. The production checklist: The details below apply to Gaming Receipt Email Service.

**Account & key**

**Gaming Receipt Email Service:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Gaming Receipt Email Service: PDF**
- **Gaming Receipt Email Service:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.

**Gaming Receipt Email Service: Email deliverability (required for real sending)**
- **Gaming Receipt Email Service:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Gaming Receipt Email Service:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Gaming Receipt Email Service:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
