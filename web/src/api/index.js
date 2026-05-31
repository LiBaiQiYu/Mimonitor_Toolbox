import { invoke } from '@tauri-apps/api/core';

export default {
    // Connection
    async connect(ip) {
        return await invoke('connect', { ip });
    },
    async disconnect() {
        return await invoke('disconnect');
    },
    async getStatus() {
        return await invoke('get_status');
    },

    // Settings
    async getSetting(key) {
        const result = await invoke('get_setting', { key });
        return result.value;
    },
    async putSetting(key, value) {
        console.log('api.putSetting called:', key, value);
        const result = await invoke('put_setting', { key, value });
        console.log('api.putSetting result:', result);
        return result;
    },

    // JNI
    async jniGet(key) {
        const result = await invoke('jni_get', { key });
        return result.value;
    },
    async jniSet(key, value, upd) {
        return await invoke('jni_set', { key, value, upd });
    },
    async refreshPq() {
        return await invoke('refresh_pq');
    },

    // Display
    async getResolution() {
        const output = await invoke('get_resolution');
        return { data: { output } };
    },
    async setResolution(width, height, dpi) {
        return await invoke('set_resolution', { width, height, dpi });
    },
    async reboot() {
        return await invoke('reboot');
    },

    // Shell
    async shellExec(cmd) {
        return await invoke('shell_exec', { cmd });
    },

    // Network
    async scanDevices() {
        return await invoke('scan_devices');
    }
};
