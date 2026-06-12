package com.quiniela.quiniela.service;

import com.quiniela.quiniela.model.Match;
import com.quiniela.quiniela.model.Participant;
import com.quiniela.quiniela.model.Prediction;
import com.quiniela.quiniela.repository.MatchRepository;
import com.quiniela.quiniela.repository.ParticipantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class QuinielaService {

    @Autowired
    private MatchRepository matchRepository;
    
    @Autowired
    private ParticipantRepository participantRepository;

    // Método principal: Se llama cuando un partido real de la copa termina
    public void registrarResultadoPartido(Long matchId, int realGoalsA, int realGoalsB) {
        
        // 1. Buscamos el partido en la base de datos y le ponemos sus goles reales
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Partido no encontrado"));
        
        match.setRealGoalsA(realGoalsA);
        match.setRealGoalsB(realGoalsB);
        matchRepository.save(match);

        // 2. Traemos a todos los participantes que están jugando
        List<Participant> participants = participantRepository.findAll();

        // 3. Revisamos las predicciones de cada participante
        for (Participant participant : participants) {
            for (Prediction prediction : participant.getPredictions()) {
                
                // Si la predicción es para el partido que acaba de terminar...
                if (prediction.getMatch().getId().equals(matchId)) {
                    
                    // Calculamos cuántos puntos ganó
                    int puntosGanados = calcularPuntos(
                            prediction.getGoalsA(), prediction.getGoalsB(), 
                            realGoalsA, realGoalsB
                    );
                    
                    // Se los sumamos a su puntaje total
                    participant.setTotalPoints(participant.getTotalPoints() + puntosGanados);
                }
            }
        }
        
        // 4. Guardamos a todos los participantes con sus puntajes actualizados
        participantRepository.saveAll(participants);
    }

    // Lógica interna para saber si alguien le atinó o no
    private int calcularPuntos(int predA, int predB, int realA, int realB) {
        // 1. Acierto exacto: 5 puntos
        if (predA == realA && predB == realB) {
            return 5;
        }
        
        // 2. Acierto de tendencia (ganador o empate): 3 puntos
        boolean prediceEmpate = predA == predB;
        boolean fueEmpate = realA == realB;
        
        boolean prediceGanaA = predA > predB;
        boolean ganoA = realA > realB;
        
        boolean prediceGanaB = predA < predB;
        boolean ganoB = realA < realB;

        if ((prediceEmpate && fueEmpate) || (prediceGanaA && ganoA) || (prediceGanaB && ganoB)) {
            return 3;
        }

        // 3. Falló: 0 puntos
        return 0;
    }
}