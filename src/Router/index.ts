import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../Views/LoginView.vue'
import HomeView from '../Views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Login',
      component: LoginView
    },
    {
      path: '/home',
      name: 'Home',
      component: HomeView
    }
  ]
})

export default router