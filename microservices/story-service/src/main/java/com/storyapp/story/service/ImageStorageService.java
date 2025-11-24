package com.storyapp.story.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class ImageStorageService {

    @Value("${image.upload.dir:uploads}")
    private String uploadDir;

    @Value("${image.max-width:2048}")
    private int maxWidth;

    @Value("${image.max-height:2048}")
    private int maxHeight;

    @Value("${image.allowed-types:image/jpeg,image/jpg,image/png,image/gif,image/webp}")
    private String allowedTypes;

    @Value("${video.allowed-types:video/mp4,video/webm,video/ogg}")
    private String allowedVideoTypes;

    @Value("${audio.allowed-types:audio/mpeg,audio/wav,audio/ogg,audio/mp3}")
    private String allowedAudioTypes;

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "gif", "webp");
    private static final List<String> ALLOWED_VIDEO_EXTENSIONS = Arrays.asList("mp4", "webm", "ogg");
    private static final List<String> ALLOWED_AUDIO_EXTENSIONS = Arrays.asList("mp3", "wav", "ogg");

    /**
     * Store images in organized directory structure: uploads/stories/
     */
    public List<String> storeStoryImages(MultipartFile[] files) throws IOException {
        List<String> imageUrls = new ArrayList<>();
        Path storiesDir = Paths.get(uploadDir, "stories");
        
        // Create directory if it doesn't exist
        if (!Files.exists(storiesDir)) {
            Files.createDirectories(storiesDir);
        }

        for (MultipartFile file : files) {
            if (file.isEmpty()) {
                continue;
            }

            // Validate file type
            if (!isValidImageType(file)) {
                throw new IOException("Invalid image type. Allowed: " + String.join(", ", ALLOWED_EXTENSIONS));
            }

            // Validate file size (already handled by Spring, but double-check)
            if (file.getSize() > 10 * 1024 * 1024) { // 10MB
                throw new IOException("File size exceeds maximum limit of 10MB");
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = getFileExtension(originalFilename);
            String uniqueFilename = UUID.randomUUID().toString() + "_" + 
                                   sanitizeFilename(originalFilename);

            Path filePath = storiesDir.resolve(uniqueFilename);

            // Save the file
            try {
                // For images, we can optionally resize if too large
                if (shouldResize(file)) {
                    BufferedImage resizedImage = resizeImage(file);
                    ImageIO.write(resizedImage, extension, filePath.toFile());
                } else {
                    Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                }

                // Return relative URL path
                imageUrls.add("/uploads/stories/" + uniqueFilename);
            } catch (IOException e) {
                // Clean up partial uploads
                Files.deleteIfExists(filePath);
                throw e;
            }
        }

        return imageUrls;
    }

    /**
     * Store character images in dedicated directory: uploads/characters/
     */
    public String storeCharacterImage(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IOException("Empty file provided");
        }

        Path charactersDir = Paths.get(uploadDir, "characters");
        if (!Files.exists(charactersDir)) {
            Files.createDirectories(charactersDir);
        }

        if (!isValidImageType(file)) {
            throw new IOException("Invalid image type. Allowed: " + String.join(", ", ALLOWED_EXTENSIONS));
        }

        String uniqueFilename = UUID.randomUUID().toString() + "_" + 
                               sanitizeFilename(file.getOriginalFilename());
        Path filePath = charactersDir.resolve(uniqueFilename);

        String extension = getFileExtension(file.getOriginalFilename());
        if (shouldResize(file)) {
            BufferedImage resizedImage = resizeImage(file);
            ImageIO.write(resizedImage, extension, filePath.toFile());
        } else {
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        }

        return "/uploads/characters/" + uniqueFilename;
    }

    /**
     * Store timeline/scene images: uploads/scenes/
     */
    public List<String> storeSceneImages(MultipartFile[] files) throws IOException {
        List<String> imageUrls = new ArrayList<>();
        Path scenesDir = Paths.get(uploadDir, "scenes");
        
        if (!Files.exists(scenesDir)) {
            Files.createDirectories(scenesDir);
        }

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;

            if (!isValidImageType(file)) {
                throw new IOException("Invalid image type");
            }

            String uniqueFilename = UUID.randomUUID().toString() + "_" + 
                                   sanitizeFilename(file.getOriginalFilename());
            Path filePath = scenesDir.resolve(uniqueFilename);

            String extension = getFileExtension(file.getOriginalFilename());
            if (shouldResize(file)) {
                BufferedImage resizedImage = resizeImage(file);
                ImageIO.write(resizedImage, extension, filePath.toFile());
            } else {
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            }

            imageUrls.add("/uploads/scenes/" + uniqueFilename);
        }

        return imageUrls;
    }

    /**
     * Store video files: uploads/videos/
     */
    public List<String> storeVideos(MultipartFile[] files) throws IOException {
        List<String> videoUrls = new ArrayList<>();
        Path videosDir = Paths.get(uploadDir, "videos");
        
        if (!Files.exists(videosDir)) {
            Files.createDirectories(videosDir);
        }

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;

            if (!isValidVideoType(file)) {
                throw new IOException("Invalid video type. Allowed: " + String.join(", ", ALLOWED_VIDEO_EXTENSIONS));
            }

            String uniqueFilename = UUID.randomUUID().toString() + "_" + 
                                   sanitizeFilename(file.getOriginalFilename());
            Path filePath = videosDir.resolve(uniqueFilename);

            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            videoUrls.add("/uploads/videos/" + uniqueFilename);
        }

        return videoUrls;
    }

    /**
     * Store audio files: uploads/audio/
     */
    public List<String> storeAudio(MultipartFile[] files) throws IOException {
        List<String> audioUrls = new ArrayList<>();
        Path audioDir = Paths.get(uploadDir, "audio");
        
        if (!Files.exists(audioDir)) {
            Files.createDirectories(audioDir);
        }

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;

            if (!isValidAudioType(file)) {
                throw new IOException("Invalid audio type. Allowed: " + String.join(", ", ALLOWED_AUDIO_EXTENSIONS));
            }

            String uniqueFilename = UUID.randomUUID().toString() + "_" + 
                                   sanitizeFilename(file.getOriginalFilename());
            Path filePath = audioDir.resolve(uniqueFilename);

            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            audioUrls.add("/uploads/audio/" + uniqueFilename);
        }

        return audioUrls;
    }

    /**
     * Delete an image file
     */
    public boolean deleteImage(String imageUrl) {
        try {
            if (imageUrl == null || imageUrl.isEmpty()) {
                return false;
            }

            // Remove leading slash if present
            String relativePath = imageUrl.startsWith("/") ? imageUrl.substring(1) : imageUrl;
            Path filePath = Paths.get(relativePath);

            if (Files.exists(filePath)) {
                Files.delete(filePath);
                return true;
            }
        } catch (IOException e) {
            return false;
        }
        return false;
    }

    // Helper methods

    private boolean isValidImageType(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null) return false;

        // Check MIME type
        List<String> allowedMimeTypes = Arrays.asList(allowedTypes.split(","));
        if (!allowedMimeTypes.contains(contentType.toLowerCase())) {
            return false;
        }

        // Check file extension
        String filename = file.getOriginalFilename();
        if (filename == null) return false;

        String extension = getFileExtension(filename).toLowerCase();
        return ALLOWED_EXTENSIONS.contains(extension);
    }

    private boolean isValidVideoType(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null) return false;

        List<String> allowedMimeTypes = Arrays.asList(allowedVideoTypes.split(","));
        if (!allowedMimeTypes.contains(contentType.toLowerCase())) {
            return false;
        }

        String filename = file.getOriginalFilename();
        if (filename == null) return false;

        String extension = getFileExtension(filename).toLowerCase();
        return ALLOWED_VIDEO_EXTENSIONS.contains(extension);
    }

    private boolean isValidAudioType(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null) return false;

        List<String> allowedMimeTypes = Arrays.asList(allowedAudioTypes.split(","));
        if (!allowedMimeTypes.contains(contentType.toLowerCase())) {
            return false;
        }

        String filename = file.getOriginalFilename();
        if (filename == null) return false;

        String extension = getFileExtension(filename).toLowerCase();
        return ALLOWED_AUDIO_EXTENSIONS.contains(extension);
    }

    private String getFileExtension(String filename) {
        if (filename == null) return "";
        int lastDot = filename.lastIndexOf('.');
        return (lastDot == -1) ? "" : filename.substring(lastDot + 1);
    }

    private String sanitizeFilename(String filename) {
        if (filename == null) return "image";
        // Remove any path separators and special characters
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private boolean shouldResize(MultipartFile file) throws IOException {
        try {
            BufferedImage image = ImageIO.read(file.getInputStream());
            if (image == null) return false;
            return image.getWidth() > maxWidth || image.getHeight() > maxHeight;
        } catch (IOException e) {
            return false;
        }
    }

    private BufferedImage resizeImage(MultipartFile file) throws IOException {
        BufferedImage originalImage = ImageIO.read(file.getInputStream());
        if (originalImage == null) {
            throw new IOException("Cannot read image file");
        }

        int originalWidth = originalImage.getWidth();
        int originalHeight = originalImage.getHeight();

        // Calculate new dimensions maintaining aspect ratio
        double widthRatio = (double) maxWidth / originalWidth;
        double heightRatio = (double) maxHeight / originalHeight;
        double ratio = Math.min(widthRatio, heightRatio);

        int newWidth = (int) (originalWidth * ratio);
        int newHeight = (int) (originalHeight * ratio);

        // Resize image
        Image scaledImage = originalImage.getScaledInstance(newWidth, newHeight, Image.SCALE_SMOOTH);
        BufferedImage resizedImage = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB);

        Graphics2D g2d = resizedImage.createGraphics();
        g2d.drawImage(scaledImage, 0, 0, null);
        g2d.dispose();

        return resizedImage;
    }
}
