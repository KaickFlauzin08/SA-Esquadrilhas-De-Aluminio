<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Sidebar from '../Components/Sidebar.vue'
import { getToken, getUsuario } from '../utils/auth'

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
  rawId: number
  orcamentoId: number
  client: string
  workplace: string
  itemsCount: number
  updatedAt: string
  badge?: ProjectBadgeType
  statusProducao: string
  items: ChecklistItem[]
}

interface EtapaChecklist {
  codigo: string
  numero: number
  titulo: string
  descricaoCurta: string
  botaoConcluir: string
  proximaEtapa: string | null
}

const etapasChecklist: EtapaChecklist[] = [
  {
    codigo: 'AGUARDANDO_MEDICAO',
    numero: 1,
    titulo: 'Medição Final',
    descricaoCurta: 'Conferência técnica dos vãos na obra',
    botaoConcluir: 'Concluir Medição Final',
    proximaEtapa: 'EM_PRODUCAO',
  },
  {
    codigo: 'EM_PRODUCAO',
    numero: 2,
    titulo: 'Produção',
    descricaoCurta: 'Corte, usinagem e montagem na fábrica',
    botaoConcluir: 'Concluir Produção',
    proximaEtapa: 'LIBERADO',
  },
  {
    codigo: 'LIBERADO',
    numero: 3,
    titulo: 'Expedição',
    descricaoCurta: 'Checklist validado e liberado para entrega',
    botaoConcluir: 'Iniciar Instalação em Campo',
    proximaEtapa: 'EM_INSTALACAO',
  },
  {
    codigo: 'EM_INSTALACAO',
    numero: 4,
    titulo: 'Instalação',
    descricaoCurta: 'Montagem e acabamento na residência',
    botaoConcluir: 'Concluir Obra (Finalizar)',
    proximaEtapa: 'CONCLUIDO',
  },
  {
    codigo: 'CONCLUIDO',
    numero: 5,
    titulo: 'Concluído',
    descricaoCurta: 'Obra entregue e validada no painel do Gestor',
    botaoConcluir: '',
    proximaEtapa: null,
  },
]

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5037/api'
const usuarioLogado = getUsuario()
const nomeUsuario = computed(() => usuarioLogado?.nome || 'Técnico')
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

const searchProject = ref<string>('')
const selectedProjectId = ref<string>('')
const toastTitle = ref<string>('Modo de Inspeção Ativo')
const toastMessage = ref<string>('Pronto para validar etapas e materiais.')
const carregando = ref<boolean>(false)
const salvando = ref<boolean>(false)
const observacaoTecnico = ref<string>('')

const projects = ref<ExpeditionProject[]>([])

function tempoRelativo(iso?: string): string {
  if (!iso) return 'Recentemente'
  const diffMs = Date.now() - new Date(iso).getTime()
  const horas = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)))
  if (horas < 24) return `Há ${horas}h`
  const dias = Math.floor(horas / 24)
  return `Há ${dias}d`
}

function mapearIcone(descricao: string, bloqueado: boolean): ItemIconType {
  if (bloqueado) return 'blocked'
  const d = (descricao || '').toLowerCase()
  if (d.includes('porta') || d.includes('pivotante') || d.includes('balcão')) return 'door'
  return 'window'
}

