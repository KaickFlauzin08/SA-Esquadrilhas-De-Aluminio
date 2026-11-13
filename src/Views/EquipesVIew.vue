<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Sidebar from '../Components/Sidebar.vue'
import { getToken, getUsuario } from '../utils/auth'

type ProjectBadge = 'SELECIONADO' | 'URGENTE'
type ItemIconType = 'door' | 'window'

interface TeamMember {
  usuarioId: number
  nome: string
  funcaoNaEquipe: string
}

interface TeamGroup {
  id: number
  nome: string
  especialidade: string
  available: boolean
  statusText: string
  membros: TeamMember[]
}

interface TechnicianOption {
  id: number
  nome: string
}

interface ProjectItem {
  id: string
  rawItemId: number
  title: string
  subtitle: string
  iconType: ItemIconType
  assigned: TeamGroup[]
}

interface OpenProject {
  id: string
  rawId: number
  orcamentoId: number
  tecnicoId: number | null
  client: string
  workplace: string
  itemsCountLabel: string
  updatedAt: string
  badge?: ProjectBadge
  totalSlots: number
  items: ProjectItem[]
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5037/api'
const usuarioLogado = getUsuario()
const nomeUsuario = computed(() => usuarioLogado?.nome || 'Gestor')
const cargoUsuario = computed(() =>
  usuarioLogado?.roles?.toUpperCase() === 'GESTOR' ? 'Gestor de Produção' : 'Operador'
)
const iniciaisUsuario = computed(() =>
  nomeUsuario.value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('')
)

function aoNavegar(menu: string) {
  console.log('Menu selecionado:', menu)
}

const searchWork = ref<string>('')
const searchTeam = ref<string>('')
const selectedProjectId = ref<string>('')
const selectedItemId = ref<string>('')
const dragOverItemId = ref<string | null>(null)
const draggedTeam = ref<TeamGroup | null>(null)
const feedbackMessage = ref<string | null>(null)
const carregando = ref<boolean>(false)
const salvando = ref<boolean>(false)

// Estados do Modal de Criar Nova Equipe
const showCreateTeamModal = ref<boolean>(false)
const novoNomeEquipe = ref<string>('')
const novaEspecialidade = ref<string>('Instalação Geral')
const tecnicosSelecionados = ref<number[]>([])
const liderSelecionado = ref<number | null>(null)
const criandoEquipe = ref<boolean>(false)

const allTechnicians = ref<TechnicianOption[]>([])
const teams = ref<TeamGroup[]>([])
const projects = ref<OpenProject[]>([])

function tempoRelativo(iso?: string): string {
  if (!iso) return 'Recente'
  const diffMs = Date.now() - new Date(iso).getTime()
  const horas = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)))
  if (horas < 24) return `Há ${horas}h`
  return `Há ${Math.floor(horas / 24)}d`
}

function mapearIcone(descricao: string): ItemIconType {
  const d = (descricao || '').toLowerCase()
  if (d.includes('porta') || d.includes('pivotante') || d.includes('balcão')) return 'door'
  return 'window'
}

