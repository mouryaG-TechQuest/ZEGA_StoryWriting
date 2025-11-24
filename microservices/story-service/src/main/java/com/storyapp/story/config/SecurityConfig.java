package com.storyapp.story.config;

import com.storyapp.story.security.JwtAuthenticationFilter;
import org.springframework.http.HttpMethod;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .cors(cors -> {}) // Enable CORS with default configuration
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()  // Public access to all uploaded images (PNG, JPEG, JPG, GIF, WEBP)
                .requestMatchers(HttpMethod.GET, "/api/stories").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/stories/genres").permitAll()  // Public access to genres
                .requestMatchers(HttpMethod.GET, "/api/stories/**").permitAll()  // Allow viewing individual stories
                .requestMatchers(HttpMethod.POST, "/api/stories/*/view").permitAll()  // Allow view tracking
                .requestMatchers(HttpMethod.POST, "/api/stories/*/watch-time").permitAll()  // Allow watch time tracking
                .requestMatchers(HttpMethod.POST, "/api/stories/upload-images").authenticated()  // Require auth for uploads
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}