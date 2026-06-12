package com.quiniela.quiniela.controller;

import com.quiniela.quiniela.repository.ParticipantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class WebController {

    @Autowired
    private ParticipantRepository participantRepository;

    @GetMapping("/")
    public String index(Model model) {
        // Trae todos los participantes de la DB y los pone en la variable "participants"
        model.addAttribute("participants", participantRepository.findAll());
        return "index";
    }
}