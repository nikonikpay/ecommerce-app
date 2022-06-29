package com.ali.ecommerce.service;

import com.ali.ecommerce.dao.CustomerRepository;
import com.ali.ecommerce.dto.PaymentInfo;
import com.ali.ecommerce.dto.Purchase;
import com.ali.ecommerce.dto.PurchaseResponse;
import com.ali.ecommerce.entity.Customer;
import com.ali.ecommerce.entity.Order;
import com.ali.ecommerce.entity.OrderItem;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;


@Service
public class CheckoutServiceImpl implements CheckoutService {


    private CustomerRepository customerRepository;

    public CheckoutServiceImpl(CustomerRepository customerRepository, @Value("${stripe.key.secret}") String secretKey) {
        this.customerRepository = customerRepository;

        //initialize stripe API with secret key
        Stripe.apiKey = secretKey;

    }

    @Override
    @Transactional
    public PurchaseResponse placeOrder(Purchase purchase) {


        //retrieve the order info from dto
        Order order = purchase.getOrder();

        //generate tracking number for
        String orderTrackingNumber = generateOrderTrackNumber();
        order.setOrderTrackingNumber(orderTrackingNumber);

        //populate order with orderItem
        Set<OrderItem> orderItems = purchase.getOrderItems();
        orderItems.forEach(order :: add);

        //populate order with billing address and shipping address
        order.setShippingAddress(purchase.getShippingAddress());
        order.setBillingAddress(purchase.getBillingAddress());


        //populate customer with order
        Customer customer = purchase.getCustomer();

        // check if this is an existing customer
        String theEmail= customer.getEmail();
        Customer customerFromDb = customerRepository.findByEmail(theEmail);

        if (customerFromDb != null){
            // we found them  let assign them accordingly
            customer= customerFromDb;
        }


        customer.add(order);

        //save to the database
        customerRepository.save(customer);

        //return a response
        return new PurchaseResponse(orderTrackingNumber);

    }

    @Override
    public PaymentIntent createPaymentIntent(PaymentInfo paymentInfo) throws StripeException {
        List<String> paymentMethodTypes = new ArrayList<>();
        paymentMethodTypes.add("card");

        Map<String,Object> params = new HashMap<>();
        params.put("amount",paymentInfo.getAmount());
        params.put("currency",paymentInfo.getCurrency());
        params.put("payment_method_types",paymentMethodTypes);
        params.put("description","I love when i do this");
        return PaymentIntent.create(params);

    }

    private String generateOrderTrackNumber() {

        return UUID.randomUUID()
                   .toString();
    }
}
