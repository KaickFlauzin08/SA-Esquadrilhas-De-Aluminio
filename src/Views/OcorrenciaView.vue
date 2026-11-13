<script setup lang="ts">
import { computed, ref } from 'vue'
import Sidebar from '../Components/Sidebar.vue'

type FilterTab = 'Todos' | 'Crítico' | 'Aberto' | 'Em Curso' | 'Finalizado'
type OccurrenceStatus = 'critico' | 'resolucao' | 'aberto' | 'resolvido'

interface Occurrence {
  id: string
  ticket: string
  title: string
  address: string
  teamShort: string
  teamFull: string
  teamAvatar: string
  status: OccurrenceStatus
  badgeLabel: string
  timestamp: string
  reportedAtFull: string
  shortDescription: string
  fullDescription: string
  footerNote: string
  footerType: 'muted' | 'resolved'
  actionLabel: string
  actionVariant: 'orange' | 'outline' | 'link'
  images: string[]
}

function aoNavegar(menu: string) {
  console.log('Menu selecionado:', menu)
}

const searchQuery = ref<string>('')
const activeTab = ref<FilterTab>('Todos')
const selectedPeriod = ref<string>('Últimos 30 dias')
const selectedTeam = ref<string>('Todas Equipes')
const isDrawerOpen = ref<boolean>(true)
const selectedOccurrenceId = ref<string>('1')
const selectedPhotoIndex = ref<number>(0)
const photoInputRef = ref<HTMLInputElement | null>(null)
const saveFeedback = ref<boolean>(false)

const filterTabs: FilterTab[] = ['Todos', 'Crítico', 'Aberto', 'Em Curso', 'Finalizado']

const occurrences = ref<Occurrence[]>([
  {
    id: '1',
    ticket: '#49210',
    title: 'Residencial Aurora - Apto 402',
    address: 'Av. das Nações, 1420 - Bloco B',
    teamShort: 'Equipe Alfa',
    teamFull: 'Equipe Alfa (Marcos/Sandro)',
    teamAvatar:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
    status: 'critico',
    badgeLabel: 'ABERTO - CRÍTICO',
    timestamp: '15 OUT, 09:30',
    reportedAtFull: '15/10/2023 às 09:30',
    shortDescription:
      'Infiltração identificada no trilho inferior da porta de correr. Guarnição de borracha apresenta folga de 5mm no canto esquerdo superior.',
    fullDescription:
      'Infiltração grave identificada pela equipe durante a vistoria final. A água está penetrando pela junção do marco com a alvenaria. Suspeita de falha na aplicação do selante PU ou desnível no contramarco. O cliente está solicitando reparo imediato antes da pintura final.',
    footerNote: 'Reportado via App Mobile',
    footerType: 'muted',
    actionLabel: 'Resolver Pendência',
    actionVariant: 'orange',
    images: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    id: '2',
    ticket: '#49198',
    title: 'Condomínio Mirante - Casa 12',
    address: 'Rua das Acácias, 310 - Jardins',
    teamShort: 'Equipe Beta',
    teamFull: 'Equipe Beta (João/Paulo)',
    teamAvatar:
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80',
    status: 'resolucao',
    badgeLabel: 'EM RESOLUÇÃO',
    timestamp: '14 OUT, 14:15',
    reportedAtFull: '14/10/2023 às 14:15',
    shortDescription:
      'Puxador da janela oscilo-batente apresenta arranhão superficial e folga no acionamento mecânico. Necessária substituição da peça.',
    fullDescription:
      'Durante a conferência de ferragens na suíte master, foi constatado risco no acabamento anodizado do puxador e leve folga no cremona. Equipe técnica já está em deslocamento com o kit de reposição original.',
    footerNote: 'Equipe a caminho',
    footerType: 'muted',
    actionLabel: 'Ver Detalhes',
    actionVariant: 'outline',
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    id: '3',
    ticket: '#49185',
    title: 'Edifício Solar - Cob. 01',
    address: 'Av. Beira Mar, 890 - Centro',
    teamShort: 'Equipe Gama',
    teamFull: 'Equipe Gama (Lucas/Pedro)',
    teamAvatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
    status: 'aberto',
    badgeLabel: 'ABERTO',
    timestamp: '14 OUT, 10:20',
    reportedAtFull: '14/10/2023 às 10:20',
    shortDescription:
      'Ajuste de regulagem nas roldanas da folha central do fechamento de sacada para suavizar o deslizamento.',
    fullDescription:
      'Cliente relatou leve atrito ao deslizar a folha 03 do sistema envidraçado da varanda gourmet. Agendada visita preventiva para alinhamento das roldanas e lubrificação dos trilhos.',
    footerNote: 'Aguardando visita',
    footerType: 'muted',
    actionLabel: 'Ver Detalhes',
    actionVariant: 'outline',
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    id: '4',
    ticket: '#49164',
    title: 'Torre Norte - Sala 1201',
    address: 'Alameda Santos, 2100 - Conj. 1201',
    teamShort: 'Equipe Alfa',
    teamFull: 'Equipe Alfa (Marcos/Sandro)',
    teamAvatar:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
    status: 'resolvido',
    badgeLabel: 'RESOLVIDO',
    timestamp: '13 OUT, 16:45',
    reportedAtFull: '13/10/2023 às 16:45',
    shortDescription:
      'Vedações trocadas e testadas com jato de água. Nenhuma infiltração detectada. Cliente aprovou o serviço.',
    fullDescription:
      'Substituição completa das borrachas EPDM perimetrais e reaplicação de silicone estrutural neutro na fachada pele de vidro. Teste de estanqueidade aprovado com assinatura do engenheiro responsável.',
    footerNote: 'Finalizado em 14/10',
    footerType: 'resolved',
    actionLabel: 'Ver Histórico',
    actionVariant: 'link',
    images: [
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80',
    ],
  },
])

