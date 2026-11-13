import { createRouter, createWebHistory } from 'vue-router'
import { isAutenticado, getRole } from '../utils/auth'

declare module 'vue-router' {
  interface RouteMeta {
    publica?: boolean
    roles?: string[]
  }
}

import LoginView from '../Views/LoginView.vue'
import HomeView from '../Views/HomeView.vue'
import ProjetosView from '../Views/ProjetosView.vue'
import ClientesView from '../Views/ClientesView.vue'
import RelatorioView from '../Views/RelatorioView.vue'
import LiberacaoView from '../Views/LiberacaoView.vue'
import OcorrenciaView from '../Views/OcorrenciaView.vue'
import EquipesView from '../Views/EquipesVIew.vue'
import TecnicosView from '../Views/TecnicosView.vue'
import NovoCadastroView from '../Views/NovoCadastro.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Login',
      component: LoginView,
      meta: { publica: true }
    },
    {
      path: '/home',
      name: 'Home',
      component: HomeView,
      meta: { roles: ['GESTOR'] }
    },
    {
      path: '/projetos',
      name: 'Projetos',
      component: ProjetosView,
      meta: { roles: ['GESTOR', 'TECNICO_CAMPO'] }
    },
    {
      path: '/projetos/novo',
      name: 'NovoCadastro',
      component: NovoCadastroView,
      meta: { roles: ['GESTOR'] }
    },
    {
      path: '/clientes',
      name: 'Clientes',
      component: ClientesView,
      meta: { roles: ['GESTOR'] }
    },
    {
      path: '/relatorio',
      name: 'Relatorio',
      component: RelatorioView,
      meta: { roles: ['GESTOR'] }
    },
    {
      path: '/liberacao',
      name: 'Liberacao',
      component: LiberacaoView,
      meta: { roles: ['GESTOR', 'TECNICO_CAMPO'] }
    },
    {
      path: '/ocorrencia',
      name: 'Ocorrencia',
      component: OcorrenciaView,
      meta: { roles: ['GESTOR', 'TECNICO_CAMPO'] }
    },
    {
      path: '/equipes',
      name: 'Equipes',
      component: EquipesView,
      meta: { roles: ['GESTOR'] }
    },
    {
      path: '/equipes/tecnicos',
      name: 'Tecnicos',
      component: TecnicosView,
      meta: { roles: ['GESTOR'] }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

router.beforeEach((to, from, next) => {
  const logado = isAutenticado()
  const role = getRole()

  if (to.meta.publica) {
    if (logado) {
      return next(role === 'GESTOR' ? '/home' : '/projetos')
    }
    return next()
  }

  if (!logado) {
    return next('/')
  }

  if (to.meta.roles && (!role || !to.meta.roles.includes(role))) {
    return next('/projetos')
  }

  return next()
})

export default router