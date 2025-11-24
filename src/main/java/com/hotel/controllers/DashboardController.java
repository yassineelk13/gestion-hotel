package com.hotel.controllers;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = {"http://localhost:3000", "http://192.168.100.19:3000"}, maxAge = 3600)
public class DashboardController {

    @GetMapping("/admin")
    public String adminDashboard() {
        return "Dashboard Admin";
    }

    @GetMapping("/reception")
    public String receptionDashboard() {
        return "Dashboard Réceptionniste";
    }

    @GetMapping("/client")
    public String clientDashboard() {
        return "Dashboard Client";
    }
}