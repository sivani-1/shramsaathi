package com.osi.shramsaathi.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.osi.shramsaathi.dto.OwnerRequest;
import com.osi.shramsaathi.dto.OwnerResponse;
import com.osi.shramsaathi.model.Owner;
import com.osi.shramsaathi.repository.OwnerRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OwnerService {

    private final OwnerRepository ownerRepository;

    public OwnerResponse register(OwnerRequest request) {
        // Generate a default password if not provided
        String password = request.getPassword() != null && !request.getPassword().isEmpty() 
            ? request.getPassword() 
            : "owner123"; // Default password
        
        Owner owner = Owner.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .address(request.getAddress())
                .businessName(request.getBusinessName())
                .district(request.getDistrict())
                .mandal(request.getMandal())
                .pincode(request.getPincode())
                .password(password)
                .registered(true)
                .build();

        ownerRepository.save(owner);
        return mapToResponse(owner);
    }

    public List<OwnerResponse> getAllOwnerResponses() {
        return ownerRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private OwnerResponse mapToResponse(Owner owner) {
        return OwnerResponse.builder()
                .id(owner.getId())
                .name(owner.getName())
                .phone(owner.getPhone())
                .address(owner.getAddress())
                .businessName(owner.getBusinessName())
                .district(owner.getDistrict())
                .mandal(owner.getMandal())
                .pincode(owner.getPincode())
                .registered(owner.getRegistered())
                .build();
    }
}
