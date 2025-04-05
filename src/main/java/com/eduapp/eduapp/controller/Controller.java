package com.eduapp.eduapp.controller;

import com.eduapp.eduapp.dto.StudentDTO;
import com.eduapp.eduapp.models.Student;
import com.eduapp.eduapp.repository.StudentRepository;
import com.eduapp.eduapp.service.FileService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;


import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.font.PDType1Font;

@RestController
@CrossOrigin(originPatterns = "http://localhost:3000")
@RequestMapping("/api")
public class Controller {

    @Autowired
    FileService fileService;

    @Autowired
    StudentRepository studentRepository;

    @Autowired
    ModelMapper modelMapper;

    @Value("${project.image}")
    private String path;

    @Value("${image.base.url}")
    private String imageBaseUrl;

    @PostMapping("/check")
    public String checkAPI(@RequestBody String body) {
        return body;
    }

    @PostMapping("/uploadFile")
    public ResponseEntity<byte[]> uploadFile(@RequestParam("file")MultipartFile file) throws IOException {
         // Check if the uploaded file is a text file
    if (file.getContentType().equals("text/plain")) {
        // Convert text file to PDF
        byte[] pdfBytes = fileService.convertTextToPdf(file);
        
        // Save the converted PDF
        String filename = fileService.saveConvertedPdf(path, pdfBytes, file.getOriginalFilename());
        String filePath = path + File.separator + filename;
        
        // Send PDF to Flask API and get audio in response
        byte[] audioData = fileService.convertPdfToAudio(filePath);
        
        // Set appropriate headers for audio file download
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("audio/mpeg"));
        headers.setContentDispositionFormData("attachment", "converted-audio.mp3");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");
        
        // Return the audio file
        return ResponseEntity.ok()
                .headers(headers)
                .body(audioData);
    } else if (file.getContentType().equals("application/pdf")) {
        // Original file is already a PDF, proceed as before
        String filename = fileService.uploadImage(path, file);
        String filePath = path + File.separator + filename;
        
        // Send PDF to Flask API and get audio in response
        byte[] audioData = fileService.convertPdfToAudio(filePath);
        
        // Set appropriate headers for audio file download
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("audio/mpeg"));
        headers.setContentDispositionFormData("attachment", "converted-audio.mp3");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");
        
        // Return the audio file
        return ResponseEntity.ok()
                .headers(headers)
                .body(audioData);
    } else {
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                .body(new byte[2]);
    }
    }


    @PostMapping("/addUser")
    public ResponseEntity<Student> addUser(@RequestBody StudentDTO studentDTO) {
//        System.out.println("student="+studentDTO.getFirstName()+" "+studentDTO.getLastName());
        System.out.println("student="+studentDTO.toString());
        Student toSaveStudent = modelMapper.map(studentDTO, Student.class);
        Student savedStudent = studentRepository.save(toSaveStudent);
        return new ResponseEntity<>(savedStudent, HttpStatus.OK);
    }

    public String constructAudioUrl(String audioName) {
        return imageBaseUrl.endsWith("/") ? (imageBaseUrl+audioName) : (imageBaseUrl+"/"+audioName);
    }

    @GetMapping("/getFile/{filename}")
    public ResponseEntity<byte[]> getFile(@PathVariable String filename) throws IOException {
        String filePath = path + "/" + filename; // use path from @Value("${project.image}")
        File file = new File(filePath);

        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }

        byte[] fileContent = Files.readAllBytes(file.toPath());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(getContentType(filePath)); // Set appropriate content type
        headers.setContentLength(fileContent.length);
        headers.setContentDisposition(ContentDisposition.inline().filename(filename).build()); // for inline display

        return new ResponseEntity<>(fileContent, headers, HttpStatus.OK);
    }

    // helper method to detect content type
    private MediaType getContentType(String filePath) {
        String lower = filePath.toLowerCase();
        if (lower.endsWith(".pdf")) return MediaType.APPLICATION_PDF;
        if (lower.endsWith(".png")) return MediaType.IMAGE_PNG;
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return MediaType.IMAGE_JPEG;
        if (lower.endsWith(".mp3")) return MediaType.valueOf("audio/mpeg");
        if (lower.endsWith(".mp4")) return MediaType.valueOf("video/mp4");
        return MediaType.APPLICATION_OCTET_STREAM;
    }
}
