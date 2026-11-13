<script setup lang="ts">
import { computed, ref } from 'vue'
import Sidebar from '../Components/Sidebar.vue'

type ProjectBadge = 'SELECIONADO' | 'URGENTE'
type ItemIconType = 'door' | 'window'

interface Collaborator {
  id: string
  name: string
  avatar: string
  available: boolean
  statusText: string
}

interface ProjectItem {
  id: string
  title: string
  subtitle: string
  iconType: ItemIconType
  assigned: Collaborator[]
}

interface OpenProject {
  id: string
  client: string
  workplace: string
  itemsCountLabel: string
  updatedAt: string
  badge?: ProjectBadge
  totalSlots: number
  baseAssignedCount: number
  items: ProjectItem[]
}

function aoNavegar(menu: string) {
  console.log('Menu selecionado:', menu)
}

const searchWork = ref<string>('')
const searchCollaborator = ref<string>('')
const selectedProjectId = ref<string>('#ORD-8915')
const selectedItemId = ref<string>('item-1')
const dragOverItemId = ref<string | null>(null)
const draggedCollaborator = ref<Collaborator | null>(null)
const feedbackMessage = ref<string | null>(null)

const collaborators = ref<Collaborator[]>([
  {
    id: 'col-1',
    name: 'Pedro Santos',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
    available: true,
    statusText: 'Disponível',
  },
  {
    id: 'col-2',
    name: 'João Paulo',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    available: false,
    statusText: 'Em Rota (Vila Nova)',
  },
  {
    id: 'col-3',
    name: 'Carlos Mendes',
    avatar:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
    available: true,
    statusText: 'Disponível',
  },
])

function createInitialProjects(): OpenProject[] {
  return [
    {
      id: '#ORD-8915',
      client: 'Construtora Omega',
      workplace: 'Edifício Ocean Breeze - Apto 402',
      itemsCountLabel: '08 Itens',
      updatedAt: 'Há 2h',
      badge: 'SELECIONADO',
      totalSlots: 8,
      baseAssignedCount: 1,
      items: [
        {
          id: 'item-1',
          title: 'Porta de Entrada Principal',
          subtitle: 'Linha Gold • Alumínio Preto',
          iconType: 'door',
          assigned: [
            {
              id: 'col-joaquim',
              name: 'Joaquim Azevedo',
              avatar:
                'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80',
              available: true,
              statusText: 'Disponível',
            },
            {
              id: 'col-mario',
              name: 'Mario Silva',
              avatar:
                'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=100&q=80',
              available: true,
              statusText: 'Disponível',
            },
          ],
        },
        {
          id: 'item-2',
          title: 'Janela Quarto Suíte (J01)',
          subtitle: 'Veneziana Integrada Motorizada',
          iconType: 'window',
          assigned: [],
        },
      ],
    },
    {
      id: '#ORD-8890',
      client: 'Residencial Florada',
      workplace: 'Bloco C - Unidade 104',
      itemsCountLabel: '14 Itens',
      updatedAt: 'Há 5h',
      badge: 'URGENTE',
      totalSlots: 14,
      baseAssignedCount: 4,
      items: [
        {
          id: 'item-201',
          title: 'Porta Balcão Varanda Gourmet',
          subtitle: 'Linha Suprema • 4 Folhas de Correr',
          iconType: 'door',
          assigned: [
            {
              id: 'col-joaquim',
              name: 'Joaquim Azevedo',
              avatar:
                'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80',
              available: true,
              statusText: 'Disponível',
            },
          ],
        },
        {
          id: 'item-202',
          title: 'Maxim-Ar Banheiro Social',
          subtitle: 'Vidro Mini Boreal 4mm',
          iconType: 'window',
          assigned: [],
        },
      ],
    },
  ]
}

const projects = ref<OpenProject[]>(createInitialProjects())

const filteredProjects = computed<OpenProject[]>(() => {
  const q = searchWork.value.trim().toLowerCase()
  if (!q) return projects.value

  return projects.value.filter(
    (p) =>
      p.id.toLowerCase().includes(q) ||
      p.client.toLowerCase().includes(q) ||
      p.workplace.toLowerCase().includes(q)
  )
})

