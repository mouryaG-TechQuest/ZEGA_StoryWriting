package com.storyapp.story.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        // Get absolute path to uploads directory
        Path uploadsPath = Paths.get("uploads").toAbsolutePath();
        String uploadsLocation = "file:" + uploadsPath.toString().replace("\\", "/") + "/";
        
        // Serve uploaded images with caching for better performance
        registry
            .addResourceHandler("/uploads/**")
            .addResourceLocations(uploadsLocation)
            .setCachePeriod(3600) // Cache for 1 hour
            .resourceChain(true);
    }
    
    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/uploads/**")
            .allowedOrigins("http://localhost:5173", "http://localhost:3000")
            .allowedMethods("GET")
            .allowedHeaders("*")
            .maxAge(3600);
    }
}
