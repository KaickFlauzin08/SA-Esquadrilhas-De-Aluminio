<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '../Components/Sidebar.vue'
import { getToken, getUsuario } from '../utils/auth'

type Status = 'novo' | 'pendente' | 'execucao' | 'concluido'
type Aba = 'todos' | 'novos' | 'pendencias'

interface Projeto {
  id: string
  rawId: number
  orcamentoId: number
  titulo: string
  descricao: string
  cliente: string
  dataEntrada: string // ISO (yyyy-mm-dd)
  prazoEntrega: string
  status: Status
  statusApi: string
  valor: number
  tecnicoId: number | null
  tecnicoNome: string
}

interface UsuarioApi {
  id: number
  nome: string
  perfil: string
  ativo: boolean
}

const router = useRouter()
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5037/api'
const usuarioLogado = getUsuario()
const isGestor = computed(() => usuarioLogado?.roles?.toUpperCase() === 'GESTOR')

const projetos = ref<Projeto[]>([])
const tecnicos = ref<UsuarioApi[]>([])
const carregando = ref(false)
const notificacoes = ref(0)

/* ---------- Modais de Visualização / Edição ---------- */
const projetoSelecionado = ref<Projeto | null>(null)
const itensOrcamento = ref<any[]>([])
const modalModo = ref<'visualizar' | 'editar' | null>(null)
const salvandoEdicao = ref(false)
const formEdicao = ref({
  statusProducao: 'AGUARDANDO_MEDICAO',
  tecnicoId: '' as string | number,
  prazoFinalEntrega: '',
})

function mapearStatus(statusApi: string): Status {
  const s = (statusApi || '').toUpperCase()
  if (s === 'CONCLUIDO' || s === 'FINALIZADO') return 'concluido'
  if (s.includes('PRODU') || s.includes('INSTAL')) return 'execucao'
  if (s.includes('PENDEN') || s.includes('LIBER')) return 'pendente'
  return 'novo' // AGUARDANDO_MEDICAO
}

const fluxoStatus = [
  'AGUARDANDO_MEDICAO',
  'EM_PRODUCAO',
  'LIBERADO',
  'EM_INSTALACAO',
  'CONCLUIDO',
]

async function carregarProjetos() {
  carregando.value = true
  try {
    const headers = { Authorization: `Bearer ${getToken()}` }

    const [resProj, resOrc, resReg, resUsers] = await Promise.all([
      fetch(`${API_URL}/projeto`, { headers }),
      fetch(`${API_URL}/orcamento`, { headers }),
      fetch(`${API_URL}/registroobra`, { headers }),
      fetch(`${API_URL}/user`, { headers }),
    ])

    const listaProjetos = resProj.ok ? await resProj.json() : []
    const listaOrcamentos = resOrc.ok ? await resOrc.json() : []
    const listaRegistros = resReg.ok ? await resReg.json() : []
    const listaUsers: UsuarioApi[] = resUsers.ok ? await resUsers.json() : []

    tecnicos.value = listaUsers.filter(
      (u) => u.ativo && u.perfil?.toUpperCase() === 'TECNICO_CAMPO'
    )

    // Ocorrências em aberto alimentam o badge do sino
    notificacoes.value = listaRegistros.filter((r: any) => !r.resolvido).length

    const mapaOrc = new Map<number, any>()
    for (const o of listaOrcamentos) mapaOrc.set(o.id, o)

    const mapaUsers = new Map<number, UsuarioApi>()
    for (const u of listaUsers) mapaUsers.set(u.id, u)

    projetos.value = listaProjetos.map((p: any) => {
      const orc = mapaOrc.get(p.orcamentoId)
      const tec = p.tecnicoId ? mapaUsers.get(p.tecnicoId) : null
      const dataIso = (p.dataInicioContrato || new Date().toISOString()).slice(0, 10)
      const ano = dataIso.slice(0, 4)

      return {
        id: `#ESQ-${ano}-${String(p.id).padStart(3, '0')}`,
        rawId: p.id,
        orcamentoId: p.orcamentoId,
        titulo: orc?.enderecoObra || `Obra Orçamento #${p.orcamentoId}`,
        descricao: `${p.statusProducao.replace('_', ' ')}${tec ? ` • Téc. ${tec.nome}` : ''}`,
        cliente: orc?.nomeCliente || `Cliente #${p.orcamentoId}`,
        dataEntrada: dataIso,
        prazoEntrega: (p.prazoFinalEntrega || orc?.prazoEstimado || '').slice(0, 10),
        status: mapearStatus(p.statusProducao),
        statusApi: p.statusProducao,
        valor: Number(orc?.valorTotal || 0),
        tecnicoId: p.tecnicoId ?? null,
        tecnicoNome: tec?.nome || 'Não designado',
      }
    })
  } catch (err) {
    console.error('Erro ao buscar projetos da API:', err)
  } finally {
    carregando.value = false
  }
}

