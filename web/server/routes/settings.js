import express from 'express';
import { adbClient } from '../adb.js';

const router = express.Router();

router.get('/:key', async (req, res) => {
    try {
        const value = await adbClient.getSetting(req.params.key);
        res.json({ key: req.params.key, value });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/', async (req, res) => {
    const { key, value } = req.body;
    if (!key || value === undefined) {
        return res.status(400).json({ error: 'key and value are required' });
    }
    try {
        await adbClient.putSetting(key, value);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/jni/:key', async (req, res) => {
    try {
        const value = await adbClient.jniGet(req.params.key);
        res.json({ key: req.params.key, value });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/jni', async (req, res) => {
    const { key, value, upd } = req.body;
    if (!key || value === undefined) {
        return res.status(400).json({ error: 'key and value are required' });
    }
    try {
        await adbClient.jniSet(key, value, upd || 3);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/refresh-pq', async (req, res) => {
    try {
        await adbClient.refreshPq();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
