package com.ecom.cricketshop.order.service;

import com.ecom.cricketshop.address.entity.Address;
import com.ecom.cricketshop.address.repo.AddressRepository;
import com.ecom.cricketshop.auth.Role;
import com.ecom.cricketshop.auth.entity.User;
import com.ecom.cricketshop.auth.repo.UserRepository;
import com.ecom.cricketshop.cart.entity.Cart;
import com.ecom.cricketshop.cart.repo.CartRepository;
import com.ecom.cricketshop.exception.BadRequestException;
import com.ecom.cricketshop.exception.ResourceNotFoundException;
import com.ecom.cricketshop.order.OrderStatus;
import com.ecom.cricketshop.order.dto.OrderItemResponse;
import com.ecom.cricketshop.order.dto.OrderResponse;
import com.ecom.cricketshop.order.entity.Order;
import com.ecom.cricketshop.order.entity.OrderItem;
import com.ecom.cricketshop.order.repo.OrderItemRepository;
import com.ecom.cricketshop.order.repo.OrderRepository;
import com.ecom.cricketshop.product.entity.Product;
import com.ecom.cricketshop.product.repo.ProductRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private AddressRepository addressRepository;


    @Transactional
    public OrderResponse placeOrder() {

        String email = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Cart> cartItems = cartRepository.findByUser(user);

        if (cartItems.isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        // Fetch default address
        Address defaultAddress = addressRepository.findByUser(user)
                .stream()
                .filter(Address::isDefault)
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Default address not set"));

        Order order = new Order();
        order.setUser(user);
        order.setCreatedAt(LocalDateTime.now());
        order.setOrderStatus(OrderStatus.PLACED);

        // Store snapshot
        String addressSnapshot =
                defaultAddress.getFullName() + "\n" +
                        defaultAddress.getPhoneNumber() + "\n" +
                        defaultAddress.getAddressLine() + "\n" +
                        defaultAddress.getCity() + ", " +
                        defaultAddress.getState() + " - " +
                        defaultAddress.getPincode();

        order.setShippingAddress(addressSnapshot);

        List<OrderItem> orderItems = new ArrayList<>();
        double total = 0;

        for (Cart cart : cartItems) {

            Product product = cart.getProduct();

            if (!product.getIsActive()) {
                throw new BadRequestException("Product inactive: " + product.getName());
            }

            if (cart.getQuantity() > product.getStock()) {
                throw new BadRequestException("Insufficient stock for: " + product.getName());
            }

            product.setStock(product.getStock() - cart.getQuantity());
            productRepository.save(product);

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setQuantity(cart.getQuantity());
            item.setPrice(product.getPrice());
            item.setItemStatus(OrderStatus.PLACED);

            total += product.getPrice() * cart.getQuantity();
            orderItems.add(item);
        }

        order.setTotalPrice(total);
        order.setOrderItems(orderItems);

        Order savedOrder = orderRepository.save(order);

        cartRepository.deleteAll(cartItems);

        return mapToOrderResponse(savedOrder);
    }

    @Transactional
    public List<OrderResponse> getMyOrders() {

        String email = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return orderRepository.findByUser(user)
                .stream()
                .map(this::mapToOrderResponse)
                .toList();
    }

    public List<OrderResponse> getSellerOrders() {

        String email = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        User seller = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found"));

        if (seller.getRole() != Role.SELLER) {
            throw new BadRequestException("Only sellers can view seller orders");
        }

        return orderRepository
                .findDistinctByOrderItemsProductSellerId(seller.getId())
                .stream()
                .map(order -> mapToSellerOrderResponse(order, seller.getId()))
                .toList();
    }

    public OrderResponse updateOrderStatus(Long orderId, OrderStatus status) {

        String email = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        User admin = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        if (admin.getRole() != Role.ADMIN) {
            throw new BadRequestException("Only admins can update order status");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        // Update status on all items in the order
        List<OrderItem> allItems = orderItemRepository.findByOrderId(orderId);

        if (allItems.isEmpty()) {
            throw new BadRequestException("No items found in this order");
        }

        // Validate transitions first
        for (OrderItem item : allItems) {
            if (!isValidTransition(item.getItemStatus(), status)) {
                throw new BadRequestException("Cannot transition item from " +
                        (item.getItemStatus() != null ? item.getItemStatus() : OrderStatus.PLACED) + " to " + status);
            }
        }

        // Update status on all items
        allItems.forEach(item -> item.setItemStatus(status));
        orderItemRepository.saveAll(allItems);

        syncOrderStatus(orderId);

        return mapToOrderResponse(orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found")));
    }

    public OrderResponse updateItemStatus(Long orderId, Long itemId, OrderStatus status) {

        String email = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        User admin = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        if (admin.getRole() != Role.ADMIN) {
            throw new BadRequestException("Only admins can update item status");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Order item not found"));

        // Verify this item belongs to this order
        if (!item.getOrder().getId().equals(orderId)) {
            throw new BadRequestException("This item does not belong to the specified order");
        }

        // Validate transition
        if (!isValidTransition(item.getItemStatus(), status)) {
            throw new BadRequestException("Cannot transition item from " +
                    (item.getItemStatus() != null ? item.getItemStatus() : OrderStatus.PLACED) + " to " + status);
        }

        item.setItemStatus(status);
        orderItemRepository.save(item);

        syncOrderStatus(orderId);

        return mapToOrderResponse(order);
    }


    @Transactional
    public OrderResponse cancelOrder(Long orderId) {

        String email = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() != Role.USER) {
            throw new BadRequestException("Only buyers can cancel orders");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("You cannot cancel this order");
        }

        if (order.getOrderStatus() == OrderStatus.DELIVERED) {
            throw new BadRequestException("Delivered orders cannot be cancelled");
        }

        if (order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Order already cancelled");
        }

        // Restore stock and cancel items
        for (OrderItem item : order.getOrderItems()) {

            Product product = item.getProduct();

            product.setStock(product.getStock() + item.getQuantity());

            productRepository.save(product);

            item.setItemStatus(OrderStatus.CANCELLED);
        }

        order.setOrderStatus(OrderStatus.CANCELLED);

        return mapToOrderResponse(orderRepository.save(order));
    }

    private boolean isValidTransition(OrderStatus current, OrderStatus next) {
        if (current == null) {
            current = OrderStatus.PLACED;
        }
        if (current == next) {
            return true;
        }
        if (current == OrderStatus.CANCELLED || current == OrderStatus.DELIVERED) {
            return false;
        }
        if (current == OrderStatus.SHIPPING) {
            return next == OrderStatus.DELIVERED || next == OrderStatus.CANCELLED;
        }
        // current is PLACED, can transition to any other status
        return true;
    }

    private void syncOrderStatus(Long orderId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) return;

        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        if (items == null || items.isEmpty()) return;

        OrderStatus newStatus = calculateOrderStatus(items);

        if (order.getOrderStatus() != newStatus) {
            order.setOrderStatus(newStatus);
            orderRepository.save(order);
        }
    }

    private OrderStatus calculateOrderStatus(List<OrderItem> items) {
        if (items == null || items.isEmpty()) {
            return OrderStatus.PLACED;
        }

        boolean anyPlaced = false;
        boolean anyShipping = false;
        boolean anyDelivered = false;
        boolean allCancelled = true;

        for (OrderItem item : items) {
            OrderStatus s = item.getItemStatus();
            if (s == null) s = OrderStatus.PLACED; // Default

            if (s != OrderStatus.CANCELLED) {
                allCancelled = false;
            }

            if (s == OrderStatus.PLACED) anyPlaced = true;
            else if (s == OrderStatus.SHIPPING) anyShipping = true;
            else if (s == OrderStatus.DELIVERED) anyDelivered = true;
        }

        if (allCancelled) {
            return OrderStatus.CANCELLED;
        } else if (anyPlaced) {
            return OrderStatus.PLACED;
        } else if (anyShipping) {
            return OrderStatus.SHIPPING;
        } else {
            return OrderStatus.DELIVERED;
        }
    }

    private OrderResponse mapToOrderResponse(Order order) {
        // Enforce synchronization on retrieval
        OrderStatus calculatedStatus = calculateOrderStatus(order.getOrderItems());
        if (order.getOrderStatus() != calculatedStatus) {
            order.setOrderStatus(calculatedStatus);
            orderRepository.save(order);
        }

        List<OrderItemResponse> items = order.getOrderItems()
                .stream()
                .map(item -> new OrderItemResponse(
                        item.getId(),
                        item.getProduct().getId(),
                        item.getProduct().getName(),
                        item.getQuantity(),
                        item.getPrice(),
                        item.getPrice() * item.getQuantity(),
                        item.getItemStatus()
                ))
                .toList();

        return new OrderResponse(
                order.getId(),
                order.getCreatedAt(),
                calculatedStatus,
                order.getTotalPrice(),
                items
        );
    }
    private OrderResponse mapToSellerOrderResponse(Order order, Long sellerId) {

        List<OrderItemResponse> items = order.getOrderItems()
                .stream()
                .filter(item -> item.getProduct().getSeller().getId().equals(sellerId))
                .map(item -> new OrderItemResponse(
                        item.getId(),
                        item.getProduct().getId(),
                        item.getProduct().getName(),
                        item.getQuantity(),
                        item.getPrice(),
                        item.getPrice() * item.getQuantity(),
                        item.getItemStatus()
                ))
                .toList();

        double sellerTotal = items.stream().mapToDouble(OrderItemResponse::getSubtotal).sum();

        // Derive a representative status from seller's items
        OrderStatus derivedStatus = items.stream()
                .map(OrderItemResponse::getItemStatus)
                .filter(s -> s != null)
                .reduce((a, b) -> {
                    // Worst-case propagation: PLACED > SHIPPING > DELIVERED > CANCELLED
                    if (a == OrderStatus.PLACED || b == OrderStatus.PLACED) return OrderStatus.PLACED;
                    if (a == OrderStatus.SHIPPING || b == OrderStatus.SHIPPING) return OrderStatus.SHIPPING;
                    if (a == OrderStatus.DELIVERED || b == OrderStatus.DELIVERED) return OrderStatus.DELIVERED;
                    return OrderStatus.CANCELLED;
                })
                .orElse(OrderStatus.PLACED);

        return new OrderResponse(
                order.getId(),
                order.getCreatedAt(),
                derivedStatus,
                sellerTotal,
                items
        );
    }
}