async function carregarDados() {
  carregando.value = true
  try {
    const headers = { Authorization: `Bearer ${getToken()}` }

const [resProj, resOrc, resUsu, resEquipe, resReg] = await Promise.all([
  fetch(`${API_URL}/projeto`, { headers }),
  fetch(`${API_URL}/orcamento`, { headers }),
  fetch(`${API_URL}/user`, { headers }),
  fetch(`${API_URL}/equipe`, { headers }),
  fetch(`${API_URL}/registroobra`, { headers }),
])

    const listaProjetos = resProj.ok ? await resProj.json() : []
    const listaOrcamentos = resOrc.ok ? await resOrc.json() : []
    const listaUsuarios = resUsu.ok ? await resUsu.json() : []
    const listaEquipes = resEquipe.ok ? await resEquipe.json() : []
    const listaRegistros = resReg.ok ? await resReg.json() : []

    const mapaOrc = new Map<number, any>()
    for (const o of listaOrcamentos) mapaOrc.set(o.id, o)

const tecnicos = listaUsuarios.filter(
  (u: any) => u.ativo !== false && (u.perfil || '').toUpperCase() !== 'GESTOR'
)

    // Verifica quais técnicos já estão em projetos ativos
    const tecnicosOcupados = new Set<number>()
    for (const p of listaProjetos) {
      if (p.tecnicoId && (p.statusProducao || '').toUpperCase() !== 'CONCLUIDO') {
        tecnicosOcupados.add(p.tecnicoId)
      }
    }

    // Mapeia as equipes vindas do novo EquipeController
    teams.value = listaEquipes.map((eq: any) => {
      const membros: TeamMember[] = eq.membros || []
      const algumOcupado = membros.some((m) => tecnicosOcupados.has(m.usuarioId))
      return {
        id: eq.id,
        nome: eq.nome,
        especialidade: eq.especialidade || 'Instalação',
        available: !algumOcupado,
        statusText: algumOcupado
          ? `Em Obra (${membros.length} técnicos)`
          : `Disponível • ${membros.length} técnico(s)`,
        membros,
      }
    })

    // Monta os projetos em aberto
    const projetosAbertos = listaProjetos.filter(
      (p: any) => (p.statusProducao || '').toUpperCase() !== 'CONCLUIDO'
    )

    const montados: OpenProject[] = await Promise.all(
      projetosAbertos.map(async (p: any) => {
        const orc = mapaOrc.get(p.orcamentoId)
        const regsProjeto = listaRegistros.filter((r: any) => r.projetoId === p.id)
        const temPendencia = regsProjeto.some((r: any) => !r.resolvido)

        let itensApi: any[] = []
        try {
          const rItens = await fetch(`${API_URL}/orcamento/${p.orcamentoId}/itens`, { headers })
          if (rItens.ok) itensApi = await rItens.json()
        } catch {
          itensApi = []
        }

        // Se o projeto já tem um técnico vinculado, encontra a equipe dele
        const equipeVinculada = p.tecnicoId
          ? teams.value.find((t) => t.membros.some((m) => m.usuarioId === p.tecnicoId))
          : undefined

        const items: ProjectItem[] = itensApi.map((it: any) => ({
          id: `item-${it.id}`,
          rawItemId: it.id,
          title: `${it.descricaoItem || 'Esquadria'} (${it.quantidade}x)`,
          subtitle: `${it.tipoAbertura || 'Esquadria'} • ${it.largura}x${it.altura}mm`,
          iconType: mapearIcone(it.descricaoItem),
          assigned: equipeVinculada ? [{ ...equipeVinculada }] : [],
        }))

        const ano = (p.dataInicioContrato || '2026').slice(0, 4)
        return {
          id: `#ORD-${ano}-${String(p.id).padStart(3, '0')}`,
          rawId: p.id,
          orcamentoId: p.orcamentoId,
          tecnicoId: p.tecnicoId ?? null,
          client: orc?.nomeCliente || `Cliente #${p.orcamentoId}`,
          workplace: orc?.enderecoObra || `Obra Orçamento #${p.orcamentoId}`,
          itemsCountLabel: `${String(items.length).padStart(2, '0')} Itens`,
          updatedAt: tempoRelativo(p.dataMedicaoFinal || p.dataInicioContrato),
          badge: temPendencia ? 'URGENTE' : undefined,
          totalSlots: Math.max(1, items.length),
          items,
        }
      })
    )

    projects.value = montados
    if (montados.length > 0 && !montados.some((m) => m.id === selectedProjectId.value)) {
      selectedProjectId.value = montados[0]!.id
      selectedItemId.value = montados[0]!.items[0]?.id ?? ''
    }
  } catch (err) {
    console.error('Erro ao carregar dados:', err)
    exibirFeedback('Erro ao conectar com a API.')
  } finally {
    carregando.value = false
  }
}

