import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { verifyPrivyToken, AuthRequest } from './middleware/privyAuth';
import { aiMasterService } from './services/aiMasterService';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

import characterRoutes from './routes/character';
import pvpRoutes from './routes/pvp';
import encounterRoutes from './routes/encounter';
import missionRoutes from './routes/mission';
import buildingRoutes from './routes/building';

app.get('/health', (req, res) => {
    res.json({ status: 'Olympo Server Operational' });
});

app.use('/api/character', characterRoutes);
app.use('/api/pvp', pvpRoutes);
app.use('/api/encounter', encounterRoutes);
app.use('/api/mission', missionRoutes);
app.use('/api/building', buildingRoutes);

// Protected route example
app.get('/api/me', verifyPrivyToken, (req: AuthRequest, res) => {
    res.json({ user: req.user });
});

// Chat route for Zeus-Proto
app.post('/api/gm-chat', verifyPrivyToken, async (req: AuthRequest, res) => {
    const { message } = req.body;
    const reply = await aiMasterService.sendMessage(message);
    res.json({ reply });
});

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
    console.log(`⚡ Zeus Engine active on port ${PORT}`);
});

process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server.close(() => process.exit(0));
});
