package com.eduapp.eduapp.repository;

import com.eduapp.eduapp.models.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByUsername(String username);
    Boolean existsByUsername(String username);
}
