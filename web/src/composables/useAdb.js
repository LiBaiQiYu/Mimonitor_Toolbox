import { ref } from 'vue';
import api from '../api/index.js';

const connected = ref(false);
const deviceIp = ref(null);
const deviceModel = ref(null);
const logs = ref([]);

function log(msg) {
    const time = new Date().toLocaleTimeString();
    logs.value.push({ time, msg });
    if (logs.value.length > 100) logs.value.shift();
}

export function useAdb() {
    async function checkStatus() {
        try {
            const result = await api.getStatus();
            connected.value = result.connected;
            deviceIp.value = result.ip;
            deviceModel.value = result.model;
            return result.connected;
        } catch (e) {
            connected.value = false;
            return false;
        }
    }

    async function connect(ip) {
        log(`正在连接 ${ip}:5555...`);
        try {
            const result = await api.connect(ip);
            if (result.success) {
                connected.value = true;
                deviceIp.value = ip;
                log(`已连接到 ${ip}`);
                const model = await getModel();
                deviceModel.value = model;
            } else {
                log(`连接失败: ${result.output}`);
            }
            return result.success;
        } catch (e) {
            log(`连接错误: ${e?.message || e?.toString?.() || JSON.stringify(e) || '未知错误'}`);
            return false;
        }
    }

    async function disconnect() {
        try {
            await api.disconnect();
            connected.value = false;
            deviceIp.value = null;
            deviceModel.value = null;
            log('已断开连接');
        } catch (e) {
            log(`断开错误: ${e}`);
        }
    }

    async function getModel() {
        try {
            const result = await api.getStatus();
            return result.model;
        } catch {
            return null;
        }
    }

    async function getSetting(key) {
        try {
            return await api.getSetting(key);
        } catch (e) {
            log(`读取设置 ${key} 失败: ${e}`);
            return null;
        }
    }

    async function putSetting(key, value) {
        try {
            console.log('putSetting called:', key, value);
            const result = await api.putSetting(key, value);
            console.log('putSetting result:', result);
            log(`设置 ${key} = ${value}`);
            return true;
        } catch (e) {
            console.error('putSetting error:', e);
            log(`设置 ${key} 失败: ${e}`);
            return false;
        }
    }

    async function jniGet(key) {
        try {
            const value = await api.jniGet(key);
            log(`JNI ${key} = ${value}`);
            return value;
        } catch (e) {
            log(`读取 JNI ${key} 失败: ${e}`);
            return null;
        }
    }

    async function jniSet(key, value, upd) {
        try {
            await api.jniSet(key, value, upd);
            log(`JNI ${key} = ${value}`);
            return true;
        } catch (e) {
            log(`设置 JNI ${key} 失败: ${e}`);
            return false;
        }
    }

    async function refreshPq() {
        try {
            await api.refreshPq();
            log('PQ 已刷新');
            return true;
        } catch (e) {
            log(`刷新 PQ 失败: ${e}`);
            return false;
        }
    }

    async function setResolution4k() {
        log('设置 4K UI (3840x2160 / DPI 640)...');
        await api.setResolution(3840, 2160, 640);
        await api.reboot();
        log('显示器重启中...');
    }

    async function setResolution1080p() {
        log('恢复 1080p UI (1920x1080 / DPI 320)...');
        await api.setResolution(1920, 1080, 320);
        await api.reboot();
        log('显示器重启中...');
    }

    async function reboot() {
        log('正在重启显示器...');
        await api.reboot();
    }

    return {
        connected,
        deviceIp,
        deviceModel,
        logs,
        log,
        checkStatus,
        connect,
        disconnect,
        getSetting,
        putSetting,
        jniGet,
        jniSet,
        refreshPq,
        setResolution4k,
        setResolution1080p,
        reboot
    };
}