/* ---------- Estado da tela ---------- */
const abaAtiva = ref<Aba>('todos')
const filtroStatus = ref<'todos' | Status>('todos')
const busca = ref('')
const ordemDesc = ref(true)
const pagina = ref(1)
const porPagina = 5

const statusInfo: Record<Status, { label: string; classe: string }> = {
  novo: { label: 'Novo', classe: 'novo' },
  pendente: { label: 'Pendente', classe: 'pendente' },
  execucao: { label: 'Execução', classe: 'execucao' },
  concluido: { label: 'Concluído', classe: 'concluido' },
}

/* ---------- Cards de resumo ---------- */
const contagem = computed(() => {
  const c = { novo: 0, pendente: 0, execucao: 0, concluido: 0 }
  for (const p of projetos.value) c[p.status]++
  return c
})
const totalAtivos = computed(() => contagem.value.novo + contagem.value.pendente + contagem.value.execucao)
const pad = (n: number) => String(n).padStart(2, '0')

/* ---------- Filtro, busca, ordenação e paginação ---------- */
const filtrados = computed(() => {
  const termo = busca.value.trim().toLowerCase()
  let lista = projetos.value.filter((p) => {
    if (abaAtiva.value === 'novos' && p.status !== 'novo') return false
    if (abaAtiva.value === 'pendencias' && p.status !== 'pendente') return false
    if (filtroStatus.value !== 'todos' && p.status !== filtroStatus.value) return false
    if (termo && !`${p.id} ${p.titulo} ${p.descricao} ${p.cliente}`.toLowerCase().includes(termo)) return false
    return true
  })
  lista = [...lista].sort((a, b) =>
    ordemDesc.value ? b.dataEntrada.localeCompare(a.dataEntrada) : a.dataEntrada.localeCompare(b.dataEntrada),
  )
  return lista
})

const totalPaginas = computed(() => Math.max(1, Math.ceil(filtrados.value.length / porPagina)))
const paginaAtual = computed(() => {
  const inicio = (pagina.value - 1) * porPagina
  return filtrados.value.slice(inicio, inicio + porPagina)
})
const paginasVisiveis = computed(() => {
  const janela = 3
  let inicio = Math.max(1, pagina.value - 1)
  const fim = Math.min(totalPaginas.value, inicio + janela - 1)
  inicio = Math.max(1, fim - janela + 1)
  return Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i)
})

watch([abaAtiva, filtroStatus, busca, ordemDesc], () => {
  pagina.value = 1
})

function irParaPagina(n: number) {
  pagina.value = Math.min(Math.max(1, n), totalPaginas.value)
}

/* ---------- Formatação ---------- */
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
function formatarData(iso: string) {
  if (!iso) return '—'
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}
function iniciais(nome: string) {
  return (
    nome
      .split(' ')
      .filter((p) => p.length > 2)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('') || nome.slice(0, 2).toUpperCase()
  )
}
const paleta = ['#2f5fd0', '#0f766e', '#b45309', '#7c3aed', '#be185d', '#475569']
function corAvatar(nome: string): string {
  let h = 0
  for (const ch of nome) h = (h * 31 + ch.charCodeAt(0)) % paleta.length
  return paleta[h] ?? '#475569'
}

/* ---------- Ações ---------- */
function novoProjeto() {
  router.push('/projetos/novo')
}

