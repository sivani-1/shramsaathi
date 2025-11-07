package com.osi.shramsaathi.dto;

import java.time.LocalDateTime;

public class JobResponse {
    private Long id;
    private Long ownerId;
    private String title;
    private String skillNeeded;
    private String location;
    private Double pay;
    private String duration;
    private String status;
    private LocalDateTime createdAt;

    // getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getOwnerId() { return ownerId; }
    public void setOwnerId(Long ownerId) { this.ownerId = ownerId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSkillNeeded() { return skillNeeded; }
    public void setSkillNeeded(String skillNeeded) { this.skillNeeded = skillNeeded; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public Double getPay() { return pay; }
    public void setPay(Double pay) { this.pay = pay; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
