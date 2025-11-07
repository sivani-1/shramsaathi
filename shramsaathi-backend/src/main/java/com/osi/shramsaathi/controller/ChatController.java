package com.osi.shramsaathi.controller;

import com.osi.shramsaathi.model.ChatMessage;
import com.osi.shramsaathi.repository.ChatRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "http://localhost:3000")
public class ChatController {

    private final ChatRepository chatRepo;

    public ChatController(ChatRepository chatRepo) {
        this.chatRepo = chatRepo;
    }

    // ✅ Send a message
    @PostMapping
    public ResponseEntity<ChatMessage> sendMessage(@RequestBody ChatMessage message) {
        return ResponseEntity.ok(chatRepo.save(message));
    }

    // ✅ Fetch all messages for an application (both worker & owner)
    @GetMapping("/{applicationId}")
    public ResponseEntity<List<ChatMessage>> getMessagesByApplication(@PathVariable Long applicationId) {
        return ResponseEntity.ok(chatRepo.findByApplicationIdOrderBySentAtAsc(applicationId));
    }
}
