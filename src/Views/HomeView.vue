<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '../Components/Sidebar.vue'
import { getToken, getUsuario } from '../utils/auth'

type TabCategory = 'Todos' | 'Medição' | 'Produção' | 'Liberação' | 'Instalação'
type StatusKey = 'medicao' | 'producao' | 'instalacao' | 'concluido' | 'liberacao'

interface ProjetoApi {
  id: number
  orcamentoId: number
  tecnicoId?: number | null
  dataMedicaoFinal?: string | null
  dataInicioContrato: string
  prazoFinalEntrega?: string | null
  statusProducao: string
}

interface OrcamentoApi {
  id: number
  usuarioId: number
  nomeCliente: string
  telefoneCliente?: string
  emailCliente?: string
  enderecoObra?: string
  dataCriacao: string
  prazoEstimado?: string | null
  valorTotal: number
  status: string
}

interface Order {
  id: string
  rawId: number
  initials: string
  client: string
  obra: string
  category: Exclude<TabCategory, 'Todos'>
  statusKey: StatusKey
  statusLabel: string
  cycleText: string
  progress: number
  diasRestantes: number
}

interface CriticalAlert {
  id: string
  days: string
  urgent: boolean
  project: string
  note: string
  dotColor: string
}

const router = useRouter()
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5037/api'

const usuarioLogado = getUsuario()

const nomeUsuario = computed(() => usuarioLogado?.nome || 'Usuário')

const cargoUsuario = computed(() => {
  const role = usuarioLogado?.roles?.toUpperCase()
  if (role === 'GESTOR') return 'Gestor'
  if (role === 'TECNICO_CAMPO') return 'Técnico de Campo'
  return role || 'Colaborador'
})

const iniciaisUsuario = computed(() => {
  return nomeUsuario.value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('')
})

function aoNavegar(menu: string) {
  console.log('Menu selecionado:', menu)
}

const searchQuery = ref<string>('')
const activeTab = ref<TabCategory>('Todos')
const currentPage = ref<number>(1)
const pageSize = 6
const showModal = ref<boolean>(false)
const salvandoPedido = ref<boolean>(false)
const carregando = ref<boolean>(false)

// Campos do modal (compatíveis com CriarOrcamentoDto)
const novoPedido = ref({
  nomeCliente: '',
  telefoneCliente: '',
  enderecoObra: '',
  prazoDias: 45,
})

const tabs: TabCategory[] = ['Todos', 'Medição', 'Produção', 'Liberação', 'Instalação']

const orders = ref<Order[]>([])
const totalOrcamentos = ref<number>(0)

// KPIs reais vindos da API
const totalPedidos = computed(() => orders.value.length)
const qtdMedicao = computed(() => orders.value.filter((o) => o.statusKey === 'medicao').length)
const qtdProducao = computed(() => orders.value.filter((o) => o.statusKey === 'producao').length)
const qtdProntoInstalacao = computed(
  () => orders.value.filter((o) => o.statusKey === 'liberacao' || o.statusKey === 'instalacao').length
)

// Prazos Críticos reais (projetos com >= 80% do ciclo consumido e não concluídos)
const criticalAlerts = computed<CriticalAlert[]>(() => {
  return orders.value
    .filter((o) => o.progress >= 80 && o.statusKey !== 'concluido')
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 3)
    .map((o) => ({
      id: o.id,
      days: o.diasRestantes < 0 ? `${Math.abs(o.diasRestantes)}d atrasado` : `${o.cycleText.replace('Dia ', '')} dias`,
      urgent: o.progress >= 90 || o.diasRestantes <= 3,
      project: o.client,
      note: o.statusLabel,
      dotColor:
        o.statusKey === 'instalacao'
          ? '#9333EA'
          : o.statusKey === 'producao'
            ? '#2563EB'
            : '#EAB308',
    }))
})

function gerarIniciais(nome: string): string {
  return (
    nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join('') || 'CL'
  )
}