async function carregarExpedicao() {
  carregando.value = true
  try {
    const headers = { Authorization: `Bearer ${getToken()}` }

    const [resProj, resOrc, resReg] = await Promise.all([
      fetch(`${API_URL}/projeto`, { headers }),
      fetch(`${API_URL}/orcamento`, { headers }),
      fetch(`${API_URL}/registroobra`, { headers }),
    ])

    const listaProjetos = resProj.ok ? await resProj.json() : []
    const listaOrcamentos = resOrc.ok ? await resOrc.json() : []
    const listaRegistros = resReg.ok ? await resReg.json() : []

    const mapaOrc = new Map<number, any>()
    for (const o of listaOrcamentos) mapaOrc.set(o.id, o)

    // Se for técnico de campo, prioriza os projetos designados a ele (ou todos se não houver filtro)
    const isGestor = usuarioLogado?.roles?.toUpperCase() === 'GESTOR'
    const filtradosPorPerfil = isGestor
      ? listaProjetos
      : listaProjetos.filter((p: any) => p.tecnicoId === usuarioLogado?.id || !p.tecnicoId)

    const montados: ExpeditionProject[] = await Promise.all(
      filtradosPorPerfil.map(async (p: any) => {
        const orc = mapaOrc.get(p.orcamentoId)
        const registrosProj = listaRegistros.filter((r: any) => r.projetoId === p.id)
        const ocorrenciasAbertas = registrosProj.filter((r: any) => !r.resolvido)

        let itensApi: any[] = []
        try {
          const resItens = await fetch(`${API_URL}/orcamento/${p.orcamentoId}/itens`, { headers })
          if (resItens.ok) itensApi = await resItens.json()
        } catch {
          itensApi = []
        }

        const jaLiberado = ['LIBERADO', 'EM_INSTALACAO', 'CONCLUIDO'].includes(p.statusProducao)

        const items: ChecklistItem[] = itensApi.map((item: any, idx: number) => {
          const ocorrenciaItem = ocorrenciasAbertas.find(
            (o: any) =>
              o.descricao?.toLowerCase().includes((item.descricaoItem || '').toLowerCase()) ||
              (idx === itensApi.length - 1 && ocorrenciasAbertas.length > 0 && !jaLiberado)
          )

          const isBloqueado = Boolean(ocorrenciaItem)
          const subtituloPadrao = `${(item.tipoAbertura || 'ESQUADRIA').toUpperCase()} • ${item.largura}X${item.altura}MM${item.ladoAbertura ? ` • ${item.ladoAbertura.toUpperCase()}` : ''}`

          return {
            id: item.id,
            title: `${item.descricaoItem || 'Esquadria'} (${item.quantidade}x)`,
            subtitle: isBloqueado
              ? (ocorrenciaItem.descricao || 'PENDÊNCIA TÉCNICA EM ABERTO').toUpperCase()
              : subtituloPadrao,
            status: isBloqueado ? 'bloqueado' : 'produzido',
            checked: jaLiberado && !isBloqueado,
            iconType: mapearIcone(item.descricaoItem, isBloqueado),
          }
        })

        let badge: ProjectBadgeType | undefined
        if (p.statusProducao === 'CONCLUIDO' || jaLiberado) badge = 'VALIDADO'
        else if (ocorrenciasAbertas.length > 0) badge = 'URGENTE'

        const ano = (p.dataInicioContrato || '2026').slice(0, 4)

        return {
          id: `#ORD-${ano}-${String(p.id).padStart(3, '0')}`,
          rawId: p.id,
          orcamentoId: p.orcamentoId,
          client: orc?.nomeCliente || `Cliente #${p.orcamentoId}`,
          workplace: orc?.enderecoObra || `Obra Orçamento #${p.orcamentoId}`,
          itemsCount: items.length,
          updatedAt: tempoRelativo(p.dataMedicaoFinal || p.dataInicioContrato),
          badge,
          statusProducao: p.statusProducao || 'AGUARDANDO_MEDICAO',
          items,
        }
      })
    )

    projects.value = montados

    if (montados.length > 0 && !montados.some((m) => m.id === selectedProjectId.value)) {
      selectedProjectId.value = montados[0]!.id
    }
  } catch (err) {
    console.error('Erro ao carregar central de liberações:', err)
    mostrarToast('Erro de Conexão', 'Não foi possível carregar os projetos da API.')
  } finally {
    carregando.value = false
  }
}

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

const activeProject = computed<ExpeditionProject | null>(() => {
  if (projects.value.length === 0) return null
  return (
    projects.value.find((p) => p.id === selectedProjectId.value) ??
    projects.value[0]!
  )
})

const etapaAtualIndex = computed<number>(() => {
  if (!activeProject.value) return 0
  const idx = etapasChecklist.findIndex((e) => e.codigo === activeProject.value!.statusProducao)
  return idx >= 0 ? idx : 0
})

const etapaAtualObj = computed<EtapaChecklist>(() => etapasChecklist[etapaAtualIndex.value]!)

const totalChecklistCount = computed<number>(() => {
  return activeProject.value?.items.length ?? 0
})

const completedCount = computed<number>(() => {
  if (!activeProject.value) return 0
  return activeProject.value.items.filter((i) => i.checked).length
})

