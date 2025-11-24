package com.storyapp.user.repository;

import com.storyapp.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailVerificationToken(String token);
    Optional<User> findByPasswordResetToken(String token);
    Optional<User> findByProviderIdAndAuthProvider(String providerId, String authProvider);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}