const filteredCollaborators = computed<Collaborator[]>(() => {
  const q = searchCollaborator.value.trim().toLowerCase()
  if (!q) return collaborators.value

  return collaborators.value.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.statusText.toLowerCase().includes(q)
  )
})

const activeProject = computed<OpenProject>(() => {
  return (
    projects.value.find((p) => p.id === selectedProjectId.value) ??
    projects.value[0]!
  )
})

const assignedTotal = computed<number>(() => {
  const visibleAssigned = activeProject.value.items.reduce(
    (sum, item) => sum + item.assigned.length,
    0
  )
  return Math.min(
    activeProject.value.totalSlots,
    activeProject.value.baseAssignedCount + visibleAssigned
  )
})

const assignedProgressPercent = computed<number>(() => {
  if (activeProject.value.totalSlots === 0) return 0
  return Math.round((assignedTotal.value / activeProject.value.totalSlots) * 100)
})

function selecionarProjeto(project: OpenProject) {
  selectedProjectId.value = project.id
  selectedItemId.value = project.items[0]?.id ?? ''
  feedbackMessage.value = null
}

function aoIniciarArrasto(event: DragEvent, collaborator: Collaborator) {
  if (!collaborator.available) {
    event.preventDefault()
    return
  }
  draggedCollaborator.value = collaborator
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('text/plain', collaborator.id)
  }
}

function aoSoltarNoItem(item: ProjectItem) {
  dragOverItemId.value = null
  const col = draggedCollaborator.value
  if (!col || !col.available) return

  alocarColaboradorNoItem(item, col)
  draggedCollaborator.value = null
}

function alocarColaboradorNoItem(item: ProjectItem, collaborator: Collaborator) {
  const alreadyAssigned = item.assigned.some((a) => a.id === collaborator.id)
  if (alreadyAssigned) return

  item.assigned.push({ ...collaborator })
  selectedItemId.value = item.id
}

function alocarPorClique(collaborator: Collaborator) {
  if (!collaborator.available) return
  const targetItem =
    activeProject.value.items.find((i) => i.id === selectedItemId.value) ??
    activeProject.value.items[0]

  if (targetItem) {
    alocarColaboradorNoItem(targetItem, collaborator)
  }
}

function removerColaborador(item: ProjectItem, collaboratorId: string) {
  item.assigned = item.assigned.filter((a) => a.id !== collaboratorId)
}

function selecionarTodosItens() {
  const firstAvailable = collaborators.value.find((c) => c.available)
  if (!firstAvailable) return

  activeProject.value.items.forEach((item) => {
    if (item.assigned.length === 0) {
      item.assigned.push({ ...firstAvailable })
    }
  })
}

function descartarAlteracoes() {
  const fresh = createInitialProjects()
  const original = fresh.find((p) => p.id === activeProject.value.id)
  if (original) {
    activeProject.value.items = original.items
  }
  exibirFeedback('Alterações descartadas para a obra ' + activeProject.value.id + '.')
}

function confirmarAlocacao() {
  exibirFeedback(
    `Alocação confirmada! OS ${activeProject.value.id} sincronizada com o mobile.`
  )
}

