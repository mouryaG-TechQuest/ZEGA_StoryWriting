package com.storyapp.user.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.base-url:http://localhost:5173}")
    private String baseUrl;

    @Value("${spring.mail.username:noreply@storywriting.com}")
    private String fromEmail;

    public EmailService(@org.springframework.beans.factory.annotation.Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationEmail(String to, String username, String token) {
        if (mailSender == null) {
            System.out.println("Email disabled - skipping verification email");
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("Verify Your Email - Story Writing App");
            
            String verificationLink = baseUrl + "/verify-email?token=" + token;
            
            message.setText(String.format(
                "Hello %s,\n\n" +
                "Thank you for registering with Story Writing App!\n\n" +
                "Please click the link below to verify your email address:\n\n" +
                "%s\n\n" +
                "This link will expire in 24 hours.\n\n" +
                "If you did not create an account, please ignore this email.\n\n" +
                "Best regards,\n" +
                "Story Writing Team",
                username, verificationLink
            ));
            
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send verification email: " + e.getMessage());
            // Don't throw exception - allow registration to proceed
        }
    }

    public void sendPasswordResetCode(String to, String username, String code) {
        if (mailSender == null) {
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("Password Reset Code - Story Writing App");
            
            message.setText(String.format(
                "Hello %s,\n\n" +
                "We received a request to reset your password.\n\n" +
                "Your password reset code is: %s\n\n" +
                "This code will expire in 15 minutes.\n\n" +
                "If you did not request a password reset, please ignore this email or contact support if you have concerns.\n\n" +
                "Best regards,\n" +
                "Story Writing Team",
                username, code
            ));
            
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send password reset email: " + e.getMessage());
        }
    }

    public void sendUsernameRecoveryCode(String to, String username, String code) {
        if (mailSender == null) {
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("Username Recovery Code - Story Writing App");
            
            message.setText(String.format(
                "Hello,\n\n" +
                "We received a request to recover your username.\n\n" +
                "Your username is: %s\n\n" +
                "Your verification code is: %s\n\n" +
                "This code will expire in 15 minutes.\n\n" +
                "If you did not request username recovery, please ignore this email or contact support.\n\n" +
                "Best regards,\n" +
                "Story Writing Team",
                username, code
            ));
            
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send username recovery email: " + e.getMessage());
        }
    }

    public void sendEmailChangeVerification(String to, String username, String token) {
        if (mailSender == null) {
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("Verify Your New Email - Story Writing App");
            
            String verificationLink = baseUrl + "/verify-email-change?token=" + token;
            
            message.setText(String.format(
                "Hello %s,\n\n" +
                "You requested to change your email address.\n\n" +
                "Please click the link below to verify your new email address:\n\n" +
                "%s\n\n" +
                "This link will expire in 24 hours.\n\n" +
                "If you did not request this change, please contact support immediately.\n\n" +
                "Best regards,\n" +
                "Story Writing Team",
                username, verificationLink
            ));
            
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send email change verification: " + e.getMessage());
        }
    }
}
