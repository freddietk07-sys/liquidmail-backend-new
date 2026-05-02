const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from a .env file if available
dotenv.config();

// Initialize Stripe with your secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
let stripe;
try {
  stripe = require('stripe')(stripeSecretKey);
} catch (e) {
  console.warn('Stripe not configured. Make sure to install the stripe package and set STRIPE_SECRET_KEY in your environment.');
  stripe = null;
}

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory settings for automatic reply behavior. When `autoSendDirectly` is
// true, replies will be sent immediately. When false, replies will be saved
// as drafts instead. These settings are stored in memory for demonstration
// purposes and will reset when the server restarts. In a production
// environment, you should persist these settings to a database.
let autoSendDirectly = false;

/**
 * Simulate sending an email using Gmail API. In a real implementation, this
 * function would use Google's APIs to send a message. Here it simply
 * resolves after a timeout to mimic an asynchronous call.
 */
async function sendEmail(reply) {
  // TODO: integrate Gmail API here. See https://developers.google.com/gmail/api
  return new Promise((resolve) => setTimeout(() => resolve(true), 300));
}

/**
 * Simulate saving a draft email. In a real implementation, this would call
 * the Gmail API to create a draft. It returns a placeholder draft ID.
 */
async function saveDraft(reply) {
  // TODO: integrate Gmail Drafts API here. See https://developers.google.com/gmail/api/guides/drafts
  return new Promise((resolve) =>
    setTimeout(() => resolve({ draftId: 'draft_' + Date.now() }), 300)
  );
}

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to provide the Stripe publishable key to the client
app.get('/config', (req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '' });
});

/**
 * Create a Stripe Checkout session.
 * This endpoint expects no body data. You can modify the pricing inside this handler.
 */
app.post('/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured.' });
  }
  const { amount, name, description } = req.body || {};
  // Validate amount (must be a positive integer representing cents)
  const priceInCents = parseInt(amount, 10);
  if (!priceInCents || isNaN(priceInCents) || priceInCents <= 0) {
    return res.status(400).json({ error: 'Invalid or missing amount for checkout session.' });
  }
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: name || 'LiquidMail Subscription',
              description: description || 'Subscription plan for LiquidMail service',
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.protocol}://${req.get('host')}/success.html`,
      cancel_url: `${req.protocol}://${req.get('host')}/cancel.html`,
    });
    res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error('Error creating Stripe Checkout session:', err);
    res.status(500).json({ error: 'Unable to create Stripe Checkout session' });
  }
});

/**
 * Placeholder endpoint for creating a PayPal transaction.
 * In a real implementation you would call the PayPal Orders API here.
 */
app.post('/create-paypal-transaction', (req, res) => {
  // TODO: Implement PayPal integration. See https://developer.paypal.com/docs/api/orders/v2/ for details.
  res.status(501).json({ error: 'PayPal integration not implemented. Please configure your PayPal credentials and implement the transaction handler.' });
});

/**
 * Get current auto-send setting. Returns whether automatic replies are sent
 * directly or stored as drafts.
 */
app.get('/settings', (req, res) => {
  res.json({ autoSendDirectly });
});

/**
 * Update the auto-send setting. Expects a JSON body with an `enable`
 * property. When set to true, automatic replies will be sent directly
 * instead of being saved as drafts.
 */
app.post('/settings/auto-send', (req, res) => {
  const { enable } = req.body || {};
  autoSendDirectly = !!enable;
  res.json({ autoSendDirectly });
});

/**
 * Endpoint to handle automatic replies. Expects a JSON body with a
 * `message` property containing the original email content. Generates a
 * simple reply (placeholder text) and either sends it or saves it as a
 * draft depending on the `autoSendDirectly` setting.
 */
app.post('/auto-reply', async (req, res) => {
  const { message } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: 'Missing message content.' });
  }
  // Placeholder reply content. In a real implementation you would call
  // an AI service such as OpenAI to generate this reply based on the
  // incoming message context and user settings.
  const reply = `Automated reply: Thank you for your message. We will get back to you soon.`;
  try {
    if (autoSendDirectly) {
      await sendEmail(reply);
      return res.json({ status: 'sent', reply });
    }
    const draft = await saveDraft(reply);
    return res.json({ status: 'drafted', draftId: draft.draftId, reply });
  } catch (err) {
    console.error('Error processing auto reply:', err);
    return res.status(500).json({ error: 'Error processing auto reply.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`LiquidMail website running at http://localhost:${PORT}`);
});