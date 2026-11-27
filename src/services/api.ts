// =====================================================================
// api.ts — único arquivo que conversa com a API nas telas mobile.
// Envia o JWT sozinho, traduz erros e agrupa as chamadas por obra.
// =====================================================================
import { getToken, getUsuario, isGestor, logout } from '../utils/auth'

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5037/api').replace(/\/+$/, '')

// ---------------------------------------------------------------------
// Tipos (espelham os DTOs da API)
// ---------------------------------------------------------------------
export interface Projeto {
  id: number
  orcamentoId: number
  tecnicoId: number | null
  dataMedicaoFinal: string | null
  dataInicioContrato: string
  prazoFinalEntrega: string | null
  statusProducao: string
}

export interface Orcamento {
  id: number
  nomeCliente: string
  telefoneCliente: string | null
  emailCliente: string | null
  enderecoObra: string | null
  prazoEstimado: string | null
  valorTotal: number
  status: string
}

export interface ItemOrcamento {
  id: number
  orcamentoId: number
  descricaoItem: string
  altura: number // mm
  largura: number // mm
  tipoAbertura: string | null
  ladoAbertura: string | null
  posicaoFechadura: string | null
  quantidade: number
}

export interface Liberacao {
  id: number
  projetoId: number
  dataLiberacao: string
  escopoLiberado: string | null
  observacoes: string | null
  liberado: boolean
}

export interface RegistroObra {
  id: number
  projetoId: number
  dataRegistro: string
  etapaProcesso: string
  descricao: string
}

export interface Ocorrencia {
  id: number
  projetoId: number
  titulo: string
  tipo: string
  severidade: string
  descricao: string
  fotoUrl: string | null
  bloqueiaObra: boolean
  resolvida: boolean
  dataAbertura: string
}

/** Resumo usado na lista da agenda */
export interface Obra {
  id: number
  cliente: string
  endereco: string
  prazo: string | null
  status: string
  rotulo: string
  concluida: boolean
  pendente: boolean
}

/** Tudo de uma obra, usado nas telas de detalhe/execução/finalização/pendência */
export interface ObraCompleta {
  projeto: Projeto
  orcamento: Orcamento | null
  itens: ItemOrcamento[]
  liberacao: Liberacao | null
  registros: RegistroObra[]
  abertas: Ocorrencia[] // ocorrências ainda não resolvidas
  bloqueada: boolean // existe ocorrência aberta que bloqueia a obra
  instalados: number[] // ids dos itens já marcados como instalados
}

