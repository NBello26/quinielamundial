package com.quiniela.quiniela.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "predictions")
public class Prediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int goalsA;
    private int goalsB;

    // Relación: Muchas predicciones pertenecen a un solo partido
    @ManyToOne
    @JoinColumn(name = "match_id")
    private Match match;

    // Relación: Muchas predicciones pertenecen a un solo participante
    // @JsonIgnore evita bucles infinitos al transformar el objeto a JSON para el frontend
    @ManyToOne
    @JoinColumn(name = "participant_id")
    @JsonIgnore
    private Participant participant;

    public Prediction() {}

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public int getGoalsA() { return goalsA; }
    public void setGoalsA(int goalsA) { this.goalsA = goalsA; }

    public int getGoalsB() { return goalsB; }
    public void setGoalsB(int goalsB) { this.goalsB = goalsB; }

    public Match getMatch() { return match; }
    public void setMatch(Match match) { this.match = match; }

    public Participant getParticipant() { return participant; }
    public void setParticipant(Participant participant) { this.participant = participant; }
}