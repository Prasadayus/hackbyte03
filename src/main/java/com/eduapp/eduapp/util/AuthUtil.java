package com.eduapp.eduapp.util;

import com.eduapp.eduapp.dto.StudentDTO;
import com.eduapp.eduapp.models.Student;
import com.eduapp.eduapp.repository.StudentRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

@Component
public class AuthUtil {

    @Autowired
    ModelMapper modelMapper;

    @Autowired
    private StudentRepository studentRepository;

    public StudentDTO loggedInUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication.getName());
        Student student = studentRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User Not Found"));

        StudentDTO studentDTO = new StudentDTO();
        studentDTO.setStudentType(student.getStudentType());
        studentDTO.setUsername(student.getUsername());
        studentDTO.setPassword(student.getPassword());
        studentDTO.setFirstName(student.getFirstName());
        studentDTO.setLastName(student.getLastName());
        return studentDTO;
    }
}
