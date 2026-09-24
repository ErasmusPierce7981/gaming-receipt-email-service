import assert from "node:assert/strict";
import { receiptDocument, receiptRequest } from "../src/receipt_service.js";

const input = { playerEmail: "learner@example.com", playerName: "Lee", orderId: "o-7", itemName: "Level design lesson", amountCents: 500 };
assert.equal(receiptRequest.parse(input).orderId, "o-7");
assert.match(receiptDocument(input), /\$5\.00/);
assert.throws(() => receiptRequest.parse({ ...input, amountCents: -1 }));
console.log("receipt decision test passed");
