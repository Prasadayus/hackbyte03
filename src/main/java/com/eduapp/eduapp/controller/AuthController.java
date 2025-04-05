package com.eduapp.eduapp.controller;

import com.eduapp.eduapp.dto.LoginDTO;
import com.eduapp.eduapp.dto.StudentDTO;
import com.eduapp.eduapp.jwt.JwtTokenUtil;
import com.eduapp.eduapp.repository.StudentRepository;
import com.eduapp.eduapp.util.AuthUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthUtil authUtil;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @PostMapping(value = "/signin", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<String> authenticateUserViaAudio(
        @RequestParam("usernameAudio") MultipartFile usernameAudio,
        @RequestParam("passwordAudio") MultipartFile passwordAudio) {

    try {
        // Send audio files to Flask API
        String user = sendAudioToFlask(usernameAudio, "username").toLowerCase();
        String pass = sendAudioToFlask(passwordAudio, "password");
        String username = user.toLowerCase().replaceAll("\\s+", "");
        String password = pass.toLowerCase().replaceAll("\\s+", "");

        // Log for debugging
        System.out.println("Transcribed username: " + username);
        System.out.println("Transcribed password: " + password);

        // Create LoginDTO
        LoginDTO loginDTO = new LoginDTO(username, password);

        // Authenticate as before
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginDTO.getUsername(), loginDTO.getPassword()));

        String jwt = jwtTokenUtil.generateToken(authentication.getName());

        SecurityContextHolder.getContext().setAuthentication(authentication);
        return new ResponseEntity<>(jwt, HttpStatus.OK);

    } catch (Exception e) {
        e.printStackTrace();
        return new ResponseEntity<>("Authentication failed: " + e.getMessage(), HttpStatus.UNAUTHORIZED);
    }
    }

    private String sendAudioToFlask(MultipartFile audioFile, String type) throws IOException {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        // Form-data key must be "file"
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(audioFile.getBytes()) {
            @Override
            public String getFilename() {
                return type + ".mp3"; // Ensure it has the correct file extension
            }
        });

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        String flaskUrl = "http://localhost:5000/api/transcribe"; // Replace with actual Flask endpoint

        ResponseEntity<String> response = restTemplate.postForEntity(flaskUrl, requestEntity, String.class);

        if (response.getStatusCode() == HttpStatus.OK) {
            // Parse JSON response to get "transcription"
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode root = objectMapper.readTree(response.getBody());
            String transcription = root.path("transcription").asText();
            return (transcription);
        } else {
            throw new RuntimeException("Failed to get transcription from Flask for: " + type);
        }
    }


    @GetMapping("/getUser")
    public ResponseEntity<StudentDTO> getLoggedInUser() {
        StudentDTO studentDTO = authUtil.loggedInUser();
        return new ResponseEntity<>(studentDTO, HttpStatus.OK);
    }
}
