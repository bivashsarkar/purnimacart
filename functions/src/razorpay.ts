import * as crypto from 'crypto';
import Razorpay from 'razorpay';

let client: Razorpay | null = null;

export function getRazorpayClient(keyId: string, keySecret: string): Razorpay {
  if (!client) {
    client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return client;
}

export async function createRazorpayOrderRemote(
  keyId: string,
  keySecret: string,
  amountPaise: number,
  receipt: string
) {
  const rp = getRazorpayClient(keyId, keySecret);
  return rp.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt,
    payment_capture: true,
  });
}

// HMAC-SHA256("{order_id}|{payment_id}", key_secret) must equal the signature
// Razorpay returns to the client. This is the ONLY trustworthy way to confirm
// a payment succeeded — never take the client's word for it.
export function verifyRazorpaySignature(
  keySecret: string,
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false; // length mismatch etc. -> not equal
  }
}

// Verifies the `X-Razorpay-Signature` header on webhook deliveries, which is
// HMAC-SHA256 of the raw request body using a separate webhook secret.
export function verifyWebhookSignature(webhookSecret: string, rawBody: Buffer, signature: string): boolean {
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
