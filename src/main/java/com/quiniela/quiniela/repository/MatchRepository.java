package com.quiniela.quiniela.repository;

import com.quiniela.quiniela.model.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {
    // Al extender JpaRepository<Modelo, Tipo_de_ID>, ya tenemos todo el CRUD gratis.
}