const progressPercent = computed<number>(() => {
  if (totalChecklistCount.value === 0) return 0
  return Math.round((completedCount.value / totalChecklistCount.value) * 100)
})

function selecionarProjeto(id: string) {
  selectedProjectId.value = id
  observacaoTecnico.value = ''
}

function alternarItem(item: ChecklistItem) {
  item.checked = !item.checked
  if (item.checked && item.status === 'bloqueado') {
    item.status = 'produzido'
  }
}

function marcarTodosComoProntos() {
  if (!activeProject.value) return
  activeProject.value.items.forEach((item) => {
    if (item.status !== 'bloqueado') {
      item.checked = true
      item.status = 'produzido'
    }
  })
  mostrarToast('Itens Atualizados', 'Todos os itens liberados foram marcados como prontos.')
}

/* ---------- Avançar / Concluir Etapa (Sincroniza na hora com o Gestor) ---------- */
async function avancarParaEtapa(novoStatus: string, etapaConcluidaLabel?: string) {
  if (!activeProject.value || salvando.value) return
  salvando.value = true

  const proj = activeProject.value
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }

  try {
    const payloadProjeto: Record<string, any> = {
      statusProducao: novoStatus,
    }
    if (proj.statusProducao === 'AGUARDANDO_MEDICAO') {
      payloadProjeto.dataMedicaoFinal = new Date().toISOString()
    }

    // 1. Atualiza o status no ProjetoController (Gestor vê imediatamente na tabela/cards)
    const resPut = await fetch(`${API_URL}/projeto/${proj.rawId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payloadProjeto),
    })

    if (!resPut.ok) throw new Error('Falha ao atualizar etapa na API.')

    // 2. Grava o registro técnico no RegistroObraController
    const obs = observacaoTecnico.value.trim()
    const descricaoRegistro = obs
      ? `${etapaConcluidaLabel || proj.statusProducao}: ${obs}`
      : `Etapa "${etapaConcluidaLabel || proj.statusProducao}" concluída por ${nomeUsuario.value}. Status atualizado para ${novoStatus}.`

    await fetch(`${API_URL}/registroobra/cadastrar`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        projetoId: proj.rawId,
        usuarioId: usuarioLogado?.id || 1,
        etapaProcesso: proj.statusProducao,
        tipoOcorrencia: 'NENHUMA',
        descricao: descricaoRegistro,
        fotoUrl: '',
        resolvido: true,
      }),
    })

    proj.statusProducao = novoStatus
    if (['LIBERADO', 'EM_INSTALACAO', 'CONCLUIDO'].includes(novoStatus)) {
      proj.badge = 'VALIDADO'
    }
    observacaoTecnico.value = ''

    mostrarToast(
      'Etapa Concluída!',
      `Projeto ${proj.id} atualizado para ${novoStatus.replace('_', ' ')} no painel do Gestor.`
    )
  } catch (err) {
    console.error('Erro ao concluir etapa:', err)
    mostrarToast('Erro', 'Não foi possível atualizar a etapa na API.')
  } finally {
    salvando.value = false
  }
}

async function salvarRascunho() {
  if (!activeProject.value || salvando.value) return
  salvando.value = true

  try {
    const proj = activeProject.value
    const resumo = observacaoTecnico.value.trim()
      ? `Checklist (${completedCount.value}/${totalChecklistCount.value}): ${observacaoTecnico.value.trim()}`
      : `Checklist de expedição (${completedCount.value}/${totalChecklistCount.value} itens conferidos).`

    await fetch(`${API_URL}/registroobra/cadastrar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        projetoId: proj.rawId,
        usuarioId: usuarioLogado?.id || 1,
        etapaProcesso: proj.statusProducao,
        tipoOcorrencia: 'NENHUMA',
        descricao: resumo,
        fotoUrl: '',
        resolvido: true,
      }),
    })

    observacaoTecnico.value = ''
    mostrarToast(
      'Rascunho Salvo',
      `Checklist do projeto ${proj.id} salvo e enviado ao histórico do Gestor.`
    )
  } catch (err) {
    console.error('Erro ao salvar rascunho:', err)
    mostrarToast('Erro', 'Falha ao salvar rascunho na API.')
  } finally {
    salvando.value = false
  }
}

async function gerarOrdemServico() {
  await avancarParaEtapa('LIBERADO', 'Liberação de Ordem de Serviço (OS)')
}

