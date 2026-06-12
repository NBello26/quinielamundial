package com.quiniela.quiniela.model;

import jakarta.persistence.*;

@Entity
@Table(name = "matches")
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String teamA;
    private String teamB;

    // Usamos Integer (objeto) en lugar de int para que puedan ser null antes de que se juegue el partido
    private Integer realGoalsA;
    private Integer realGoalsB;

    // Constructor vacío obligatorio para JPA
    public Match() {}

    public Match(String teamA, String teamB) {
        this.teamA = teamA;
        this.teamB = teamB;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTeamA() { return teamA; }
    public void setTeamA(String teamA) { this.teamA = teamA; }

    public String getTeamB() { return teamB; }
    public void setTeamB(String teamB) { this.teamB = teamB; }

    public Integer getRealGoalsA() { return realGoalsA; }
    public void setRealGoalsA(Integer realGoalsA) { this.realGoalsA = realGoalsA; }

    public Integer getRealGoalsB() { return realGoalsB; }
    public void setRealGoalsB(Integer realGoalsB) { this.realGoalsB = realGoalsB; }
}