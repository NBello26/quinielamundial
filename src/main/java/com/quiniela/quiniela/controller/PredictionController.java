package com.quiniela.quiniela.controller;

import com.quiniela.quiniela.model.Prediction;
import com.quiniela.quiniela.repository.MatchRepository;
import com.quiniela.quiniela.repository.ParticipantRepository;
import com.quiniela.quiniela.repository.PredictionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/predictions")
public class PredictionController {

    @Autowired
    private PredictionRepository predictionRepository;

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private ParticipantRepository participantRepository;

    @PostMapping("/{participantId}/{matchId}")
    public Prediction createPrediction(@PathVariable Long participantId, 
                                       @PathVariable Long matchId, 
                                       @RequestBody Prediction prediction) {
        
        prediction.setParticipant(participantRepository.findById(participantId).get());
        prediction.setMatch(matchRepository.findById(matchId).get());
        
        return predictionRepository.save(prediction);
    }
}