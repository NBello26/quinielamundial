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
    const matches = await prisma.match.findMany({
        orderBy: {
            id: 'asc' // <--- ESTA ES LA MAGIA: Siempre ordenados por ID de menor a mayor
        }
    });
    res.json(matches);
});

// Cargar partidos masivamente
app.post('/api/matches/batch', async (req, res) => {
    const matches = await prisma.match.createMany({ data: req.body });
    res.json(matches);
});

// Crear o actualizar predicción
app.post('/api/predictions/:participantId/:matchId', async (req, res) => {
    const { participantId, matchId } = req.params;
    const { goalsA, goalsB } = req.body;
    
    try {
        // 1. Buscamos si este participante ya tiene una predicción para este partido
        const existente = await prisma.prediction.findFirst({
            where: { 
                participantId: parseInt(participantId), 
                matchId: parseInt(matchId) 
            }
        });

        if (existente) {
            // 2. Si ya existía, la actualizamos
            const actualizada = await prisma.prediction.update({
                where: { id: existente.id },
                data: { goalsA, goalsB }
            });
            return res.json(actualizada);
        } else {
            // 3. Si estaba en blanco, creamos una nueva
            const nueva = await prisma.prediction.create({
                data: {
                    goalsA,
                    goalsB,
                    matchId: parseInt(matchId),
                    participantId: parseInt(participantId)
                }
            });
            return res.json(nueva);
        }
    } catch (error) {
        console.error("Error al guardar predicción:", error);
        res.status(500).json({ error: "Hubo un error al guardar" });
    }
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

// Obtener un participante específico con todas sus predicciones y los datos de los partidos
app.get('/api/participants/:id', async (req, res) => {
    try {
        const participant = await prisma.participant.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                predictions: {
                    include: { match: true }, // Trae los datos del partido (nombres de equipos y resultado real)
                    orderBy: { matchId: 'asc' } // Los ordena cronológicamente (Fecha 1, 2, 3)
                }
            }
        });
        res.json(participant);
    } catch (error) {
        console.error("Error al buscar predicciones:", error);
        res.status(500).json({ error: "Error al cargar los datos" });
    }
});

