<script setup lang="ts">
import { computed, ref } from 'vue'
import Sidebar from '../Components/Sidebar.vue'

type ProjectBadgeType = 'SELECIONADO' | 'URGENTE' | 'VALIDADO'
type ItemStatus = 'produzido' | 'bloqueado' | 'pendente'
type ItemIconType = 'door' | 'window' | 'blocked'

interface ChecklistItem {
  id: number
  title: string
  subtitle: string
  status: ItemStatus
  checked: boolean
  iconType: ItemIconType
}

interface ExpeditionProject {
  id: string
  client: string
  workplace: string
  itemsCount: number
  updatedAt: string
  badge?: ProjectBadgeType
  totalChecklist: number
  baseCompleted: number
  items: ChecklistItem[]
}

function aoNavegar(menu: string) {
  console.log('Menu selecionado:', menu)
}

const searchProject = ref<string>('')
const selectedProjectId = ref<string>('#ORD-8915')
const toastTitle = ref<string>('Modo de Inspeção Ativo')
const toastMessage = ref<string>('Pronto para validar expedição de materiais.')

const projects = ref<ExpeditionProject[]>([
  {
    id: '#ORD-8915',
    client: 'Construtora Omega',
    workplace: 'Edifício Ocean Breeze - Apto 402',
    itemsCount: 8,
    updatedAt: 'Há 2h',
    badge: 'SELECIONADO',
    totalChecklist: 8,
    baseCompleted: 4,
    items: [
      {
        id: 1,
        title: 'Porta de Entrada Principal',
        subtitle: 'LINHA GOLD • PINTURA ELETROSTÁTICA PRETA',
        status: 'produzido',
        checked: true,
        iconType: 'door',
      },
      {
        id: 2,
        title: 'Janela Quarto Suíte (J01)',
        subtitle: 'VENEZIANA INTEGRADA MOTORIZADA',
        status: 'produzido',
        checked: true,
        iconType: 'window',
      },
      {
        id: 3,
        title: 'Janela Lavanderia (J02)',
        subtitle: 'FALTA VIDRO TEMPERADO',
        status: 'bloqueado',
        checked: false,
        iconType: 'blocked',
      },
    ],
  },
  {
    id: '#ORD-8890',
    client: 'Residencial Florada',
    workplace: 'Bloco C - Unidade 104',
    itemsCount: 14,
    updatedAt: 'Há 5h',
    badge: 'URGENTE',
    totalChecklist: 14,
    baseCompleted: 9,
    items: [
      {
        id: 101,
        title: 'Porta Balcão Varanda Gourmet',
        subtitle: 'LINHA SUPREMA • 4 FOLHAS DE CORRER',
        status: 'produzido',
        checked: true,
        iconType: 'door',
      },
      {
        id: 102,
        title: 'Maxim-Ar Banheiro Social',
        subtitle: 'VIDRO MINI BOREAL 4MM',
        status: 'produzido',
        checked: true,
        iconType: 'window',
      },
      {
        id: 103,
        title: 'Painel Fixo Sala de Estar',
        subtitle: 'AGUARDANDO PERFIL DE ARREMATE',
        status: 'bloqueado',
        checked: false,
        iconType: 'blocked',
      },
    ],
  },
  {
    id: '#ORD-8902',
    client: 'Marina Lins',
    workplace: 'Casa de Campo - Bragança',
    itemsCount: 5,
    updatedAt: 'Há 1d',
    badge: 'VALIDADO',
    totalChecklist: 5,
    baseCompleted: 2,
    items: [
      {
        id: 201,
        title: 'Porta Pivotante Hall Social',
        subtitle: 'ALUMÍNIO AMADEIRADO • PUXADOR INOX',
        status: 'produzido',
        checked: true,
        iconType: 'door',
      },
      {
        id: 202,
        title: 'Janela Cozinha Integrada',
        subtitle: 'LINHA GOLD • VIDRO LAMINADO INCOLOR',
        status: 'produzido',
        checked: true,
        iconType: 'window',
      },
      {
        id: 203,
        title: 'Veneziana Dormitório Hóspedes',
        subtitle: 'PINTURA ELETROSTÁTICA BRANCA',
        status: 'produzido',
        checked: true,
        iconType: 'window',
      },
    ],
  },
])

