import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';

import Home from './views/Home.vue';
import Picture from './views/Picture.vue';
import Source from './views/Source.vue';
import Tools from './views/Tools.vue';
import About from './views/About.vue';

const routes = [
    { path: '/', component: Home },
    { path: '/picture', component: Picture },
    { path: '/source', component: Source },
    { path: '/tools', component: Tools },
    { path: '/about', component: About }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

createApp(App).use(router).mount('#app');
