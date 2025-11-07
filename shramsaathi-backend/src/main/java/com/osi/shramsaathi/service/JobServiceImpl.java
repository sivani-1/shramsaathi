package com.osi.shramsaathi.service;

import com.osi.shramsaathi.dto.JobRequest;
import com.osi.shramsaathi.dto.JobResponse;
import com.osi.shramsaathi.exception.ResourceNotFoundException;
import com.osi.shramsaathi.model.Job;
import com.osi.shramsaathi.repository.JobRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class JobServiceImpl implements JobService {

    private final JobRepository jobRepository;

    public JobServiceImpl(JobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

    private JobResponse map(Job job) {
        JobResponse r = new JobResponse();
        r.setId(job.getId());
        r.setOwnerId(job.getOwnerId());
        r.setTitle(job.getTitle());
        r.setSkillNeeded(job.getSkillNeeded());
        r.setLocation(job.getLocation());
        r.setPay(job.getPay());
        r.setDuration(job.getDuration());
        r.setStatus(job.getStatus());
        r.setCreatedAt(job.getCreatedAt());
        return r;
    }

    public JobResponse createJob(JobRequest request) {
        Job job = new Job();
        job.setOwnerId(request.getOwnerId());
        job.setTitle(request.getTitle());
        job.setSkillNeeded(request.getSkillNeeded());
        job.setLocation(request.getLocation());
        job.setPay(request.getPay());
        job.setDuration(request.getDuration());
        Job saved = jobRepository.save(job);
        return map(saved);
    }

    public JobResponse updateJob(Long id, JobRequest request) {
        Job job = jobRepository.findById(id).orElseThrow(() ->
                new ResourceNotFoundException("Job not found: " + id));
        job.setTitle(request.getTitle());
        job.setSkillNeeded(request.getSkillNeeded());
        job.setLocation(request.getLocation());
        job.setPay(request.getPay());
        job.setDuration(request.getDuration());
        Job saved = jobRepository.save(job);
        return map(saved);
    }

    public void deleteJob(Long id) {
        Job job = jobRepository.findById(id).orElseThrow(() ->
                new ResourceNotFoundException("Job not found: " + id));
        jobRepository.delete(job);
    }

    public JobResponse getJobById(Long id) {
        Job job = jobRepository.findById(id).orElseThrow(() ->
                new ResourceNotFoundException("Job not found: " + id));
        return map(job);
    }

    public List<JobResponse> getJobsByOwner(Long ownerId) {
        return jobRepository.findByOwnerId(ownerId).stream().map(this::map).collect(Collectors.toList());
    }

    public List<JobResponse> searchBySkill(String skill) {
        return jobRepository.findBySkillNeededContainingIgnoreCase(skill).stream().map(this::map).collect(Collectors.toList());
    }
    @Override
public List<JobResponse> getAllJobs() {
    return jobRepository.findAll()
            .stream()
            .map(this::map)
            .collect(Collectors.toList());
}

}
