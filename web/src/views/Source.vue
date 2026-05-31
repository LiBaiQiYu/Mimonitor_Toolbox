<template>
    <div class="source">
        <div class="flex items-center justify-between mb-lg">
            <h1 class="page-title" style="margin-bottom: 0;">信号源</h1>
            <button @click="refreshData" class="btn btn-secondary" :disabled="!connected">刷新</button>
        </div>

        <div class="card-group">
            <div class="card">
                <div class="section-label">当前信号源</div>
                <div style="display: flex; justify-content: center; padding: 24px 0;">
                    <span class="badge">{{ getSourceName(currentSource) }}</span>
                </div>
            </div>

            <div class="card">
                <div class="section-label">切换信号源</div>
                <div class="btn-group" style="display: grid; grid-template-columns: repeat(3, 1fr);">
                    <button v-for="s in sources" :key="s.val" :class="{ active: currentSource === s.val }" class="btn" @click="setSource(s.val)">
                        {{ s.name }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAdb } from '../composables/useAdb.js';
import api from '../api/index.js';

const { connected, log } = useAdb();

const sources = [
    { val: 23, name: 'HDMI 1' },
    { val: 24, name: 'HDMI 2' },
    { val: 29, name: 'DP' }
];

const currentSource = ref(23);

function getSourceName(val) {
    return sources.find(s => s.val === val)?.name || '未知';
}

async function refreshData() {
    if (!connected.value) return;
    try {
        const src = await api.getSetting('mitv.tvplayer.hdmi.last.source');
        currentSource.value = parseInt(src) || 23;
    } catch {}
}

async function setSource(val) {
    currentSource.value = val;
    await api.putSetting('tv_input_source_id', String(val));
    await api.putSetting('mitv.tvplayer.hdmi.last.source', String(val));
    // 使用 intent 方式切换信号源
    await api.shellExec('am force-stop com.xiaomi.mitv.tvplayer');
    await api.shellExec(`am start -a com.xiaomi.mitv.tvplayer.EXTSRC_PLAY -n com.xiaomi.mitv.tvplayer/.ExternalSourceActivity --ei input ${val} -f 0x10000000`);
    log(`信号源: ${getSourceName(val)}`);
}

onMounted(() => {
    refreshData();
});
</script>
