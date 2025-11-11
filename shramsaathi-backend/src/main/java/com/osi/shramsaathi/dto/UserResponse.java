package com.osi.shramsaathi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long id;
    private String name;
    private String phone;
    private String address;
    private String workType;
    private String district;
    private String mandal;
    private Integer pincode;
    private Boolean registered;
    private String area;
    private String colony;
    private String state;
    private Integer age;
    private Integer experienceYears;
}
// This is the UserResponse class, which is used to send the user data to the client.
// It uses Lombok to generate the getters, setters, constructor, and builder methods.
    