// ENDPOINT TEMPORAL DE RESCATE
app.get('/api/fix-matches', async (req, res) => {
    const partidosCorregidos = [
        // ================= FECHA 1 =================
        { id: 1, teamA: "México", teamB: "Sudáfrica", group: "A" },
        { id: 2, teamA: "Corea del Sur", teamB: "República Checa", group: "A" },
        { id: 3, teamA: "Canadá", teamB: "Bosnia y Herzegovina", group: "B" },
        { id: 4, teamA: "Catar", teamB: "Suiza", group: "B" },
        { id: 5, teamA: "Estados Unidos", teamB: "Paraguay", group: "C" },
        { id: 6, teamA: "Australia", teamB: "Turquía", group: "C" },
        { id: 7, teamA: "Brasil", teamB: "Marruecos", group: "D" },
        { id: 8, teamA: "Haití", teamB: "Escocia", group: "D" },
        { id: 9, teamA: "Alemania", teamB: "Curazao", group: "E" },
        { id: 10, teamA: "Costa de Marfil", teamB: "Ecuador", group: "E" },
        { id: 11, teamA: "Países Bajos", teamB: "Japón", group: "F" },
        { id: 12, teamA: "Suecia", teamB: "Túnez", group: "F" },
        { id: 13, teamA: "España", teamB: "Cabo Verde", group: "G" },
        { id: 14, teamA: "Arabia Saudita", teamB: "Uruguay", group: "G" },
        { id: 15, teamA: "Bélgica", teamB: "Egipto", group: "H" },
        { id: 16, teamA: "Irán", teamB: "Nueva Zelanda", group: "H" },
        { id: 17, teamA: "Francia", teamB: "Senegal", group: "I" },
        { id: 18, teamA: "Irak", teamB: "Noruega", group: "I" },
        { id: 19, teamA: "Argentina", teamB: "Argelia", group: "J" },
        { id: 20, teamA: "Austria", teamB: "Jordania", group: "J" },
        { id: 21, teamA: "Portugal", teamB: "RD Congo", group: "K" },
        { id: 22, teamA: "Uzbekistán", teamB: "Colombia", group: "K" },
        { id: 23, teamA: "Inglaterra", teamB: "Croacia", group: "L" },
        { id: 24, teamA: "Ghana", teamB: "Panamá", group: "L" },

        // ================= FECHA 2 =================
        { id: 25, teamA: "México", teamB: "Corea del Sur", group: "A" },
        { id: 26, teamA: "República Checa", teamB: "Sudáfrica", group: "A" },
        { id: 27, teamA: "Canadá", teamB: "Catar", group: "B" },
        { id: 28, teamA: "Suiza", teamB: "Bosnia y Herzegovina", group: "B" },
        { id: 29, teamA: "Estados Unidos", teamB: "Australia", group: "C" },
        { id: 30, teamA: "Turquía", teamB: "Paraguay", group: "C" },
        { id: 31, teamA: "Brasil", teamB: "Haití", group: "D" },
        { id: 32, teamA: "Escocia", teamB: "Marruecos", group: "D" },
        { id: 33, teamA: "Alemania", teamB: "Costa de Marfil", group: "E" },
        { id: 34, teamA: "Ecuador", teamB: "Curazao", group: "E" },
        { id: 35, teamA: "Países Bajos", teamB: "Suecia", group: "F" },
        { id: 36, teamA: "Túnez", teamB: "Japón", group: "F" },
        { id: 37, teamA: "España", teamB: "Arabia Saudita", group: "G" },
        { id: 38, teamA: "Uruguay", teamB: "Cabo Verde", group: "G" },
        { id: 39, teamA: "Bélgica", teamB: "Irán", group: "H" },
        { id: 40, teamA: "Nueva Zelanda", teamB: "Egipto", group: "H" },
        { id: 41, teamA: "Francia", teamB: "Irak", group: "I" },
        { id: 42, teamA: "Noruega", teamB: "Senegal", group: "I" },
        { id: 43, teamA: "Argentina", teamB: "Austria", group: "J" },
        { id: 44, teamA: "Jordania", teamB: "Argelia", group: "J" },
        { id: 45, teamA: "Portugal", teamB: "Uzbekistán", group: "K" },
        { id: 46, teamA: "Colombia", teamB: "RD Congo", group: "K" },
        { id: 47, teamA: "Inglaterra", teamB: "Ghana", group: "L" },
        { id: 48, teamA: "Panamá", teamB: "Croacia", group: "L" },

        // ================= FECHA 3 =================
        { id: 49, teamA: "República Checa", teamB: "México", group: "A" },
        { id: 50, teamA: "Sudáfrica", teamB: "Corea del Sur", group: "A" },
        { id: 51, teamA: "Suiza", teamB: "Canadá", group: "B" },
        { id: 52, teamA: "Bosnia y Herzegovina", teamB: "Catar", group: "B" },
        { id: 53, teamA: "Turquía", teamB: "Estados Unidos", group: "C" },
        { id: 54, teamA: "Paraguay", teamB: "Australia", group: "C" },
        { id: 55, teamA: "Marruecos", teamB: "Haití", group: "D" },
        { id: 56, teamA: "Escocia", teamB: "Brasil", group: "D" }, // <- Añadido el partido 72 que faltaba
        { id: 57, teamA: "Curazao", teamB: "Costa de Marfil", group: "E" },
        { id: 58, teamA: "Ecuador", teamB: "Alemania", group: "E" },
        { id: 59, teamA: "Japón", teamB: "Suecia", group: "F" },
        { id: 60, teamA: "Túnez", teamB: "Países Bajos", group: "F" },
        { id: 61, teamA: "Uruguay", teamB: "España", group: "G" },
        { id: 62, teamA: "Cabo Verde", teamB: "Arabia Saudita", group: "G" },
        { id: 63, teamA: "Nueva Zelanda", teamB: "Bélgica", group: "H" },
        { id: 64, teamA: "Egipto", teamB: "Irán", group: "H" },
        { id: 65, teamA: "Noruega", teamB: "Francia", group: "I" },
        { id: 66, teamA: "Senegal", teamB: "Irak", group: "I" },
        { id: 67, teamA: "Jordania", teamB: "Argentina", group: "J" },
        { id: 68, teamA: "Argelia", teamB: "Austria", group: "J" },
        { id: 69, teamA: "Colombia", teamB: "Portugal", group: "K" },
        { id: 70, teamA: "RD Congo", teamB: "Uzbekistán", group: "K" },
        { id: 71, teamA: "Panamá", teamB: "Inglaterra", group: "L" },
        { id: 72, teamA: "Croacia", teamB: "Ghana", group: "L" }
    ];

    try {
        // Ejecutar las actualizaciones en la base de datos de manera controlada
        for (const partido of partidosCorregidos) {
            await prisma.match.update({
                where: { id: partido.id }, 
                data: {
                    teamA: partido.teamA,
                    teamB: partido.teamB,
                    group: partido.group // Inyectamos el grupo directamente en la DB
                }
            });
        }
        res.json({ message: "¡Base de datos reestructurada con éxito! 12 grupos de 4 equipos perfectos." });
    } catch(error) {
        console.error("Error al corregir partidos:", error);
        res.status(500).json({ error: "Hubo un error al actualizar los partidos." });
    }
});

app.get('/api/debug-matches', async (req, res) => {
  const matches = await prisma.match.findMany({
    orderBy: {
      id: 'asc'
    }
  });

  res.json(matches);
});
// Arrancar servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));