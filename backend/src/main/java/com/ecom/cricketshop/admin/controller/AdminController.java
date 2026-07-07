package com.ecom.cricketshop.admin.controller;

import com.ecom.cricketshop.admin.service.AdminService;
import com.ecom.cricketshop.auth.entity.User;
import com.ecom.cricketshop.order.OrderStatus;
import com.ecom.cricketshop.order.dto.OrderResponse;
import com.ecom.cricketshop.order.entity.Order;
import com.ecom.cricketshop.order.service.OrderService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private OrderService orderService;

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return adminService.getAllUsers();
    }

    @PutMapping("users/{userId}/toggle")
    public User toggleUserStatus(@PathVariable Long userId) {
        return adminService.toggleUserStatus(userId);
    }

    @GetMapping("/orders")
    public List<Order> getAllOrders() {
        return adminService.getAllOrders();
    }

    // Update status of all items in an order (admin only)
    @PutMapping("/orders/{orderId}/status")
    @Transactional
    public OrderResponse updateOrderStatus(
            @PathVariable Long orderId,
            @RequestParam OrderStatus status) {
        return orderService.updateOrderStatus(orderId, status);
    }

    // Update status of a single item in an order (admin only)
    @PutMapping("/orders/{orderId}/items/{itemId}/status")
    @Transactional
    public OrderResponse updateItemStatus(
            @PathVariable Long orderId,
            @PathVariable Long itemId,
            @RequestParam OrderStatus status) {
        return orderService.updateItemStatus(orderId, itemId, status);
    }

    @GetMapping("/revenue")
    public double getTotalRevenue() {
        return adminService.getTotalRevenue();
    }
}
