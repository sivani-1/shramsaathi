package com.osi.shramsaathi.service;

import com.osi.shramsaathi.model.ChatMessage;
import com.osi.shramsaathi.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {
    
    private final ChatMessageRepository chatMessageRepository;

    public ChatMessage saveMessage(ChatMessage message) {
        message.setCreatedAt(LocalDateTime.now());
        message.setRead(false);
        return chatMessageRepository.save(message);
    }

    public List<ChatMessage> getMessagesByApplicationId(Long applicationId) {
        return chatMessageRepository.findByApplicationIdOrderByCreatedAtAsc(applicationId);
    }

    public void markAsRead(Long messageId) {
        chatMessageRepository.findById(messageId).ifPresent(message -> {
            message.setRead(true);
            chatMessageRepository.save(message);
        });
    }
}