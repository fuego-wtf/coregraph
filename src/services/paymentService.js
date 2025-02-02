"use strict";

const Stripe = require("stripe");

/**
 * PaymentService
 * Example usage with Stripe for subscriptions or one-time payments.
 */
class PaymentService {
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  /**
   * Create a checkout session
   * @param {string} priceId - A Stripe price ID for the subscription or product
   * @param {string} successUrl - Where to redirect on successful payment
   * @param {string} cancelUrl - Where to redirect on canceled payment
   */
  async createCheckoutSession(priceId, successUrl, cancelUrl) {
    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl
    });
    return session;
  }
}

module.exports = PaymentService; 