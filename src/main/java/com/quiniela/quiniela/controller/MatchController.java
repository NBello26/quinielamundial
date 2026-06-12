package com.quiniela.quiniela.controller;

import com.quiniela.quiniela.model.Match;
import com.quiniela.quiniela.repository.MatchRepository;
import com.quiniela.quiniela.service.QuinielaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
public class MatchController {

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private QuinielaService quinielaService;

    // 1. Obtener todos los partidos
    @GetMapping
    public List<Match> getAllMatches() {
        return matchRepository.findAll();
    }

    // 2. Cargar partidos de forma masiva (para que no los cargues uno a uno)
    @PostMapping("/batch")
    public List<Match> createMatches(@RequestBody List<Match> matches) {
        return matchRepository.saveAll(matches);
    }

    // 3. Actualizar el resultado de un partido y disparar el cálculo de puntos
    @PutMapping("/{id}/result")
    public void updateResult(@PathVariable Long id, @RequestParam int goalsA, @RequestParam int goalsB) {
        quinielaService.registrarResultadoPartido(id, goalsA, goalsB);
    }
}