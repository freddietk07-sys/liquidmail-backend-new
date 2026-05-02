// Wait for DOM content to load before running scripts
document.addEventListener('DOMContentLoaded', async () => {
  // Update the copyright year
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // Fetch Stripe publishable key from the server
  let publishableKey = '';
  try {
    const configRes = await fetch('/config');
    const configData = await configRes.json();
    publishableKey = configData.publishableKey;
  } catch (err) {
    console.warn('Unable to retrieve Stripe publishable key:', err);
  }

  // Load Stripe.js if a publishable key is available
  let stripe = null;
  if (publishableKey) {
    const stripeJs = document.createElement('script');
    stripeJs.src = 'https://js.stripe.com/v3/';
    stripeJs.onload = () => {
      stripe = Stripe(publishableKey);
    };
    document.head.appendChild(stripeJs);
  }

  // Attach click handlers for all checkout buttons (Basic, Pro, Business)
  const checkoutButtons = document.querySelectorAll('.checkout-button');
  checkoutButtons.forEach((button) => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!stripe) {
        alert('Stripe is not configured. Please try again later.');
        return;
      }
      const amount = button.getAttribute('data-amount');
      const name = button.getAttribute('data-name');
      const description = button.getAttribute('data-description');
      // Disable the button to prevent duplicate clicks
      button.disabled = true;
      try {
        const response = await fetch('/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ amount, name, description }),
        });
        const session = await response.json();
        if (session.url) {
          window.location.href = session.url;
        } else if (session.id) {
          await stripe.redirectToCheckout({ sessionId: session.id });
        } else {
          throw new Error('Unable to initiate Stripe checkout session');
        }
      } catch (err) {
        console.error('Error starting checkout:', err);
        alert('There was a problem starting your checkout. Please try again.');
      } finally {
        button.disabled = false;
      }
    });
  });

  // Initialize PayPal Buttons for each plan if client ID is provided
  const PAYPAL_CLIENT_ID = 'YOUR_PAYPAL_CLIENT_ID'; // Replace with your PayPal client ID
  if (PAYPAL_CLIENT_ID && PAYPAL_CLIENT_ID !== 'YOUR_PAYPAL_CLIENT_ID') {
    const paypalScript = document.createElement('script');
    paypalScript.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
    paypalScript.onload = () => {
      const planConfigs = [
        { id: 'paypal-basic', value: '9.00', description: 'Basic Plan' },
        { id: 'paypal-pro', value: '19.00', description: 'Pro Plan' },
        { id: 'paypal-business', value: '29.00', description: 'Business Plan' },
      ];
      planConfigs.forEach((plan) => {
        const containerId = '#' + plan.id;
        const container = document.querySelector(containerId);
        if (!container) return;
        paypal
          .Buttons({
            createOrder: function (data, actions) {
              return actions.order.create({
                purchase_units: [
                  {
                    amount: {
                      value: plan.value,
                    },
                    description: `LiquidMail ${plan.description}`,
                  },
                ],
              });
            },
            onApprove: function (data, actions) {
              return actions.order.capture().then(function () {
                window.location.href = '/success.html';
              });
            },
            onCancel: function () {
              window.location.href = '/cancel.html';
            },
            onError: function (err) {
              console.error('PayPal Checkout error:', err);
              alert('An error occurred during PayPal checkout. Please try again.');
            },
          })
          .render(containerId);
      });
    };
    document.head.appendChild(paypalScript);
  }
});