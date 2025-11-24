package com.storyapp.user.service;

import com.storyapp.user.dto.RegisterRequest;
import com.storyapp.user.dto.UpdateProfileRequest;
import com.storyapp.user.model.PasswordHistory;
import com.storyapp.user.model.User;
import com.storyapp.user.repository.PasswordHistoryRepository;
import com.storyapp.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordHistoryRepository passwordHistoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private static final SecureRandom secureRandom = new SecureRandom();

    public UserService(UserRepository userRepository,
                      PasswordHistoryRepository passwordHistoryRepository,
                      PasswordEncoder passwordEncoder,
                      @org.springframework.beans.factory.annotation.Autowired(required = false) EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordHistoryRepository = passwordHistoryRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @Transactional
    public User registerUser(RegisterRequest request) {
        // Validate passwords match
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }

        // Check if username exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        // Check if email exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // Create new user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setAuthProvider("local");
        // Email verification required
        user.setEmailVerified(false);

        // Generate email verification token
        String verificationToken = UUID.randomUUID().toString();
        user.setEmailVerificationToken(verificationToken);
        user.setVerificationTokenExpiry(LocalDateTime.now().plusHours(24));

        // Save user
        User savedUser = userRepository.save(user);

        // Save password to history
        PasswordHistory passwordHistory = new PasswordHistory(savedUser.getId(), savedUser.getPassword());
        passwordHistoryRepository.save(passwordHistory);

        // Send verification email
        try {
            if (emailService != null) {
                emailService.sendVerificationEmail(savedUser.getEmail(), savedUser.getUsername(), verificationToken);
            }
        } catch (Exception e) {
            System.err.println("Failed to send verification email: " + e.getMessage());
            // Don't fail registration if email fails
        }

        return savedUser;
    }

    @Transactional
    public boolean verifyEmail(String token) {
        Optional<User> userOptional = userRepository.findByEmailVerificationToken(token);
        
        if (userOptional.isEmpty()) {
            return false;
        }

        User user = userOptional.get();

        // Check if token is expired
        if (user.getVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            return false;
        }

        // Mark email as verified
        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        userRepository.save(user);

        return true;
    }

    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Email not found"));

        // Check if email is verified
        if (!user.isEmailVerified()) {
            throw new RuntimeException("Account registered but email not verified. Please verify your email first.");
        }

        // Generate 5-digit code using SecureRandom
        String resetCode = String.format("%05d", secureRandom.nextInt(100000));
        
        // Store hashed reset code for security
        user.setPasswordResetToken(passwordEncoder.encode(resetCode));
        user.setPasswordResetTokenExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        // Send reset code email (plain text - only user receives it)
        if (emailService != null) {
            emailService.sendPasswordResetCode(user.getEmail(), user.getUsername(), resetCode);
        }
    }

    @Transactional
    public boolean resetPassword(String email, String resetCode, String newPassword, String confirmPassword) {
        // Validate passwords match
        if (!newPassword.equals(confirmPassword)) {
            throw new RuntimeException("Passwords do not match");
        }

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Email not found"));

        // Check if user has a reset token
        if (user.getPasswordResetToken() == null || user.getPasswordResetTokenExpiry() == null) {
            throw new RuntimeException("No password reset requested for this email");
        }

        // Check if token is expired
        if (user.getPasswordResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Reset code has expired. Please request a new one.");
        }

        // Verify reset code (compare with hashed token)
        if (!passwordEncoder.matches(resetCode, user.getPasswordResetToken())) {
            throw new RuntimeException("Invalid reset code");
        }

        // Check if new password is same as current
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new RuntimeException("New password cannot be the same as current password");
        }

        // Check against password history
        List<PasswordHistory> passwordHistories = passwordHistoryRepository
            .findTop5ByUserIdOrderByCreatedAtDesc(user.getId());
        
        for (PasswordHistory history : passwordHistories) {
            if (passwordEncoder.matches(newPassword, history.getPasswordHash())) {
                throw new RuntimeException("Cannot reuse any of your last 5 passwords");
            }
        }

        // Update password
        String encodedPassword = passwordEncoder.encode(newPassword);
        user.setPassword(encodedPassword);
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiry(null);
        userRepository.save(user);

        // Save to password history
        PasswordHistory passwordHistory = new PasswordHistory(user.getId(), encodedPassword);
        passwordHistoryRepository.save(passwordHistory);

        return true;
    }

    @Transactional
    public void forgotUsername(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Email not found"));

        // Check if email is verified
        if (!user.isEmailVerified()) {
            throw new RuntimeException("Account registered but email not verified. Please verify your email first.");
        }

        // Generate 5-digit code for verification using SecureRandom
        String verificationCode = String.format("%05d", secureRandom.nextInt(100000));

        // Send username recovery email (no need to store code)
        if (emailService != null) {
            emailService.sendUsernameRecoveryCode(user.getEmail(), user.getUsername(), verificationCode);
        }
    }

    @Transactional
    public User updateProfile(String username, UpdateProfileRequest request) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Update basic fields
        if (request.getFirstName() != null && !request.getFirstName().trim().isEmpty()) {
            user.setFirstName(request.getFirstName());
        }

        if (request.getLastName() != null && !request.getLastName().trim().isEmpty()) {
            user.setLastName(request.getLastName());
        }

        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }

        // Handle username change
        if (request.getNewUsername() != null && !request.getNewUsername().equals(username)) {
            if (userRepository.existsByUsername(request.getNewUsername())) {
                throw new RuntimeException("Username already exists");
            }
            user.setUsername(request.getNewUsername());
        }

        // Handle email change - requires verification
        if (request.getNewEmail() != null && !request.getNewEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getNewEmail())) {
                throw new RuntimeException("Email already exists");
            }

            // Generate new verification token
            String verificationToken = UUID.randomUUID().toString();
            user.setEmailVerificationToken(verificationToken);
            user.setVerificationTokenExpiry(LocalDateTime.now().plusHours(24));
            user.setEmailVerified(false);

            // Send verification to new email
            if (emailService != null) {
                emailService.sendEmailChangeVerification(request.getNewEmail(), user.getUsername(), verificationToken);
            }

            // Don't update email yet - wait for verification
        }

        return userRepository.save(user);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public boolean isPasswordInHistory(Long userId, String password) {
        List<PasswordHistory> histories = passwordHistoryRepository
            .findTop5ByUserIdOrderByCreatedAtDesc(userId);
        
        return histories.stream()
            .anyMatch(history -> passwordEncoder.matches(password, history.getPasswordHash()));
    }
}
