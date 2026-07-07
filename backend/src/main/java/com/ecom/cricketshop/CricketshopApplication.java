package com.ecom.cricketshop;

import com.ecom.cricketshop.auth.Role;
import com.ecom.cricketshop.auth.entity.User;
import com.ecom.cricketshop.auth.repo.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@SpringBootApplication
public class CricketshopApplication {

	public static void main(String[] args) {
		SpringApplication.run(CricketshopApplication.class, args);
	}

	@Bean
	CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		return args -> {
			if (!userRepository.existsByEmail("admin@gmail.com")) {
				User admin = new User();
				admin.setName("Admin");
				admin.setEmail("admin@gmail.com");
				admin.setPassword(passwordEncoder.encode("Admin@123"));
				admin.setRole(Role.ADMIN);
				admin.setIsActive(true);
				admin.setCreatedAt(LocalDateTime.now());
				userRepository.save(admin);
				System.out.println("Admin user created: admin@gmail.com / Admin@123");
			} else {
				System.out.println("Admin already exists. Cricket Shop is ready.");
			}
		};
	}
}