function exibirFeedback(msg: string) {
  feedbackMessage.value = msg
  setTimeout(() => {
    feedbackMessage.value = null
  }, 3200)
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
            <h1 class="page-title">Designação de Equipes</h1>
            <span class="title-badge">LOGÍSTICA DE CAMPO</span>
          </div>

          <div class="topbar-actions">
            <button type="button" class="icon-btn" aria-label="Notificações">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
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
          <!-- COLUNA ESQUERDA: Projetos em Aberto -->
          <aside class="card projects-panel">
            <div class="panel-header">
              <div>
                <h2 class="panel-title">Projetos em Aberto</h2>
                <p class="panel-subtitle">Aguardando designação de equipe</p>
              </div>
              <span class="works-count-pill">08 Obras</span>
            </div>

            <div class="search-box">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                v-model="searchWork"
                type="text"
                placeholder="Filtrar por obra..."
              />
            </div>

            <div class="projects-list">
              <div
                v-for="project in filteredProjects"
                :key="project.id"
                :class="['project-card', { selected: project.id === activeProject.id }]"
                @click="selecionarProjeto(project)"
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
                </div>

                <h3 class="project-client">{{ project.client }}</h3>
                <p class="project-workplace">{{ project.workplace }}</p>

                <div class="project-card-footer">
                  <span class="meta-item">
                    <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z" />
                    </svg>
                    {{ project.itemsCountLabel }}
                  </span>

                  <span class="meta-item">
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ project.updatedAt }}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          <!-- COLUNA DIREITA: Painel de Alocação -->
          <section class="card allocation-panel">
            <!-- Cabeçalho do Painel de Alocação -->
            <div class="allocation-header">
              <div>
                <div class="allocation-title-row">
                  <h2>Painel de Alocação</h2>
                  <span class="project-tag">{{ activeProject.id }}</span>
                </div>
                <p class="allocation-location">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
                  </svg>
                  <span>{{ activeProject.workplace.split(' - ')[0] }} - {{ activeProject.client }}</span>
                </p>
              </div>

              <div class="assigned-summary">
                <span class="assigned-label">DESIGNADOS</span>
                <div class="assigned-progress-row">
                  <div class="assigned-track">
                    <div
                      class="assigned-fill"
                      :style="{ width: `${assignedProgressPercent}%` }"
                    ></div>
                  </div>
                  <strong class="assigned-fraction">
                    {{ assignedTotal }} / {{ activeProject.totalSlots }}
                  </strong>
                </div>
              </div>
            </div>

            <!-- Área Central Dividida: Itens do Projeto + Colaboradores Disponíveis -->
            <div class="allocation-split">
              <!-- Esquerda: Itens do Projeto -->
              <div class="items-column">
                <div class="subcolumn-header">
                  <h3>Itens do Projeto</h3>
                  <button
                    type="button"
                    class="select-all-btn"
                    @click="selecionarTodosItens"
                  >
                    Selecionar Todos
                  </button>
                </div>

                <div class="project-items-list">
                  <div
                    v-for="item in activeProject.items"
                    :key="item.id"
                    :class="[
                      'allocation-item-card',
                      {
                        active: selectedItemId === item.id,
                        'drag-over': dragOverItemId === item.id,
                      },
                    ]"
                    @click="selectedItemId = item.id"
                    @dragover.prevent="dragOverItemId = item.id"
                    @dragleave.prevent="dragOverItemId = null"
                    @drop.prevent="aoSoltarNoItem(item)"
                  >
                    <div class="item-card-top">
                      <div class="item-info-left">
                        <div class="item-icon-box">
                          <!-- Ícone Porta -->
                          <svg v-if="item.iconType === 'door'" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 19V5c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v14H3v2h18v-2h-2zm-6-6h-2v-2h2v2z" />
                          </svg>
                          <!-- Ícone Janela -->
                          <svg v-else width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 8h-6V5h6v6zm-8-6v6H5V5h6zm-6 8h6v6H5v-6zm8 6v-6h6v6h-6z" />
                          </svg>
                        </div>

                        <div>
                          <p class="item-title">{{ item.title }}</p>
                          <p class="item-subtitle">{{ item.subtitle }}</p>
                        </div>
                      </div>

                      <span
                        v-if="item.assigned.length > 0"
                        class="item-status-pill allocated"
                      >
                        ALOCADO
                      </span>
                      <span v-else class="item-status-pill pending">
                        PENDENTE
                      </span>
                    </div>

                    <!-- Chips de Colaboradores Alocados -->
                    <div v-if="item.assigned.length > 0" class="assigned-chips-row">
                      <div
                        v-for="person in item.assigned"
                        :key="person.id"
                        class="collaborator-chip"
                      >
                        <img :src="person.avatar" :alt="person.name" />
                        <span>{{ person.name }}</span>
                        <button
                          type="button"
                          class="remove-chip-btn"
                          title="Remover colaborador"
                          @click.stop="removerColaborador(item, person.id)"
                        >
                          &times;
                        </button>
                      </div>
                    </div>

                    <!-- Dropzone quando ainda não há colaboradores alocados -->
                    <div v-else class="drop-target-box">
                      Arraste colaboradores aqui para alocar
                    </div>
                  </div>
                </div>
              </div>

              <!-- Direita: Colaboradores Disponíveis -->
              <div class="collaborators-column">
                <div class="subcolumn-header">
                  <h3>Colaboradores Disponíveis</h3>
                </div>

                <div class="collab-search-box">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    v-model="searchCollaborator"
                    type="text"
                    placeholder="Pesquisar nome..."
                  />
                </div>

                <div class="collaborators-list">
                  <div
                    v-for="col in filteredCollaborators"
                    :key="col.id"
                    :draggable="col.available"
                    :class="['collaborator-card', { unavailable: !col.available }]"
                    :title="col.available ? 'Arraste para um item ou clique para alocar' : col.statusText"
                    @dragstart="aoIniciarArrasto($event, col)"
                    @click="alocarPorClique(col)"
                  >
                    <div class="collab-left">
                      <img :src="col.avatar" :alt="col.name" class="collab-avatar" />
                      <div>
                        <p class="collab-name">{{ col.name }}</p>
                        <p :class="['collab-status', col.available ? 'text-green' : 'text-red']">
                          {{ col.statusText }}
                        </p>
                      </div>
                    </div>

                    <!-- Ícone de Arrasto (Disponível) ou Cadeado (Indisponível) -->
                    <svg
                      v-if="col.available"
                      class="grip-icon"
                      width="14"
                      height="14"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M5 3a1.25 1.25 0 110 2.5A1.25 1.25 0 015 3zm6 0a1.25 1.25 0 110 2.5A1.25 1.25 0 0111 3zM5 6.75a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zm6 0a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zM5 10.5A1.25 1.25 0 115 13a1.25 1.25 0 010-2.5zm6 0a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5z" />
                    </svg>

                    <svg
                      v-else
                      class="lock-icon"
                      width="14"
                      height="14"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Rodapé do Painel de Alocação -->
            <footer class="allocation-footer">
              <div class="mobile-sync-box">
                <div class="phone-circle">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p class="sync-title">Sincronização com Mobile</p>
                  <p class="sync-subtitle">
                    {{ feedbackMessage ?? 'Equipes receberão a OS em tempo real' }}
                  </p>
                </div>
              </div>

              <div class="footer-actions">
                <button type="button" class="btn-discard" @click="descartarAlteracoes">
                  Descartar
                </button>
                <button type="button" class="btn-confirm" @click="confirmarAlocacao">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 9v4h2l-3 3-3-3h2v-4h2zm1-3V3.5L18.5 8H14z" />
                  </svg>
                  <span>Confirmar Alocação de Equipes</span>
                </button>
              </div>
            </footer>
          </section>
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

