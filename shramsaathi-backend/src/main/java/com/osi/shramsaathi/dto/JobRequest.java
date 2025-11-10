package com.osi.shramsaathi.dto;

public class JobRequest {
    private Long ownerId;
    private String title;
    private String skillNeeded;
    private String location;
    private Double pay;
    private String duration;
    private Integer pincode;
    private String area;
    private String colony;
    private String state;
    private Double latitude;
    private Double longitude;

    // getters and setters
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

    public Integer getPincode() { return pincode; }
    public void setPincode(Integer pincode) { this.pincode = pincode; }

    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }

    public String getColony() { return colony; }
    public void setColony(String colony) { this.colony = colony; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
}
