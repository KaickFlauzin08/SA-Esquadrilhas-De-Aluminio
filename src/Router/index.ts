import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../Views/LoginView.vue'
import HomeView from '../Views/HomeView.vue'
import ProjetosView from '../Views/ProjetosView.vue'
import ClientesView from '../Views/ClientesView.vue'
import RelatorioView from '../Views/RelatorioView.vue'
import LiberacaoView from '../Views/LiberacaoView.vue'
import OcorrenciaView from '../Views/OcorrenciaView.vue'
import EquipesView from '../Views/EquipesVIew.vue'


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
    }, 
    {
      path: '/projetos',
      name: 'Projetos',
      component: ProjetosView
    },
    {
      path: '/clientes',
      name: 'Clientes',
      component: ClientesView
    },
    {
      path: '/relatorio',
      name: 'Relatorio',
      component: RelatorioView
    },
    {
      path: '/liberacao',
      name: 'Liberacao',
      component: LiberacaoView
    },
    {
      path: '/ocorrencia',
      name: 'Ocorrencia',
      component: OcorrenciaView
    },
    {
      path: '/equipes',
      name: 'Equipes',
      component: EquipesView
    }
  ]
})

export default router