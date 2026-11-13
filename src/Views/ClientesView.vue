<script setup lang="ts">
import { computed, ref } from 'vue'
import Sidebar from '../Components/Sidebar.vue'

type TabCategory = 'Todos' | 'PF' | 'PJ' | 'Arquivados'
type ClientGroup = 'PF' | 'PJ'
type StatusKey = 'ativo' | 'producao' | 'medicao' | 'fidelizado'

interface Client {
  id: number
  initials: string
  name: string
  email: string
  typeLabel: string
  group: ClientGroup
  statusKey: StatusKey
  statusLabel: string
  lastContact: string
  archived?: boolean
}

function aoNavegar(menu: string) {
  console.log('Menu selecionado:', menu)
}

const searchQuery = ref<string>('')
const activeTab = ref<TabCategory>('Todos')
const currentPage = ref<number>(1)
const showModal = ref<boolean>(false)
const totalClientes = ref<number>(1284)

const newClient = ref<{
  name: string
  email: string
  typeLabel: string
}>({
  name: '',
  email: '',
  typeLabel: 'Pessoa Física',
})

const tabs: TabCategory[] = ['Todos', 'PF', 'PJ', 'Arquivados']

const clients = ref<Client[]>([
  {
    id: 1,
    initials: 'ML',
    name: 'Marina Lins',
    email: 'marina.lins@email.com',
    typeLabel: 'Pessoa Física',
    group: 'PF',
    statusKey: 'ativo',
    statusLabel: 'ATIVO',
    lastContact: 'Hoje, 14:30',
  },
  {
    id: 2,
    initials: 'CO',
    name: 'Construtora Omega',
    email: 'contato@omega.com.br',
    typeLabel: 'Pessoa Jurídica',
    group: 'PJ',
    statusKey: 'producao',
    statusLabel: 'EM PRODUÇÃO',
    lastContact: 'Ontem, 09:15',
  },
  {
    id: 3,
    initials: 'JA',
    name: 'Joaquim Azevedo',
    email: 'joaquim.aze@gmail.com',
    typeLabel: 'Pessoa Física',
    group: 'PF',
    statusKey: 'medicao',
    statusLabel: 'MEDIÇÃO',
    lastContact: '12 Out 2023',
  },
  {
    id: 4,
    initials: 'RF',
    name: 'Residencial Florada',
    email: 'admin@residencialflorada.com',
    typeLabel: 'Condomínio (PJ)',
    group: 'PJ',
    statusKey: 'fidelizado',
    statusLabel: 'FIDELIZADO',
    lastContact: '10 Out 2023',
  },
])

const formattedTotalClientes = computed<string>(() => {
  return totalClientes.value.toLocaleString('en-US')
})

const filteredClients = computed<Client[]>(() => {
  return clients.value.filter((client) => {
    let matchesTab = true
    if (activeTab.value === 'Arquivados') {
      matchesTab = Boolean(client.archived)
    } else if (activeTab.value === 'PF' || activeTab.value === 'PJ') {
      matchesTab = !client.archived && client.group === activeTab.value
    } else {
      matchesTab = !client.archived
    }

    const q = searchQuery.value.trim().toLowerCase()
    const matchesQuery =
      !q ||
      client.name.toLowerCase().includes(q) ||
      client.email.toLowerCase().includes(q) ||
      client.typeLabel.toLowerCase().includes(q) ||
      client.statusLabel.toLowerCase().includes(q)

    return matchesTab && matchesQuery
  })
})

function addClient() {
  if (!newClient.value.name.trim() || !newClient.value.email.trim()) return

  const initials = newClient.value.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')

  const isPJ = newClient.value.typeLabel !== 'Pessoa Física'

  clients.value.unshift({
    id: Date.now(),
    initials: initials || 'NC',
    name: newClient.value.name.trim(),
    email: newClient.value.email.trim(),
    typeLabel: newClient.value.typeLabel,
    group: isPJ ? 'PJ' : 'PF',
    statusKey: 'ativo',
    statusLabel: 'ATIVO',
    lastContact: 'Agora',
  })

  totalClientes.value += 1
  newClient.value = {
    name: '',
    email: '',
    typeLabel: 'Pessoa Física',
  }
  showModal.value = false
}