const filteredOccurrences = computed<Occurrence[]>(() => {
  return occurrences.value.filter((item) => {
    let matchesTab = true
    if (activeTab.value === 'Crítico') matchesTab = item.status === 'critico'
    else if (activeTab.value === 'Aberto')
      matchesTab = item.status === 'aberto' || item.status === 'critico'
    else if (activeTab.value === 'Em Curso') matchesTab = item.status === 'resolucao'
    else if (activeTab.value === 'Finalizado') matchesTab = item.status === 'resolvido'

    const matchesTeam =
      selectedTeam.value === 'Todas Equipes' || item.teamShort === selectedTeam.value

    const q = searchQuery.value.trim().toLowerCase()
    const matchesQuery =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.teamFull.toLowerCase().includes(q) ||
      item.shortDescription.toLowerCase().includes(q) ||
      item.ticket.toLowerCase().includes(q)

    return matchesTab && matchesTeam && matchesQuery
  })
})

const selectedOccurrence = computed<Occurrence>(() => {
  return (
    occurrences.value.find((o) => o.id === selectedOccurrenceId.value) ??
    occurrences.value[0]!
  )
})

const activePreviewImage = computed<string>(() => {
  return (
    selectedOccurrence.value.images[selectedPhotoIndex.value] ??
    selectedOccurrence.value.images[0] ??
    ''
  )
})

function abrirDetalhes(item: Occurrence) {
  selectedOccurrenceId.value = item.id
  selectedPhotoIndex.value = 0
  saveFeedback.value = false
  isDrawerOpen.value = true
}

function abrirSeletorFoto() {
  photoInputRef.value?.click()
}

function adicionarFoto(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const objectUrl = URL.createObjectURL(file)
  selectedOccurrence.value.images.push(objectUrl)
  selectedPhotoIndex.value = selectedOccurrence.value.images.length - 1
  target.value = ''
}