const filteredProjects = computed<ExpeditionProject[]>(() => {
  const q = searchProject.value.trim().toLowerCase()
  if (!q) return projects.value

  return projects.value.filter(
    (proj) =>
      proj.id.toLowerCase().includes(q) ||
      proj.client.toLowerCase().includes(q) ||
      proj.workplace.toLowerCase().includes(q)
  )
})

const activeProject = computed<ExpeditionProject>(() => {
  return (
    projects.value.find((p) => p.id === selectedProjectId.value) ??
    projects.value[0]!
  )
})

const completedCount = computed<number>(() => {
  const checkedVisible = activeProject.value.items.filter((i) => i.checked).length
  return Math.min(
    activeProject.value.totalChecklist,
    activeProject.value.baseCompleted + checkedVisible
  )
})

const progressPercent = computed<number>(() => {
  if (activeProject.value.totalChecklist === 0) return 0
  return Math.round((completedCount.value / activeProject.value.totalChecklist) * 100)
})

function selecionarProjeto(id: string) {
  selectedProjectId.value = id
}

function alternarItem(item: ChecklistItem) {
  item.checked = !item.checked
  if (item.checked && item.status === 'bloqueado') {
    item.status = 'produzido'
  }
}

function marcarTodosComoProntos() {
  activeProject.value.items.forEach((item) => {
    if (item.status !== 'bloqueado') {
      item.checked = true
      item.status = 'produzido'
    }
  })
  mostrarToast('Itens Atualizados', 'Todos os itens liberados foram marcados como prontos.')
}

function salvarRascunho() {
  mostrarToast(
    'Rascunho Salvo',
    `Checklist do projeto ${activeProject.value.id} salvo com sucesso.`
  )
}

function gerarOrdemServico() {
  mostrarToast(
    'Ordem de Serviço Gerada',
    `OS enviada para o App Instalador (${activeProject.value.client}).`
  )
}

function mostrarToast(title: string, message: string) {
  toastTitle.value = title
  toastMessage.value = message
}
</script>