// ---------------------------------------------------------------------
// Requisição base
// ---------------------------------------------------------------------
async function request<T>(caminho: string, opcoes: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = getToken()
  const temCorpo = opcoes.body !== undefined

  let res: Response
  try {
    res = await fetch(`${API_URL}${caminho}`, {
      method: opcoes.method ?? 'GET',
      headers: {
        ...(temCorpo ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: temCorpo ? JSON.stringify(opcoes.body) : undefined,
    })
  } catch {
    throw new Error(`Não foi possível conectar à API (${API_URL}). Verifique a rede e o endereço no arquivo .env.`)
  }

  const texto = await res.text()
  let dados: any = null
  try {
    dados = texto ? JSON.parse(texto) : null
  } catch {
    dados = texto
  }

  if (res.status === 401) {
    logout()
    window.location.assign(import.meta.env.BASE_URL)
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  if (!res.ok) {
    const msg = dados && typeof dados === 'object' ? dados.mensagem || dados.title : ''
    throw new Error(msg || `Erro ${res.status} ao falar com a API.`)
  }

  return dados as T
}

// ---------------------------------------------------------------------
// Status e formatação
// ---------------------------------------------------------------------
const ROTULOS: Record<string, string> = {
  AGUARDANDO_MEDICAO: 'Aguardando medição',
  EM_PRODUCAO: 'Em produção',
  LIBERADO: 'Liberada',
  EM_INSTALACAO: 'Em instalação',
  CONCLUIDO: 'Concluída',
}

export function rotuloStatus(status: string): string {
  const s = (status || '').toUpperCase()
  return ROTULOS[s] ?? s.replace(/_/g, ' ').toLowerCase()
}

/** O técnico só executa depois que a obra foi liberada */
export function podeExecutar(status: string): boolean {
  return status === 'LIBERADO' || status === 'EM_INSTALACAO'
}

export function dataBR(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR')
}

// ---------------------------------------------------------------------
// Agenda
// ---------------------------------------------------------------------
export async function listarObras(): Promise<Obra[]> {
  const usuario = getUsuario()

  const [projetos, orcamentos, abertas] = await Promise.all([
    request<Projeto[]>('/Projeto'),
    request<Orcamento[]>('/Orcamento'),
    request<Ocorrencia[]>('/Ocorrencia?resolvida=false'),
  ])

  const orcamentoPorId = new Map(orcamentos.map((o) => [o.id, o]))
  const bloqueados = new Set(abertas.filter((o) => o.bloqueiaObra).map((o) => o.projetoId))

  return projetos
    .filter((p) => isGestor() || p.tecnicoId === usuario?.id) // técnico só vê as dele
    .map((p) => {
      const orc = orcamentoPorId.get(p.orcamentoId)
      const status = (p.statusProducao || '').toUpperCase()
      const concluida = status === 'CONCLUIDO'
      const pendente = !concluida && bloqueados.has(p.id)
      return {
        id: p.id,
        cliente: orc?.nomeCliente || `Orçamento #${p.orcamentoId}`,
        endereco: orc?.enderecoObra || 'Endereço não informado',
        prazo: p.prazoFinalEntrega,
        status,
        rotulo: pendente ? 'Pendente' : rotuloStatus(status),
        concluida,
        pendente,
      }
    })
    .sort((a, b) => b.id - a.id)
}

// ---------------------------------------------------------------------
// Dados completos de uma obra
// ---------------------------------------------------------------------
const PADRAO_ITEM = /^Item instalado #(\d+):/

export async function carregarObra(projetoId: number): Promise<ObraCompleta> {
  const projetos = await request<Projeto[]>('/Projeto')
  const projeto = projetos.find((p) => p.id === projetoId)
  if (!projeto) throw new Error('Obra não encontrada.')

  const [orcamentos, itens, liberacoes, registros, ocorrencias] = await Promise.all([
    request<Orcamento[]>('/Orcamento'),
    request<ItemOrcamento[]>(`/Orcamento/${projeto.orcamentoId}/itens`),
    request<Liberacao[]>('/LiberacaoInstalacao'),
    request<RegistroObra[]>('/RegistroObra'),
    request<Ocorrencia[]>(`/Ocorrencia?projetoId=${projetoId}`),
  ])

  const registrosDaObra = registros.filter((r) => r.projetoId === projetoId)
  const abertas = ocorrencias.filter((o) => !o.resolvida)

  const liberacao =
    liberacoes
      .filter((l) => l.projetoId === projetoId && l.liberado)
      .sort((a, b) => b.id - a.id)[0] ?? null

  const instalados = registrosDaObra
    .map((r) => PADRAO_ITEM.exec(r.descricao ?? '')?.[1])
    .filter((n): n is string => n !== undefined)
    .map(Number)

  return {
    projeto,
    orcamento: orcamentos.find((o) => o.id === projeto.orcamentoId) ?? null,
    itens,
    liberacao,
    registros: registrosDaObra,
    abertas,
    bloqueada: abertas.some((o) => o.bloqueiaObra),
    instalados,
  }
}

// ---------------------------------------------------------------------
// Ações (tudo grava no banco)
// ---------------------------------------------------------------------
function registrar(projetoId: number, etapa: string, descricao: string): Promise<unknown> {
  return request('/RegistroObra/cadastrar', {
    method: 'POST',
    body: {
      projetoId,
      usuarioId: getUsuario()?.id ?? 0, // a API usa o id do token; este é só reserva
      etapaProcesso: etapa,
      tipoOcorrencia: 'NENHUMA',
      descricao,
      fotoUrl: null,
      resolvido: true,
    },
  })
}

/** LIBERADO → EM_INSTALACAO (se já estiver em instalação não faz nada) */
export async function iniciarExecucao(projeto: Projeto): Promise<void> {
  if (projeto.statusProducao !== 'LIBERADO') return
  await request(`/Projeto/${projeto.id}`, { method: 'PUT', body: { statusProducao: 'EM_INSTALACAO' } })
  await registrar(projeto.id, 'EM_INSTALACAO', `Execução iniciada por ${getUsuario()?.nome ?? 'técnico'}.`)
}

export function marcarItemInstalado(projetoId: number, item: ItemOrcamento): Promise<unknown> {
  return registrar(projetoId, 'EM_INSTALACAO', `Item instalado #${item.id}: ${item.descricaoItem}`)
}

export interface NovaOcorrencia {
  projetoId: number
  titulo: string
  tipo: string
  severidade: string
  descricao: string
  fotoUrl: string | null
  bloqueiaObra: boolean
}

export function criarOcorrencia(dados: NovaOcorrencia): Promise<unknown> {
  return request('/Ocorrencia/cadastrar', {
    method: 'POST',
    body: { ...dados, reportadoPorId: getUsuario()?.id ?? 0 },
  })
}

export function resolverOcorrencia(id: number, solucao: string): Promise<unknown> {
  return request(`/Ocorrencia/${id}/resolver`, { method: 'PATCH', body: { solucaoAplicada: solucao } })
}

/** Não existe endpoint de suporte: a notificação vira uma ocorrência ALTA que o gestor vê no painel */
export function notificarSuporte(projetoId: number, motivo: string): Promise<unknown> {
  return criarOcorrencia({
    projetoId,
    titulo: `Suporte solicitado - OS #${projetoId}`,
    tipo: 'TECNICA',
    severidade: 'ALTA',
    descricao: `${getUsuario()?.nome ?? 'Técnico'} pediu ajuda do suporte. ${motivo}`.trim(),
    fotoUrl: null,
    bloqueiaObra: false,
  })
}

/** Salva o e-mail do cliente (se mudou) e registra a conclusão — a API marca o projeto como CONCLUIDO */
export async function concluirObra(obra: ObraCompleta, email: string): Promise<void> {
  const orc = obra.orcamento
  if (orc && email && email !== (orc.emailCliente ?? '')) {
    await request(`/Orcamento/${orc.id}`, {
      method: 'PUT',
      body: {
        nomeCliente: orc.nomeCliente,
        telefoneCliente: orc.telefoneCliente ?? '',
        emailCliente: email,
        enderecoObra: orc.enderecoObra ?? '',
        prazoEstimado: orc.prazoEstimado,
        valorTotal: orc.valorTotal,
        status: orc.status,
      },
    })
  }

  const nome = getUsuario()?.nome ?? 'técnico'
  const sufixo = email ? ` Avaliação destinada a ${email}.` : ''
  await registrar(obra.projeto.id, 'CONCLUIDO', `Instalação concluída por ${nome}.${sufixo}`)
}

// ---------------------------------------------------------------------
// Foto: a API só tem o campo FotoUrl (texto), então a imagem é reduzida
// e enviada como data URL. Funciona e aparece no painel web.
// ---------------------------------------------------------------------
export function lerFoto(arquivo: File, maxLado = 1024, qualidade = 0.6): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo)
    const img = new Image()

    img.onload = () => {
      const escala = Math.min(1, maxLado / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * escala)
      canvas.height = Math.round(img.height * escala)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('Não foi possível processar a imagem.'))
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', qualidade))
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Arquivo de imagem inválido.'))
    }

    img.src = url
  })
}