function salvarAlteracoes() {
  saveFeedback.value = true
  setTimeout(() => {
    saveFeedback.value = false
  }, 2500)
}
</script>

<template>
  <div class="layout-wrapper">
    <Sidebar @navigate="aoNavegar" />

    <div class="workspace-shell">
      <!-- Área Principal (Esquerda / Centro) -->
      <main class="main-area">
        <!-- Topbar -->
        <header class="topbar">
          <h1 class="page-title">Gestão de Ocorrências</h1>

          <div class="search-box">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar pendências, obras ou clientes..."
            />
          </div>
        </header>

        <!-- Conteúdo -->
        <div class="content-body">
          <!-- KPIs -->
          <section class="kpi-grid">
            <div class="kpi-card">
              <p class="kpi-label">Total Pendências</p>
              <div class="kpi-bottom">
                <strong class="kpi-value">124</strong>
                <span class="kpi-pill blue">+12% mês</span>
              </div>
            </div>

            <div class="kpi-card border-red">
              <p class="kpi-label">Em Aberto</p>
              <div class="kpi-bottom">
                <strong class="kpi-value text-red">32</strong>
                <svg class="kpi-watermark-icon" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div class="kpi-card border-amber">
              <p class="kpi-label">Em Resolução</p>
              <div class="kpi-bottom">
                <strong class="kpi-value text-amber">45</strong>
                <svg class="kpi-watermark-icon" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
          </section>

          <!-- Barra de Filtros -->
          <section class="filters-bar">
            <div class="tabs-segmented">
              <button
                v-for="tab in filterTabs"
                :key="tab"
                type="button"
                :class="['seg-btn', { active: activeTab === tab }]"
                @click="activeTab = tab"
              >
                {{ tab }}
              </button>
            </div>

            <div class="filter-divider"></div>

            <div class="dropdown-group">
              <div class="filter-select">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <select v-model="selectedPeriod" aria-label="Período">
                  <option value="Últimos 30 dias">Últimos 30 dias</option>
                  <option value="Últimos 7 dias">Últimos 7 dias</option>
                  <option value="Este mês">Este mês</option>
                </select>
                <svg class="chevron" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              <div class="filter-select">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <select v-model="selectedTeam" aria-label="Equipes">
                  <option value="Todas Equipes">Todas Equipes</option>
                  <option value="Equipe Alfa">Equipe Alfa</option>
                  <option value="Equipe Beta">Equipe Beta</option>
                  <option value="Equipe Gama">Equipe Gama</option>
                </select>
                <svg class="chevron" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </section>

          <!-- Grade de Ocorrências -->
          <section :class="['cards-grid', { 'drawer-open': isDrawerOpen }]">
            <article
              v-for="item in filteredOccurrences"
              :key="item.id"
              :class="['occ-card', { selected: isDrawerOpen && selectedOccurrence.id === item.id }]"
              @click="abrirDetalhes(item)"
            >
              <!-- Cabeçalho do Card -->
              <div class="occ-header">
                <div class="occ-top-row">
                  <span :class="['status-badge', `badge-${item.status}`]">
                    {{ item.badgeLabel }}
                  </span>
                  <span class="occ-time">{{ item.timestamp }}</span>
                </div>

                <h2 class="occ-title">{{ item.title }}</h2>
                <p class="occ-team">
                  <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                  <span>{{ item.teamFull }}</span>
                </p>
              </div>

              <!-- Corpo com Foto + Descrição -->
              <div class="occ-body">
                <img :src="item.images[0]" :alt="item.title" class="occ-thumb" />
                <p class="occ-desc">{{ item.shortDescription }}</p>
              </div>

              <!-- Rodapé do Card -->
              <div class="occ-footer">
                <span v-if="item.footerType === 'resolved'" class="footer-resolved">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  {{ item.footerNote }}
                </span>
                <span v-else class="footer-muted">{{ item.footerNote }}</span>

                <button
                  type="button"
                  :class="['card-action-btn', `btn-${item.actionVariant}`]"
                  @click.stop="abrirDetalhes(item)"
                >
                  {{ item.actionLabel }}
                </button>
              </div>
            </article>

            <div v-if="filteredOccurrences.length === 0" class="empty-state">
              Nenhuma ocorrência encontrada para os filtros selecionados.
            </div>
          </section>
        </div>
      </main>

      <!-- Painel Lateral Direito: Detalhes da Ocorrência -->
      <aside v-if="isDrawerOpen" class="details-drawer">
        <div class="drawer-header">
          <h2>Detalhes da Ocorrência</h2>
          <button
            type="button"
            class="close-drawer-btn"
            aria-label="Fechar detalhes"
            @click="isDrawerOpen = false"
          >
            &times;
          </button>
        </div>

        <div class="drawer-scroll">
          <!-- Ticket & Título -->
          <div class="drawer-ticket-row">
            <span :class="['status-badge', `badge-${selectedOccurrence.status}`]">
              {{ selectedOccurrence.badgeLabel }}
            </span>
            <span class="ticket-number">Ticket {{ selectedOccurrence.ticket }}</span>
          </div>

          <h3 class="drawer-title">{{ selectedOccurrence.title }}</h3>
          <p class="drawer-address">{{ selectedOccurrence.address }}</p>

          <!-- Evidência Fotográfica -->
          <div class="drawer-section">
            <label class="micro-label">EVIDÊNCIA FOTOGRÁFICA</label>

            <div class="hero-photo-box">
              <img :src="activePreviewImage" :alt="selectedOccurrence.title" />
            </div>

            <div class="thumbs-strip">
              <button
                v-for="(img, idx) in selectedOccurrence.images"
                :key="`${selectedOccurrence.id}-photo-${idx}`"
                type="button"
                :class="['thumb-btn', { active: selectedPhotoIndex === idx }]"
                @click="selectedPhotoIndex = idx"
              >
                <img :src="img" :alt="`Evidência ${idx + 1}`" />
              </button>

              <input
                ref="photoInputRef"
                type="file"
                accept="image/*"
                class="hidden-file"
                @change="adicionarFoto"
              />

              <button
                type="button"
                class="add-photo-btn"
                title="Adicionar foto"
                @click="abrirSeletorFoto"
              >
                +
              </button>
            </div>
          </div>

          <!-- Descrição Completa -->
          <div class="drawer-section">
            <label class="micro-label">DESCRIÇÃO COMPLETA</label>
            <div class="description-box">
              <p>{{ selectedOccurrence.fullDescription }}</p>
            </div>
          </div>

          <!-- Equipe e Data -->
          <div class="meta-two-cols">
            <div>
              <label class="micro-label">EQUIPE RESPONSÁVEL</label>
              <div class="team-badge-row">
                <img
                  :src="selectedOccurrence.teamAvatar"
                  :alt="selectedOccurrence.teamShort"
                  class="team-mini-avatar"
                />
                <strong>{{ selectedOccurrence.teamShort }}</strong>
              </div>
            </div>

            <div>
              <label class="micro-label">DATA REPORTADA</label>
              <p class="reported-date">{{ selectedOccurrence.reportedAtFull }}</p>
            </div>
          </div>

          <!-- Ações Rápidas -->
          <div class="drawer-section">
            <label class="micro-label">AÇÕES RÁPIDAS</label>
            <p v-if="saveFeedback" class="save-feedback">
              Alterações salvas com sucesso para {{ selectedOccurrence.ticket }}.
            </p>
          </div>
        </div>

        <div class="drawer-footer">
          <button type="button" class="btn-save-primary" @click="salvarAlteracoes">
            Salvar Alterações
          </button>
        </div>
      </aside>
    </div>
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

