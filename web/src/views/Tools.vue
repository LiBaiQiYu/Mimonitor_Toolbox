<template>
    <div class="tools">
        <h1 class="page-title">工具</h1>

        <div class="card-group">
            <div class="card" style="flex-direction: row; align-items: center; gap: var(--space-lg);">
                <div style="flex: 1; min-width: 0;">
                    <div class="section-label">4K UI 模式</div>
                    <p class="text-secondary text-sm" style="margin-bottom: 0;">
                        将显示器 UI 分辨率提升至 3840×2160，DPI 设为 640。开启或关闭后显示器将自动重启。
                    </p>
                </div>
                <div class="toggle-wrapper">
                    <label class="toggle">
                        <input type="checkbox" v-model="is4k" @change="toggle4k" :disabled="!connected || toggling" />
                        <span class="track"><span class="thumb"></span></span>
                    </label>
                </div>
            </div>

            <div class="card">
                <div class="section-label">快捷操作</div>
                <button @click="showRebootDialog" class="btn btn-danger" :disabled="!connected" style="width: 100%;">
                    重启显示器
                </button>
            </div>
        </div>

        <!-- 4K Toggle Dialog -->
        <div v-if="show4kDialog" class="dialog-overlay" @click.self="cancel4k">
            <div class="dialog">
                <div class="dialog-title">{{ pending4kState ? '开启' : '关闭' }} 4K UI</div>
                <div class="dialog-message">
                    {{ pending4kState ? '开启' : '关闭' }} 4K UI 需要重启显示器才能生效。是否继续？
                </div>
                <div class="dialog-actions">
                    <button class="btn btn-secondary" @click="cancel4k">取消</button>
                    <button class="btn btn-primary" @click="confirm4k">确认</button>
                </div>
            </div>
        </div>

        <!-- Reboot Dialog -->
        <div v-if="showRebootConfirm" class="dialog-overlay" @click.self="cancelReboot">
            <div class="dialog">
                <div class="dialog-title">重启显示器</div>
                <div class="dialog-message">确定要重启显示器吗？</div>
                <div class="dialog-actions">
                    <button class="btn btn-secondary" @click="cancelReboot">取消</button>
                    <button class="btn btn-danger" @click="confirmReboot">重启</button>
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

const is4k = ref(false);
const toggling = ref(false);
const show4kDialog = ref(false);
const pending4kState = ref(false);
const showRebootConfirm = ref(false);

async function check4kState() {
    if (!connected.value) return;
    try {
        const res = await api.getResolution();
        const output = typeof res === 'string' ? res : res.data?.output || '';
        is4k.value = output.includes('3840') || output.includes('3840x2160');
    } catch {}
}

function toggle4k() {
    if (!connected.value || toggling.value) return;
    pending4kState.value = is4k.value;
    show4kDialog.value = true;
}

function cancel4k() {
    show4kDialog.value = false;
    is4k.value = !is4k.value;
}

async function confirm4k() {
    show4kDialog.value = false;
    toggling.value = true;

    if (pending4kState.value) {
        await api.setResolution(3840, 2160, 640);
        log('已设置 4K UI (3840×2160 / DPI 640)');
    } else {
        await api.setResolution(1920, 1080, 320);
        log('已恢复 1080p UI (1920×1080 / DPI 320)');
    }
    log('正在重启显示器...');
    await api.reboot();
    toggling.value = false;
}

function showRebootDialog() {
    if (!connected.value) return;
    showRebootConfirm.value = true;
}

function cancelReboot() {
    showRebootConfirm.value = false;
}

async function confirmReboot() {
    showRebootConfirm.value = false;
    log('正在重启显示器...');
    await api.reboot();
}

onMounted(() => {
    check4kState();
});
</script>

<style scoped>
.dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.15s ease;
}

.dialog {
    background: rgba(25, 25, 40, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 28px;
    min-width: 320px;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
    animation: slideUp 0.2s ease;
}

.dialog-title {
    font-size: 18px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 8px;
}

.dialog-message {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 24px;
    line-height: 1.5;
}

.dialog-actions {
    display: flex;
    gap: 12px;
}

.dialog-actions .btn {
    flex: 1;
    padding: 12px 16px;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
}

.dialog-actions .btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
}

.dialog-actions .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.15);
}

.dialog-actions .btn-primary {
    background: rgba(0, 212, 255, 0.2);
    color: #00d4ff;
}

.dialog-actions .btn-primary:hover {
    background: rgba(0, 212, 255, 0.3);
}

.dialog-actions .btn-danger {
    background: rgba(232, 17, 35, 0.2);
    color: #ff6b6b;
}

.dialog-actions .btn-danger:hover {
    background: rgba(232, 17, 35, 0.3);
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideUp {
    from { transform: translateY(10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}
</style>
