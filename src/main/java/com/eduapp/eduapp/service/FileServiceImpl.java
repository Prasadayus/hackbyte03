package com.eduapp.eduapp.service;

import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.itextpdf.text.BaseColor;
import com.itextpdf.text.Document;
import com.itextpdf.text.DocumentException;
import com.itextpdf.text.Font;
import com.itextpdf.text.FontFactory;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.pdf.PdfWriter;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileServiceImpl implements FileService {

    @Override
    public String uploadImage(String path, MultipartFile file) throws IOException {
        String origFileName = file.getOriginalFilename();

        String randomId = UUID.randomUUID().toString();

        String filename = randomId.concat(origFileName.substring(origFileName.lastIndexOf(".")));
        String filePath = path + File.separator + filename;

        File folder = new File(path);
        if(!folder.exists()) {
            folder.mkdir();
        }

        Files.copy(file.getInputStream(), Paths.get(filePath));

        return filename;
    }

    @Override
    public byte[] convertTextToPdf(MultipartFile file) throws IOException {
    try {
        // Read text content from the uploaded file
        String textContent = new String(file.getBytes(), StandardCharsets.UTF_8);
        
        // Create a new PDF document in memory
        ByteArrayOutputStream pdfOutputStream = new ByteArrayOutputStream();
        Document document = new Document();
        PdfWriter.getInstance(document, pdfOutputStream);
        
        document.open();
        
        // Add the text content to the PDF
        Font font = FontFactory.getFont(FontFactory.COURIER, 12, BaseColor.BLACK);
        Paragraph paragraph = new Paragraph(textContent, font);
        document.add(paragraph);
        
        document.close();
        
        // Return the PDF as byte array
        return pdfOutputStream.toByteArray();
    } catch (DocumentException e) {
        throw new IOException("Failed to convert text to PDF", e);
    }
}

@Override
public String saveConvertedPdf(String path, byte[] pdfBytes, String originalFilename) throws IOException {
    // Create a filename for the converted PDF
    String baseFilename = originalFilename.replaceFirst("[.][^.]+$", "");
    String pdfFilename = baseFilename + ".pdf";
    
    // Save the PDF bytes to a file
    Path filePath = Paths.get(path, pdfFilename);
    Files.write(filePath, pdfBytes);
    
    return pdfFilename;
}

    @Override
    public byte[] convertPdfToAudio(String pdfFilePath) throws IOException {
        // Create RestTemplate
        RestTemplate restTemplate = new RestTemplate();
        
        // Prepare headers
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        
        // Prepare the request body
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new FileSystemResource(pdfFilePath));
        
        // Create the request entity
        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        String flaskApiUrl = "http://localhost:5001";
        
        // Send POST request to Flask API
        ResponseEntity<byte[]> response = restTemplate.postForEntity(
                flaskApiUrl + "/api/convert", 
                requestEntity, 
                byte[].class);
        
        // Return the audio file bytes
        return response.getBody();
    }
}