<template>
  <div class="layout-wrapper">
    <Sidebar @navigate="aoNavegar" />

    <main class="main-area">
      <!-- Topbar -->
      <header class="topbar">
        <div class="topbar-inner">
          <div class="topbar-title-group">
            <h1 class="page-title">Central de Liberações</h1>
            <span class="title-badge">CONTROLE DE EXPEDIÇÃO</span>
          </div>

          <div class="topbar-actions">
            <button type="button" class="icon-btn" aria-label="Notificações">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span class="notif-dot"></span>
            </button>

            <div class="user-profile">
              <div class="user-info">
                <p class="user-name">Ricardo Almeida</p>
                <p class="user-role">Gestor de Produção</p>
              </div>
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
                alt="Ricardo Almeida"
                class="user-avatar"
              />
            </div>
          </div>
        </div>
      </header>

      <!-- Conteúdo Principal -->
      <div class="content-container">
        <div class="workspace-grid">
          <!-- COLUNA ESQUERDA: Projetos em Expedição -->
          <aside class="card projects-panel">
            <div class="panel-header">
              <div>
                <h2 class="panel-title">Projetos em Expedição</h2>
                <p class="panel-subtitle">Prontos para validação de instalação</p>
              </div>
              <span class="active-count-pill">12 Ativos</span>
            </div>

            <div class="search-box">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                v-model="searchProject"
                type="text"
                placeholder="Filtrar por cliente ou obra..."
              />
            </div>

            <div class="projects-list">
              <div
                v-for="project in filteredProjects"
                :key="project.id"
                :class="['project-card', { selected: project.id === activeProject.id }]"
                @click="selecionarProjeto(project.id)"
              >
                <div class="project-card-top">
                  <span class="project-code">{{ project.id }}</span>

                  <span
                    v-if="project.id === activeProject.id"
                    class="project-badge badge-selected"
                  >
                    SELECIONADO
                  </span>
                  <span
                    v-else-if="project.badge === 'URGENTE'"
                    class="project-badge badge-urgent"
                  >
                    URGENTE
                  </span>
                  <span
                    v-else-if="project.badge === 'VALIDADO'"
                    class="project-badge badge-validated"
                  >
                    VALIDADO
                  </span>
                </div>

                <h3 class="project-client">{{ project.client }}</h3>
                <p class="project-workplace">{{ project.workplace }}</p>

                <div class="project-card-footer">
                  <span class="meta-item">
                    <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z" />
                    </svg>
                    {{ project.itemsCount }} Itens Produzidos
                  </span>

                  <span class="meta-item">
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ project.updatedAt }}
                  </span>
                </div>
              </div>

              <p v-if="filteredProjects.length === 0" class="empty-projects">
                Nenhum projeto encontrado.
              </p>
            </div>
          </aside>

          <!-- COLUNA DIREITA: Checklist de Liberação -->
          <section class="card checklist-panel">
            <div class="checklist-body">
              <!-- Cabeçalho do Checklist -->
              <div class="checklist-header">
                <div>
                  <div class="checklist-title-row">
                    <h2>CHECKLIST DE LIBERAÇÃO</h2>
                    <span class="project-tag">PROJETO {{ activeProject.id }}</span>
                  </div>
                  <p class="checklist-location">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
                    </svg>
                    <span>{{ activeProject.workplace.split(' - ')[0] }} - {{ activeProject.client }}</span>
                  </p>
                </div>

                <div class="progress-summary">
                  <span class="progress-label">PROGRESSO DE LIBERAÇÃO</span>
                  <div class="progress-bar-row">
                    <div class="progress-track">
                      <div class="progress-fill" :style="{ width: `${progressPercent}%` }"></div>
                    </div>
                    <strong class="progress-fraction">
                      {{ completedCount }} / {{ activeProject.totalChecklist }}
                    </strong>
                  </div>
                </div>
              </div>

              <!-- Subcabeçalho da Lista -->
              <div class="items-section-header">
                <div class="items-section-title">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span>Itens Produzidos para Instalação</span>
                </div>

                <button type="button" class="mark-all-btn" @click="marcarTodosComoProntos">
                  Marcar todos como prontos
                </button>
              </div>

              <!-- Lista de Itens -->
              <div class="checklist-items">
                <div
                  v-for="item in activeProject.items"
                  :key="item.id"
                  :class="['item-row', { blocked: item.status === 'bloqueado' && !item.checked }]"
                >
                  <div class="item-left">
                    <div :class="['item-icon-box', item.status === 'bloqueado' && !item.checked ? 'danger' : 'neutral']">
                      <!-- Ícone Porta -->
                      <svg v-if="item.iconType === 'door'" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 19V5c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v14H3v2h18v-2h-2zm-6-6h-2v-2h2v2z" />
                      </svg>
                      <!-- Ícone Janela -->
                      <svg v-else-if="item.iconType === 'window'" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 8h-6V5h6v6zm-8-6v6H5V5h6zm-6 8h6v6H5v-6zm8 6v-6h6v6h-6z" />
                      </svg>
                      <!-- Ícone Bloqueado -->
                      <svg v-else width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                      </svg>
                    </div>

                    <div class="item-texts">
                      <p class="item-title">{{ item.title }}</p>
                      <p :class="['item-subtitle', { 'text-danger': item.status === 'bloqueado' && !item.checked }]">
                        {{ item.subtitle }}
                      </p>
                    </div>
                  </div>

                  <div class="item-right">
                    <span
                      v-if="item.status === 'bloqueado' && !item.checked"
                      class="status-pill blocked"
                    >
                      Bloqueado
                    </span>
                    <span v-else class="status-pill produced">
                      ✓ Produzido
                    </span>

                    <button
                      type="button"
                      role="checkbox"
                      :aria-checked="item.checked"
                      :class="['custom-checkbox', { checked: item.checked }]"
                      @click="alternarItem(item)"
                    >
                      <svg v-if="item.checked" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Rodapé do Checklist -->
            <footer class="checklist-footer">
              <div class="app-sync-info">
                <div class="phone-icon-circle">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p class="sync-title">Envio direto para Equipe Campo</p>
                  <p class="sync-sub">App Instalador v2.4</p>
                </div>
              </div>

              <div class="footer-buttons">
                <button type="button" class="btn-draft" @click="salvarRascunho">
                  Salvar Rascunho
                </button>
                <button type="button" class="btn-os" @click="gerarOrdemServico">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 9v4h2l-3 3-3-3h2v-4h2zm1-3V3.5L18.5 8H14z" />
                  </svg>
                  <span>Gerar Ordem de Serviço (OS)</span>
                </button>
              </div>
            </footer>
          </section>
        </div>
      </div>

      <!-- Toast Flutuante Inferior Direito -->
      <div class="inspection-toast" role="status">
        <div class="toast-check">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p class="toast-title">{{ toastTitle }}</p>
          <p class="toast-sub">{{ toastMessage }}</p>
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
  position: relative;
}

