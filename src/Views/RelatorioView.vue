<script setup lang="ts">
import { computed, ref } from 'vue'
import Sidebar from '../Components/Sidebar.vue'

type ReportStatusKey = 'execucao' | 'bloqueado' | 'finalizado'

interface MonthlyProductivity {
  month: string
  projetado: number
  realizado: number
}

interface ReportItem {
  id: number
  project: string
  subtitle: string
  date: string
  statusKey: ReportStatusKey
  statusLabel: string
  progress: number
  responsible: string
  notes: string
}

function aoNavegar(menu: string) {
  console.log('Menu selecionado:', menu)
}

const dateRange = ref<string>('01/05/2024 - 31/05/2024')
const selectedProjectFilter = ref<string>('Todos os Projetos')
const searchReport = ref<string>('')
const showAdvancedFilters = ref<boolean>(false)
const minProgressFilter = ref<number>(0)
const selectedReportModal = ref<ReportItem | null>(null)

const monthlyData: MonthlyProductivity[] = [
  { month: 'Jan', projetado: 320, realizado: 300 },
  { month: 'Fev', projetado: 350, realizado: 330 },
  { month: 'Mar', projetado: 410, realizado: 400 },
  { month: 'Abr', projetado: 380, realizado: 400 },
  { month: 'Mai', projetado: 455, realizado: 430 },
  { month: 'Jun', projetado: 420, realizado: 452 },
]

const hoveredBar = ref<{ month: string; projetado: number; realizado: number } | null>(null)

const reports = ref<ReportItem[]>([
  {
    id: 1,
    project: 'Edifício Ocean Breeze',
    subtitle: 'Construtora Omega - Apto 402',
    date: 'Hoje, 14:30',
    statusKey: 'execucao',
    statusLabel: 'EM EXECUÇÃO',
    progress: 75,
    responsible: 'Carlos Mendes',
    notes: 'Instalação das esquadrias da fachada norte concluída; aguardando vidros temperados da varanda.',
  },
  {
    id: 2,
    project: 'Residencial Florada',
    subtitle: 'Bloco C - Unidade 104',
    date: 'Ontem, 09:15',
    statusKey: 'bloqueado',
    statusLabel: 'BLOQUEADO',
    progress: 40,
    responsible: 'Fernanda Souza',
    notes: 'Embargo técnico temporário por divergência de nível no contramarco da suíte.',
  },
  {
    id: 3,
    project: 'Marina Lins',
    subtitle: 'Casa de Campo - Bragança',
    date: '22 Mai 2024',
    statusKey: 'finalizado',
    statusLabel: 'FINALIZADO',
    progress: 100,
    responsible: 'Ricardo Almeida',
    notes: 'Vistoria final aprovada pelo cliente sem pendências de vedação ou acabamento.',
  },
])

const filteredReports = computed<ReportItem[]>(() => {
  return reports.value.filter((item) => {
    const matchesDropdown =
      selectedProjectFilter.value === 'Todos os Projetos' ||
      item.statusLabel === selectedProjectFilter.value.toUpperCase()

    const q = searchReport.value.trim().toLowerCase()
    const matchesSearch =
      !q ||
      item.project.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.statusLabel.toLowerCase().includes(q)

    const matchesProgress = item.progress >= minProgressFilter.value

    return matchesDropdown && matchesSearch && matchesProgress
  })
})

function barHeight(value: number): number {
  const maxVal = 480
  const chartHeight = 190
  return Math.round((value / maxVal) * chartHeight)
}

function barY(value: number): number {
  const baselineY = 210
  return baselineY - barHeight(value)
}