function toggleTecnicoModal(id: number) {
  const idx = tecnicosSelecionados.value.indexOf(id)
  if (idx >= 0) {
    tecnicosSelecionados.value.splice(idx, 1)
    if (liderSelecionado.value === id) {
      liderSelecionado.value = tecnicosSelecionados.value[0] ?? null
    }
  } else {
    tecnicosSelecionados.value.push(id)
    if (!liderSelecionado.value) liderSelecionado.value = id
  }
}

async function salvarNovaEquipe() {
  if (!novoNomeEquipe.value.trim() || tecnicosSelecionados.value.length === 0 || criandoEquipe.value) {
    return
  }

  criandoEquipe.value = true
  try {
    const res = await fetch(`${API_URL}/equipe/cadastrar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        nome: novoNomeEquipe.value.trim(),
        especialidade: novaEspecialidade.value.trim(),
        liderId: liderSelecionado.value,
        tecnicosIds: tecnicosSelecionados.value,
      }),
    })

    if (!res.ok) throw new Error('Erro ao cadastrar equipe')

    novoNomeEquipe.value = ''
    novaEspecialidade.value = 'Instalação Geral'
    tecnicosSelecionados.value = []
    liderSelecionado.value = null
    showCreateTeamModal.value = false

    await carregarDados()
    exibirFeedback('Nova equipe criada e pronta para alocação!')
  } catch (err) {
    console.error(err)
    exibirFeedback('Não foi possível criar a equipe.')
  } finally {
    criandoEquipe.value = false
  }
}

const filteredProjects = computed(() => {
  const q = searchWork.value.trim().toLowerCase()
  if (!q) return projects.value
  return projects.value.filter(
    (p) =>
      p.id.toLowerCase().includes(q) ||
      p.client.toLowerCase().includes(q) ||
      p.workplace.toLowerCase().includes(q)
  )
})

const filteredTeams = computed(() => {
  const q = searchTeam.value.trim().toLowerCase()
  if (!q) return teams.value
  return teams.value.filter(
    (t) =>
      t.nome.toLowerCase().includes(q) ||
      t.especialidade.toLowerCase().includes(q) ||
      t.membros.some((m) => m.nome.toLowerCase().includes(q))
  )
})

const activeProject = computed(() => {
  if (projects.value.length === 0) return null
  return projects.value.find((p) => p.id === selectedProjectId.value) ?? projects.value[0]!
})

const assignedTotal = computed(() => {
  if (!activeProject.value) return 0
  return activeProject.value.items.filter((item) => item.assigned.length > 0).length
})

const assignedProgressPercent = computed(() => {
  if (!activeProject.value || activeProject.value.totalSlots === 0) return 0
  return Math.round((assignedTotal.value / activeProject.value.totalSlots) * 100)
})

function selecionarProjeto(project: OpenProject) {
  selectedProjectId.value = project.id
  selectedItemId.value = project.items[0]?.id ?? ''
  feedbackMessage.value = null
}

function aoIniciarArrasto(event: DragEvent, team: TeamGroup) {
  draggedTeam.value = team
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('text/plain', String(team.id))
  }
}

function aoSoltarNoItem(item: ProjectItem) {
  dragOverItemId.value = null
  if (!draggedTeam.value) return
  alocarEquipeNoItem(item, draggedTeam.value)
  draggedTeam.value = null
}

function alocarEquipeNoItem(item: ProjectItem, team: TeamGroup) {
  if (item.assigned.some((a) => a.id === team.id)) return
  item.assigned.push({ ...team })
  selectedItemId.value = item.id
}

function alocarPorClique(team: TeamGroup) {
  if (!activeProject.value) return
  const target =
    activeProject.value.items.find((i) => i.id === selectedItemId.value) ??
    activeProject.value.items[0]
  if (target) alocarEquipeNoItem(target, team)
}

function removerEquipeDoItem(item: ProjectItem, teamId: number) {
  item.assigned = item.assigned.filter((a) => a.id !== teamId)
}

function selecionarTodosItens() {
  if (!activeProject.value || teams.value.length === 0) return
  const equipePreferida = teams.value.find((t) => t.available) ?? teams.value[0]!
  activeProject.value.items.forEach((item) => {
    if (item.assigned.length === 0) {
      item.assigned.push({ ...equipePreferida })
    }
  })
}

async function confirmarAlocacao() {
  if (!activeProject.value || salvando.value) return
  salvando.value = true

  const proj = activeProject.value
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }

  try {
    const primeiraEquipe = proj.items.flatMap((i) => i.assigned)[0]
    const liderOuPrimeiroMembro =
      primeiraEquipe?.membros.find((m) => m.funcaoNaEquipe === 'Líder') ??
      primeiraEquipe?.membros[0]

    // Vincula o líder da equipe ao Projeto
    await fetch(`${API_URL}/projeto/${proj.rawId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        tecnicoId: liderOuPrimeiroMembro ? liderOuPrimeiroMembro.usuarioId : null,
      }),
    })

    // Registra no histórico da obra quais equipes/técnicos foram designados
    const resumo = proj.items
      .map((it) => {
        const eqNomes = it.assigned.map((e) => `${e.nome} (${e.membros.map((m) => m.nome).join(', ')})`).join('; ')
        return `${it.title}: ${eqNomes || 'Pendente'}`
      })
      .join(' | ')

    await fetch(`${API_URL}/registroobra/cadastrar`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        projetoId: proj.rawId,
        usuarioId: usuarioLogado?.id || 1,
        etapaProcesso: 'DESIGNACAO_EQUIPE',
        tipoOcorrencia: 'NENHUMA',
        descricao: `Equipes designadas para ${proj.id} -> ${resumo}`,
        fotoUrl: '',
        resolvido: true,
      }),
    })

    await carregarDados()
    exibirFeedback(`Alocação confirmada! OS ${proj.id} enviada para a equipe.`)
  } catch (err) {
    console.error(err)
    exibirFeedback('Erro ao salvar alocação.')
  } finally {
    salvando.value = false
  }
}