.workspace-shell {
  flex: 1;
  min-width: 0;
  display: flex;
  background-color: #F8FAFC;
}

.main-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* Topbar */
.topbar {
  background: #FFFFFF;
  border-bottom: 1px solid #F1F5F9;
  padding: 14px 28px;
  display: flex;
  align-items: center;
  gap: 24px;
  position: sticky;
  top: 0;
  z-index: 15;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1E293B;
  white-space: nowrap;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 310px;
}

.search-box svg {
  position: absolute;
  left: 12px;
  color: #94A3B8;
  pointer-events: none;
}

.search-box input {
  width: 100%;
  background: #F1F5F9;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 8px 14px 8px 36px;
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

/* Corpo Principal */
.content-body {
  padding: 24px 28px 36px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-x: hidden;
}

/* KPIs */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.kpi-card {
  background: #FFFFFF;
  border: 1px solid #F1F5F9;
  border-radius: 14px;
  padding: 18px 20px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}

.kpi-card.border-red {
  border-left: 3.5px solid #EF4444;
}

.kpi-card.border-amber {
  border-left: 3.5px solid #F59E0B;
}

.kpi-label {
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 600;
  color: #64748B;
}

.kpi-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.kpi-value {
  font-size: 24px;
  font-weight: 800;
  color: #1E293B;
  line-height: 1;
}

.kpi-value.text-red {
  color: #EF4444;
}

.kpi-value.text-amber {
  color: #F59E0B;
}

.kpi-pill.blue {
  background: #EFF6FF;
  color: #2563EB;
  font-size: 10px;
  font-weight: 700;
  padding: 4px 9px;
  border-radius: 999px;
}

.kpi-watermark-icon {
  color: #CBD5E1;
}

/* Filtros */
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
}

