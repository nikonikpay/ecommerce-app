package com.ali.ecommerce.dto;

import com.ali.ecommerce.entity.Address;
import com.ali.ecommerce.entity.Customer;
import com.ali.ecommerce.entity.Order;
import com.ali.ecommerce.entity.OrderItem;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;


@Getter
@Setter
public class Purchase {

    private Customer customer;
    private Address shippingAddress;
    private Address billingAddress;
    private Order order;
    private Set<OrderItem> orderItems;


}