function baixarCsv() {
  const header = ['Nome / Razão Social', 'E-mail', 'Tipo', 'Status', 'Último Contato']
  const rows = filteredClients.value.map((c) => [
    `"${c.name}"`,
    `"${c.email}"`,
    `"${c.typeLabel}"`,
    `"${c.statusLabel}"`,
    `"${c.lastContact}"`,
  ])

  const csvContent = '\uFEFF' + [header.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'clientes_sa_esquadrias.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
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
              placeholder="Buscar clientes ou contatos..."
            />
          </div>

          <div class="topbar-actions">
            <button type="button" class="icon-btn" aria-label="Notificações">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span class="notif-dot"></span>
            </button>

            <button type="button" class="icon-btn" aria-label="Calendário">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>

            <div class="divider"></div>

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
        <!-- Linha 1: 4 Cards de KPI -->
        <section class="kpi-grid">
          <div class="card kpi-card">
            <div class="kpi-top">
              <div class="kpi-icon blue">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zM7.17 14.75l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0020 4H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7.42c-.14 0-.25-.11-.25-.25z" />
                </svg>
              </div>
              <span class="pill green">+5.2%</span>
            </div>
            <p class="kpi-label">Total de Clientes</p>
            <p class="kpi-value">{{ formattedTotalClientes }}</p>
          </div>

          <div class="card kpi-card">
            <div class="kpi-top">
              <div class="kpi-icon yellow">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 5v14a1 1 0 001 1h14M8 20v-3m4 3v-2m4 2v-3M4 9h3m-3 4h2m-2 4h3" />
                </svg>
              </div>
            </div>
            <p class="kpi-label">Novos Prospectos</p>
            <p class="kpi-value">42</p>
          </div>

          <div class="card kpi-card">
            <div class="kpi-top">
              <div class="kpi-icon indigo">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <p class="kpi-label">Aguardando Retorno</p>
            <p class="kpi-value">18</p>
          </div>

          <div class="card kpi-card">
            <div class="kpi-top">
              <div class="kpi-icon emerald">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                </svg>
              </div>
              <span class="pill green-strong">84% Retenção</span>
            </div>
            <p class="kpi-label">Clientes Ativos</p>
            <p class="kpi-value">892</p>
          </div>
        </section>

        <!-- Linha 2: Listagem de Clientes -->
        <section class="card table-card">
          <div class="table-header">
            <div>
              <h2 class="section-title">Listagem de Clientes</h2>
              <p class="section-subtitle">Gerencie sua base de contatos e parceiros</p>
            </div>

            <div class="header-controls">
              <div class="tabs-group">
                <button
                  v-for="tab in tabs"
                  :key="tab"
                  type="button"
                  @click="activeTab = tab"
                  :class="['tab-btn', { active: activeTab === tab }]"
                >
                  {{ tab }}
                </button>
              </div>

              <button type="button" class="new-client-btn" @click="showModal = true">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m-7-7h14" />
                </svg>
                <span>Novo Cliente</span>
              </button>
            </div>
          </div>

          <div class="table-scroll">
            <table class="clients-table">
              <thead>
                <tr>
                  <th>Nome / Razão Social</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Último Contato</th>
                  <th class="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="client in filteredClients" :key="client.id">
                  <td>
                    <div class="client-cell">
                      <span class="client-avatar">{{ client.initials }}</span>
                      <div class="client-identity">
                        <span class="client-name">{{ client.name }}</span>
                        <span class="client-email">{{ client.email }}</span>
                      </div>
                    </div>
                  </td>

                  <td class="client-type">{{ client.typeLabel }}</td>

                  <td>
                    <span :class="['status-badge', `status-${client.statusKey}`]">
                      {{ client.statusLabel }}
                    </span>
                  </td>

                  <td class="last-contact">{{ client.lastContact }}</td>

                  <td class="text-right">
                    <button type="button" class="dots-btn" title="Opções do cliente">
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                      </svg>
                    </button>
                  </td>
                </tr>

                <tr v-if="filteredClients.length === 0">
                  <td colspan="5" class="empty-row">
                    Nenhum cliente encontrado para o filtro selecionado.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="table-footer">
            <span>Mostrando 1 a 10 de {{ formattedTotalClientes }} clientes</span>

            <div class="pagination">
              <button type="button" @click="currentPage = Math.max(1, currentPage - 1)">&lsaquo;</button>
              <button
                v-for="page in [1, 2, 3]"
                :key="page"
                type="button"
                :class="{ active: currentPage === page }"
                @click="currentPage = page"
              >
                {{ page }}
              </button>
              <button type="button" @click="currentPage = Math.min(3, currentPage + 1)">&rsaquo;</button>
            </div>
          </div>
        </section>

        <!-- Linha 3: Cards Inferiores -->
        <section class="bottom-grid">
          <!-- Card CTA: Exportar Relatório -->
          <div class="cta-card">
            <div class="cta-watermark">
              <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m-7-7h14" />
              </svg>
            </div>
            <div>
              <h3>Exportar Relatório?</h3>
              <p>Gere uma planilha completa com todos os dados de clientes.</p>
            </div>
            <button type="button" class="cta-btn" @click="baixarCsv">
              Baixar CSV
            </button>
          </div>

          <!-- Card: Contatos Recentes -->
          <div class="card info-card">
            <div class="info-icon">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 10l9-6 9 6v9a1 1 0 01-1 1h-3v-6H7v6H4a1 1 0 01-1-1v-9z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 16h6" />
              </svg>
            </div>
            <div class="info-content">
              <h3>Contatos Recentes</h3>
              <p>14 interações nas últimas 24h</p>
              <div class="stock-track">
                <div class="stock-fill" style="width: 68%"></div>
              </div>
            </div>
          </div>

          <!-- Card: NPS da Base -->
          <div class="card info-card">
            <div class="info-icon">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div class="info-content">
              <h3>NPS da Base</h3>
              <p>Média geral de satisfação</p>
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

      <!-- Modal Rápido: Novo Cliente -->
      <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
        <div class="modal-box">
          <div class="modal-header">
            <h3>Cadastrar Novo Cliente</h3>
            <button type="button" @click="showModal = false">&times;</button>
          </div>

          <form @submit.prevent="addClient" class="modal-form">
            <div>
              <label>Nome ou Razão Social</label>
              <input
                v-model="newClient.name"
                type="text"
                required
                placeholder="Ex.: Construtora Horizonte"
              />
            </div>

            <div>
              <label>E-mail de Contato</label>
              <input
                v-model="newClient.email"
                type="email"
                required
                placeholder="contato@empresa.com.br"
              />
            </div>

            <div>
              <label>Tipo de Cadastro</label>
              <select v-model="newClient.typeLabel">
                <option value="Pessoa Física">Pessoa Física</option>
                <option value="Pessoa Jurídica">Pessoa Jurídica</option>
                <option value="Condomínio (PJ)">Condomínio (PJ)</option>
              </select>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-cancel" @click="showModal = false">Cancelar</button>
              <button type="submit" class="btn-submit">Salvar Cliente</button>
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

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid #E2E8F0;
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

/* Tabela Listagem de Clientes */
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

.header-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
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

.new-client-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #1E3A8A;
  color: #FFFFFF;
  border: none;
  border-radius: 12px;
  padding: 9px 16px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.15s;
}

.new-client-btn:hover {
  background: #1E40AF;
}

.table-scroll {
  overflow-x: auto;
}

.clients-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.clients-table th {
  padding: 13px 24px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94A3B8;
  border-bottom: 1px solid #F1F5F9;
}

.clients-table td {
  padding: 15px 24px;
  font-size: 13px;
  border-bottom: 1px solid #F1F5F9;
  white-space: nowrap;
}

.clients-table tbody tr:hover {
  background: #F8FAFC;
}

.client-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.client-avatar {
  width: 34px;
  height: 34px;
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

.client-identity {
  display: flex;
  flex-direction: column;
}

.client-name {
  font-weight: 700;
  color: #1E293B;
}

.client-email {
  font-size: 11px;
  color: #94A3B8;
  margin-top: 1px;
}

.client-type {
  color: #475569;
  font-weight: 500;
}

.last-contact {
  color: #64748B;
  font-size: 13px;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.status-ativo { background: #DCFCE7; color: #15803D; }
.status-producao { background: #DBEAFE; color: #1D4ED8; }
.status-medicao { background: #FEF9C3; color: #A16207; }
.status-fidelizado { background: #F3E8FF; color: #7E22CE; }

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
  min-height: 142px;
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
  max-width: 240px;
  line-height: 1.45;
}

.cta-btn {
  align-self: flex-start;
  margin-top: 16px;
  background: #FFFFFF;
  color: #1E3A8A;
  border: none;
  border-radius: 10px;
  padding: 10px 18px;
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
  line-height: 1.4;
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

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-form label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
}

.modal-form input,
.modal-form select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #CBD5E1;
  border-radius: 10px;
  font-size: 13px;
  color: #1E293B;
  background: #FFFFFF;
  outline: none;
}

.modal-form input:focus,
.modal-form select:focus {
  border-color: #2563EB;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 6px;
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

/* Responsividade */
@media (max-width: 1150px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
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