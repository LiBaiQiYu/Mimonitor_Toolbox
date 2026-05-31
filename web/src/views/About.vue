<template>
    <div class="about">
        <h1 class="page-title">关于</h1>

        <div class="card-group">
            <div class="card">
                <div class="section-label">本项目</div>
                <div class="about-item">
                    <span class="about-label">G Pro 27U 2025 Toolbox</span>
                    <span class="about-value">v1.0.0</span>
                </div>
                <div class="about-item">
                    <span class="about-label">作者</span>
                    <span class="about-value">cw</span>
                </div>
            </div>

            <div class="card">
                <div class="section-label">基于</div>
                <div class="about-item">
                    <span class="about-label">原作者</span>
                    <span class="about-value">YiHooong</span>
                </div>
                <div class="about-item">
                    <span class="about-label">项目</span>
                    <a href="https://github.com/YiHooong/Mimonitor_Toolbox" target="_blank" class="about-link">
                        https://github.com/YiHooong/Mimonitor_Toolbox
                    </a>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.about-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.about-item:last-child {
    border-bottom: none;
}

.about-label {
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
}

.about-value {
    color: #fff;
    font-size: 14px;
}

.about-link {
    color: var(--neon-blue);
    font-size: 14px;
    text-decoration: none;
}

.about-link:hover {
    text-decoration: underline;
}
</style>
