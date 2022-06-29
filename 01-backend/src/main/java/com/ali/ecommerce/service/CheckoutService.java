package com.ali.ecommerce.service;

import com.ali.ecommerce.dto.PaymentInfo;
import com.ali.ecommerce.dto.Purchase;
import com.ali.ecommerce.dto.PurchaseResponse;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
public interface CheckoutService {

    PurchaseResponse placeOrder(Purchase purchase);

    PaymentIntent createPaymentIntent(PaymentInfo paymentInfo) throws StripeException;

}
