package com.quiniela.quiniela.controller;

import com.quiniela.quiniela.model.Participant;
import com.quiniela.quiniela.repository.ParticipantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/participants")
public class ParticipantController {

    @Autowired
    private ParticipantRepository participantRepository;

    @GetMapping
    public List<Participant> getAllParticipants() {
        return participantRepository.findAll();
    }

    @PostMapping
    public Participant createParticipant(@RequestBody Participant participant) {
        return participantRepository.save(participant);
    }
}