async function visualizar(p: Projeto) {
  projetoSelecionado.value = p
  modalModo.value = 'visualizar'
  itensOrcamento.value = []

  try {
    const res = await fetch(`${API_URL}/orcamento/${p.orcamentoId}/itens`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (res.ok) {
      itensOrcamento.value = await res.json()
    }
  } catch (err) {
    console.error('Erro ao buscar itens do orçamento:', err)
  }
}

function editar(p: Projeto) {
  projetoSelecionado.value = p
  formEdicao.value = {
    statusProducao: p.statusApi || 'AGUARDANDO_MEDICAO',
    tecnicoId: p.tecnicoId ?? '',
    prazoFinalEntrega: p.prazoEntrega || '',
  }
  modalModo.value = 'editar'
}

async function salvarEdicaoProjeto() {
  if (!projetoSelecionado.value || salvandoEdicao.value) return
  salvandoEdicao.value = true

  const p = projetoSelecionado.value
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }

  try {
    await fetch(`${API_URL}/projeto/${p.rawId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        statusProducao: formEdicao.value.statusProducao,
        prazoFinalEntrega: formEdicao.value.prazoFinalEntrega
          ? new Date(formEdicao.value.prazoFinalEntrega).toISOString()
          : null,
      }),
    })

    if (
      isGestor.value &&
      formEdicao.value.tecnicoId &&
      Number(formEdicao.value.tecnicoId) !== p.tecnicoId
    ) {
      await fetch(
        `${API_URL}/projeto/${p.rawId}/designar-tecnico/${formEdicao.value.tecnicoId}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      )
    }

    modalModo.value = null
    await carregarProjetos()
  } catch (err) {
    console.error('Erro ao editar projeto:', err)
  } finally {
    salvandoEdicao.value = false
  }
}

