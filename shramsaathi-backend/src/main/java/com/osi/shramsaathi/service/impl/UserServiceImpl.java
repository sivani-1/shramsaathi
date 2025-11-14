// package com.osi.shramsaathi.service.impl;

// import java.util.List;

// import org.springframework.stereotype.Service;

// import com.osi.shramsaathi.dto.UserRequest;
// import com.osi.shramsaathi.dto.UserResponse;
// import com.osi.shramsaathi.model.User;
// import com.osi.shramsaathi.repository.UserRepository;
// import com.osi.shramsaathi.service.UserService;

// import lombok.RequiredArgsConstructor;

// @Service
// @RequiredArgsConstructor
// public class UserServiceImpl implements UserService {

//     private final UserRepository userRepository;

//     /**
//      * Registers a new user with details provided in the request
//      */
//     @Override
//     public UserResponse register(UserRequest request) {
//         // Generate a default password if not provided
//         String password = request.getPassword() != null && !request.getPassword().isEmpty() 
//             ? request.getPassword() 
//             : "worker123"; // Default password
        
//         User user = User.builder()
//                 .name(request.getName())
//                 .phone(request.getPhone())
//                 .address(request.getAddress())
//                 .workType(request.getWorkType())
//                 .district(request.getDistrict())
//                 .mandal(request.getMandal())
//                 .pincode(request.getPincode())
//                 .area(request.getArea())
//                 .colony(request.getColony())
//                 .state(request.getState())
//                 .age(request.getAge())
//                 .experienceYears(request.getExperienceYears())
//                 .password(password)
//                 .registered(true)
//                 .build();

//         User savedUser = userRepository.save(user);
//         return toResponse(savedUser);
//     }

//     /**
//      * Retrieves all users from the database
//      */
//     @Override
//     public List<UserResponse> getAllUsers() {
//         return userRepository.findAll()
//                 .stream()
//                 .map(this::toResponse)
//                 .toList();
//     }

   

//     /**
//      * Maps a User entity to a UserResponse DTO
//      */
//     private UserResponse toResponse(User user) {
//         return UserResponse.builder()
//                 .id(user.getId())
//                 .name(user.getName())
//                 .phone(user.getPhone())
//                 .address(user.getAddress())
//                 .workType(user.getWorkType())
//                 .district(user.getDistrict())
//                 .mandal(user.getMandal())
//                 .pincode(user.getPincode())
//                 .area(user.getArea())
//                 .colony(user.getColony())
//                 .state(user.getState())
//                 .registered(user.getRegistered())
//                 .age(user.getAge())
//                 .experienceYears(user.getExperienceYears())
//                 .build();
//     }
// }


package com.osi.shramsaathi.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.osi.shramsaathi.dto.UserRequest;
import com.osi.shramsaathi.dto.UserResponse;
import com.osi.shramsaathi.model.User;
import com.osi.shramsaathi.repository.UserRepository;
import com.osi.shramsaathi.service.UserService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public UserResponse register(UserRequest request) {

        String password = request.getPassword() != null && !request.getPassword().isEmpty()
                ? request.getPassword()
                : "worker123";

        User user = User.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .address(request.getAddress())
                .workType(request.getWorkType())
                .district(request.getDistrict())
                .mandal(request.getMandal())
                .pincode(request.getPincode())
                .area(request.getArea())
                .colony(request.getColony())
                .state(request.getState())
                .age(request.getAge())
                .experienceYears(request.getExperienceYears())
                .password(password)
                .registered(true)
                .build();

        User savedUser = userRepository.save(user);
        return toResponse(savedUser);
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /** ⭐ FIX ADDED — Fetch user by ID */
    @Override
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
        return toResponse(user);
    }

    /** Convert User → UserResponse DTO */
    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .phone(user.getPhone())
                .address(user.getAddress())
                .workType(user.getWorkType())
                .district(user.getDistrict())
                .mandal(user.getMandal())
                .pincode(user.getPincode())
                .area(user.getArea())
                .colony(user.getColony())
                .state(user.getState())
                .registered(user.getRegistered())
                .age(user.getAge())
                .experienceYears(user.getExperienceYears())
                .build();
    }
}