/* Container Geral */
.content-container {
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 28px 40px;
}

.workspace-grid {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 24px;
  align-items: start;
}

.card {
  background: #FFFFFF;
  border-radius: 18px;
  border: 1px solid #F1F5F9;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}

/* Coluna Esquerda: Projetos em Aberto */
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

.works-count-pill {
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
  margin: 3px 0 12px;
  font-size: 12px;
  color: #64748B;
}

.project-card.selected .project-workplace {
  color: #DBEAFE;
}

.project-card-footer {
  padding-top: 10px;
  border-top: 1px solid #F1F5F9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: #64748B;
}

.project-card.selected .project-card-footer {
  border-top-color: rgba(255, 255, 255, 0.14);
  color: #DBEAFE;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

/* Coluna Direita: Painel de Alocação */
.allocation-panel {
  display: flex;
  flex-direction: column;
}

.allocation-header {
  padding: 24px 28px 20px;
  border-bottom: 1px solid #F1F5F9;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.allocation-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.allocation-title-row h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #1E293B;
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

.allocation-location {
  margin: 8px 0 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #64748B;
}

.allocation-location svg {
  color: #1E3A8A;
}

.assigned-summary {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.assigned-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #94A3B8;
}

.assigned-progress-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.assigned-track {
  width: 96px;
  height: 7px;
  background: #E2E8F0;
  border-radius: 999px;
  overflow: hidden;
}

.assigned-fill {
  height: 100%;
  background: #1D4ED8;
  border-radius: 999px;
  transition: width 0.25s ease;
}

.assigned-fraction {
  font-size: 14px;
  font-weight: 800;
  color: #1E293B;
}

/* Split: Itens do Projeto (Esquerda) + Colaboradores Disponíveis (Direita) */
.allocation-split {
  display: grid;
  grid-template-columns: 1.55fr 1fr;
  border-bottom: 1px solid #F1F5F9;
}

.items-column {
  padding: 22px 26px 26px;
  border-right: 1px solid #F1F5F9;
}

.collaborators-column {
  padding: 22px 24px 26px;
  background: #FCFDFF;
}

.subcolumn-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.subcolumn-header h3 {
  margin: 0;
  font-size: 13.5px;
  font-weight: 700;
  color: #1E293B;
}

.select-all-btn {
  background: transparent;
  border: none;
  color: #1E3A8A;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
}

.select-all-btn:hover {
  background: #EFF6FF;
}

.project-items-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.allocation-item-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  padding: 16px;
  cursor: pointer;
  transition: 0.16s ease;
}

.allocation-item-card.active {
  border: 1.5px solid #1E3A8A;
  background: #FAFBFD;
}

.allocation-item-card.drag-over {
  border: 1.5px dashed #2563EB;
  background: #EFF6FF;
}

.item-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.item-info-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #F1F5F9;
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-title {
  margin: 0;
  font-size: 13.5px;
  font-weight: 700;
  color: #1E293B;
}

.item-subtitle {
  margin: 2px 0 0;
  font-size: 11px;
  color: #64748B;
}

.item-status-pill {
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.03em;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.item-status-pill.allocated {
  background: #DCFCE7;
  color: #15803D;
}

.item-status-pill.pending {
  background: #FEF3C7;
  color: #D97706;
}

.assigned-chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.collaborator-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 999px;
  padding: 4px 10px 4px 5px;
  font-size: 11.5px;
  font-weight: 600;
  color: #1E293B;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.collaborator-chip img {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  object-fit: cover;
}

.remove-chip-btn {
  background: transparent;
  border: none;
  color: #94A3B8;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  padding: 0 2px;
}

.remove-chip-btn:hover {
  color: #EF4444;
}

.drop-target-box {
  margin-top: 14px;
  border: 1.5px dashed #CBD5E1;
  border-radius: 10px;
  background: #FAFBFD;
  padding: 12px;
  text-align: center;
  font-size: 11px;
  color: #94A3B8;
}

/* Colaboradores Disponíveis */
.collab-search-box {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 14px;
}

.collab-search-box svg {
  position: absolute;
  left: 11px;
  color: #94A3B8;
  pointer-events: none;
}

.collab-search-box input {
  width: 100%;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 8px 12px 8px 32px;
  font-size: 12px;
  color: #334155;
  outline: none;
}

.collab-search-box input:focus {
  border-color: #93C5FD;
}

.collaborators-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.collaborator-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 11px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  cursor: grab;
  transition: 0.15s;
}

.collaborator-card:hover:not(.unavailable) {
  border-color: #93C5FD;
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.05);
}