/* Topbar */
.topbar {
  background: #FFFFFF;
  border-bottom: 1px solid #F1F5F9;
  padding: 14px 28px;
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

.topbar-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1E293B;
}

.title-badge {
  background: #DBEAFE;
  color: #1D4ED8;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 4px 10px;
  border-radius: 999px;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 18px;
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

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid #E2E8F0;
}

/* Container Principal */
.content-container {
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 28px 64px;
  flex: 1;
}

.workspace-grid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 24px;
  align-items: stretch;
}

.card {
  background: #FFFFFF;
  border-radius: 18px;
  border: 1px solid #F1F5F9;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}

/* Coluna Esquerda: Projetos em Expedição */
.projects-panel {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.panel-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #1E293B;
}

.panel-subtitle {
  margin: 3px 0 0;
  font-size: 11px;
  color: #64748B;
}

.active-count-pill {
  background: #F1F5F9;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box svg {
  position: absolute;
  left: 12px;
  color: #94A3B8;
  pointer-events: none;
}

.search-box input {
  width: 100%;
  background: #FAFBFD;
  border: 1px solid #E2E8F0;
  border-radius: 11px;
  padding: 9px 12px 9px 36px;
  font-size: 12px;
  color: #334155;
  outline: none;
  transition: 0.15s;
}

.search-box input:focus {
  background: #FFFFFF;
  border-color: #93C5FD;
  box-shadow: 0 0 0 3px #EFF6FF;
}

.projects-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.project-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  padding: 16px;
  cursor: pointer;
  transition: 0.18s ease;
}

.project-card:hover {
  border-color: #93C5FD;
  background: #FAFBFD;
}

.project-card.selected {
  background: #1E3A8A;
  border-color: #1E3A8A;
  color: #FFFFFF;
  box-shadow: 0 8px 18px rgba(30, 58, 138, 0.22);
}

.project-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.project-code {
  font-size: 11px;
  font-weight: 600;
  color: #94A3B8;
}

.project-card.selected .project-code {
  color: #BFDBFE;
}

.project-badge {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 3px 8px;
  border-radius: 999px;
}

.badge-selected {
  background: rgba(255, 255, 255, 0.16);
  color: #FFFFFF;
}

.badge-urgent {
  background: #F1F5F9;
  color: #475569;
}

.badge-validated {
  background: #DCFCE7;
  color: #15803D;
}

.project-client {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #1E293B;
}

.project-card.selected .project-client {
  color: #FFFFFF;
}

.project-workplace {
  margin: 3px 0 14px;
  font-size: 12px;
  color: #64748B;
}

.project-card.selected .project-workplace {
  color: #DBEAFE;
}

.project-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: #64748B;
}

