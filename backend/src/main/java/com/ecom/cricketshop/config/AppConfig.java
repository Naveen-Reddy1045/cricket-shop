package com.ecom.cricketshop.config;

import com.ecom.cricketshop.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class AppConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Configuration
    public class SecurityConfig {

        @Bean
        public PasswordEncoder passwordEncoder() {
            return new BCryptPasswordEncoder();
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

            http
                    .cors(Customizer.withDefaults())
                    .csrf(csrf -> csrf.disable())
                    .authorizeHttpRequests(auth -> auth

                            // Public endpoints
                            .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                            .requestMatchers("/auth/**").permitAll()
                            .requestMatchers("/products/**").permitAll()
                            .requestMatchers("/upload/**").permitAll()
                            .requestMatchers("/uploads/**").permitAll()

                            // Role based endpoints
                            .requestMatchers("/seller/**").hasRole("SELLER")
                            .requestMatchers("/admin/**").hasRole("ADMIN")
                            .requestMatchers("/buyer/**").hasRole("USER")
                            .requestMatchers("/buyer/address/**").hasRole("USER")

                            // Everything else authenticated
                            .anyRequest().authenticated()
                    )
                    .addFilterBefore(jwtAuthenticationFilter,
                            UsernamePasswordAuthenticationFilter.class);

            return http.build();
        }
    }
}
