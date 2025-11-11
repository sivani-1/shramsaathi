package com.osi.shramsaathi.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Phone is required")
    private String phone;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "Work type is required")
    private String workType;

    @NotBlank(message = "District is required")
    private String district;

    @NotBlank(message = "Mandal is required")
    private String mandal;

    @NotNull(message = "Pincode is required")
    private Integer pincode;
    private String area;
    private String colony;
    private String state;
    private Integer age;
    private Integer experienceYears;
    private String password; // Add password field
}
// This is the UserRequest class, which is used to create a new user.
// It uses Lombok to generate the getters, setters, constructor, and builder methods.
// It also uses JSR 380 (Bean Validation) annotations to validate the input fields. 
