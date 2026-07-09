package com.ecom.cricketshop.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/upload")
public class ImageUploadController {

    private final Cloudinary cloudinary;

    public ImageUploadController(
            @Value("${cloudinary.cloud-name}") String cloudName,
            @Value("${cloudinary.api-key}") String apiKey,
            @Value("${cloudinary.api-secret}") String apiSecret) {

        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true
        ));
    }

    @PostMapping("/image")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "No file provided"));
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Only image files are allowed"));
        }

        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap("folder", "cricketshop")
            );

            String imageUrl = (String) result.get("secure_url");
            return ResponseEntity.ok(Map.of("success", true, "imageUrl", imageUrl));

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "message", "Image upload failed: " + e.getMessage()));
        }
    }
}
