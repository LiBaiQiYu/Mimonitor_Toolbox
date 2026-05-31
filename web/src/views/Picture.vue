<template>
    <div class="picture">
        <div class="flex items-center justify-between mb-lg">
            <h1 class="page-title" style="margin-bottom: 0;">画面设置</h1>
            <button @click="refreshData" class="btn btn-secondary" :disabled="!connected">刷新</button>
        </div>

        <div class="card-group">
            <div class="card">
                <div class="section-label">画面模式</div>
                <div class="btn-group">
                    <button v-for="m in modes" :key="m.val" :class="{ active: currentMode === m.val }" class="btn" @click="setMode(m.val)">
                        {{ m.name }}
                    </button>
                </div>
                <button class="btn btn-secondary mt-md" style="width: 100%;" @click="resetMode">恢复默认</button>
            </div>

            <div class="card" v-for="s in sliders" :key="s.key">
                <div class="slider-row">
                    <span class="label">{{ s.label }}</span>
                    <input type="range" class="slider" :min="s.min" :max="s.max" :step="s.step" v-model.number="s.value" @change="updateSetting(s)" :disabled="!connected" />
                    <span class="value">{{ s.value }}</span>
                </div>
            </div>

            <div class="card">
                <div class="section-label">色温</div>
                <div class="btn-group">
                    <button v-for="ct in colorTemps" :key="ct.val" :class="{ active: currentColorTemp === ct.val }" class="btn" @click="setColorTemp(ct)">
                        {{ ct.name }}
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="section-label">精密控光</div>
                <div class="btn-group">
                    <button v-for="ld in localDimming" :key="ld.val" :class="{ active: currentLocalDimming === ld.val }" class="btn" @click="setLocalDimming(ld.val)">
                        {{ ld.name }}
                    </button>
                </div>
            </div>

        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useAdb } from '../composables/useAdb.js';
import api from '../api/index.js';

const { connected, log } = useAdb();

const modes = [
    { val: 14, name: '标准' },
    { val: 10, name: '游戏' },
    { val: 9, name: '电影' },
    { val: 18, name: 'HDR 标准' },
    { val: 16, name: 'HDR 游戏' },
    { val: 17, name: 'HDR 电影' }
];

const colorTemps = [
    { name: '暖色', val: 3, jniVal: 4 },
    { name: '标准', val: 2, jniVal: 3 },
    { name: '冷色', val: 1, jniVal: 2 },
    { name: '原色', val: 6, jniVal: 6 },
    { name: '自定义', val: 0, jniVal: 1 }
];

const localDimming = [
    { val: 0, name: '关' },
    { val: 1, name: '低' },
    { val: 2, name: '中' },
    { val: 3, name: '高' }
];

const currentMode = ref(18);
const currentColorTemp = ref(2);
const currentLocalDimming = ref(0);

const sliders = reactive([
    { key: 'picture_backlight', label: '背光', value: 50, min: 1, max: 100, step: 1 },
    { key: 'picture_brightness', label: '黑色级别', value: 50, min: 1, max: 100, step: 1 },
    { key: 'picture_contrast', label: '对比度', value: 50, min: 0, max: 100, step: 1 },
    { key: 'picture_saturation', label: '饱和度', value: 50, min: 0, max: 100, step: 1 },
    { key: 'picture_hue', label: '色调', value: 50, min: 1, max: 100, step: 1 },
    { key: 'picture_sharpness', label: '锐度', value: 0, min: 0, max: 100, step: 1 }
]);

async function refreshData() {
    if (!connected.value) return;

    try {
        const mode = await api.getSetting('picture_mode');
        currentMode.value = parseInt(mode) || 18;
    } catch {}

    for (const s of sliders) {
        try {
            const v = await api.getSetting(s.key);
            const parsed = parseInt(v);
            s.value = isNaN(parsed) ? 50 : parsed;
        } catch {}
    }

    try {
        const ct = await api.getSetting('picture_color_temperature');
        currentColorTemp.value = parseInt(ct) || 2;
    } catch {}

    try {
        const ld = await api.jniGet('g_video__vid_local_dimming');
        currentLocalDimming.value = parseInt(ld) || 0;
    } catch {}

}

async function setMode(val) {
    currentMode.value = val;
    await api.putSetting('picture_mode', String(val));
    log(`画面模式: ${modes.find(m => m.val === val)?.name}`);
    await api.refreshPq();
    await refreshData();
}

async function updateSetting(slider) {
    await api.putSetting(slider.key, String(slider.value));
    log(`${slider.label}: ${slider.value}`);
    await api.refreshPq();
}

async function setColorTemp(ct) {
    currentColorTemp.value = ct.val;
    await api.putSetting('picture_color_temperature', String(ct.val));
    await api.jniSet('g_video__clr_temp', String(ct.jniVal));
    log(`色温: ${ct.name}`);
    await api.refreshPq();
}

async function setLocalDimming(val) {
    currentLocalDimming.value = val;
    await api.jniSet('g_video__vid_local_dimming', String(val));
    await api.putSetting('tv_picture_video_local_dimming', String(val));
    log(`精密控光: ${localDimming.find(m => m.val === val)?.name}`);
    await api.refreshPq();
}

async function resetMode() {
    await api.jniSet('g_fusion_picture__pic_reset_def_bypicmode', '0');
    log('已恢复当前模式默认设置');
    await api.refreshPq();
}

onMounted(() => {
    refreshData();
});
</script>
