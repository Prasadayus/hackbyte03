package com.eduapp.eduapp;

import com.eduapp.eduapp.models.Student;
import com.eduapp.eduapp.models.StudentType;
import com.eduapp.eduapp.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class EduappApplication {

	@Autowired
	PasswordEncoder passwordEncoder;

	public static void main(String[] args) {
		SpringApplication.run(EduappApplication.class, args);
	}

	// @Bean
	// public CommandLineRunner demo(StudentRepository studentRepository) {
	// 	return args -> {
	// 		Student student = new Student();
	// 		student.setFirstName("Test");
	// 		student.setLastName("User");
	// 		student.setUsername("testuser");
	// 		student.setPassword(passwordEncoder.encode("password123"));
	// 		student.setStudentType(StudentType.NO_DISABILITY);

	// 		studentRepository.save(student);
	// 		System.out.println("Student saved at startup: " + student);
	// 	};
	// }
}