function exibirFeedback(msg: string) {
  feedbackMessage.value = msg
  setTimeout(() => {
    feedbackMessage.value = null
  }, 3500)
}

onMounted(() => {
  carregarDados()
})
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
            <button
              type="button"
              class="btn-new-team"
              @click="showCreateTeamModal = true"
            >
              + Nova Equipe
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
              <span class="works-count-pill">
                {{ String(projects.length).padStart(2, '0') }} Obras
              </span>
            </div>

            <div class="search-box">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input v-model="searchWork" type="text" placeholder="Filtrar por obra..." />
            </div>

            <div class="projects-list">
              <p v-if="carregando" class="empty-msg">Carregando obras...</p>

              <div
                v-else
                v-for="project in filteredProjects"
                :key="project.id"
                :class="['project-card', { selected: activeProject && project.id === activeProject.id }]"
                @click="selecionarProjeto(project)"
              >
                <div class="project-card-top">
                  <span class="project-code">{{ project.id }}</span>
                  <span
                    v-if="activeProject && project.id === activeProject.id"
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
                  <span class="meta-item">{{ project.itemsCountLabel }}</span>
                  <span class="meta-item">{{ project.updatedAt }}</span>
                </div>
              </div>
            </div>
          </aside>

          <!-- COLUNA DIREITA: Painel de Alocação -->
          <section v-if="activeProject" class="card allocation-panel">
            <div class="allocation-header">
              <div>
                <div class="allocation-title-row">
                  <h2>Painel de Alocação</h2>
                  <span class="project-tag">{{ activeProject.id }}</span>
                </div>
                <p class="allocation-location">
                  <span>{{ activeProject.workplace }} • {{ activeProject.client }}</span>
                </p>
              </div>

              <div class="assigned-summary">
                <span class="assigned-label">ITENS DESIGNADOS</span>
                <div class="assigned-progress-row">
                  <div class="assigned-track">
                    <div class="assigned-fill" :style="{ width: `${assignedProgressPercent}%` }"></div>
                  </div>
                  <strong class="assigned-fraction">
                    {{ assignedTotal }} / {{ activeProject.totalSlots }}
                  </strong>
                </div>
              </div>
            </div>

            <div class="allocation-split">
              <!-- Esquerda: Itens do Projeto -->
              <div class="items-column">
                <div class="subcolumn-header">
                  <h3>Itens do Projeto</h3>
                  <button type="button" class="select-all-btn" @click="selecionarTodosItens">
                    Alocar Todos
                  </button>
                </div>

                <div class="project-items-list">
                  <div
                    v-for="item in activeProject.items"
                    :key="item.id"
                    :class="[
                      'allocation-item-card',
                      { active: selectedItemId === item.id, 'drag-over': dragOverItemId === item.id },
                    ]"
                    @click="selectedItemId = item.id"
                    @dragover.prevent="dragOverItemId = item.id"
                    @dragleave.prevent="dragOverItemId = null"
                    @drop.prevent="aoSoltarNoItem(item)"
                  >
                    <div class="item-card-top">
                      <div class="item-info-left">
                        <div class="item-icon-box">
                          <svg v-if="item.iconType === 'door'" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 19V5c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v14H3v2h18v-2h-2zm-6-6h-2v-2h2v2z" />
                          </svg>
                          <svg v-else width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 8h-6V5h6v6zm-8-6v6H5V5h6zm-6 8h6v6H5v-6zm8 6v-6h6v6h-6z" />
                          </svg>
                        </div>
                        <div>
                          <p class="item-title">{{ item.title }}</p>
                          <p class="item-subtitle">{{ item.subtitle }}</p>
                        </div>
                      </div>

                      <span v-if="item.assigned.length > 0" class="item-status-pill allocated">ALOCADO</span>
                      <span v-else class="item-status-pill pending">PENDENTE</span>
                    </div>

                    <div v-if="item.assigned.length > 0" class="assigned-chips-row">
                      <div v-for="team in item.assigned" :key="team.id" class="collaborator-chip">
                        <span class="chip-initials">EQ</span>
                        <span>
                          <strong>{{ team.nome }}</strong>
                          ({{ team.membros.map((m) => m.nome).join(', ') }})
                        </span>
                        <button
                          type="button"
                          class="remove-chip-btn"
                          @click.stop="removerEquipeDoItem(item, team.id)"
                        >
                          &times;
                        </button>
                      </div>
                    </div>

                    <div v-else class="drop-target-box">
                      Arraste uma equipe aqui ou clique nela ao lado para alocar
                    </div>
                  </div>
                </div>
              </div>

              <!-- Direita: Equipes Formadas -->
              <div class="collaborators-column">
                <div class="subcolumn-header">
                  <h3>Equipes Formadas</h3>
                  <button type="button" class="select-all-btn" @click="showCreateTeamModal = true">
                    + Criar grupo
                  </button>
                </div>

                <div class="collab-search-box">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input v-model="searchTeam" type="text" placeholder="Pesquisar equipe ou técnico..." />
                </div>

                <div class="collaborators-list">
                  <div
                    v-for="team in filteredTeams"
                    :key="team.id"
                    draggable="true"
                    class="collaborator-card"
                    @dragstart="aoIniciarArrasto($event, team)"
                    @click="alocarPorClique(team)"
                  >
                    <div class="collab-left">
                      <div class="collab-avatar-initials">{{ team.membros.length }}T</div>
                      <div>
                        <p class="collab-name">{{ team.nome }}</p>
                        <p class="collab-members-sub">
                          {{ team.membros.map((m) => m.nome).join(' • ') }}
                        </p>
                        <p :class="['collab-status', team.available ? 'text-green' : 'text-amber']">
                          {{ team.statusText }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p v-if="!carregando && filteredTeams.length === 0" class="empty-msg">
                    Nenhuma equipe criada ainda. Clique em <strong>+ Nova Equipe</strong>.
                  </p>
                </div>
              </div>
            </div>

            <footer class="allocation-footer">
              <div class="mobile-sync-box">
                <div>
                  <p class="sync-title">Sincronização com Mobile</p>
                  <p class="sync-subtitle">
                    {{ feedbackMessage ?? 'Equipes receberão a OS em tempo real' }}
                  </p>
                </div>
              </div>

              <div class="footer-actions">
                <button type="button" class="btn-discard" :disabled="salvando" @click="carregarDados">
                  Descartar
                </button>
                <button type="button" class="btn-confirm" :disabled="salvando" @click="confirmarAlocacao">
                  <span>{{ salvando ? 'Salvando...' : 'Confirmar Alocação de Equipes' }}</span>
                </button>
              </div>
            </footer>
          </section>
        </div>
      </div>

      <!-- MODAL: Criar Nova Equipe agrupando Técnicos existentes -->
      <div
        v-if="showCreateTeamModal"
        class="modal-backdrop"
        @click.self="showCreateTeamModal = false"
      >
        <div class="modal-box">
          <div class="modal-header">
            <div>
              <h3>Criar Novo Grupo / Equipe</h3>
              <p class="modal-sub">Junte os técnicos cadastrados em uma equipe de campo</p>
            </div>
            <button type="button" @click="showCreateTeamModal = false">&times;</button>
          </div>

          <div class="modal-form">
            <label class="field-label">Nome da Equipe</label>
            <input
              v-model="novoNomeEquipe"
              type="text"
              class="modal-input"
              placeholder="Ex: Equipe Alfa - Fachadas"
            />

            <label class="field-label">Especialidade</label>
            <input
              v-model="novaEspecialidade"
              type="text"
              class="modal-input"
              placeholder="Ex: Linha Gold / Pele de Vidro"
            />

            <label class="field-label">Selecione os Técnicos da Equipe</label>
            <div class="tech-checklist">
              <div
                v-for="tech in allTechnicians"
                :key="tech.id"
                :class="['tech-option', { checked: tecnicosSelecionados.includes(tech.id) }]"
                @click="toggleTecnicoModal(tech.id)"
              >
                <div class="tech-option-left">
                  <input
                    type="checkbox"
                    :checked="tecnicosSelecionados.includes(tech.id)"
                    @change.stop="toggleTecnicoModal(tech.id)"
                  />
                  <span>{{ tech.nome }}</span>
                </div>

                <button
                  v-if="tecnicosSelecionados.includes(tech.id)"
                  type="button"
                  :class="['leader-pill', { active: liderSelecionado === tech.id }]"
                  @click.stop="liderSelecionado = tech.id"
                >
                  {{ liderSelecionado === tech.id ? '★ Líder' : 'Definir Líder' }}
                </button>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-discard" @click="showCreateTeamModal = false">
              Cancelar
            </button>
            <button
              type="button"
              class="btn-confirm"
              :disabled="criandoEquipe || !novoNomeEquipe.trim() || tecnicosSelecionados.length === 0"
              @click="salvarNovaEquipe"
            >
              {{ criandoEquipe ? 'Criando...' : 'Salvar Equipe' }}
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
  overflow-y: auto;
}

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
  gap: 14px;
}

