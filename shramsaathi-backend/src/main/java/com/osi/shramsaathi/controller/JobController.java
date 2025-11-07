package com.osi.shramsaathi.controller;

import com.osi.shramsaathi.dto.JobRequest;
import com.osi.shramsaathi.dto.JobResponse;
import com.osi.shramsaathi.service.JobService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "http://localhost:3000")
public class JobController {

    private final JobService jobService;

    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    // ✅ GET all jobs (used by Analytics / Worker dashboard)
    @GetMapping
    public ResponseEntity<List<JobResponse>> getAllJobs() {
        List<JobResponse> jobs = jobService.getAllJobs();
        return ResponseEntity.ok(jobs);
    }

    // ✅ NEW: Get jobs by owner ID (used in Owner Dashboard)
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<JobResponse>> getJobsByOwner(@PathVariable Long ownerId) {
        List<JobResponse> jobs = jobService.getJobsByOwner(ownerId);
        return ResponseEntity.ok(jobs);
    }

    // ✅ POST: Create new job
    @PostMapping
    public ResponseEntity<JobResponse> createJob(@RequestBody JobRequest jobRequest) {
        JobResponse job = jobService.createJob(jobRequest);
        return ResponseEntity.ok(job);
    }

    // ✅ DELETE: Delete job by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJob(@PathVariable Long id) {
        jobService.deleteJob(id);
        return ResponseEntity.noContent().build();
    }
}
