package com.quiniela.quiniela.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.FetchType;

@Entity
@Table(name = "participants")
public class Participant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private int totalPoints = 0;

    // Relación: Un participante tiene muchas predicciones
    // CascadeType.ALL hace que si guardamos al participante, sus predicciones se guarden solas
    @OneToMany(mappedBy = "participant", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<Prediction> predictions = new ArrayList<>();

    public Participant() {}

    public Participant(String name) {
        this.name = name;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getTotalPoints() { return totalPoints; }
    public void setTotalPoints(int totalPoints) { this.totalPoints = totalPoints; }

    public List<Prediction> getPredictions() { return predictions; }
    public void setPredictions(List<Prediction> predictions) { this.predictions = predictions; }
}