async function atualizarStatus(p: Projeto) {
  const idxAtual = fluxoStatus.indexOf(p.statusApi)
  const proximoStatus =
    idxAtual >= 0 && idxAtual < fluxoStatus.length - 1
      ? fluxoStatus[idxAtual + 1]
      : 'AGUARDANDO_MEDICAO'

  try {
    const res = await fetch(`${API_URL}/projeto/${p.rawId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        statusProducao: proximoStatus,
      }),
    })

    if (res.ok) {
      await carregarProjetos()
    }
  } catch (err) {
    console.error('Erro ao avançar status do projeto:', err)
  }
}

onMounted(() => {
  carregarProjetos()
})
</script>

<template>
  <div class="layout">
    <Sidebar />

    <div class="content">
      <!-- Cabeçalho -->
      <header class="topbar">
        <h1>Gestão de Projetos</h1>

        <div class="topbar__actions">
          <label class="search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input v-model="busca" type="search" placeholder="Buscar projeto ou obra..." />
          </label>

          <button class="bell" type="button" aria-label="Notificações" @click="carregarProjetos" title="Ocorrências em aberto / Atualizar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span v-if="notificacoes" class="bell__badge">{{ notificacoes }}</span>
          </button>

          <button class="btn-primary" type="button" @click="novoProjeto">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Novo Projeto
          </button>
        </div>
      </header>

      <main class="main">
        <!-- Abas + filtros -->
        <div class="toolbar">
          <div class="tabs" role="tablist">
            <button role="tab" :aria-selected="abaAtiva === 'todos'" :class="{ active: abaAtiva === 'todos' }" @click="abaAtiva = 'todos'">
              Todos Projetos
            </button>
            <button role="tab" :aria-selected="abaAtiva === 'novos'" :class="{ active: abaAtiva === 'novos' }" @click="abaAtiva = 'novos'">
              Novos Projetos
            </button>
            <button role="tab" :aria-selected="abaAtiva === 'pendencias'" :class="{ active: abaAtiva === 'pendencias' }" @click="abaAtiva = 'pendencias'">
              Pendências
              <span class="tabs__badge">{{ contagem.pendente }}</span>
            </button>
          </div>

          <div class="filters">
            <span class="filters__label">Filtrar por Status:</span>
            <select v-model="filtroStatus" class="select">
              <option value="todos">Todos Status</option>
              <option value="novo">Novo</option>
              <option value="pendente">Pendente</option>
              <option value="execucao">Execução</option>
              <option value="concluido">Concluído</option>
            </select>
            <button
              class="icon-btn icon-btn--bordered"
              type="button"
              :title="ordemDesc ? 'Mais recentes primeiro' : 'Mais antigos primeiro'"
              aria-label="Alterar ordenação por data"
              @click="ordemDesc = !ordemDesc"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 5h10" />
                <path d="M11 9h7" />
                <path d="M11 13h4" />
                <path d="M3 17l3 3 3-3" />
                <path d="M6 18V4" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Cards de resumo -->
        <section class="stats">
          <article class="stat">
            <span class="stat__icon stat__icon--blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 3a2 2 0 0 0-2 2v1H4a2 2 0 0 0-2 2v4h20V8a2 2 0 0 0-2-2h-4V5a2 2 0 0 0-2-2h-4zm0 2h4v1h-4V5zM2 14v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5h-8v1.5h-4V14H2z" /></svg>
            </span>
            <div>
              <p class="stat__label">Total Ativos</p>
              <strong class="stat__value">{{ totalAtivos }}</strong>
            </div>
          </article>

          <article class="stat">
            <span class="stat__icon stat__icon--yellow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
                <path d="M12 7v5l3 2" />
              </svg>
            </span>
            <div>
              <p class="stat__label">Pendentes</p>
              <strong class="stat__value">{{ pad(contagem.pendente) }}</strong>
            </div>
          </article>

          <article class="stat">
            <span class="stat__icon stat__icon--green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="3 3.2">
                <circle cx="12" cy="12" r="8" />
              </svg>
            </span>
            <div>
              <p class="stat__label">Em Execução</p>
              <strong class="stat__value">{{ pad(contagem.execucao) }}</strong>
            </div>
          </article>

          <article class="stat">
            <span class="stat__icon stat__icon--gray">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.2 14.2-3.5-3.5 1.4-1.4 2.1 2.1 4.6-4.6 1.4 1.4-6 6z" /></svg>
            </span>
            <div>
              <p class="stat__label">Concluídos (Mês)</p>
              <strong class="stat__value">{{ pad(contagem.concluido) }}</strong>
            </div>
          </article>
        </section>

        <!-- Tabela -->
        <section class="table-card">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Projeto / Obra</th>
                  <th>Cliente</th>
                  <th>Data Entrada</th>
                  <th>Status</th>
                  <th class="right">Valor Total</th>
                  <th class="center">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="carregando">
                  <td colspan="7" class="vazio">Carregando projetos da API...</td>
                </tr>

                <tr v-else v-for="p in paginaAtual" :key="p.id">
                  <td class="id">{{ p.id }}</td>
                  <td>
                    <strong class="proj__title">{{ p.titulo }}</strong>
                    <span class="proj__desc">{{ p.descricao }}</span>
                  </td>
                  <td>
                    <div class="cliente">
                      <span class="avatar" :style="{ backgroundColor: corAvatar(p.cliente) }">{{ iniciais(p.cliente) }}</span>
                      <span>{{ p.cliente }}</span>
                    </div>
                  </td>
                  <td class="data">{{ formatarData(p.dataEntrada) }}</td>
                  <td>
                    <span class="chip" :class="`chip--${statusInfo[p.status].classe}`">
                      <svg v-if="p.status === 'novo'" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" /></svg>
                      <svg v-else-if="p.status === 'pendente'" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm1 15h-2v-2h2v2zm0-4h-2V9h2v4z" /></svg>
                      <svg v-else-if="p.status === 'execucao'" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3.3h-4l-.4 2.6a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1c.5.4 1.1.8 1.7 1l.4 2.6h4l.4-2.6c.6-.2 1.2-.6 1.7-1l2.5 1 2-3.5L19.4 13zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" /></svg>
                      <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>
                      {{ statusInfo[p.status].label }}
                    </span>
                  </td>
                  <td class="valor">{{ moeda.format(p.valor) }}</td>
                  <td>
                    <div class="acoes">
                      <button class="icon-btn" type="button" title="Visualizar" aria-label="Visualizar projeto" @click="visualizar(p)">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button class="icon-btn" type="button" title="Editar" aria-label="Editar projeto" @click="editar(p)">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button class="icon-btn" type="button" title="Avançar status" aria-label="Atualizar status" @click="atualizarStatus(p)">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="23 4 23 10 17 10" />
                          <polyline points="1 20 1 14 7 14" />
                          <path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>

                <tr v-if="!carregando && !paginaAtual.length">
                  <td colspan="7" class="vazio">Nenhum projeto encontrado com esses filtros.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <footer class="table-footer">
            <span>Mostrando {{ paginaAtual.length }} de {{ filtrados.length }} projetos</span>

            <nav class="pager" aria-label="Paginação">
              <button class="pager__btn" type="button" :disabled="pagina === 1" aria-label="Página anterior" @click="irParaPagina(pagina - 1)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <button
                v-for="n in paginasVisiveis"
                :key="n"
                class="pager__btn"
                :class="{ active: n === pagina }"
                type="button"
                :aria-current="n === pagina ? 'page' : undefined"
                @click="irParaPagina(n)"
              >
                {{ n }}
              </button>
              <button class="pager__btn" type="button" :disabled="pagina === totalPaginas" aria-label="Próxima página" @click="irParaPagina(pagina + 1)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </nav>
          </footer>
        </section>
      </main>
    </div>

    <!-- Modal Visualizar / Editar Projeto -->
    <div v-if="modalModo && projetoSelecionado" class="modal-backdrop" @click.self="modalModo = null">
      <div class="modal-box">
        <div class="modal-header">
          <h3>
            {{ modalModo === 'visualizar' ? `Detalhes ${projetoSelecionado.id}` : `Editar ${projetoSelecionado.id}` }}
          </h3>
          <button type="button" @click="modalModo = null">&times;</button>
        </div>

        <div v-if="modalModo === 'visualizar'" class="modal-body">
          <p><strong>Cliente:</strong> {{ projetoSelecionado.cliente }}</p>
          <p><strong>Obra:</strong> {{ projetoSelecionado.titulo }}</p>
          <p><strong>Status Atual:</strong> {{ projetoSelecionado.statusApi }}</p>
          <p><strong>Técnico:</strong> {{ projetoSelecionado.tecnicoNome }}</p>
          <p><strong>Entrega Prevista:</strong> {{ formatarData(projetoSelecionado.prazoEntrega) }}</p>
          <p><strong>Valor Total:</strong> {{ moeda.format(projetoSelecionado.valor) }}</p>

          <div v-if="itensOrcamento.length" class="itens-box">
            <strong>Esquadrias / Itens:</strong>
            <ul>
              <li v-for="item in itensOrcamento" :key="item.id">
                {{ item.quantidade }}x {{ item.descricaoItem }} ({{ item.largura }}x{{ item.altura }}mm - {{ item.tipoAbertura }})
              </li>
            </ul>
          </div>
        </div>

        <form v-else class="modal-body" @submit.prevent="salvarEdicaoProjeto">
          <label class="modal-field">
            <span>Status de Produção</span>
            <select v-model="formEdicao.statusProducao" class="select">
              <option value="AGUARDANDO_MEDICAO">Aguardando Medição</option>
              <option value="EM_PRODUCAO">Em Produção</option>
              <option value="LIBERADO">Liberado</option>
              <option value="EM_INSTALACAO">Em Instalação</option>
              <option value="CONCLUIDO">Concluído</option>
            </select>
          </label>

          <label v-if="isGestor" class="modal-field">
            <span>Técnico Designado</span>
            <select v-model="formEdicao.tecnicoId" class="select">
              <option value="">Sem técnico</option>
              <option v-for="t in tecnicos" :key="t.id" :value="t.id">{{ t.nome }}</option>
            </select>
          </label>

          <label class="modal-field">
            <span>Prazo Final de Entrega</span>
            <input v-model="formEdicao.prazoFinalEntrega" type="date" class="select" />
          </label>

          <div class="modal-footer">
            <button type="button" class="pager__btn" @click="modalModo = null">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="salvandoEdicao">
              {{ salvandoEdicao ? 'Salvando...' : 'Salvar Alterações' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.layout {
  display: flex;
  height: 100vh;
  background: #f8fafc;
  font-family: 'Inter', system-ui, -apple-system, Roboto, sans-serif;
  color: #0f172a;
}

.content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

/* Cabeçalho */
.topbar {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 32px;
  background: #ffffff;
  border-bottom: 1px solid #e5e9f0;
}

.topbar h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.topbar__actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 280px;
  padding: 0 12px;
  height: 36px;
  background: #eef1f6;
  border-radius: 10px;
  color: #64748b;
}

.search input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: 13px;
  color: #0f172a;
}

.search:focus-within {
  box-shadow: 0 0 0 2px #bfd3ff;
}

.bell {
  position: relative;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: #475569;
  cursor: pointer;
  border-radius: 10px;
}

.bell:hover {
  background: #eef1f6;
}

.bell__badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 15px;
  height: 15px;
  padding: 0 4px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 18px;
  border: none;
  border-radius: 8px;
  background: #2f6bf0;
  color: #fff;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s;
}

.btn-primary:hover {
  background: #2258d6;
}

/* Conteúdo */
.main {
  padding: 24px 32px 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.tabs {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  background: #fff;
  border: 1px solid #e5e9f0;
  border-radius: 10px;
}

.tabs button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: #334155;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.tabs button:hover:not(.active) {
  background: #f1f5f9;
}

.tabs button.active {
  background: #2f6bf0;
  color: #fff;
}

.tabs__badge {
  padding: 1px 7px;
  border-radius: 999px;
  background: #fee2e2;
  color: #dc2626;
  font-size: 11px;
  font-weight: 700;
}

.filters {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filters__label {
  font-size: 13px;
  color: #64748b;
}

.select {
  height: 36px;
  padding: 0 12px;
  border: 1px solid #e5e9f0;
  border-radius: 8px;
  background: #fff;
  font: inherit;
  font-size: 13px;
  color: #0f172a;
  cursor: pointer;
}

.icon-btn {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
}

.icon-btn:hover {
  background: #eef1f6;
  color: #2f6bf0;
}

.icon-btn--bordered {
  width: 36px;
  height: 36px;
  border: 1px solid #e5e9f0;
  background: #fff;
}

/* Cards de resumo */
.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: #fff;
  border: 1px solid #e5e9f0;
  border-radius: 14px;
}

.stat__icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  flex-shrink: 0;
}

.stat__icon--blue { background: #e6eefe; color: #2f6bf0; }
.stat__icon--yellow { background: #fff4d6; color: #f59e0b; }
.stat__icon--green { background: #dcfae9; color: #10b981; }
.stat__icon--gray { background: #eceff4; color: #475569; }

.stat__label {
  margin: 0 0 2px;
  font-size: 13px;
  color: #64748b;
}

.stat__value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
}

/* Tabela */
.table-card {
  background: #fff;
  border: 1px solid #e5e9f0;
  border-radius: 14px;
  overflow: hidden;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 860px;
}

thead th {
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e9f0;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
  white-space: nowrap;
}

th.right, td.valor { text-align: right; }
th.center { text-align: center; }

tbody td {
  padding: 16px 20px;
  border-bottom: 1px solid #eef1f6;
  font-size: 13px;
  vertical-align: middle;
}

tbody tr:hover {
  background: #fafbff;
}

td.id {
  color: #94a3b8;
  font-weight: 500;
  white-space: nowrap;
}

.proj__title {
  display: block;
  font-size: 13px;
  font-weight: 700;
}

.proj__desc {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: #64748b;
}

.cliente {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

td.data {
  white-space: nowrap;
  color: #334155;
}

td.valor {
  font-weight: 700;
  white-space: nowrap;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.chip--novo { background: #dbe8ff; color: #2f5fd0; }
.chip--pendente { background: #fdf0c4; color: #b45309; }
.chip--execucao { background: #d3f5e4; color: #047857; }
.chip--concluido { background: #e5e7eb; color: #475569; }

.acoes {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.vazio {
  padding: 40px 20px;
  text-align: center;
  color: #64748b;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  font-size: 13px;
  color: #64748b;
}

.pager {
  display: flex;
  gap: 6px;
}

.pager__btn {
  display: grid;
  place-items: center;
  min-width: 30px;
  height: 30px;
  padding: 0 8px;
  border: 1px solid #e5e9f0;
  border-radius: 6px;
  background: #fff;
  color: #334155;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.pager__btn:hover:not(:disabled):not(.active) {
  background: #f1f5f9;
}

.pager__btn.active {
  background: #2f6bf0;
  border-color: #2f6bf0;
  color: #fff;
  font-weight: 600;
}

.pager__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: center;
  padding: 16px;
  z-index: 50;
}

.modal-box {
  width: 100%;
  max-width: 440px;
  background: #fff;
  border-radius: 14px;
  padding: 20px 24px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.12);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.modal-header button {
  border: none;
  background: transparent;
  font-size: 22px;
  color: #64748b;
  cursor: pointer;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
}

.modal-body p {
  margin: 0;
}

.itens-box {
  margin-top: 8px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.itens-box ul {
  margin: 6px 0 0;
  padding-left: 18px;
}

.modal-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-weight: 600;
  color: #334155;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

/* Responsivo */
@media (max-width: 1100px) {
  .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 720px) {
  .topbar { padding: 12px 16px; flex-wrap: wrap; }
  .search { width: 100%; }
  .main { padding: 16px; }
  .stats { grid-template-columns: 1fr; }
  .table-footer { flex-direction: column; align-items: flex-start; }
}
</style>