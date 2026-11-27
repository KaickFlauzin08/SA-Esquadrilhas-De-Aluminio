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

// Telas exclusivas da experiência mobile
import AgendaView from '../Views/Mobile/AgendaView.vue'
import DetalhesOSView from '../Views/Mobile/DetalhesOSView.vue'
import ExecucaoOSView from '../Views/Mobile/ExecucaoOSView.vue'
import OcorrenciaOSView from '../Views/Mobile/OcorrenciaOSView.vue'
import FinalizacaoOSView from '../Views/Mobile/FinalizacaoOSView.vue'
import PendenciaOSView from '../Views/Mobile/PendenciaOSView.vue'

const LIMITE_MOBILE = 768

function destinoInicial(role: string | null): string {
  if (typeof window !== 'undefined' && window.innerWidth <= LIMITE_MOBILE) {
    return '/agenda'
  }

  return role === 'GESTOR' ? '/home' : '/projetos'
}

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

    // Fluxo mobile do técnico de campo
    {
      path: '/agenda',
      name: 'Agenda',
      component: AgendaView,
      meta: { roles: ['GESTOR', 'TECNICO_CAMPO'] }
    },
    {
      path: '/agenda/os/:id',
      name: 'DetalhesOS',
      component: DetalhesOSView,
      meta: { roles: ['GESTOR', 'TECNICO_CAMPO'] }
    },
    {
      path: '/agenda/os/:id/execucao',
      name: 'ExecucaoOS',
      component: ExecucaoOSView,
      meta: { roles: ['GESTOR', 'TECNICO_CAMPO'] }
    },
    {
      path: '/agenda/os/:id/ocorrencia',
      name: 'OcorrenciaOS',
      component: OcorrenciaOSView,
      meta: { roles: ['GESTOR', 'TECNICO_CAMPO'] }
    },
    {
      path: '/agenda/os/:id/finalizacao',
      name: 'FinalizacaoOS',
      component: FinalizacaoOSView,
      meta: { roles: ['GESTOR', 'TECNICO_CAMPO'] }
    },
    {
      path: '/agenda/os/:id/pendencia',
      name: 'PendenciaOS',
      component: PendenciaOSView,
      meta: { roles: ['GESTOR', 'TECNICO_CAMPO'] }
    },

    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

router.beforeEach((to) => {
  const logado = isAutenticado()
  const role = getRole()

  // Se tentar abrir o login já autenticado, envia para a área adequada.
  if (to.meta.publica) {
    return logado ? destinoInicial(role) : true
  }

  // Rotas privadas exigem sessão.
  if (!logado) {
    return to.path !== '/' ? '/' : true
  }

  // Confere a permissão exigida pela rota.
  if (to.meta.roles && (!role || !to.meta.roles.includes(role))) {
    return destinoInicial(role)
  }
  console.log('[guard]', to.path, { logado, role, rotaExiste: to.matched.length > 0 })

  return true
})

export default router
