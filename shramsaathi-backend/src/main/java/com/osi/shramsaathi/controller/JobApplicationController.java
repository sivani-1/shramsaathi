package com.osi.shramsaathi.controller;

import com.osi.shramsaathi.model.Job;
import com.osi.shramsaathi.model.JobApplication;
import com.osi.shramsaathi.repository.JobRepository;
import com.osi.shramsaathi.repository.JobApplicationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/applications")
@CrossOrigin(origins = "http://localhost:3000")
public class JobApplicationController {

    private final JobApplicationRepository appRepo;
    private final JobRepository jobRepo;

    public JobApplicationController(JobApplicationRepository appRepo, JobRepository jobRepo) {
        this.appRepo = appRepo;
        this.jobRepo = jobRepo;
    }

    // ✅ Worker applies for a job (Prevent duplicate applications)
    @PostMapping
    public ResponseEntity<?> applyForJob(@RequestBody JobApplication application) {
        // 🚫 Check if worker already applied for this job
        Optional<JobApplication> existing = appRepo.findByJobIdAndWorkerId(application.getJobId(), application.getWorkerId());

        if (existing.isPresent()) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "⚠️ You have already applied for this job.");
            response.put("existingApplication", existing.get());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        }

        // ✅ Save new application
        JobApplication saved = appRepo.save(application);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "✅ Job application submitted successfully!");
        response.put("application", saved);
        return ResponseEntity.ok(response);
    }

    // ✅ Get all applications for a specific job (Owner View)
    @GetMapping("/job/{jobId}")
    public ResponseEntity<List<JobApplication>> getApplicationsByJob(@PathVariable Long jobId) {
        return ResponseEntity.ok(appRepo.findByJobId(jobId));
    }

    // ✅ Get all applications made by a specific worker (Worker View)
    @GetMapping("/worker/{workerId}")
    public ResponseEntity<List<Map<String, Object>>> getApplicationsByWorker(@PathVariable Long workerId) {
        List<JobApplication> apps = appRepo.findByWorkerId(workerId);
        List<Map<String, Object>> response = new ArrayList<>();

        for (JobApplication app : apps) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", app.getId());
            map.put("workerId", app.getWorkerId());
            map.put("workerName", app.getWorkerName());
            map.put("workerSkill", app.getWorkerSkill());
            map.put("status", app.getStatus());
            map.put("appliedAt", app.getAppliedAt());
            map.put("jobId", app.getJobId());

            // ✅ Fetch job details
            jobRepo.findById(app.getJobId()).ifPresentOrElse(job -> {
                map.put("jobTitle", job.getTitle());
                map.put("location", job.getLocation());
                map.put("pay", job.getPay());
                map.put("duration", job.getDuration());
            }, () -> {
                map.put("jobTitle", "Job not found");
                map.put("location", "-");
                map.put("pay", "-");
            });

            response.add(map);
        }

        return ResponseEntity.ok(response);
    }

    // ✅ Update application status (Owner Action)
    @PutMapping("/{id}/status")
    public ResponseEntity<JobApplication> updateStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        JobApplication app = appRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        app.setStatus(status);
        return ResponseEntity.ok(appRepo.save(app));
    }
}