.tabs-segmented {
  display: inline-flex;
  flex-wrap: wrap;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 11px;
  padding: 3px;
  gap: 2px;
}

.seg-btn {
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

.seg-btn:hover {
  color: #1E293B;
}

.seg-btn.active {
  background: #F1F5F9;
  color: #1E293B;
  font-weight: 700;
}

.filter-divider {
  width: 1px;
  height: 22px;
  background: #E2E8F0;
}

.dropdown-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.filter-select {
  position: relative;
  display: inline-flex;
  align-items: center;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 0 10px;
  height: 34px;
  color: #475569;
}

.filter-select select {
  appearance: none;
  border: none;
  outline: none;
  background: transparent;
  padding: 0 22px 0 8px;
  font-size: 12px;
  font-weight: 500;
  color: #334155;
  cursor: pointer;
}

.filter-select .chevron {
  position: absolute;
  right: 9px;
  color: #64748B;
  pointer-events: none;
}

/* Grade de Cards de Ocorrências */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(290px, 1fr));
  gap: 18px;
}

.cards-grid.drawer-open {
  grid-template-columns: repeat(2, minmax(280px, 1fr));
}

.occ-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition: 0.16s ease;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}

.occ-card:hover {
  border-color: #93C5FD;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
}

.occ-card.selected {
  border-color: #93C5FD;
  box-shadow: 0 0 0 2px #DBEAFE;
}

.occ-header {
  padding: 16px 18px 12px;
  border-bottom: 1px solid #F1F5F9;
}

.occ-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.status-badge {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 6px;
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.badge-critico,
.badge-aberto {
  background: #FEE2E2;
  color: #EF4444;
}

.badge-resolucao {
  background: #FEF3C7;
  color: #D97706;
}

.badge-resolvido {
  background: #DCFCE7;
  color: #16A34A;
}

.occ-time {
  font-size: 10px;
  font-weight: 600;
  color: #94A3B8;
}

.occ-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #1E293B;
}

.occ-team {
  margin: 4px 0 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #64748B;
}

