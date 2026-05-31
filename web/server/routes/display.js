import express from 'express';
import { adbClient } from '../adb.js';

const router = express.Router();

router.post('/resolution', async (req, res) => {
    const { width, height, dpi } = req.body;
    if (!width || !height) {
        return res.status(400).json({ error: 'width and height are required' });
    }
    try {
        await adbClient.setResolution(width, height);
        if (dpi) {
            await adbClient.setDensity(dpi);
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/resolution', async (req, res) => {
    try {
        const output = await adbClient.getCurrentResolution();
        res.json({ output });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/reboot', async (req, res) => {
    try {
        await adbClient.reboot();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
