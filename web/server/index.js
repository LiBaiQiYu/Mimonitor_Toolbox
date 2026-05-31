import express from 'express';
import cors from 'cors';
import connectRoutes from './routes/connect.js';
import settingsRoutes from './routes/settings.js';
import displayRoutes from './routes/display.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/connect', connectRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/display', displayRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Monitor Toolbox Server running on http://localhost:${PORT}`);
});
