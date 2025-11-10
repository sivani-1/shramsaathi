package com.osi.shramsaathi.controller;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class LocationController {

    private final SimpMessagingTemplate messagingTemplate;

    // Worker sends location updates to /app/location/{workerId}
    @MessageMapping("/location/{workerId}")
    public void receiveLocation(@DestinationVariable String workerId, LocationMessage msg) {
        // Broadcast to subscribers on /topic/location/{workerId}
        messagingTemplate.convertAndSend("/topic/location/" + workerId, msg);
    }

    public static class LocationMessage {
        public Long workerId;
        public Double lat;
        public Double lon;
        public Long timestamp;

        public LocationMessage() {}

        public LocationMessage(Long workerId, Double lat, Double lon, Long timestamp) {
            this.workerId = workerId;
            this.lat = lat;
            this.lon = lon;
            this.timestamp = timestamp;
        }

        // getters/setters if needed
    }
}
