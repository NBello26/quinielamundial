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
        // --- FECHA 1 (Orden exacto de tu Excel) ---
        { teamA: "México", teamB: "Sudáfrica" }, // 1
        { teamA: "Corea del Sur", teamB: "República Checa" }, // 2
        { teamA: "Canadá", teamB: "Bosnia y Herzegovina" }, // 3
        { teamA: "Estados Unidos", teamB: "Paraguay" }, // 4
        { teamA: "Catar", teamB: "Suiza" }, // 5
        { teamA: "Brasil", teamB: "Marruecos" }, // 6
        { teamA: "Haití", teamB: "Escocia" }, // 7
        { teamA: "Australia", teamB: "Turquía" }, // 8
        { teamA: "Alemania", teamB: "Curazao" }, // 9
        { teamA: "Países Bajos", teamB: "Japón" }, // 10
        { teamA: "Costa de Marfil", teamB: "Ecuador" }, // 11
        { teamA: "Suecia", teamB: "Túnez" }, // 12
        { teamA: "España", teamB: "Cabo Verde" }, // 13
        { teamA: "Bélgica", teamB: "Egipto" }, // 14
        { teamA: "Arabia Saudita", teamB: "Uruguay" }, // 15
        { teamA: "Irán", teamB: "Nueva Zelanda" }, // 16
        { teamA: "Francia", teamB: "Senegal" }, // 17
        { teamA: "Irak", teamB: "Noruega" }, // 18
        { teamA: "Argentina", teamB: "Argelia" }, // 19
        { teamA: "Austria", teamB: "Jordania" }, // 20
        { teamA: "Portugal", teamB: "RD Congo" }, // 21
        { teamA: "Inglaterra", teamB: "Croacia" }, // 22
        { teamA: "Ghana", teamB: "Panamá" }, // 23
        { teamA: "Uzbekistán", teamB: "Colombia" }, // 24

        // --- FECHA 2 (Orden exacto de tu Excel hasta el 36) ---
        { teamA: "República Checa", teamB: "Sudáfrica" }, // 25
        { teamA: "Suiza", teamB: "Bosnia y Herzegovina" }, // 26
        { teamA: "Canadá", teamB: "Catar" }, // 27
        { teamA: "México", teamB: "Corea del Sur" }, // 28
        { teamA: "Estados Unidos", teamB: "Australia" }, // 29
        { teamA: "Escocia", teamB: "Marruecos" }, // 30
        { teamA: "Brasil", teamB: "Haití" }, // 31
        { teamA: "Turquía", teamB: "Paraguay" }, // 32
        { teamA: "Países Bajos", teamB: "Suecia" }, // 33
        { teamA: "Alemania", teamB: "Costa de Marfil" }, // 34
        { teamA: "Ecuador", teamB: "Curazao" }, // 35
        { teamA: "Túnez", teamB: "Japón" }, // 36

        // --- DE AQUÍ EN ADELANTE (37 al 72) RELLENADOS DEL JSON ---
        { "teamA": "Bélgica", "teamB": "Irán" }, // 37
        { "teamA": "Nueva Zelanda", "teamB": "Egipto" }, // 38
        { "teamA": "España", "teamB": "Arabia Saudita" }, // 39
        { "teamA": "Uruguay", "teamB": "Cabo Verde" }, // 40
        { "teamA": "Francia", "teamB": "Irak" }, // 41
        { "teamA": "Noruega", "teamB": "Senegal" }, // 42
        { "teamA": "Argentina", "teamB": "Austria" }, // 43
        { "teamA": "Jordania", "teamB": "Argelia" }, // 44
        { "teamA": "Portugal", "teamB": "Uzbekistán" }, // 45
        { "teamA": "Colombia", "teamB": "RD Congo" }, // 46
        { "teamA": "Inglaterra", "teamB": "Ghana" }, // 47
        { "teamA": "Panamá", "teamB": "Croacia" }, // 48
        
        // --- FECHA 3 ---
        { "teamA": "República Checa", "teamB": "México" }, // 49
        { "teamA": "Sudáfrica", "teamB": "Corea del Sur" }, // 50
        { "teamA": "Suiza", "teamB": "Canadá" }, // 51
        { "teamA": "Bosnia y Herzegovina", "teamB": "Catar" }, // 52
        { "teamA": "Marruecos", "teamB": "Haití" }, // 53
        { "teamA": "Turquía", "teamB": "Estados Unidos" }, // 54
        { "teamA": "Paraguay", "teamB": "Australia" }, // 55
        { "teamA": "Curazao", "teamB": "Costa de Marfil" }, // 56
        { "teamA": "Ecuador", "teamB": "Alemania" }, // 57
        { "teamA": "Japón", "teamB": "Suecia" }, // 58
        { "teamA": "Túnez", "teamB": "Países Bajos" }, // 59
        { "teamA": "Nueva Zelanda", "teamB": "Bélgica" }, // 60
        { "teamA": "Egipto", "teamB": "Irán" }, // 61
        { "teamA": "Uruguay", "teamB": "España" }, // 62
        { "teamA": "Cabo Verde", "teamB": "Arabia Saudita" }, // 63
        { "teamA": "Noruega", "teamB": "Francia" }, // 64
        { "teamA": "Senegal", "teamB": "Irak" }, // 65
        { "teamA": "Jordania", "teamB": "Argentina" }, // 66
        { "teamA": "Argelia", "teamB": "Austria" }, // 67
        { "teamA": "Colombia", "teamB": "Portugal" }, // 68
        { "teamA": "RD Congo", "teamB": "Uzbekistán" }, // 69
        { "teamA": "Panamá", "teamB": "Inglaterra" }, // 70
        { "teamA": "Croacia", "teamB": "Ghana" } // 71 (Debería haber uno más aquí si son 72, revisa tu JSON original)
    ];

    try {
        for (let i = 0; i < partidosCorregidos.length; i++) {
            await prisma.match.update({
                where: { id: i + 1 }, 
                data: {
                    teamA: partidosCorregidos[i].teamA,
                    teamB: partidosCorregidos[i].teamB
                }
            });
        }
        res.json({ message: "¡Base de datos corregida! El orden ya calza con tu Excel." });
    } catch(error) {
        console.error(error);
        res.status(500).json({ error: "Hubo un error al actualizar" });
    }
});

// Arrancar servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));