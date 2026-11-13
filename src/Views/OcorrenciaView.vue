<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Sidebar from '../Components/Sidebar.vue'
import { getToken, getUsuario } from '../utils/auth'

type FilterTab = 'Todos' | 'Crítico' | 'Aberto' | 'Finalizado'
type OccurrenceStatus = 'critico' | 'aberto' | 'resolvido'

interface Occurrence {
  id: number
  projetoId: number
  ticket: string
  title: string
  address: string
  teamShort: string
  teamFull: string
  teamInitials: string
  status: OccurrenceStatus
  badgeLabel: string
  timestamp: string
  reportedAtFull: string
  shortDescription: string
  fullDescription: string
  solucaoAplicada: string
  bloqueiaObra: boolean
  resolvida: boolean
  footerNote: string
  footerType: 'muted' | 'resolved'
  actionLabel: string
  actionVariant: 'orange' | 'outline' | 'link'
  images: string[]
}

interface ProjetoOption {
  id: number
  label: string
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5037/api'
const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'

const usuarioLogado = getUsuario()
const nomeUsuario = computed(() => usuarioLogado?.nome || 'Gestor')
const cargoUsuario = computed(() =>
  usuarioLogado?.roles?.toUpperCase() === 'GESTOR' ? 'Gestor de Produção' : 'Técnico de Campo'
)
const iniciaisUsuario = computed(() =>
  nomeUsuario.value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('')
)

const searchQuery = ref<string>('')
const activeTab = ref<FilterTab>('Todos')
const selectedPeriod = ref<string>('Todos')
const selectedTeam = ref<string>('Todas Equipes')
const isDrawerOpen = ref<boolean>(false)
const selectedOccurrenceId = ref<number | null>(null)
const selectedPhotoIndex = ref<number>(0)
const photoInputRef = ref<HTMLInputElement | null>(null)
const saveFeedback = ref<string | null>(null)
const carregando = ref<boolean>(false)
const resolvendo = ref<boolean>(false)
const solucaoInput = ref<string>('')

// Modal Nova Ocorrência
const showCreateModal = ref<boolean>(false)
const criandoOcorrencia = ref<boolean>(false)
const novoProjetoId = ref<number>(0)
const novoTitulo = ref<string>('')
const novoTipo = ref<string>('TECNICA')
const novaSeveridade = ref<string>('MEDIA')
const novaDescricao = ref<string>('')
const novaFotoUrl = ref<string>('')
const novoBloqueiaObra = ref<boolean>(false)

const filterTabs: FilterTab[] = ['Todos', 'Crítico', 'Aberto', 'Finalizado']

const occurrences = ref<Occurrence[]>([])
const projetosDisponiveis = ref<ProjetoOption[]>([])
const equipesDisponiveis = ref<string[]>([])

function getAuthHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function gerarIniciais(nome: string): string {
  return (
    nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join('') || 'EQ'
  )
}

function formatarCurto(iso?: string): string {
  if (!iso) return 'RECENTE'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'RECENTE'
  return d
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    .replace('.', '')
    .toUpperCase()
}

function formatarCompleto(iso?: string): string {
  if (!iso) return 'Data não informada'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Data não informada'
  return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

async function carregarOcorrencias() {
  carregando.value = true
  try {
    const headers = getAuthHeaders()
    const [resOcc, resProj, resOrc, resEq, resUser] = await Promise.all([
      fetch(`${API_URL}/ocorrencia`, { headers }),
      fetch(`${API_URL}/projeto`, { headers }),
      fetch(`${API_URL}/orcamento`, { headers }),
      fetch(`${API_URL}/equipe`, { headers }),
      fetch(`${API_URL}/user`, { headers }),
    ])

    const listaOcc = resOcc.ok ? await resOcc.json() : []
    const listaProj = resProj.ok ? await resProj.json() : []
    const listaOrc = resOrc.ok ? await resOrc.json() : []
    const listaEq = resEq.ok ? await resEq.json() : []
    const listaUser = resUser.ok ? await resUser.json() : []

    const mapaOrc = new Map<number, any>()
    for (const o of listaOrc) mapaOrc.set(o.id, o)

    const mapaProj = new Map<number, any>()
    for (const p of listaProj) mapaProj.set(p.id, p)

    const mapaUser = new Map<number, string>()
    for (const u of listaUser) mapaUser.set(u.id, u.nome)

    // Preenche opções de projetos para o modal de abertura
    projetosDisponiveis.value = listaProj.map((p: any) => {
      const orc = mapaOrc.get(p.orcamentoId)
      return {
        id: p.id,
        label: `#${p.id} - ${orc?.nomeCliente || `Orçamento #${p.orcamentoId}`}`,
      }
    })
    if (projetosDisponiveis.value.length > 0 && novoProjetoId.value === 0) {
      novoProjetoId.value = projetosDisponiveis.value[0]!.id
    }

    const nomesEquipesSet = new Set<string>()
    for (const eq of listaEq) {
      if (eq.nome) nomesEquipesSet.add(eq.nome)
    }

    occurrences.value = listaOcc.map((o: any) => {
      const proj = mapaProj.get(o.projetoId)
      const orc = mapaOrc.get(o.orcamentoId || proj?.orcamentoId)

      // Descobre equipe pelo tecnicoId do projeto ou pelo nome de quem reportou
      const equipeVinculada = proj?.tecnicoId
        ? listaEq.find((e: any) => (e.membros || []).some((m: any) => m.usuarioId === proj.tecnicoId))
        : null

      const teamShort = equipeVinculada?.nome || (proj?.tecnicoId ? mapaUser.get(proj.tecnicoId) : null) || 'Equipe Campo'
      nomesEquipesSet.add(teamShort)

      const membrosNomes = equipeVinculada?.membros?.map((m: any) => m.nome).join('/')
      const teamFull = membrosNomes ? `${teamShort} (${membrosNomes})` : `${teamShort} • Por ${o.reportadoPorNome || 'Técnico'}`

      const sev = (o.severidade || 'MEDIA').toUpperCase()
      const isCritico = !o.resolvida && (o.bloqueiaObra || sev === 'CRITICA' || sev === 'ALTA')

      let status: OccurrenceStatus = 'aberto'
      let badgeLabel = `ABERTO • ${o.tipo || 'TÉCNICA'}`
      let actionLabel = 'Resolver Pendência'
      let actionVariant: 'orange' | 'outline' | 'link' = 'outline'

      if (o.resolvida) {
        status = 'resolvido'
        badgeLabel = 'RESOLVIDO'
        actionLabel = 'Ver Histórico'
        actionVariant = 'link'
      } else if (isCritico) {
        status = 'critico'
        badgeLabel = o.bloqueiaObra ? 'EMBARGO / CRÍTICO' : 'ABERTO - CRÍTICO'
        actionLabel = 'Resolver Pendência'
        actionVariant = 'orange'
      }

      return {
        id: o.id,
        projetoId: o.projetoId,
        ticket: `#${String(o.id).padStart(5, '0')}`,
        title: `${orc?.nomeCliente || `Projeto #${o.projetoId}`} - ${o.titulo}`,
        address: orc?.enderecoObra || 'Endereço da obra não cadastrado',
        teamShort,
        teamFull,
        teamInitials: gerarIniciais(teamShort),
        status,
        badgeLabel,
        timestamp: formatarCurto(o.dataAbertura),
        reportedAtFull: formatarCompleto(o.dataAbertura),
        shortDescription: o.descricao,
        fullDescription: o.descricao,
        solucaoAplicada: o.solucaoAplicada || '',
        bloqueiaObra: Boolean(o.bloqueiaObra),
        resolvida: Boolean(o.resolvida),
        footerNote: o.resolvida
          ? `Finalizado ${o.dataResolucao ? `em ${new Date(o.dataResolucao).toLocaleDateString('pt-BR')}` : ''}`
          : `Reportado por ${o.reportadoPorNome || 'Equipe'}`,
        footerType: o.resolvida ? 'resolved' : 'muted',
        actionLabel,
        actionVariant,
        images: o.fotoUrl ? [o.fotoUrl] : [FALLBACK_IMG],
      }
    })

    equipesDisponiveis.value = Array.from(nomesEquipesSet)

    if (occurrences.value.length > 0) {
      const atual = occurrences.value.find((x) => x.id === selectedOccurrenceId.value) ?? occurrences.value[0]!
      selectedOccurrenceId.value = atual.id
      solucaoInput.value = atual.solucaoAplicada
    }
  } catch (err) {
    console.error('Erro ao carregar ocorrências:', err)
  } finally {
    carregando.value = false
  }
}

const totalPendenciasKpi = computed(() => occurrences.value.length)
const emAbertoKpi = computed(() => occurrences.value.filter((o) => !o.resolvida).length)
const criticasKpi = computed(() => occurrences.value.filter((o) => o.status === 'critico').length)

const filteredOccurrences = computed<Occurrence[]>(() => {
  return occurrences.value.filter((item) => {
    let matchesTab = true
    if (activeTab.value === 'Crítico') matchesTab = item.status === 'critico'
    else if (activeTab.value === 'Aberto') matchesTab = !item.resolvida
    else if (activeTab.value === 'Finalizado') matchesTab = item.resolvida

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

const selectedOccurrence = computed<Occurrence | null>(() => {
  if (occurrences.value.length === 0) return null
  return (
    occurrences.value.find((o) => o.id === selectedOccurrenceId.value) ??
    occurrences.value[0]!
  )
})

const activePreviewImage = computed<string>(() => {
  if (!selectedOccurrence.value) return FALLBACK_IMG
  return (
    selectedOccurrence.value.images[selectedPhotoIndex.value] ??
    selectedOccurrence.value.images[0] ??
    FALLBACK_IMG
  )
})

function abrirDetalhes(item: Occurrence) {
  selectedOccurrenceId.value = item.id
  selectedPhotoIndex.value = 0
  solucaoInput.value = item.solucaoAplicada
  saveFeedback.value = null
  isDrawerOpen.value = true
}

function abrirSeletorFoto() {
  photoInputRef.value?.click()
}

function adicionarFoto(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || !selectedOccurrence.value) return

  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result === 'string' && selectedOccurrence.value) {
      selectedOccurrence.value.images.push(reader.result)
      selectedPhotoIndex.value = selectedOccurrence.value.images.length - 1
    }
  }
  reader.readAsDataURL(file)
  target.value = ''
}

async function resolverOcorrenciaAtual() {
  if (!selectedOccurrence.value || resolvendo.value) return
  resolvendo.value = true

  try {
    const res = await fetch(`${API_URL}/ocorrencia/${selectedOccurrence.value.id}/resolver`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        solucaoAplicada: solucaoInput.value.trim() || 'Pendência resolvida pela gestão.',
      }),
    })

    if (!res.ok) throw new Error('Erro ao resolver ocorrência')

    await carregarOcorrencias()
    saveFeedback.value = `Ocorrência ${selectedOccurrence.value.ticket} marcada como resolvida!`
    setTimeout(() => {
      saveFeedback.value = null
    }, 3000)
  } catch (err) {
    console.error(err)
    saveFeedback.value = 'Erro ao atualizar ocorrência na API.'
  } finally {
    resolvendo.value = false
  }
}

