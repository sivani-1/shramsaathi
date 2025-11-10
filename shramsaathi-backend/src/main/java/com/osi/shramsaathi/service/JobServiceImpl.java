package com.osi.shramsaathi.service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.osi.shramsaathi.dto.JobRequest;
import com.osi.shramsaathi.dto.JobResponse;
import com.osi.shramsaathi.exception.ResourceNotFoundException;
import com.osi.shramsaathi.model.Job;
import com.osi.shramsaathi.repository.JobRepository;

@Service
public class JobServiceImpl implements JobService {

    private final JobRepository jobRepository;
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();
    // Simple in-memory cache for geocoding queries -> [lat, lon]
    private final ConcurrentHashMap<String, double[]> geocodeCache = new ConcurrentHashMap<>();

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
        r.setPincode(job.getPincode());
        r.setArea(job.getArea());
        r.setColony(job.getColony());
        r.setState(job.getState());
        r.setLatitude(job.getLatitude());
        r.setLongitude(job.getLongitude());
        r.setStatus(job.getStatus());
        r.setCreatedAt(job.getCreatedAt());
        return r;
    }

    // Server-side geocoding using Nominatim. Returns {lat,lon} or null.
    private double[] geocodeRequest(JobRequest request) {
        try {
            StringBuilder sb = new StringBuilder();
            if (request.getArea() != null && !request.getArea().isBlank()) sb.append(request.getArea()).append(", ");
            if (request.getColony() != null && !request.getColony().isBlank()) sb.append(request.getColony()).append(", ");
            if (request.getPincode() != null) sb.append(request.getPincode()).append(", ");
            if (request.getState() != null && !request.getState().isBlank()) sb.append(request.getState()).append(", ");
            if (request.getLocation() != null && !request.getLocation().isBlank()) sb.append(request.getLocation()).append(", ");
            sb.append("India");

            String key = sb.toString();
            if (geocodeCache.containsKey(key)) {
                return geocodeCache.get(key);
            }

            String q = URLEncoder.encode(sb.toString(), StandardCharsets.UTF_8);
            String url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=" + q;
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("User-Agent", "ShramSaathi/1.0")
                    .GET()
                    .build();
            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            JsonNode arr = objectMapper.readTree(resp.body());
            if (arr.isArray() && arr.size() > 0) {
                JsonNode node = arr.get(0);
                double lat = node.get("lat").asDouble();
                double lon = node.get("lon").asDouble();
                // simple bounding check for India
                if (lat >= 6 && lat <= 38 && lon >= 68 && lon <= 98) {
                    double[] coords = new double[] { lat, lon };
                    geocodeCache.put(key, coords);
                    return coords;
                }
                // if address shows country_code == in, accept
                if (node.has("address") && node.get("address").has("country_code")
                        && "in".equalsIgnoreCase(node.get("address").get("country_code").asText())) {
                    double[] coords = new double[] { lat, lon };
                    geocodeCache.put(key, coords);
                    return coords;
                }
            }
        } catch (Exception e) {
            // ignore and return null
        }
        return null;
    }

    public JobResponse createJob(JobRequest request) {
        Job job = new Job();
        job.setOwnerId(request.getOwnerId());
        job.setTitle(request.getTitle());
        job.setSkillNeeded(request.getSkillNeeded());
        job.setLocation(request.getLocation());
        job.setPay(request.getPay());
        job.setDuration(request.getDuration());
        job.setPincode(request.getPincode());
        job.setArea(request.getArea());
        job.setColony(request.getColony());
        job.setState(request.getState());

        // attempt server-side geocoding and store coordinates
        double[] coords = geocodeRequest(request);
        if (coords != null) {
            job.setLatitude(coords[0]);
            job.setLongitude(coords[1]);
        }

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
        job.setPincode(request.getPincode());
        job.setArea(request.getArea());
        job.setColony(request.getColony());
        job.setState(request.getState());

        double[] coords = geocodeRequest(request);
        if (coords != null) {
            job.setLatitude(coords[0]);
            job.setLongitude(coords[1]);
        }

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