.occ-body {
  padding: 14px 18px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.occ-thumb {
  width: 68px;
  height: 68px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid #E2E8F0;
}

.occ-desc {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.48;
  color: #475569;
}

.occ-footer {
  padding: 12px 18px;
  border-top: 1px solid #F1F5F9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.footer-muted {
  font-size: 11px;
  font-style: italic;
  color: #94A3B8;
}

.footer-resolved {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  color: #10B981;
}

.card-action-btn {
  font-size: 11px;
  font-weight: 700;
  border-radius: 8px;
  padding: 7px 13px;
  cursor: pointer;
  transition: 0.15s;
}

.btn-orange {
  background: #EA580C;
  color: #FFFFFF;
  border: none;
}

.btn-orange:hover {
  background: #C2410C;
}

.btn-outline {
  background: #FFFFFF;
  color: #1E293B;
  border: 1px solid #CBD5E1;
}

.btn-outline:hover {
  background: #F8FAFC;
}

.btn-link {
  background: transparent;
  color: #334155;
  border: none;
  padding: 6px 4px;
}

.btn-link:hover {
  color: #1E3A8A;
}

.empty-state {
  grid-column: 1 / -1;
  background: #FFFFFF;
  border: 1px dashed #CBD5E1;
  border-radius: 14px;
  padding: 36px;
  text-align: center;
  font-size: 13px;
  color: #64748B;
}

/* Painel Lateral Direito (Drawer) */
.details-drawer {
  width: 370px;
  flex-shrink: 0;
  background: #FFFFFF;
  border-left: 1px solid #E2E8F0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;
  box-shadow: -4px 0 20px rgba(15, 23, 42, 0.04);
  z-index: 25;
}

.drawer-header {
  padding: 18px 22px;
  border-bottom: 1px solid #F1F5F9;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.drawer-header h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #1E293B;
}

.close-drawer-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  line-height: 1;
  color: #64748B;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.close-drawer-btn:hover {
  background: #F1F5F9;
  color: #1E293B;
}

.drawer-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 20px 22px;
}

.drawer-ticket-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.ticket-number {
  font-size: 11px;
  font-weight: 600;
  color: #94A3B8;
}

.drawer-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #1E293B;
}

.drawer-address {
  margin: 4px 0 20px;
  font-size: 12px;
  color: #64748B;
}

.drawer-section {
  margin-bottom: 20px;
}

.micro-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #94A3B8;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.hero-photo-box {
  width: 100%;
  height: 185px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #E2E8F0;
  margin-bottom: 10px;
}

.hero-photo-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbs-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.thumb-btn {
  width: 54px;
  height: 54px;
  padding: 0;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;
  background: #F1F5F9;
}

.thumb-btn.active {
  border-color: #1E3A8A;
}

.thumb-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hidden-file {
  display: none;
}

.add-photo-btn {
  width: 54px;
  height: 54px;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  background: #F8FAFC;
  color: #64748B;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 0.15s;
}

.add-photo-btn:hover {
  background: #EFF6FF;
  color: #1E3A8A;
  border-color: #93C5FD;
}

.description-box {
  background: #F8FAFC;
  border: 1px solid #F1F5F9;
  border-radius: 12px;
  padding: 14px;
}

.description-box p {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: #334155;
}

.meta-two-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.team-badge-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: #1E293B;
}

.team-mini-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  object-fit: cover;
}

.reported-date {
  margin: 2px 0 0;
  font-size: 12.5px;
  font-weight: 700;
  color: #1E293B;
}

.save-feedback {
  margin: 6px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: #10B981;
}

.drawer-footer {
  padding: 16px 22px;
  border-top: 1px solid #F1F5F9;
  background: #FFFFFF;
}

.btn-save-primary {
  width: 100%;
  background: #1E3A8A;
  color: #FFFFFF;
  border: none;
  border-radius: 11px;
  padding: 13px 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.2);
  transition: 0.15s;
}

.btn-save-primary:hover {
  background: #1E40AF;
}

/* Responsividade */
@media (max-width: 1280px) {
  .cards-grid,
  .cards-grid.drawer-open {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 960px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
  .details-drawer {
    position: fixed;
    right: 0;
    top: 0;
    width: 100%;
    max-width: 380px;
  }
}
</style>