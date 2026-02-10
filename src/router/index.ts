import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import LoginPage from '../views/LoginPage.vue';
import MapPage from '@/views/MapPage.vue';
import AddReportPage from '@/views/AddReportPage.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/map',
    name: 'Map',
    component: MapPage
  }, 
  {
    path: '/add-report',
    name: 'AddReport',
    component: AddReportPage
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
