import express from 'express';
import { adbClient } from '../adb.js';

const router = express.Router();

router.post('/connect', async (req, res) => {
    const { ip } = req.body;
    if (!ip) {
        return res.status(400).json({ error: 'IP is required' });
    }
    const result = await adbClient.connect(ip);
    res.json(result);
});

router.post('/disconnect', async (req, res) => {
    const result = await adbClient.disconnect();
    res.json(result);
});

router.get('/status', async (req, res) => {
    const connected = await adbClient.isConnected();
    const ip = adbClient.getIp();
    let model = null;
    if (connected && ip) {
        try {
            model = await adbClient.getDeviceModel();
        } catch {}
    }
    res.json({ connected, ip, model });
});

export default router;