.btn-new-team {
  background: #1E3A8A;
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.btn-new-team:hover {
  background: #1E40AF;
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

.content-container {
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 28px 64px;
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

.projects-panel {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: calc(100vh - 110px);
  position: sticky;
  top: 84px;
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
}

.search-box,
.collab-search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box svg,
.collab-search-box svg {
  position: absolute;
  left: 12px;
  color: #94A3B8;
}

.search-box input,
.collab-search-box input {
  width: 100%;
  background: #FAFBFD;
  border: 1px solid #E2E8F0;
  border-radius: 11px;
  padding: 9px 12px 9px 36px;
  font-size: 12px;
  outline: none;
}

.projects-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  padding-right: 4px;
}

.project-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  padding: 16px;
  cursor: pointer;
}

.project-card.selected {
  background: #1E3A8A;
  border-color: #1E3A8A;
  color: #FFFFFF;
}

.project-card-top {
  display: flex;
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
  padding: 3px 8px;
  border-radius: 999px;
}

.badge-selected {
  background: rgba(255, 255, 255, 0.16);
  color: #FFFFFF;
}

.badge-urgent {
  background: #FEE2E2;
  color: #EF4444;
}

.project-client {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
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
  justify-content: space-between;
  font-size: 11px;
  color: #64748B;
}

.project-card.selected .project-card-footer {
  border-top-color: rgba(255, 255, 255, 0.14);
  color: #DBEAFE;
}

.allocation-panel {
  display: flex;
  flex-direction: column;
}

.allocation-header {
  padding: 24px 28px 20px;
  border-bottom: 1px solid #F1F5F9;
  display: flex;
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
  font-size: 13px;
  color: #64748B;
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
}

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
}

