import { z } from "zod";
import { infrai } from "./infrai_client.js";

export const receiptRequest = z.object({
  playerEmail: z.string().email(),
  playerName: z.string().min(1),
  orderId: z.string().min(1),
  itemName: z.string().min(1),
  amountCents: z.number().int().nonnegative(),
});
export type ReceiptRequest = z.infer<typeof receiptRequest>;

export function receiptDocument(input: ReceiptRequest): string {
  return `<h1>Order receipt</h1><p>Player: ${input.playerName}</p><p>Item: ${input.itemName}</p><p>Order: ${input.orderId}</p><p>Total: $${(input.amountCents / 100).toFixed(2)}</p>`;
}

export async function sendReceipt(raw: unknown) {
  const input = receiptRequest.parse(raw);
  const html = receiptDocument(input);
  const pdf = await infrai.pdf.generate({ html, page_size: "A4", orientation: "portrait", store: false });
  const email = await infrai.email.send({
    to: input.playerEmail,
    subject: `Receipt for order ${input.orderId}`,
    html: `${html}<p>Your receipt PDF has been generated.</p>`,
  });
  return { orderId: input.orderId, messageId: email.message_id, pdf };
}