function mostrarToast(title: string, message: string) {
  toastTitle.value = title
  toastMessage.value = message
}

onMounted(() => {
  carregarExpedicao()
})
</script>

<template>
  <div class="layout-wrapper">
    <Sidebar />

    <main class="main-area">
      <!-- Topbar -->
      <header class="topbar">
        <div class="topbar-inner">
          <div class="topbar-title-group">
            <h1 class="page-title">Central de Liberações</h1>
            <span class="title-badge">CONTROLE DE EXPEDIÇÃO &amp; CAMPO</span>
          </div>

          <div class="topbar-actions">
            <button type="button" class="icon-btn" aria-label="Atualizar" @click="carregarExpedicao" title="Sincronizar projetos">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span v-if="projects.length > 0" class="notif-dot"></span>
            </button>

            <button type="button" class="icon-btn" aria-label="Calendário">
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
              <div class="user-avatar-initials">{{ iniciaisUsuario }}</div>
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
                <p class="panel-subtitle">Prontos para validação e execução</p>
              </div>
              <span class="active-count-pill">{{ projects.length }} Ativos</span>
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
              <p v-if="carregando" class="empty-projects">
                Carregando projetos da API...
              </p>

              <div
                v-else
                v-for="project in filteredProjects"
                :key="project.id"
                :class="['project-card', { selected: activeProject && project.id === activeProject.id }]"
                @click="selecionarProjeto(project.id)"
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

              <p v-if="!carregando && filteredProjects.length === 0" class="empty-projects">
                Nenhum projeto encontrado.
              </p>
            </div>
          </aside>

          <!-- COLUNA DIREITA: Checklist de Liberação -->
          <section v-if="activeProject" class="card checklist-panel">
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
                    <span>{{ activeProject.workplace }} • {{ activeProject.client }}</span>
                  </p>
                </div>

                <div class="progress-summary">
                  <span class="progress-label">PROGRESSO DE LIBERAÇÃO</span>
                  <div class="progress-bar-row">
                    <div class="progress-track">
                      <div class="progress-fill" :style="{ width: `${progressPercent}%` }"></div>
                    </div>
                    <strong class="progress-fraction">
                      {{ completedCount }} / {{ totalChecklistCount }}
                    </strong>
                  </div>
                </div>
              </div>

              <!-- BLOCO DE ETAPAS DENTRO DO CHECKLIST -->
              <div class="stages-box">
                <div class="stages-top-bar">
                  <span class="stages-label">ETAPAS DO PROJETO (SINCRONIZADO COM GESTOR)</span>
                  <span class="current-stage-pill">
                    Etapa Atual: {{ etapaAtualObj.titulo }}
                  </span>
                </div>

                <!-- Stepper Horizontal Clicável -->
                <div class="stepper-track">
                  <button
                    v-for="(etapa, idx) in etapasChecklist"
                    :key="etapa.codigo"
                    type="button"
                    :disabled="salvando"
                    :class="[
                      'step-node',
                      {
                        done: idx < etapaAtualIndex || activeProject.statusProducao === 'CONCLUIDO',
                        active: idx === etapaAtualIndex && activeProject.statusProducao !== 'CONCLUIDO',
                      },
                    ]"
                    :title="`Definir etapa como: ${etapa.titulo}`"
                    @click="avancarParaEtapa(etapa.codigo, etapa.titulo)"
                  >
                    <span class="step-circle">
                      <template v-if="idx < etapaAtualIndex || activeProject.statusProducao === 'CONCLUIDO'">
                        ✓
                      </template>
                      <template v-else>
                        {{ etapa.numero }}
                      </template>
                    </span>
                    <span class="step-title">{{ etapa.titulo }}</span>
                  </button>
                </div>

                <!-- Ação Rápida para o Técnico Concluir a Etapa Atual -->
                <div class="stage-action-bar">
                  <div class="stage-info-text">
                    <strong>{{ etapaAtualObj.titulo }}:</strong>
                    <span>{{ etapaAtualObj.descricaoCurta }}</span>
                  </div>

                  <div class="stage-controls">
                    <input
                      v-model="observacaoTecnico"
                      type="text"
                      class="stage-note-input"
                      placeholder="Observação rápida para o Gestor (opcional)..."
                    />

                    <button
                      v-if="etapaAtualObj.proximaEtapa"
                      type="button"
                      class="btn-complete-stage"
                      :disabled="salvando"
                      @click="avancarParaEtapa(etapaAtualObj.proximaEtapa, etapaAtualObj.titulo)"
                    >
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{{ salvando ? 'Salvando...' : etapaAtualObj.botaoConcluir }}</span>
                    </button>

                    <span v-else class="completed-tag">
                      ✓ Obra 100% Concluída
                    </span>
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

                <p v-if="activeProject.items.length === 0" class="empty-projects">
                  Nenhum item cadastrado no orçamento deste projeto.
                </p>
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
                  <p class="sync-title">Envio direto para Equipe Campo &amp; Gestor</p>
                  <p class="sync-sub">Sincronização em tempo real</p>
                </div>
              </div>

              <div class="footer-buttons">
                <button type="button" class="btn-draft" :disabled="salvando" @click="salvarRascunho">
                  Salvar Rascunho
                </button>
                <button type="button" class="btn-os" :disabled="salvando" @click="gerarOrdemServico">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 9v4h2l-3 3-3-3h2v-4h2zm1-3V3.5L18.5 8H14z" />
                  </svg>
                  <span>{{ salvando ? 'Processando...' : 'Gerar Ordem de Serviço (OS)' }}</span>
                </button>
              </div>
            </footer>
          </section>

          <section v-else class="card checklist-panel" style="align-items: center; justify-content: center;">
            <p class="empty-projects">Nenhum projeto disponível para expedição.</p>
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
  padding-bottom: 20px;
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