async function criarNovaOcorrencia() {
  if (!novoProjetoId.value || !novoTitulo.value.trim() || !novaDescricao.value.trim() || criandoOcorrencia.value) {
    return
  }

  criandoOcorrencia.value = true
  try {
    const res = await fetch(`${API_URL}/ocorrencia/cadastrar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        projetoId: novoProjetoId.value,
        reportadoPorId: usuarioLogado?.id || 1,
        titulo: novoTitulo.value.trim(),
        tipo: novoTipo.value,
        severidade: novaSeveridade.value,
        descricao: novaDescricao.value.trim(),
        fotoUrl: novaFotoUrl.value.trim() || null,
        bloqueiaObra: novoBloqueiaObra.value,
      }),
    })

    if (!res.ok) throw new Error('Falha ao cadastrar ocorrência')

    novoTitulo.value = ''
    novaDescricao.value = ''
    novaFotoUrl.value = ''
    novoBloqueiaObra.value = false
    showCreateModal.value = false

    await carregarOcorrencias()
  } catch (err) {
    console.error(err)
    alert('Não foi possível registrar a ocorrência na API.')
  } finally {
    criandoOcorrencia.value = false
  }
}

onMounted(() => {
  carregarOcorrencias()
})
</script>

<template>
  <div class="layout-wrapper">
    <Sidebar />

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

          <div class="topbar-actions">
            <button
              type="button"
              class="btn-new-occ"
              @click="showCreateModal = true"
            >
              + Nova Ocorrência
            </button>

            <button
              type="button"
              class="icon-btn"
              aria-label="Notificações"
              title="Atualizar ocorrências"
              @click="carregarOcorrencias"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span v-if="emAbertoKpi > 0" class="notif-dot"></span>
            </button>

            <div class="divider"></div>

            <div class="user-profile">
              <div class="user-info">
                <p class="user-name">{{ nomeUsuario }}</p>
                <p class="user-role">{{ cargoUsuario }}</p>
              </div>
              <div class="user-avatar-initials">{{ iniciaisUsuario }}</div>
            </div>
          </div>
        </header>

        <!-- Conteúdo -->
        <div class="content-body">
          <!-- KPIs -->
          <section class="kpi-grid">
            <div class="kpi-card">
              <p class="kpi-label">Total Pendências</p>
              <div class="kpi-bottom">
                <strong class="kpi-value">{{ totalPendenciasKpi }}</strong>
                <span class="kpi-pill blue">Registros</span>
              </div>
            </div>

            <div class="kpi-card border-red">
              <p class="kpi-label">Em Aberto</p>
              <div class="kpi-bottom">
                <strong class="kpi-value text-red">{{ emAbertoKpi }}</strong>
                <svg class="kpi-watermark-icon" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div class="kpi-card border-amber">
              <p class="kpi-label">Críticas / Embargos</p>
              <div class="kpi-bottom">
                <strong class="kpi-value text-amber">{{ criticasKpi }}</strong>
                <svg class="kpi-watermark-icon" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
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
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <select v-model="selectedTeam" aria-label="Equipes">
                  <option value="Todas Equipes">Todas Equipes</option>
                  <option v-for="eq in equipesDisponiveis" :key="eq" :value="eq">
                    {{ eq }}
                  </option>
                </select>
                <svg class="chevron" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </section>

          <!-- Grade de Ocorrências -->
          <section :class="['cards-grid', { 'drawer-open': isDrawerOpen && selectedOccurrence }]">
            <div v-if="carregando" class="empty-state">
              Carregando ocorrências da API...
            </div>

            <article
              v-else
              v-for="item in filteredOccurrences"
              :key="item.id"
              :class="['occ-card', { selected: isDrawerOpen && selectedOccurrence?.id === item.id }]"
              @click="abrirDetalhes(item)"
            >
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

              <div class="occ-body">
                <img :src="item.images[0]" :alt="item.title" class="occ-thumb" />
                <p class="occ-desc">{{ item.shortDescription }}</p>
              </div>

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

            <div v-if="!carregando && filteredOccurrences.length === 0" class="empty-state">
              Nenhuma ocorrência encontrada para os filtros selecionados.
            </div>
          </section>
        </div>
      </main>

      <!-- Painel Lateral Direito: Detalhes da Ocorrência -->
      <aside v-if="isDrawerOpen && selectedOccurrence" class="details-drawer">
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
                <span class="team-mini-initials">{{ selectedOccurrence.teamInitials }}</span>
                <strong>{{ selectedOccurrence.teamShort }}</strong>
              </div>
            </div>

            <div>
              <label class="micro-label">DATA REPORTADA</label>
              <p class="reported-date">{{ selectedOccurrence.reportedAtFull }}</p>
            </div>
          </div>

          <!-- Parecer / Solução Aplicada -->
          <div class="drawer-section">
            <label class="micro-label">PARECER / SOLUÇÃO APLICADA</label>
            <textarea
              v-model="solucaoInput"
              rows="3"
              class="solution-textarea"
              :disabled="selectedOccurrence.resolvida"
              placeholder="Descreva a ação corretiva realizada pela equipe..."
            ></textarea>

            <p v-if="saveFeedback" class="save-feedback">
              {{ saveFeedback }}
            </p>
          </div>
        </div>

        <div v-if="!selectedOccurrence.resolvida" class="drawer-footer">
          <button
            type="button"
            class="btn-save-primary"
            :disabled="resolvendo"
            @click="resolverOcorrenciaAtual"
          >
            {{ resolvendo ? 'Finalizando...' : 'Marcar como Resolvida' }}
          </button>
        </div>
      </aside>
    </div>

    <!-- Modal: Registrar Nova Ocorrência -->
    <div
      v-if="showCreateModal"
      class="modal-backdrop"
      @click.self="showCreateModal = false"
    >
      <div class="modal-box">
        <div class="modal-header">
          <div>
            <h3>Registrar Nova Ocorrência</h3>
            <p class="modal-sub">Notifique a gestão sobre pendências ou bloqueios na obra</p>
          </div>
          <button type="button" @click="showCreateModal = false">&times;</button>
        </div>

        <form class="modal-form" @submit.prevent="criarNovaOcorrencia">
          <label class="field-label">Projeto / Obra *</label>
          <select v-model.number="novoProjetoId" class="modal-input" required>
            <option v-for="p in projetosDisponiveis" :key="p.id" :value="p.id">
              {{ p.label }}
            </option>
          </select>

          <label class="field-label">Título da Ocorrência *</label>
          <input
            v-model="novoTitulo"
            type="text"
            class="modal-input"
            placeholder="Ex: Vidro temperado trincado no transporte"
            required
          />

          <div class="modal-row-2">
            <div>
              <label class="field-label">Tipo</label>
              <select v-model="novoTipo" class="modal-input">
                <option value="TECNICA">Técnica / Instalação</option>
                <option value="MATERIAL">Material / Vidro</option>
                <option value="EMBARGO">Embargo de Obra</option>
                <option value="CLIENTE">Solicitação Cliente</option>
              </select>
            </div>
            <div>
              <label class="field-label">Severidade</label>
              <select v-model="novaSeveridade" class="modal-input">
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica</option>
              </select>
            </div>
          </div>

          <label class="field-label">Descrição Detalhada *</label>
          <textarea
            v-model="novaDescricao"
            rows="3"
            class="modal-input"
            placeholder="Descreva o problema identificado no local..."
            required
          ></textarea>

          <label class="field-label">URL da Foto (opcional)</label>
          <input
            v-model="novaFotoUrl"
            type="text"
            class="modal-input"
            placeholder="https://..."
          />

          <label class="checkbox-block">
            <input v-model="novoBloqueiaObra" type="checkbox" />
            <span>Esta ocorrência bloqueia/embarga a continuação da obra</span>
          </label>

          <div class="modal-footer">
            <button type="button" class="btn-outline" @click="showCreateModal = false">
              Cancelar
            </button>
            <button type="submit" class="btn-new-occ" :disabled="criandoOcorrencia">
              {{ criandoOcorrencia ? 'Salvando...' : 'Registrar Ocorrência' }}
            </button>
          </div>
        </form>
      </div>
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
  overflow-y: auto;
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

.topbar-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.btn-new-occ {
  background: #1E3A8A;
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  padding: 9px 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.btn-new-occ:hover {
  background: #1E40AF;
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
}

/* Corpo Principal */
.content-body {
  padding: 24px 28px 64px;
  display: flex;
  flex-direction: column;
  gap: 20px;
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

/* Grade de Cards */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(280px, 1fr));
  gap: 18px;
}

.cards-grid.drawer-open {
  grid-template-columns: repeat(2, minmax(260px, 1fr));
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
}

.occ-card:hover {
  border-color: #93C5FD;
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

.badge-critico {
  background: #FEE2E2;
  color: #EF4444;
}

.badge-aberto {
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
}

.btn-orange {
  background: #EA580C;
  color: #FFFFFF;
  border: none;
}

.btn-outline {
  background: #FFFFFF;
  color: #1E293B;
  border: 1px solid #CBD5E1;
}

.btn-link {
  background: transparent;
  color: #334155;
  border: none;
  padding: 6px 4px;
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
}

.close-drawer-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  color: #64748B;
  cursor: pointer;
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
  font-size: 17px;
  font-weight: 800;
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
  height: 175px;
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
  width: 52px;
  height: 52px;
  padding: 0;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;
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
  width: 52px;
  height: 52px;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  background: #F8FAFC;
  color: #64748B;
  font-size: 20px;
  cursor: pointer;
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
}

.team-mini-initials {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #1E3A8A;
  color: #FFFFFF;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reported-date {
  margin: 2px 0 0;
  font-size: 12px;
  font-weight: 700;
}

.solution-textarea {
  width: 100%;
  border: 1px solid #CBD5E1;
  border-radius: 10px;
  padding: 10px;
  font-size: 12px;
  font-family: inherit;
  outline: none;
  resize: vertical;
}

.solution-textarea:disabled {
  background: #F8FAFC;
  color: #475569;
}

.save-feedback {
  margin: 8px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: #10B981;
}

.drawer-footer {
  padding: 16px 22px;
  border-top: 1px solid #F1F5F9;
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
}

.btn-save-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modal Nova Ocorrência */
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
  max-width: 480px;
  padding: 24px;
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

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-label {
  font-size: 12px;
  font-weight: 700;
  color: #334155;
}

.modal-input {
  width: 100%;
  border: 1px solid #CBD5E1;
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 13px;
  font-family: inherit;
  outline: none;
}

.modal-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.checkbox-block {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #EF4444;
  margin-top: 4px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}

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

@media (max-width: 768px) {
  .user-info {
    display: none;
  }
}
</style>