const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

// Como es para uso familiar, permitimos conexiones desde cualquier lugar
app.use(cors());
app.use(express.json());

// --- LÓGICA DE PUNTOS (Traducción de tu QuinielaService) ---
function calcularPuntos(predA, predB, realA, realB) {
    if (predA === realA && predB === realB) return 5;
    
    const prediceEmpate = predA === predB;
    const fueEmpate = realA === realB;
    const prediceGanaA = predA > predB;
    const ganoA = realA > realB;
    const prediceGanaB = predA < predB;
    const ganoB = realA < realB;

    if ((prediceEmpate && fueEmpate) || (prediceGanaA && ganoA) || (prediceGanaB && ganoB)) {
        return 3;
    }
    return 0;
}

// --- ENDPOINTS (Traducción de tus Controllers) ---

// Obtener participantes (WebController / ParticipantController)
app.get('/api/participants', async (req, res) => {
    const participants = await prisma.participant.findMany({
        orderBy: { totalPoints: 'desc' } // Los ordenamos por puntos de una vez
    });
    res.json(participants);
});

// Crear participante
app.post('/api/participants', async (req, res) => {
    const participant = await prisma.participant.create({ data: req.body });
    res.json(participant);
});

// Obtener partidos
app.get('/api/matches', async (req, res) => {
    const matches = await prisma.match.findMany();
    res.json(matches);
});

// Cargar partidos masivamente
app.post('/api/matches/batch', async (req, res) => {
    const matches = await prisma.match.createMany({ data: req.body });
    res.json(matches);
});

// Crear predicción
app.post('/api/predictions/:participantId/:matchId', async (req, res) => {
    const { participantId, matchId } = req.params;
    const { goalsA, goalsB } = req.body;
    
    const prediction = await prisma.prediction.create({
        data: {
            goalsA,
            goalsB,
            matchId: parseInt(matchId),
            participantId: parseInt(participantId)
        }
    });
    res.json(prediction);
});

// Actualizar resultado y calcular puntos
app.put('/api/matches/:id/result', async (req, res) => {
    const matchId = parseInt(req.params.id);
    const { goalsA, goalsB } = req.body; // En Express es mejor mandarlo en el body que como RequestParam

    // 1. Guardar resultado real
    await prisma.match.update({
        where: { id: matchId },
        data: { realGoalsA: goalsA, realGoalsB: goalsB }
    });

    // 2. Buscar predicciones de este partido
    const predictions = await prisma.prediction.findMany({
        where: { matchId: matchId },
        include: { participant: true }
    });

    // 3. Calcular puntos y actualizar participantes
    for (const pred of predictions) {
        const puntosGanados = calcularPuntos(pred.goalsA, pred.goalsB, goalsA, goalsB);
        if (puntosGanados > 0) {
            await prisma.participant.update({
                where: { id: pred.participantId },
                data: { totalPoints: pred.participant.totalPoints + puntosGanados }
            });
        }
    }

    res.json({ message: "Resultado actualizado y puntos calculados" });
});

// Cargar participantes y predicciones masivamente desde Postman
app.post('/api/participants/batch', async (req, res) => {
    try {
        const participantes = req.body; // Esperamos un array de participantes
        
        for (const p of participantes) {
            await prisma.participant.create({
                data: {
                    name: p.name,
                    predictions: {
                        // Prisma creará las predicciones y las enlazará automáticamente al participante
                        create: p.predictions 
                    }
                }
            });
        }
        res.json({ message: "Participantes y predicciones cargados con éxito" });
    } catch (error) {
        console.error("Error en la carga masiva:", error);
        res.status(500).json({ error: "Hubo un error al cargar los datos" });
    }
});

// Arrancar servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));