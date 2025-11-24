package com.storyapp.user.controller;

import com.storyapp.user.dto.*;
import com.storyapp.user.model.User;
import com.storyapp.user.repository.UserRepository;
import com.storyapp.user.security.JwtTokenProvider;
import com.storyapp.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final UserService userService;
    private final JwtTokenProvider tokenProvider;

    public AuthController(AuthenticationManager authenticationManager,
                         UserRepository userRepository,
                         UserService userService,
                         JwtTokenProvider tokenProvider) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.userService = userService;
        this.tokenProvider = tokenProvider;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            User user = userService.registerUser(request);
            return ResponseEntity.ok(Map.of(
                "message", "Registration successful! Please check your email to verify your account.",
                "emailSent", true,
                "username", user.getUsername()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Registration failed: " + e.getMessage()));
        }
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        try {
            boolean verified = userService.verifyEmail(token);
            if (verified) {
                return ResponseEntity.ok(Map.of(
                    "message", "Email verified successfully! You can now login.",
                    "verified", true
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "message", "Invalid or expired verification token",
                    "verified", false
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Verification failed: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            String username = request.getUsername();
            String password = request.getPassword();

            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
            );
            
            User user = userRepository.findByUsername(username).orElseThrow();
            
            // Email verification is REQUIRED to login
            if (!user.isEmailVerified()) {
                return ResponseEntity.status(403).body(Map.of(
                    "message", "Account registered but email not verified. Please verify your email first.",
                    "emailVerified", false
                ));
            }
            
            String token = tokenProvider.generateToken(username);
            
            return ResponseEntity.ok(Map.of(
                "token", token,
                "username", username,
                "email", user.getEmail(),
                "firstName", user.getFirstName(),
                "lastName", user.getLastName()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid username or password"));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            userService.forgotPassword(request.getEmail());
            return ResponseEntity.ok(Map.of(
                "message", "If the email exists, a password reset code has been sent.",
                "emailSent", true
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to send reset code"));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request,
                                          @RequestParam String email) {
        try {
            boolean reset = userService.resetPassword(
                email,
                request.getResetCode(),
                request.getNewPassword(),
                request.getConfirmPassword()
            );
            
            if (reset) {
                return ResponseEntity.ok(Map.of(
                    "message", "Password reset successfully! You can now login with your new password.",
                    "success", true
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "message", "Invalid or expired reset code",
                    "success", false
                ));
            }
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Password reset failed"));
        }
    }

    @PostMapping("/forgot-username")
    public ResponseEntity<?> forgotUsername(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            userService.forgotUsername(request.getEmail());
            return ResponseEntity.ok(Map.of(
                "message", "If the email exists, your username has been sent to your email.",
                "emailSent", true
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to send username"));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody UpdateProfileRequest request,
                                          @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String username = tokenProvider.getUsernameFromJWT(token);
            
            User updatedUser = userService.updateProfile(username, request);
            
            return ResponseEntity.ok(Map.of(
                "message", "Profile updated successfully",
                "user", Map.of(
                    "username", updatedUser.getUsername(),
                    "firstName", updatedUser.getFirstName(),
                    "lastName", updatedUser.getLastName(),
                    "email", updatedUser.getEmail(),
                    "phoneNumber", updatedUser.getPhoneNumber() != null ? updatedUser.getPhoneNumber() : "",
                    "emailVerified", updatedUser.isEmailVerified()
                )
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Profile update failed"));
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        if (tokenProvider.validateToken(token)) {
            String username = tokenProvider.getUsernameFromJWT(token);
            return ResponseEntity.ok(Map.of("valid", true, "username", username));
        }
        return ResponseEntity.ok(Map.of("valid", false));
    }
}