.project-card.selected .project-card-footer {
  color: #DBEAFE;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.empty-projects {
  text-align: center;
  font-size: 12px;
  color: #94A3B8;
  padding: 20px 0;
}

/* Coluna Direita: Checklist de Liberação */
.checklist-panel {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 620px;
}

.checklist-body {
  padding: 28px 30px;
}

.checklist-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 24px;
  border-bottom: 1px solid #F1F5F9;
}

.checklist-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.checklist-title-row h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #1E293B;
  letter-spacing: -0.01em;
}

.project-tag {
  background: #EFF6FF;
  color: #1E3A8A;
  border: 1px solid #DBEAFE;
  font-size: 10px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
}

.checklist-location {
  margin: 8px 0 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #64748B;
}

.checklist-location svg {
  color: #1E3A8A;
}

.progress-summary {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.progress-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #94A3B8;
}

.progress-bar-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-track {
  width: 96px;
  height: 7px;
  background: #E2E8F0;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #10B981;
  border-radius: 999px;
  transition: width 0.25s ease;
}

.progress-fraction {
  font-size: 14px;
  font-weight: 800;
  color: #1E293B;
}

/* Subcabeçalho dos Itens */
.items-section-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 22px 0 16px;
}

.items-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #1E293B;
}

.items-section-title svg {
  color: #1E3A8A;
}

.mark-all-btn {
  background: transparent;
  border: none;
  color: #1E3A8A;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.mark-all-btn:hover {
  background: #EFF6FF;
}

/* Lista de Itens */
.checklist-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-row {
  background: #FAFBFD;
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  transition: 0.15s;
}

.item-row.blocked {
  background: #FFFDFD;
  border-color: #FECACA;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.item-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-icon-box.neutral {
  background: #F1F5F9;
  color: #64748B;
}

.item-icon-box.danger {
  background: #FEE2E2;
  color: #EF4444;
}

.item-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: #1E293B;
}

.item-subtitle {
  margin: 3px 0 0;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: #94A3B8;
}

.item-subtitle.text-danger {
  color: #EF4444;
  font-weight: 700;
}

.item-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.status-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 999px;
  white-space: nowrap;
}

.status-pill.produced {
  background: #DCFCE7;
  color: #15803D;
}

.status-pill.blocked {
  background: #FEE2E2;
  color: #EF4444;
}

.custom-checkbox {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  border: 1.5px solid #94A3B8;
  background: #FFFFFF;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: 0.15s;
}

.custom-checkbox.checked {
  background: #0284C7;
  border-color: #0284C7;
}

/* Rodapé do Checklist */
.checklist-footer {
  border-top: 1px solid #F1F5F9;
  padding: 18px 30px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.app-sync-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.phone-icon-circle {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #F1F5F9;
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sync-title {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  color: #334155;
}

.sync-sub {
  margin: 1px 0 0;
  font-size: 11px;
  color: #94A3B8;
}

.footer-buttons {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.btn-draft {
  background: #FFFFFF;
  border: 1px solid #CBD5E1;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
  padding: 11px 18px;
  border-radius: 11px;
  cursor: pointer;
  transition: 0.15s;
}

.btn-draft:hover {
  background: #F8FAFC;
  border-color: #94A3B8;
}

.btn-os {
  background: #1E3A8A;
  border: none;
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 700;
  padding: 11px 20px;
  border-radius: 11px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.2);
  transition: 0.15s;
}

.btn-os:hover {
  background: #1E40AF;
}

/* Toast Flutuante */
.inspection-toast {
  position: fixed;
  right: 22px;
  bottom: 18px;
  background: #111827;
  color: #FFFFFF;
  border-radius: 14px;
  padding: 12px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.25);
  z-index: 40;
}

.toast-check {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #10B981;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toast-title {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  color: #FFFFFF;
}

.toast-sub {
  margin: 2px 0 0;
  font-size: 10px;
  color: #9CA3AF;
}

/* Responsividade */
@media (max-width: 1080px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .user-info {
    display: none;
  }
  .inspection-toast {
    left: 16px;
    right: 16px;
  }
}
</style>