function mapearStatusProducao(status: string): {
  category: Exclude<TabCategory, 'Todos'>
  statusKey: StatusKey
  statusLabel: string
} {
  const s = (status || '').toUpperCase()

  if (s.includes('PRODU')) {
    return { category: 'Produção', statusKey: 'producao', statusLabel: 'EM PRODUÇÃO' }
  }
  if (s.includes('INSTAL')) {
    return { category: 'Instalação', statusKey: 'instalacao', statusLabel: 'EM INSTALAÇÃO' }
  }
  if (s.includes('LIBER')) {
    return { category: 'Liberação', statusKey: 'liberacao', statusLabel: 'LIBERADO P/ INSTALAÇÃO' }
  }
  if (s.includes('CONCLU') || s.includes('FINAL')) {
    return { category: 'Liberação', statusKey: 'concluido', statusLabel: 'CONCLUÍDO' }
  }
  return { category: 'Medição', statusKey: 'medicao', statusLabel: 'AGUARDANDO MEDIÇÃO' }
}

function calcularCiclo(inicioIso: string, fimIso?: string | null, concluido?: boolean) {
  const inicio = new Date(inicioIso)
  const hoje = new Date()
  const fim = fimIso ? new Date(fimIso) : new Date(inicio.getTime() + 45 * 24 * 60 * 60 * 1000)

  const msPorDia = 1000 * 60 * 60 * 24
  const totalDias = Math.max(1, Math.round((fim.getTime() - inicio.getTime()) / msPorDia))
  const diasPassados = Math.max(1, Math.round((hoje.getTime() - inicio.getTime()) / msPorDia))
  const diasRestantes = Math.round((fim.getTime() - hoje.getTime()) / msPorDia)

  if (concluido) {
    return {
      cycleText: `Finalizado em ${diasPassados}d`,
      progress: 100,
      diasRestantes: 0,
    }
  }

  const progress = Math.min(100, Math.max(4, Math.round((diasPassados / totalDias) * 100)))
  return {
    cycleText: `Dia ${diasPassados}/${totalDias}`,
    progress,
    diasRestantes,
  }
}

async function carregarDashboard() {
  carregando.value = true
  try {
    const headers = {
      Authorization: `Bearer ${getToken()}`,
    }

    const [resProjetos, resOrcamentos] = await Promise.all([
      fetch(`${API_URL}/projeto`, { headers }),
      fetch(`${API_URL}/orcamento`, { headers }),
    ])

    const projetos: ProjetoApi[] = resProjetos.ok ? await resProjetos.json() : []
    const orcamentos: OrcamentoApi[] = resOrcamentos.ok ? await resOrcamentos.json() : []

    totalOrcamentos.value = orcamentos.length

    // Mapeia orçamentos por ID para pegar o NomeCliente e EnderecoObra de cada projeto
    const mapaOrcamentos = new Map<number, OrcamentoApi>()
    for (const orc of orcamentos) {
      mapaOrcamentos.set(orc.id, orc)
    }

    orders.value = projetos
      .map((proj) => {
        const orc = mapaOrcamentos.get(proj.orcamentoId)
        const nomeCliente = orc?.nomeCliente || `Orçamento #${proj.orcamentoId}`
        const statusInfo = mapearStatusProducao(proj.statusProducao)
        const ciclo = calcularCiclo(
          proj.dataInicioContrato,
          proj.prazoFinalEntrega || orc?.prazoEstimado,
          statusInfo.statusKey === 'concluido'
        )

        return {
          id: `#ORD-${proj.id}`,
          rawId: proj.id,
          initials: gerarIniciais(nomeCliente),
          client: nomeCliente,
          obra: orc?.enderecoObra || '',
          category: statusInfo.category,
          statusKey: statusInfo.statusKey,
          statusLabel: statusInfo.statusLabel,
          cycleText: ciclo.cycleText,
          progress: ciclo.progress,
          diasRestantes: ciclo.diasRestantes,
        }
      })
      .sort((a, b) => b.rawId - a.rawId)
  } catch (err) {
    console.error('Erro ao carregar dados do dashboard:', err)
  } finally {
    carregando.value = false
  }
}

