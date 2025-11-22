import Stripe from "stripe";

// Stripe instance using env secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

// Hoodie price ID
const HOODIE_PRICE_ID = process.env.HOODIE_PRICE_ID as string;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { size } = req.body;

    if (!size) {
      return res.status(400).json({ error: "Size is required" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: HOODIE_PRICE_ID,
          quantity: 1,
        },
      ],

      customer_creation: "if_required",

      shipping_address_collection: {
        allowed_countries: ["US", "GB", "DE", "FR", "HU", "PL", "NL", "RO"],
      },

      metadata: {
        order_type: "preorder",
        hoodie_size: size,
      },

      custom_fields: [
        {
          key: "size",
          label: { type: "custom", custom: "Hoodie Size" },
          type: "dropdown",
          dropdown: {
            options: [
              { label: "XS", value: "XS" },
              { label: "S", value: "S" },
              { label: "M", value: "M" },
              { label: "L", value: "L" },
              { label: "XL", value: "XL" },
              { label: "XXL", value: "XXL" },
            ],
          },
        },
      ],

      success_url: "https://ghostriderjunior.com/merch?status=success",
      cancel_url: "https://ghostriderjunior.com/merch?status=cancelled",
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe Error:", err);
    return res.status(500).json({ error: "Stripe checkout error" });
  }
}