/* ---------- BLOCO DE ETAPAS DENTRO DO CHECKLIST ---------- */
.stages-box {
  margin-top: 20px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  padding: 16px 18px;
}

.stages-top-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 14px;
}

.stages-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #64748B;
}

.current-stage-pill {
  background: #DBEAFE;
  color: #1E3A8A;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
}

.stepper-track {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.step-node {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 9px 10px;
  cursor: pointer;
  text-align: left;
  transition: 0.15s;
}

.step-node:hover:not(:disabled) {
  border-color: #93C5FD;
}

.step-node.done {
  background: #F0FDF4;
  border-color: #BBF7D0;
}

.step-node.active {
  background: #1E3A8A;
  border-color: #1E3A8A;
  color: #FFFFFF;
  box-shadow: 0 4px 10px rgba(30, 58, 138, 0.18);
}

.step-circle {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #E2E8F0;
  color: #475569;
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-node.done .step-circle {
  background: #10B981;
  color: #FFFFFF;
}

.step-node.active .step-circle {
  background: #FFFFFF;
  color: #1E3A8A;
}

.step-title {
  font-size: 11px;
  font-weight: 700;
  line-height: 1.2;
}

.stage-action-bar {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed #CBD5E1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.stage-info-text {
  font-size: 12px;
  color: #475569;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.stage-info-text strong {
  color: #1E293B;
}

.stage-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  flex: 1;
  justify-content: flex-end;
}

.stage-note-input {
  min-width: 220px;
  flex: 1;
  max-width: 320px;
  background: #FFFFFF;
  border: 1px solid #CBD5E1;
  border-radius: 9px;
  padding: 8px 12px;
  font-size: 12px;
  color: #1E293B;
  outline: none;
}

.stage-note-input:focus {
  border-color: #2563EB;
}

.btn-complete-stage {
  background: #10B981;
  color: #FFFFFF;
  border: none;
  border-radius: 9px;
  padding: 9px 16px;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.22);
  transition: 0.15s;
}

.btn-complete-stage:hover:not(:disabled) {
  background: #059669;
}

.btn-complete-stage:disabled {
  opacity: 0.6;
  cursor: progress;
}

.completed-tag {
  background: #DCFCE7;
  color: #15803D;
  font-size: 12px;
  font-weight: 700;
  padding: 7px 14px;
  border-radius: 9px;
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

.btn-os:disabled,
.btn-draft:disabled {
  opacity: 0.6;
  cursor: progress;
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
@media (max-width: 1180px) {
  .stepper-track {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1080px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .stepper-track {
    grid-template-columns: 1fr;
  }
  .user-info {
    display: none;
  }
  .inspection-toast {
    left: 16px;
    right: 16px;
  }
}
</style>