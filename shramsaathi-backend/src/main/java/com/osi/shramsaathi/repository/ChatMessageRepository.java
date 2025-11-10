package com.osi.shramsaathi.repository;

import com.osi.shramsaathi.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByApplicationIdOrderByCreatedAtAsc(Long applicationId);
}