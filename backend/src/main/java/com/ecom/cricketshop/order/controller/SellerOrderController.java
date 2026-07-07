package com.ecom.cricketshop.order.controller;

import com.ecom.cricketshop.order.dto.OrderResponse;
import com.ecom.cricketshop.order.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/seller/orders")
public class SellerOrderController {

    @Autowired
    private OrderService orderService;

    // View seller orders (read-only — status updates are admin-only)
    @GetMapping
    public List<OrderResponse> getSellerOrders() {
        return orderService.getSellerOrders();
    }
}
