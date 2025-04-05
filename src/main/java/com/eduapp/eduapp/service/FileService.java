package com.eduapp.eduapp.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface FileService {

    String uploadImage(String image, MultipartFile file) throws IOException;
    byte[] convertPdfToAudio(String pdfFilePath) throws IOException;
    byte[] convertTextToPdf(MultipartFile file) throws IOException;
    String saveConvertedPdf(String path, byte[] pdfBytes, String originalFilename) throws IOException;

}
