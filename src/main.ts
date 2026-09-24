import { sendReceipt } from "./receipt_service.js";

const to = process.env.DEMO_EMAIL_TO;
if (!to) throw new Error("Set DEMO_EMAIL_TO before running the demo");

const result = await sendReceipt({
  playerEmail: to,
  playerName: "Mina",
  orderId: "quest-2048",
  itemName: "Astral Cartographer course",
  amountCents: 1299,
});
console.log(JSON.stringify(result, null, 2));
