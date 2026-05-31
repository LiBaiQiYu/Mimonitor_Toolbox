import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execPromise = promisify(exec);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const adbPath = path.join(process.cwd(), '../../adb.exe');

let currentIp = null;

function adb(args) {
    return new Promise((resolve, reject) => {
        const cmd = `"${adbPath}" ${args}`;
        exec(cmd, { timeout: 30000 }, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });
}

export const adbClient = {
    async connect(ip) {
        currentIp = ip;
        try {
            const out = await adb(`connect ${ip}:5555`);
            const success = out.toLowerCase().includes('connected');
            if (success) {
                await this.setupJar();
            }
            return { success, output: out };
        } catch (e) {
            return { success: false, output: e.message };
        }
    },

    async disconnect() {
        if (!currentIp) return { success: true, output: 'already disconnected' };
        try {
            const out = await adb(`disconnect ${currentIp}:5555`);
            currentIp = null;
            return { success: true, output: out };
        } catch (e) {
            return { success: false, output: e.message };
        }
    },

    async isConnected() {
        if (!currentIp) return false;
        try {
            const out = await adb(`-s ${currentIp}:5555 shell echo connected`);
            return out.trim() === 'connected';
        } catch {
            return false;
        }
    },

    async shell(cmd) {
        if (!currentIp) throw new Error('Not connected');
        const out = await adb(`-s ${currentIp}:5555 shell "${cmd}"`);
        return out;
    },

    async getSetting(key) {
        const out = await this.shell(`settings get global ${key}`);
        return out.trim();
    },

    async putSetting(key, value) {
        await this.shell(`settings put global ${key} ${value}`);
        return true;
    },

    async setupJar() {
        const jar = '/data/data/mitv.service/cache/MtkDirectTool.jar';
        const sdExists = await this.shell('[ -f /sdcard/MtkDirectTool.jar ] && echo YES');
        if (!sdExists.includes('YES')) {
            const localJar = path.join(process.cwd(), '../../MtkDirectTool.jar');
            await adb(`-s ${currentIp}:5555 push "${localJar}" /sdcard/MtkDirectTool.jar`);
        }
        await this.shell(`service call TvService 3 s16 "sh -c \\"[ -f ${jar} ] || cp /sdcard/MtkDirectTool.jar ${jar}\\""`);
    },

    async jniSet(key, value, upd = 3) {
        const jar = '/data/data/mitv.service/cache/MtkDirectTool.jar';
        const shCmd = `eval\\${IFS}CLASSPATH=${jar}\\${IFS}/system/bin/app_process\\${IFS}/data/data/mitv.service/cache\\${IFS}MtkDirectTool\\${IFS}set\\${IFS}${key}\\${IFS}${value}\\${IFS}${upd}`;
        await this.shell(`service call TvService 3 s16 "sh -c \\"${shCmd}\\""`);
        return true;
    },

    async jniGet(key) {
        const jar = '/data/data/mitv.service/cache/MtkDirectTool.jar';
        await this.shell('logcat -c');
        const shCmd = `eval\\${IFS}CLASSPATH=${jar}\\${IFS}/system/bin/app_process\\${IFS}/data/data/mitv.service/cache\\${IFS}MtkDirectTool\\${IFS}get\\${IFS}${key}`;
        await this.shell(`service call TvService 3 s16 "sh -c \\"${shCmd}\\""`);
        await new Promise(r => setTimeout(r, 800));
        const log = await this.shell(`logcat -d | grep 'GET ${key}' | tail -1`);
        const i = log.indexOf('= ');
        const value = i >= 0 ? log.substring(i + 2).trim() : 'N/A';
        return value;
    },

    async refreshPq() {
        await this.shell('am broadcast -a com.xiaomi.mitv.action.PIC_MODE_CHANGED --ei picmode 7');
        return true;
    },

    async setResolution(w, h) {
        await this.shell(`wm size ${w}x${h}`);
        return true;
    },

    async setDensity(dpi) {
        await this.shell(`wm density ${dpi}`);
        return true;
    },

    async reboot() {
        await this.shell('reboot');
        return true;
    },

    async getDeviceModel() {
        const out = await this.shell('getprop ro.product.model');
        return out.trim();
    },

    async getCurrentResolution() {
        const out = await this.shell('wm size');
        return out;
    },

    getIp() {
        return currentIp;
    }
};

export default adbClient;
