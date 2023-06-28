import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

import AppLayout from '../layouts/AppLayout.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/:catchAll(.*)',
    redirect: { path: '/dashboard' },
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
        meta: {
          title: "Dashboard",
          subtitle: "Run templates"
        }
      },{
        name: 'templates',
        path: 'templates',
        component: () => import('../pages/TemplatesDatabase.vue'),
        meta: {
          title: "Templates",
          subtitle: "Find templates"
        }
      },{
        name: 'uikit',
        path: 'uikit',
        component: () => import('../pages/UI.vue'),
        meta: {
          title: "UI Kit",
          subtitle: "Build the app"
        }
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
