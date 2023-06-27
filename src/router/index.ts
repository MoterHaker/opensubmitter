import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

import AppLayout from '../layouts/AppLayout.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/:catchAll(.*)',
    redirect: { name: 'dashboard' },
  },
  {
    name: 'default',
    path: '',
    component: AppLayout,
    children: [
      {
        name: 'dashboard',
        path: 'dashboard',
        component: () => import('../pages/TaskManager.vue'),
      },{
        name: 'templates',
        path: 'templates',
        component: () => import('../pages/TemplatesDatabase.vue'),
      },{
        name: 'uikit',
        path: 'uikit',
        component: () => import('../pages/UI.vue'),
      }
    ],
  },

]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  //  mode: process.env.VUE_APP_ROUTER_MODE_HISTORY === 'true' ? 'history' : 'hash',
  routes,
})

export default router
