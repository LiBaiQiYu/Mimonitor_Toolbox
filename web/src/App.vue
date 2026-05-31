<template>
    <div class="app">
        <div class="titlebar">
            <div class="titlebar-drag" data-tauri-drag-region>
                <span class="titlebar-title">G Pro 27U 2025 Toolbox</span>
            </div>
            <div class="titlebar-controls">
                <button class="titlebar-btn minimize" @click="minimizeWindow">
                    <svg width="12" height="12" viewBox="0 0 12 12"><rect y="5" width="12" height="2" fill="currentColor"/></svg>
                </button>
                <button class="titlebar-btn maximize" @click="maximizeWindow">
                    <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
                </button>
                <button class="titlebar-btn close" @click="showCloseDialog">
                    <svg width="12" height="12" viewBox="0 0 12 12"><path d="M1 1L11 11M1 11L11 1" stroke="currentColor" stroke-width="1.5"/></svg>
                </button>
            </div>
        </div>
        <main class="content">
            <router-view />
        </main>
        <nav class="tab-bar">
            <router-link to="/">
                <span class="icon">🔗</span>
                <span>连接</span>
            </router-link>
            <router-link to="/picture">
                <span class="icon">🎨</span>
                <span>画面</span>
            </router-link>
            <router-link to="/source">
                <span class="icon">📺</span>
                <span>信号源</span>
            </router-link>
            <router-link to="/tools">
                <span class="icon">⚙️</span>
                <span>工具</span>
            </router-link>
            <router-link to="/about">
                <span class="icon">ℹ️</span>
                <span>关于</span>
            </router-link>
        </nav>

        <!-- Close Dialog -->
        <div v-if="showDialog" class="dialog-overlay" @click.self="closeDialog">
            <div class="dialog">
                <div class="dialog-title">关闭窗口</div>
                <div class="dialog-message">请选择如何关闭应用程序</div>
                <div class="dialog-actions">
                    <button class="btn btn-secondary" @click="hideToTray">
                        <span class="btn-icon">📌</span>
                        最小化到托盘
                    </button>
                    <button class="btn btn-danger" @click="quitApp">
                        <span class="btn-icon">✖</span>
                        退出程序
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { getCurrentWindow } from '@tauri-apps/api/window';

const appWindow = getCurrentWindow();
const showDialog = ref(false);

async function minimizeWindow() {
    await appWindow.minimize();
}

async function maximizeWindow() {
    await appWindow.toggleMaximize();
}

function showCloseDialog() {
    showDialog.value = true;
}

function closeDialog() {
    showDialog.value = false;
}

async function hideToTray() {
    showDialog.value = false;
    try {
        await appWindow.hide();
        console.log('Window hidden');
    } catch (e) {
        console.error('Failed to hide window:', e);
    }
}

async function quitApp() {
    showDialog.value = false;
    await appWindow.close();
}
</script>

<style>
@import './styles/glass.css';

.titlebar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 36px;
    background: rgba(15, 15, 25, 0.95);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    user-select: none;
    flex-shrink: 0;
}

.titlebar-drag {
    flex: 1;
    height: 100%;
    display: flex;
    align-items: center;
    padding-left: 12px;
}

.titlebar-title {
    font-size: 13px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
    pointer-events: none;
}

.titlebar-controls {
    display: flex;
    height: 100%;
}

.titlebar-btn {
    width: 46px;
    height: 100%;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.1s ease;
}

.titlebar-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
}

.titlebar-btn.close:hover {
    background: #e81123;
    color: white;
}

/* Dialog Styles */
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
}

.dialog-actions {
    display: flex;
    gap: 12px;
}

.dialog-actions .btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
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

.dialog-actions .btn-danger {
    background: rgba(232, 17, 35, 0.2);
    color: #ff6b6b;
}

.dialog-actions .btn-danger:hover {
    background: rgba(232, 17, 35, 0.3);
}

.btn-icon {
    font-size: 16px;
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