function exportarPdf() {
  window.print()
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
            <h1 class="page-title">Central de Relatórios</h1>
            <span class="title-badge">ANÁLISE DE DADOS</span>
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
      <div class="dashboard-container">
        <!-- Barra de Filtros e Exportação -->
        <section class="toolbar-row">
          <div class="toolbar-left">
            <div class="date-input-box">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input v-model="dateRange" type="text" aria-label="Período" />
            </div>

            <div class="select-box">
              <select v-model="selectedProjectFilter" aria-label="Filtrar projetos">
                <option value="Todos os Projetos">Todos os Projetos</option>
                <option value="Em Execução">Em Execução</option>
                <option value="Bloqueado">Bloqueado</option>
                <option value="Finalizado">Finalizado</option>
              </select>
              <svg class="chevron" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div class="toolbar-right">
            <button
              type="button"
              :class="['btn-outline', { active: showAdvancedFilters }]"
              @click="showAdvancedFilters = !showAdvancedFilters"
            >
              <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 4h18l-7 8.5V19l-4 2v-8.5L3 4z" />
              </svg>
              <span>Filtros Avançados</span>
            </button>

            <button type="button" class="btn-primary" @click="exportarPdf">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 9v4h2l-3 3-3-3h2v-4h2zm1-3V3.5L18.5 8H14z" />
              </svg>
              <span>Exportar em PDF</span>
            </button>
          </div>
        </section>

        <!-- Painel Expansível de Filtros Avançados -->
        <section v-if="showAdvancedFilters" class="card advanced-panel">
          <div class="advanced-field">
            <label>Progresso mínimo da obra: <strong>{{ minProgressFilter }}%</strong></label>
            <input v-model.number="minProgressFilter" type="range" min="0" max="100" step="5" />
          </div>
          <button
            type="button"
            class="reset-filter-btn"
            @click="minProgressFilter = 0; selectedProjectFilter = 'Todos os Projetos'; searchReport = ''"
          >
            Limpar filtros
          </button>
        </section>

        <!-- Linha 1: 4 Cards de KPI -->
        <section class="kpi-grid">
          <!-- Total de Projetos -->
          <div class="card kpi-card">
            <div class="kpi-top">
              <div class="kpi-icon blue">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                </svg>
              </div>
              <span class="pill green">+12%</span>
            </div>
            <p class="kpi-label">TOTAL DE PROJETOS</p>
            <p class="kpi-value">128</p>
          </div>

          <!-- Instalações Concluídas -->
          <div class="card kpi-card">
            <div class="kpi-top">
              <div class="kpi-icon emerald">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span class="pill green">Meta 95%</span>
            </div>
            <p class="kpi-label">INSTALAÇÕES CONCLUÍDAS</p>
            <p class="kpi-value">84</p>
          </div>

          <!-- Embargos Ativos -->
          <div class="card kpi-card">
            <div class="kpi-top">
              <div class="kpi-icon amber">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                </svg>
              </div>
              <span class="pill red">+5 pend.</span>
            </div>
            <p class="kpi-label">EMBARGOS ATIVOS</p>
            <p class="kpi-value">14</p>
          </div>

          <!-- Produção Mensal -->
          <div class="card kpi-card">
            <div class="kpi-top">
              <div class="kpi-icon indigo">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                </svg>
              </div>
              <span class="pill blue">Eficiência</span>
            </div>
            <p class="kpi-label">PRODUÇÃO MENSAL</p>
            <p class="kpi-value">452 itens</p>
          </div>
        </section>

        <!-- Linha 2: Gráficos -->
        <section class="charts-grid">
          <!-- Gráfico de Barras: Produtividade Mensal (Itens) -->
          <div class="card chart-card">
            <div class="chart-header">
              <h2 class="section-title">Produtividade Mensal (Itens)</h2>

              <div class="bar-legend">
                <span class="legend-item">
                  <i class="legend-box navy"></i>
                  Projetado
                </span>
                <span class="legend-item">
                  <i class="legend-box sky"></i>
                  Realizado
                </span>
              </div>
            </div>

            <div class="bar-chart-wrapper">
              <div v-if="hoveredBar" class="chart-tooltip">
                <strong>{{ hoveredBar.month }}</strong>: Projetado {{ hoveredBar.projetado }} | Realizado {{ hoveredBar.realizado }}
              </div>

              <svg viewBox="0 0 640 245" class="bar-svg" role="img" aria-label="Gráfico de Produtividade Mensal">
                <!-- Linhas de Grade Horizontais + Eixo Y -->
                <g v-for="tick in [400, 300, 200, 100, 0]" :key="tick">
                  <text
                    x="34"
                    :y="barY(tick) + 4"
                    text-anchor="end"
                    fill="#94A3B8"
                    font-size="11"
                    font-family="sans-serif"
                  >
                    {{ tick }}
                  </text>
                  <line
                    x1="46"
                    :y1="barY(tick)"
                    x2="620"
                    :y2="barY(tick)"
                    :stroke="tick === 0 ? '#CBD5E1' : '#F1F5F9'"
                    stroke-width="1"
                  />
                </g>

                <!-- Grupos de Barras por Mês -->
                <g
                  v-for="(item, index) in monthlyData"
                  :key="item.month"
                  :transform="`translate(${66 + index * 92}, 0)`"
                  class="bar-group"
                  @mouseenter="hoveredBar = item"
                  @mouseleave="hoveredBar = null"
                >
                  <!-- Barra Projetado -->
                  <rect
                    x="0"
                    :y="barY(item.projetado)"
                    width="34"
                    :height="barHeight(item.projetado)"
                    rx="3"
                    fill="#1E3A8A"
                  />
                  <!-- Barra Realizado -->
                  <rect
                    x="36"
                    :y="barY(item.realizado)"
                    width="34"
                    :height="barHeight(item.realizado)"
                    rx="3"
                    fill="#8CC5FC"
                  />
                  <!-- Rótulo do Mês -->
                  <text
                    x="35"
                    y="232"
                    text-anchor="middle"
                    fill="#64748B"
                    font-size="11"
                    font-family="sans-serif"
                  >
                    {{ item.month }}
                  </text>
                </g>
              </svg>
            </div>
          </div>

          <!-- Gráfico Donut: Status de Instalação -->
          <div class="card chart-card donut-card">
            <div class="chart-header">
              <h2 class="section-title">Status de Instalação</h2>
            </div>

            <div class="donut-body">
              <svg viewBox="0 0 200 200" class="donut-svg" role="img" aria-label="Status de Instalação">
                <!-- Pendente (Laranja ~21%) -->
                <circle
                  cx="100"
                  cy="100"
                  r="66"
                  fill="none"
                  stroke="#F59E0B"
                  stroke-width="26"
                  stroke-dasharray="87 415"
                  stroke-dashoffset="-253"
                  transform="rotate(-90 100 100)"
                />
                <!-- Bloqueado (Vermelho ~15%) -->
                <circle
                  cx="100"
                  cy="100"
                  r="66"
                  fill="none"
                  stroke="#EF4444"
                  stroke-width="26"
                  stroke-dasharray="62 415"
                  stroke-dashoffset="-191"
                  transform="rotate(-90 100 100)"
                />
                <!-- Concluído (Verde ~64%) -->
                <circle
                  cx="100"
                  cy="100"
                  r="66"
                  fill="none"
                  stroke="#10B981"
                  stroke-width="26"
                  stroke-dasharray="266 415"
                  stroke-dashoffset="75"
                  transform="rotate(-90 100 100)"
                />
              </svg>

              <div class="donut-legend">
                <div class="legend-row">
                  <span class="legend-item">
                    <i class="legend-box green"></i>
                    Concluído
                  </span>
                  <span class="legend-item">
                    <i class="legend-box amber"></i>
                    Pendente
                  </span>
                </div>
                <div class="legend-row">
                  <span class="legend-item">
                    <i class="legend-box red"></i>
                    Bloqueado
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Linha 3: Relatórios Recentes -->
        <section class="card table-card">
          <div class="table-header">
            <div>
              <h2 class="section-title">Relatórios Recentes</h2>
              <p class="section-subtitle">Últimas atividades e atualizações de obras</p>
            </div>

            <div class="table-search">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input v-model="searchReport" type="text" placeholder="Buscar relatório..." />
            </div>
          </div>

          <div class="table-scroll">
            <table class="reports-table">
              <thead>
                <tr>
                  <th>PROJETO / OBRA</th>
                  <th>DATA</th>
                  <th>STATUS</th>
                  <th>PROGRESSO</th>
                  <th class="text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="report in filteredReports" :key="report.id">
                  <td>
                    <div class="project-cell">
                      <span class="project-name">{{ report.project }}</span>
                      <span class="project-sub">{{ report.subtitle }}</span>
                    </div>
                  </td>

                  <td class="date-cell">{{ report.date }}</td>

                  <td>
                    <span :class="['status-badge', `status-${report.statusKey}`]">
                      {{ report.statusLabel }}
                    </span>
                  </td>

                  <td>
                    <div class="progress-inline">
                      <div class="progress-track">
                        <div
                          :class="['progress-fill', `fill-${report.statusKey}`]"
                          :style="{ width: `${report.progress}%` }"
                        ></div>
                      </div>
                      <strong class="progress-pct">{{ report.progress }}%</strong>
                    </div>
                  </td>

                  <td class="text-right">
                    <button
                      type="button"
                      class="details-link"
                      @click="selectedReportModal = report"
                    >
                      Ver detalhes
                    </button>
                  </td>
                </tr>

                <tr v-if="filteredReports.length === 0">
                  <td colspan="5" class="empty-row">
                    Nenhum relatório encontrado para os filtros aplicados.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <!-- Modal: Detalhes do Relatório -->
      <div
        v-if="selectedReportModal"
        class="modal-backdrop"
        @click.self="selectedReportModal = null"
      >
        <div class="modal-box">
          <div class="modal-header">
            <div>
              <h3>{{ selectedReportModal.project }}</h3>
              <p class="modal-sub">{{ selectedReportModal.subtitle }}</p>
            </div>
            <button type="button" @click="selectedReportModal = null">&times;</button>
          </div>

          <div class="modal-body">
            <div class="modal-meta">
              <span><strong>Responsável:</strong> {{ selectedReportModal.responsible }}</span>
              <span><strong>Atualização:</strong> {{ selectedReportModal.date }}</span>
              <span><strong>Avanço:</strong> {{ selectedReportModal.progress }}%</span>
            </div>
            <p class="modal-notes">{{ selectedReportModal.notes }}</p>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-primary" @click="selectedReportModal = null">
              Fechar
            </button>
          </div>
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
.dashboard-container {
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 28px 36px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.card {
  background: #FFFFFF;
  border-radius: 16px;
  border: 1px solid #F1F5F9;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}

/* Toolbar de Filtros */
.toolbar-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.date-input-box {
  position: relative;
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 11px;
  padding: 0 14px;
  height: 40px;
  min-width: 240px;
}

.date-input-box svg {
  color: #94A3B8;
  margin-right: 8px;
  flex-shrink: 0;
}

.date-input-box input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: #475569;
  width: 100%;
}

.select-box {
  position: relative;
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 11px;
  height: 40px;
}

.select-box select {
  appearance: none;
  border: none;
  outline: none;
  background: transparent;
  padding: 0 36px 0 14px;
  font-size: 13px;
  font-weight: 500;
  color: #334155;
  cursor: pointer;
  height: 100%;
}

.select-box .chevron {
  position: absolute;
  right: 12px;
  color: #64748B;
  pointer-events: none;
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 16px;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 11px;
  font-size: 13px;
  font-weight: 600;
  color: #1E293B;
  cursor: pointer;
  transition: 0.15s;
}

.btn-outline:hover,
.btn-outline.active {
  background: #F1F5F9;
  border-color: #CBD5E1;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 18px;
  background: #1E3A8A;
  border: none;
  border-radius: 11px;
  font-size: 13px;
  font-weight: 600;
  color: #FFFFFF;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(30, 58, 138, 0.18);
  transition: 0.15s;
}

.btn-primary:hover {
  background: #1E40AF;
}

/* Painel Avançado */
.advanced-panel {
  padding: 16px 20px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.advanced-field {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 13px;
  color: #475569;
}

.advanced-field input[type='range'] {
  accent-color: #1E3A8A;
}

.reset-filter-btn {
  background: #F1F5F9;
  border: none;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
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
.kpi-icon.emerald { background: #ECFDF5; color: #10B981; }
.kpi-icon.amber { background: #FEF3C7; color: #F59E0B; }
.kpi-icon.indigo { background: #EEF2FF; color: #4F46E5; }

.pill {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
}

.pill.green { background: #ECFDF5; color: #10B981; }
.pill.red { background: #FEF2F2; color: #EF4444; }
.pill.blue { background: #EFF6FF; color: #2563EB; }

.kpi-label {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: #64748B;
}

.kpi-value {
  margin: 6px 0 0;
  font-size: 26px;
  font-weight: 700;
  color: #1E293B;
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: 1.9fr 1fr;
  gap: 22px;
}

.chart-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
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

.bar-legend {
  display: flex;
  align-items: center;
  gap: 16px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 500;
  color: #64748B;
}

.legend-box {
  display: inline-block;
  width: 11px;
  height: 11px;
  border-radius: 3px;
}

.legend-box.navy { background: #1E3A8A; }
.legend-box.sky { background: #8CC5FC; }
.legend-box.green { background: #10B981; }
.legend-box.amber { background: #F59E0B; }
.legend-box.red { background: #EF4444; }

.bar-chart-wrapper {
  position: relative;
  width: 100%;
  flex: 1;
  display: flex;
  align-items: center;
}

.chart-tooltip {
  position: absolute;
  top: 0;
  right: 8px;
  background: #1E293B;
  color: #FFFFFF;
  font-size: 11px;
  padding: 5px 10px;
  border-radius: 8px;
  pointer-events: none;
}

.bar-svg {
  width: 100%;
  height: auto;
  display: block;
}

.bar-group {
  cursor: pointer;
}

.bar-group:hover rect {
  opacity: 0.88;
}

/* Donut */
.donut-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.donut-svg {
  width: 195px;
  height: 195px;
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 210px;
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 22px;
}

/* Tabela Relatórios Recentes */
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

.table-search {
  position: relative;
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 11px;
  padding: 0 14px;
  height: 38px;
  min-width: 230px;
}

.table-search svg {
  color: #94A3B8;
  margin-right: 8px;
}

.table-search input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: #334155;
  width: 100%;
}

.table-scroll {
  overflow-x: auto;
}

.reports-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.reports-table th {
  padding: 13px 24px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94A3B8;
  border-bottom: 1px solid #F1F5F9;
}

.reports-table td {
  padding: 16px 24px;
  font-size: 13px;
  border-bottom: 1px solid #F1F5F9;
  white-space: nowrap;
}

.reports-table tbody tr:last-child td {
  border-bottom: none;
}

.reports-table tbody tr:hover {
  background: #F8FAFC;
}

.project-cell {
  display: flex;
  flex-direction: column;
}

.project-name {
  font-weight: 700;
  color: #1E293B;
}

.project-sub {
  font-size: 11px;
  color: #94A3B8;
  margin-top: 2px;
}

.date-cell {
  color: #64748B;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.status-execucao { background: #DBEAFE; color: #1D4ED8; }
.status-bloqueado { background: #FEE2E2; color: #EF4444; }
.status-finalizado { background: #DCFCE7; color: #15803D; }

.progress-inline {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-track {
  width: 84px;
  height: 6px;
  background: #F1F5F9;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
}

.fill-execucao,
.fill-finalizado {
  background: #10B981;
}

.fill-bloqueado {
  background: #F59E0B;
}

.progress-pct {
  font-size: 12px;
  color: #1E293B;
}

.text-right {
  text-align: right;
}

.details-link {
  background: transparent;
  border: none;
  color: #1E3A8A;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
}

.details-link:hover {
  background: #EFF6FF;
}

.empty-row {
  text-align: center;
  padding: 32px;
  color: #64748B;
}

/* Modal Detalhes */
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
  max-width: 440px;
  padding: 24px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.modal-sub {
  margin: 3px 0 0;
  font-size: 12px;
  color: #64748B;
}

.modal-header button {
  background: none;
  border: none;
  font-size: 22px;
  color: #94A3B8;
  cursor: pointer;
}

.modal-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #334155;
  background: #F8FAFC;
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 12px;
}

.modal-notes {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #475569;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

/* Responsividade */
@media (max-width: 1150px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
  .user-info {
    display: none;
  }
}

@media print {
  .topbar-actions,
  .toolbar-right {
    display: none;
  }
}
</style>