.select-all-btn {
  background: transparent;
  border: none;
  color: #1E3A8A;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
}

.project-items-list,
.collaborators-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.allocation-item-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  padding: 16px;
  cursor: pointer;
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
}

.item-title {
  margin: 0;
  font-size: 13.5px;
  font-weight: 700;
}

.item-subtitle {
  margin: 2px 0 0;
  font-size: 11px;
  color: #64748B;
}

.item-status-pill {
  font-size: 9.5px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 999px;
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
}

.chip-initials {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #1E3A8A;
  color: #FFFFFF;
  font-size: 9.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-chip-btn {
  background: transparent;
  border: none;
  color: #94A3B8;
  font-size: 14px;
  cursor: pointer;
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

.collaborator-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 11px 14px;
  cursor: grab;
}

.collaborator-card:hover {
  border-color: #93C5FD;
}

.collab-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.collab-avatar-initials {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #EFF6FF;
  color: #1E3A8A;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.collab-name {
  margin: 0;
  font-size: 12.5px;
  font-weight: 700;
}

.collab-members-sub {
  margin: 2px 0;
  font-size: 11px;
  color: #64748B;
}

.collab-status {
  margin: 0;
  font-size: 10.5px;
  font-weight: 600;
}

.text-green {
  color: #10B981;
}

.text-amber {
  color: #D97706;
}

.allocation-footer {
  padding: 18px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.sync-title {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
}

.sync-subtitle {
  margin: 1px 0 0;
  font-size: 11px;
  color: #94A3B8;
}

.footer-actions {
  display: flex;
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
}

.btn-confirm {
  background: #1E3A8A;
  border: none;
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 700;
  padding: 11px 20px;
  border-radius: 10px;
  cursor: pointer;
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modal Criar Equipe */
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
  max-width: 460px;
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
  margin-top: 4px;
}

.modal-input {
  border: 1px solid #CBD5E1;
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 13px;
  outline: none;
}

.tech-checklist {
  max-height: 210px;
  overflow-y: auto;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tech-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}

.tech-option:hover {
  background: #F8FAFC;
}

.tech-option.checked {
  background: #EFF6FF;
}

.tech-option-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.leader-pill {
  border: 1px solid #CBD5E1;
  background: #FFFFFF;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
  cursor: pointer;
}

.leader-pill.active {
  background: #1E3A8A;
  color: #FFFFFF;
  border-color: #1E3A8A;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.empty-msg {
  text-align: center;
  font-size: 12px;
  color: #94A3B8;
  padding: 16px 0;
}

@media (max-width: 1180px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }
  .projects-panel {
    position: static;
    max-height: none;
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
</style>