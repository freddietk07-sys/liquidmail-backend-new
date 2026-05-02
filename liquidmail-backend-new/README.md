# LiquidMail Website

This repository contains a simple marketing website for **LiquidMail**, an AI‑powered email drafting and scheduling service. The site includes a modern, clean design with a dark color scheme (black and blue) and supports payments via both **Stripe** and **PayPal**.

## Features

* Responsive single‑page site with smooth transitions and modern card components
* Highlights key features of LiquidMail: AI drafting, scheduling, Gmail integration
* Pricing section with three subscription plans: **Basic** at $9/month, **Pro** at $19/month, and **Business** at $29/month
* Stripe Checkout integration for card payments
* PayPal button integration with sandbox support (requires client ID)

## Getting Started

1. **Install dependencies**

   ```bash
   cd liquidmail_website
   npm install
   ```

2. **Configure environment variables**

   Copy the provided `.env.example` to `.env` and fill in your own Stripe keys. You can obtain test keys from your Stripe dashboard.

   ```bash
   cp .env.example .env
   # Edit .env and set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY
   ```

   If you want to enable PayPal buttons, edit `public/script.js` and replace `YOUR_PAYPAL_CLIENT_ID` with your PayPal REST client ID.

3. **Run the server**

   ```bash
   npm start
   ```

   The site will be served on `http://localhost:3000` by default. Navigate there in your browser to view the website. When you click **Subscribe with Card**, the app will create a Stripe Checkout session and redirect you to the hosted payment page. On success or cancellation you will be brought back to the site.

## Deployment

This project uses a simple Express server and static files. You can deploy it to any Node‑compatible environment (e.g. Vercel, Railway, Heroku). Make sure to set the environment variables for your Stripe keys in the deployment settings.

## Customization

* **Design** – Edit `public/style.css` to tweak colors, fonts or spacing. The design uses a dark theme with a blue accent (#0070f3) and rounded corners on cards and buttons.
* **Pricing** – Adjust the price and plan details in `public/index.html` and `server.js` (line item amount) as needed.
* **Payments** – For recurring subscriptions, you can update the `/create-checkout-session` endpoint in `server.js` to use Stripe’s Subscription APIs or integrate the PayPal Orders API under `/create-paypal-transaction`.

## License

This project is provided as‑is for demonstration purposes. Feel free to adapt it for your own use.