.collaborator-card.unavailable {
  background: #F8FAFC;
  border-color: #F1F5F9;
  cursor: not-allowed;
  opacity: 0.78;
}

.collab-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.collab-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.collab-name {
  margin: 0;
  font-size: 12.5px;
  font-weight: 700;
  color: #1E293B;
}

.collaborator-card.unavailable .collab-name {
  color: #64748B;
}

.collab-status {
  margin: 2px 0 0;
  font-size: 10.5px;
  font-weight: 600;
}

.text-green {
  color: #10B981;
}

.text-red {
  color: #EF4444;
}

.grip-icon,
.lock-icon {
  color: #CBD5E1;
  flex-shrink: 0;
}

/* Rodapé do Painel */
.allocation-footer {
  padding: 18px 28px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.mobile-sync-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.phone-circle {
  width: 36px;
  height: 36px;
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
  color: #1E293B;
}

.sync-subtitle {
  margin: 1px 0 0;
  font-size: 11px;
  color: #94A3B8;
}

.footer-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.btn-discard {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
  padding: 11px 20px;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.15s;
}

.btn-discard:hover {
  background: #F8FAFC;
  border-color: #CBD5E1;
}

.btn-confirm {
  background: #1E3A8A;
  border: none;
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 700;
  padding: 11px 20px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.2);
  transition: 0.15s;
}

.btn-confirm:hover {
  background: #1E40AF;
}

/* Responsividade */
@media (max-width: 1180px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 820px) {
  .allocation-split {
    grid-template-columns: 1fr;
  }
  .items-column {
    border-right: none;
    border-bottom: 1px solid #F1F5F9;
  }
}

@media (max-width: 640px) {
  .user-info {
    display: none;
  }
}
</style>