package com.osi.shramsaathi.repository;

import com.osi.shramsaathi.model.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {

    // ✅ Get all applications for a specific job
    List<JobApplication> findByJobId(Long jobId);

    // ✅ Count total applications for a job
    long countByJobId(Long jobId);

    // ✅ Get all applications submitted by a specific worker
    List<JobApplication> findByWorkerId(Long workerId);

    // 🚫 Prevent duplicate applications: find one if the same worker already applied to a job
    Optional<JobApplication> findByJobIdAndWorkerId(Long jobId, Long workerId);
}
