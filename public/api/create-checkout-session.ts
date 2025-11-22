import Stripe from "stripe";

// 🔥 Hardcode your secret key here (safe because this is server-side ONLY)
const stripe = new Stripe("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", {
  apiVersion: "2022-11-15", // use a stable, known version
});

// 🔥 Hardcode your PRICE ID here (must start with price_)
const HOODIE_PRICE_ID = "price_1SWMf3CehjiGbIW1tdk12uQm";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // We still read size, but we won't use it for now
    const { size } = req.body || {};

    if (!size) {
      return res.status(400).json({ error: "Size is required" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: HOODIE_PRICE_ID,
          quantity: 1,
        },
      ],
      // minimal required fields:
      success_url: "https://ghostriderjunior.com/merch?status=success",
      cancel_url: "https://ghostriderjunior.com/merch?status=cancelled",
    });

    // If we get here, Stripe succeeded and session.url MUST exist
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe Error:", err);
    // send back something visible
    return res.status(500).json({ error: "Stripe checkout error" });
  }
}
