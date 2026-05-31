<template>
    <div class="home">
        <h1 class="page-title">显示器连接</h1>

        <div class="card-group">
            <div class="card">
                <div class="section-label">网络连接</div>
                <div class="flex gap-xs" style="flex-wrap: nowrap;">
                    <input v-model="ip" class="input" placeholder="输入显示器 IP" :disabled="connected" style="flex: 1; min-width: 0;" />
                    <button @click="handleConnect" class="btn btn-primary" :disabled="connected || connecting" style="white-space: nowrap;">
                        {{ connecting ? '连接中...' : '连接' }}
                    </button>
                    <button v-if="connected" @click="handleDisconnect" class="btn btn-danger" style="white-space: nowrap;">
                        断开
                    </button>
                </div>
                <div class="status" style="margin-top: 16px;">
                    <span :class="['status-dot', connected ? 'online' : 'offline']"></span>
                    {{ connected ? `已连接 ${deviceModel || deviceIp}` : '未连接' }}
                </div>
            </div>

            <div class="card">
                <div class="section-label">搜索设备</div>
                <button @click="handleScan" class="btn btn-secondary" :disabled="scanning" style="width: 100%;">
                    {{ scanning ? '搜索中...' : '搜索局域网设备' }}
                </button>
                <div v-if="scannedDevices.length > 0" style="margin-top: 12px;">
                    <div v-for="d in scannedDevices" :key="d" class="device-item" @click="selectDevice(d)">
                        <span class="device-ip">{{ d }}</span>
                        <span class="device-hint">点击连接</span>
                    </div>
                </div>
                <div v-else-if="scanDone && !scanning" class="text-secondary" style="text-align: center; margin-top: 12px;">
                    未发现设备
                </div>
            </div>

            <div class="card">
                <div class="section-label">操作日志</div>
                <div class="log-viewer">
                    <div v-for="(l, i) in logs" :key="i" class="log-line">
                        <span class="time">{{ l.time }}</span>
                        <span class="msg">{{ l.msg }}</span>
                    </div>
                    <div v-if="logs.length === 0" class="text-secondary" style="text-align: center; padding-top: 40px;">
                        暂无日志
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useAdb } from '../composables/useAdb.js';
import api from '../api/index.js';

const { connected, deviceIp, deviceModel, logs, checkStatus, connect, disconnect } = useAdb();

const ip = ref('');
const connecting = ref(false);
const scanning = ref(false);
const scanDone = ref(false);
const scannedDevices = ref([]);

onMounted(async () => {
    await checkStatus();
    if (deviceIp.value) {
        ip.value = deviceIp.value;
    }
});

watch(deviceIp, (newIp) => {
    if (newIp) {
        ip.value = newIp;
    }
});

async function handleConnect() {
    if (!ip.value) return;
    connecting.value = true;
    await connect(ip.value);
    connecting.value = false;
}

async function handleDisconnect() {
    await disconnect();
}

async function handleScan() {
    scanning.value = true;
    scanDone.value = false;
    scannedDevices.value = [];
    try {
        const devices = await api.scanDevices();
        scannedDevices.value = devices;
    } catch (e) {
        console.error('Scan failed:', e);
    }
    scanning.value = false;
    scanDone.value = true;
}

function selectDevice(d) {
    ip.value = d;
    handleConnect();
}
</script>

<style scoped>
.device-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    cursor: pointer;
    margin-bottom: 8px;
    transition: background 0.2s;
}
.device-item:hover {
    background: rgba(255, 255, 255, 0.1);
}
.device-ip {
    font-family: monospace;
    font-size: 14px;
}
.device-hint {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
}
</style>