const filteredOrders = computed<Order[]>(() => {
  return orders.value.filter((order) => {
    const matchesTab = activeTab.value === 'Todos' || order.category === activeTab.value
    const q = searchQuery.value.trim().toLowerCase()
    const matchesQuery =
      !q ||
      order.id.toLowerCase().includes(q) ||
      order.client.toLowerCase().includes(q) ||
      order.obra.toLowerCase().includes(q) ||
      order.statusLabel.toLowerCase().includes(q)
    return matchesTab && matchesQuery
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredOrders.value.length / pageSize)))

const paginatedOrders = computed<Order[]>(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredOrders.value.slice(start, start + pageSize)
})

// Cria o orçamento e aprova imediatamente para gerar o Projeto no banco via OrcamentoController
async function addOrder() {
  if (!novoPedido.value.nomeCliente.trim() || salvandoPedido.value) return

  salvandoPedido.value = true
  try {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    }

    const prazoEntrega = new Date()
    prazoEntrega.setDate(prazoEntrega.getDate() + (novoPedido.value.prazoDias || 45))

    // 1. Cadastra o orçamento (POST /api/orcamento/cadastrar)
    const resCriar = await fetch(`${API_URL}/orcamento/cadastrar`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        usuarioId: usuarioLogado?.id || 1,
        nomeCliente: novoPedido.value.nomeCliente.trim(),
        telefoneCliente: novoPedido.value.telefoneCliente.trim(),
        emailCliente: '',
        enderecoObra: novoPedido.value.enderecoObra.trim(),
        prazoEstimado: prazoEntrega.toISOString(),
        valorTotal: 0,
        status: 'RASCUNHO',
      }),
    })

    if (!resCriar.ok) return

    const criado = await resCriar.json()

    // 2. Aprova o orçamento (PUT /api/orcamento/{id}) -> cria o Projeto automaticamente no backend
    await fetch(`${API_URL}/orcamento/${criado.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        nomeCliente: novoPedido.value.nomeCliente.trim(),
        telefoneCliente: novoPedido.value.telefoneCliente.trim(),
        emailCliente: '',
        enderecoObra: novoPedido.value.enderecoObra.trim(),
        prazoEstimado: prazoEntrega.toISOString(),
        valorTotal: 0,
        status: 'APROVADO',
      }),
    })

    await carregarDashboard()

    novoPedido.value = {
      nomeCliente: '',
      telefoneCliente: '',
      enderecoObra: '',
      prazoDias: 45,
    }
    showModal.value = false
  } catch (err) {
    console.error('Erro ao criar pedido:', err)
  } finally {
    salvandoPedido.value = false
  }
}

onMounted(() => {
  carregarDashboard()
})
</script>

<template>
  <div class="layout-wrapper">
    <Sidebar @navigate="aoNavegar" />

    <main class="main-area">
      <!-- Top Navbar -->
      <header class="topbar">
        <div class="topbar-inner">
          <div class="search-box">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar pedidos, clientes ou obras..."
              @input="currentPage = 1"
            />
          </div>

          <div class="topbar-actions">
            <button type="button" class="icon-btn" aria-label="Atualizar dados" @click="carregarDashboard" title="Atualizar">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span v-if="criticalAlerts.length > 0" class="notif-dot"></span>
            </button>

            <button type="button" class="icon-btn" aria-label="Projetos" @click="router.push('/projetos')">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>

            <div class="divider"></div>

            <div class="user-profile">
              <div class="user-info">
                <p class="user-name">{{ nomeUsuario }}</p>
                <p class="user-role">{{ cargoUsuario }}</p>
              </div>
              <div class="user-avatar-initials" :title="nomeUsuario">
                {{ iniciaisUsuario }}
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Conteúdo do Dashboard -->
      <div class="dashboard-container">
        <!-- Linha 1: 4 Cards de KPI -->
        <section class="kpi-grid">
          <div class="card kpi-card">
            <div class="kpi-top">
              <div class="kpi-icon blue">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zM7.17 14.75l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0020 4H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7.42c-.14 0-.25-.11-.25-.25z" />
                </svg>
              </div>
              <span class="pill green">{{ totalOrcamentos }} orçamentos</span>
            </div>
            <p class="kpi-label">Total de Pedidos</p>
            <p class="kpi-value">{{ totalPedidos }}</p>
          </div>

          <div class="card kpi-card">
            <div class="kpi-top">
              <div class="kpi-icon yellow">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 5v14a1 1 0 001 1h14M8 20v-3m4 3v-2m4 2v-3M4 9h3m-3 4h2m-2 4h3" />
                </svg>
              </div>
              <span class="pill neutral">Etapa 1</span>
            </div>
            <p class="kpi-label">Aguardando Medição</p>
            <p class="kpi-value">{{ qtdMedicao }}</p>
          </div>

          <div class="card kpi-card">
            <div class="kpi-top">
              <div class="kpi-icon indigo">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span class="pill neutral">Fábrica</span>
            </div>
            <p class="kpi-label">Em Produção</p>
            <p class="kpi-value">{{ qtdProducao }}</p>
          </div>

          <div class="card kpi-card">
            <div class="kpi-top">
              <div class="kpi-icon emerald">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                </svg>
              </div>
              <span class="pill green-strong">Campo</span>
            </div>
            <p class="kpi-label">Pronto / Instalação</p>
            <p class="kpi-value">{{ qtdProntoInstalacao }}</p>
          </div>
        </section>

        <!-- Linha 2: Tabela Gestão de Pedidos + Painel Prazos Críticos -->
        <section class="middle-grid">
          <div class="card table-card">
            <div class="table-header">
              <div>
                <h2 class="section-title">Gestão de Pedidos</h2>
                <p class="section-subtitle">Acompanhamento do fluxo produtivo</p>
              </div>

              <div class="tabs-group">
                <button
                  v-for="tab in tabs"
                  :key="tab"
                  type="button"
                  @click="activeTab = tab; currentPage = 1"
                  :class="['tab-btn', { active: activeTab === tab }]"
                >
                  {{ tab }}
                </button>
              </div>
            </div>

            <div class="table-scroll">
              <table class="orders-table">
                <thead>
                  <tr>
                    <th>ID Pedido</th>
                    <th>Cliente</th>
                    <th>Status</th>
                    <th>Prazo (Ciclo)</th>
                    <th class="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="carregando">
                    <td colspan="5" class="empty-row">Carregando projetos da API...</td>
                  </tr>
                  <tr v-else v-for="order in paginatedOrders" :key="order.id">
                    <td class="order-id">{{ order.id }}</td>
                    <td>
                      <div class="client-cell">
                        <span class="client-avatar">{{ order.initials }}</span>
                        <div>
                          <span class="client-name">{{ order.client }}</span>
                          <small v-if="order.obra" class="client-obra">{{ order.obra }}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span :class="['status-badge', `status-${order.statusKey}`]">
                        {{ order.statusLabel }}
                      </span>
                    </td>
                    <td class="progress-cell">
                      <div class="progress-info">
                        <span>{{ order.cycleText }}</span>
                        <strong>{{ order.progress }}%</strong>
                      </div>
                      <div class="progress-track">
                        <div
                          :class="['progress-fill', `bar-${order.statusKey}`]"
                          :style="{ width: `${order.progress}%` }"
                        ></div>
                      </div>
                    </td>
                    <td class="text-right">
                      <button
                        type="button"
                        class="dots-btn"
                        title="Ver detalhes em Projetos"
                        @click="router.push('/projetos')"
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!carregando && paginatedOrders.length === 0">
                    <td colspan="5" class="empty-row">
                      Nenhum pedido encontrado para o filtro selecionado.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="table-footer">
              <span>Mostrando {{ paginatedOrders.length }} de {{ filteredOrders.length }} pedidos</span>
              <div class="pagination">
                <button type="button" @click="currentPage = Math.max(1, currentPage - 1)">&lsaquo;</button>
                <button
                  v-for="page in totalPages"
                  :key="page"
                  type="button"
                  :class="{ active: currentPage === page }"
                  @click="currentPage = page"
                >
                  {{ page }}
                </button>
                <button type="button" @click="currentPage = Math.min(totalPages, currentPage + 1)">&rsaquo;</button>
              </div>
            </div>
          </div>

          <!-- Prazos Críticos -->
          <aside class="card alerts-card">
            <div class="alerts-header">
              <div class="alert-icon">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                </svg>
              </div>
              <h3>Prazos Críticos</h3>
            </div>

            <div class="alerts-body">
              <p v-if="criticalAlerts.length === 0" class="empty-alerts">
                Nenhum projeto próximo do vencimento.
              </p>

              <div v-for="alert in criticalAlerts" :key="alert.id" class="alert-item">
                <div class="alert-top">
                  <span class="alert-id">{{ alert.id }}</span>
                  <span :class="['alert-days', alert.urgent ? 'urgent' : 'warning']">
                    {{ alert.days }}
                  </span>
                </div>
                <p class="alert-project">{{ alert.project }}</p>
                <div class="alert-note">
                  <span class="dot" :style="{ backgroundColor: alert.dotColor }"></span>
                  <span>{{ alert.note }}</span>
                </div>
              </div>

              <button type="button" class="alerts-all-btn" @click="router.push('/projetos')">
                Ver todos os projetos ({{ totalPedidos }})
              </button>
            </div>
          </aside>
        </section>

        <!-- Linha 3: CTA Novo Pedido + Estoque de Alumínio + NPS Clientes -->
        <section class="bottom-grid">
          <div class="cta-card">
            <div class="cta-watermark">
              <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m-7-7h14" />
              </svg>
            </div>
            <div>
              <h3>Novo Pedido?</h3>
              <p>Inicie o fluxo de medição técnica em um clique.</p>
            </div>
            <button type="button" class="cta-btn" @click="showModal = true">
              Cadastrar Projeto
            </button>
          </div>

          <div class="card info-card">
            <div class="info-icon">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 10l9-6 9 6v9a1 1 0 01-1 1h-3v-6H7v6H4a1 1 0 01-1-1v-9z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 16h6" />
              </svg>
            </div>
            <div class="info-content">
              <h3>Estoque de Alumínio</h3>
              <p>Atualizado há 20 min</p>
              <div class="stock-track">
                <div class="stock-fill" style="width: 68%"></div>
              </div>
            </div>
          </div>

          <div class="card info-card">
            <div class="info-icon">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div class="info-content">
              <h3>NPS Clientes</h3>
              <p>Média Mensal</p>
              <div class="nps-row">
                <div class="stars">
                  <svg v-for="star in 5" :key="star" width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <strong>4.8</strong>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Modal Rápido: Cadastrar Projeto (Cria Orçamento + Aprova para gerar Projeto) -->
      <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
        <div class="modal-box">
          <div class="modal-header">
            <h3>Novo Pedido de Medição</h3>
            <button type="button" @click="showModal = false">&times;</button>
          </div>
          <form @submit.prevent="addOrder">
            <div class="modal-fields">
              <div>
                <label>Nome do Cliente *</label>
                <input v-model="novoPedido.nomeCliente" type="text" required placeholder="Ex.: Marina Lins" />
              </div>
              <div>
                <label>Telefone</label>
                <input v-model="novoPedido.telefoneCliente" type="text" placeholder="(11) 99999-9999" />
              </div>
              <div>
                <label>Endereço da Obra</label>
                <input v-model="novoPedido.enderecoObra" type="text" placeholder="Rua / Condomínio" />
              </div>
              <div>
                <label>Prazo Estimado (dias)</label>
                <input v-model.number="novoPedido.prazoDias" type="number" min="1" max="365" />
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-cancel" @click="showModal = false">Cancelar</button>
              <button type="submit" class="btn-submit" :disabled="salvandoPedido">
                {{ salvandoPedido ? 'Criando...' : 'Criar Pedido' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.layout-wrapper {
  display: flex;
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1E293B;
}

.main-area {
  flex: 1;
  min-width: 0;
  background-color: #F8FAFC;
  display: flex;
  flex-direction: column;
}

/* Topbar */
.topbar {
  background: #FFFFFF;
  border-bottom: 1px solid #F1F5F9;
  padding: 14px 24px;
  position: sticky;
  top: 0;
  z-index: 20;
}

.topbar-inner {
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.search-box {
  position: relative;
  width: 100%;
  max-width: 340px;
  display: flex;
  align-items: center;
}

.search-box svg {
  position: absolute;
  left: 14px;
  color: #9CA3AF;
  pointer-events: none;
}

.search-box input {
  width: 100%;
  background: #F1F5F9;
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 9px 14px 9px 38px;
  font-size: 13px;
  color: #334155;
  outline: none;
  transition: 0.2s;
}

.search-box input:focus {
  background: #FFFFFF;
  border-color: #93C5FD;
  box-shadow: 0 0 0 3px #DBEAFE;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.icon-btn {
  position: relative;
  background: transparent;
  border: none;
  color: #475569;
  padding: 8px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: #F1F5F9;
}

.notif-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #EF4444;
  border: 2px solid #FFFFFF;
}

.divider {
  width: 1px;
  height: 28px;
  background: #E2E8F0;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  text-align: right;
}

.user-name {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #1E293B;
}

.user-role {
  margin: 0;
  font-size: 11px;
  color: #64748B;
}

.user-avatar-initials {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #1E3A8A;
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #E2E8F0;
  user-select: none;
}

/* Container Geral */
.dashboard-container {
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card {
  background: #FFFFFF;
  border-radius: 16px;
  border: 1px solid #F1F5F9;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.kpi-card {
  padding: 20px;
}

.kpi-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.kpi-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kpi-icon.blue { background: #EFF6FF; color: #2563EB; }
.kpi-icon.yellow { background: #FEFCE8; color: #EAB308; }
.kpi-icon.indigo { background: #EEF2FF; color: #4F46E5; }
.kpi-icon.emerald { background: #ECFDF5; color: #10B981; }

.pill {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
}

.pill.green { background: #ECFDF5; color: #10B981; }
.pill.green-strong { background: #DCFCE7; color: #16A34A; }
.pill.neutral { background: #F1F5F9; color: #64748B; }

.kpi-label {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
  color: #64748B;
}

.kpi-value {
  margin: 4px 0 0;
  font-size: 26px;
  font-weight: 700;
  color: #1E293B;
}

/* Middle Grid */
.middle-grid {
  display: grid;
  grid-template-columns: 1fr 310px;
  gap: 24px;
  align-items: start;
}

.table-card {
  overflow: hidden;
}

.table-header {
  padding: 22px 24px 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1E293B;
}

.section-subtitle {
  margin: 3px 0 0;
  font-size: 12px;
  color: #64748B;
}

.tabs-group {
  display: inline-flex;
  flex-wrap: wrap;
  background: #F8FAFC;
  padding: 4px;
  border-radius: 12px;
  border: 1px solid #F1F5F9;
  gap: 2px;
}

.tab-btn {
  background: transparent;
  border: none;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  color: #64748B;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.15s;
}

.tab-btn:hover {
  color: #1E293B;
}

.tab-btn.active {
  background: #FFFFFF;
  color: #1E3A8A;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.table-scroll {
  overflow-x: auto;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.orders-table th {
  padding: 13px 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94A3B8;
  border-bottom: 1px solid #F1F5F9;
}

.orders-table td {
  padding: 15px 20px;
  font-size: 13px;
  border-bottom: 1px solid #F1F5F9;
  white-space: nowrap;
}

.orders-table tbody tr:hover {
  background: #F8FAFC;
}

.order-id {
  font-weight: 700;
  color: #1E293B;
}

.client-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.client-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #F1F5F9;
  color: #475569;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.client-name {
  display: block;
  font-weight: 500;
  color: #334155;
}

.client-obra {
  display: block;
  font-size: 11px;
  color: #94A3B8;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.status-medicao { background: #FEF9C3; color: #A16207; }
.status-producao { background: #DBEAFE; color: #1D4ED8; }
.status-instalacao { background: #F3E8FF; color: #7E22CE; }
.status-concluido { background: #DCFCE7; color: #15803D; }
.status-liberacao { background: #EEF2FF; color: #4F46E5; }

.progress-cell {
  min-width: 190px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #64748B;
  margin-bottom: 6px;
}

.progress-info strong {
  color: #475569;
}

.progress-track {
  width: 100%;
  height: 6px;
  background: #F1F5F9;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.bar-medicao { background: #EAB308; }
.bar-producao { background: #2563EB; }
.bar-instalacao { background: #9333EA; }
.bar-concluido { background: #16A34A; }
.bar-liberacao { background: #4F46E5; }

.text-right {
  text-align: right;
}

.dots-btn {
  background: transparent;
  border: none;
  color: #94A3B8;
  padding: 6px;
  border-radius: 8px;
  cursor: pointer;
}

.dots-btn:hover {
  background: #F1F5F9;
  color: #1E293B;
}

.empty-row {
  text-align: center;
  padding: 32px;
  color: #64748B;
}

.table-footer {
  padding: 14px 24px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: #64748B;
}

.pagination {
  display: inline-flex;
  gap: 6px;
}

.pagination button {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: #64748B;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.pagination button:hover {
  background: #F1F5F9;
}

.pagination button.active {
  border-color: #CBD5E1;
  background: #FFFFFF;
  color: #1E293B;
}

/* Prazos Críticos */
.alerts-card {
  overflow: hidden;
}

.alerts-header {
  background: #FEF2F2;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #FEE2E2;
}

.alert-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #FEE2E2;
  color: #EF4444;
  display: flex;
  align-items: center;
  justify-content: center;
}

.alerts-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #1E293B;
}

.alerts-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-alerts {
  margin: 0;
  font-size: 12px;
  color: #64748B;
  text-align: center;
  padding: 12px 0;
}

.alert-item {
  background: #F8FAFC;
  border: 1px solid #F1F5F9;
  border-radius: 12px;
  padding: 14px;
}

.alert-top {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  margin-bottom: 4px;
}

.alert-id {
  color: #94A3B8;
  font-weight: 500;
}

.alert-days {
  font-weight: 700;
}

.alert-days.urgent { color: #EF4444; }
.alert-days.warning { color: #F59E0B; }

.alert-project {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: #1E293B;
}

.alert-note {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
  color: #64748B;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.alerts-all-btn {
  width: 100%;
  padding: 10px;
  margin-top: 4px;
  border-radius: 12px;
  border: 1px dashed #CBD5E1;
  background: transparent;
  color: #1E3A8A;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.15s;
}

.alerts-all-btn:hover {
  background: #EFF6FF;
  border-color: #93C5FD;
}

/* Bottom Grid */
.bottom-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.cta-card {
  position: relative;
  overflow: hidden;
  background: #1E3A8A;
  color: #FFFFFF;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 136px;
}

.cta-card h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.cta-card p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #DBEAFE;
}

.cta-btn {
  align-self: flex-start;
  margin-top: 16px;
  background: #FFFFFF;
  color: #1E3A8A;
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  position: relative;
  z-index: 2;
}

.cta-btn:hover {
  background: #EFF6FF;
}

.cta-watermark {
  position: absolute;
  right: -16px;
  bottom: -22px;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: rgba(30, 64, 175, 0.75);
  color: #1E3A8A;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.info-card {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.info-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #F1F5F9;
  color: #334155;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-content {
  flex: 1;
}

.info-content h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #1E293B;
}

.info-content p {
  margin: 3px 0 0;
  font-size: 12px;
  color: #94A3B8;
}

.stock-track {
  width: 100%;
  max-width: 150px;
  height: 6px;
  background: #F1F5F9;
  border-radius: 999px;
  overflow: hidden;
  margin-top: 12px;
}

.stock-fill {
  height: 100%;
  background: #10B981;
  border-radius: 999px;
}

.nps-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.stars {
  display: flex;
  color: #FACC15;
}

.nps-row strong {
  font-size: 14px;
  color: #1E293B;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 50;
}

.modal-box {
  background: #FFFFFF;
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  padding: 24px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.modal-header button {
  background: none;
  border: none;
  font-size: 22px;
  color: #94A3B8;
  cursor: pointer;
}

.modal-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-box label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 4px;
}

.modal-box input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #CBD5E1;
  border-radius: 10px;
  font-size: 13px;
  outline: none;
}

.modal-box input:focus {
  border-color: #2563EB;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}

.btn-cancel {
  background: transparent;
  border: none;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #64748B;
  border-radius: 10px;
  cursor: pointer;
}

.btn-submit {
  background: #1E3A8A;
  border: none;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  color: #FFFFFF;
  border-radius: 10px;
  cursor: pointer;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: progress;
}

/* Responsividade */
@media (max-width: 1150px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .middle-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .kpi-grid,
  .bottom-grid {
    grid-template-columns: 1fr;
  }
  .user-info {
    display: none;
  }
}
</style>