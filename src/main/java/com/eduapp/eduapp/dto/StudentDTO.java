package com.eduapp.eduapp.dto;

import com.eduapp.eduapp.models.StudentType;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentDTO {

    private String firstName;

    private String username;
    private String password;

    private String lastName;

    private StudentType studentType;
}
