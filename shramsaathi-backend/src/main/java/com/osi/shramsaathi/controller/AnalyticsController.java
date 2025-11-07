package com.osi.shramsaathi.controller;

import com.osi.shramsaathi.model.Job;
import com.osi.shramsaathi.repository.JobApplicationRepository;
import com.osi.shramsaathi.repository.JobRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "http://localhost:3000")
public class AnalyticsController {

    private final JobRepository jobRepo;
    private final JobApplicationRepository appRepo;

    public AnalyticsController(JobRepository jobRepo, JobApplicationRepository appRepo) {
        this.jobRepo = jobRepo;
        this.appRepo = appRepo;
    }

    // Owner: counts of applications per job (ownerId -> map jobId -> count)
    @GetMapping("/owner/{ownerId}/application-counts")
    public ResponseEntity<Map<Long, Long>> getApplicationCountsForOwner(@PathVariable Long ownerId) {
        List<Job> jobs = jobRepo.findByOwnerId(ownerId);
        Map<Long, Long> counts = new HashMap<>();
        for (Job job : jobs) {
            counts.put(job.getId(), appRepo.countByJobId(job.getId()));
        }
        return ResponseEntity.ok(counts);
    }

    // Worker summary: total jobs available, applied count, accepted count
    @GetMapping("/worker/{workerId}/summary")
    public ResponseEntity<Map<String, Long>> getWorkerSummary(@PathVariable Long workerId) {
        long totalJobs = jobRepo.count();
        long applied = appRepo.findByWorkerId(workerId).size();
        long accepted = appRepo.findByWorkerId(workerId).stream()
                .filter(a -> "accepted".equalsIgnoreCase(a.getStatus())).count();
        Map<String, Long> out = new HashMap<>();
        out.put("totalJobs", totalJobs);
        out.put("applied", applied);
        out.put("accepted", accepted);
        return ResponseEntity.ok(out);
    }
}
