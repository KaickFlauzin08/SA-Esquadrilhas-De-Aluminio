<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import UserMenu from '../Components/UserMenu.vue'
import { getToken, getUsuario } from '../utils/auth'

type Aba = 'agenda' | 'historico' | 'perfil'
type StatusKey = 'em_rota' | 'pendente' | 'concluido'

interface ProjetoApi {
  id: number
  orcamentoId: number
  tecnicoId?: number | null
  statusProducao: string
}

interface OrcamentoApi {
  id: number
  nomeCliente: string
  enderecoObra?: string
}

interface Obra {
  id: number
  os: string
  cliente: string
  endereco: string
  statusKey: StatusKey
  statusLabel: string
}

const router = useRouter()
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5037/api'
const usuarioLogado = getUsuario()

const abaAtiva = ref<Aba>('agenda')
const carregando = ref(false)
const obras = ref<Obra[]>([])

const primeiroNome = computed(
  () => (usuarioLogado?.nome || 'Técnico').trim().split(/\s+/)[0] ?? 'Técnico',
)

const saudacao = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
})

const iniciais = computed(() => primeiroNome.value.charAt(0).toUpperCase())

// "Hoje, 24 de Maio"
const dataHoje = computed(() => {
  const txt = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
  return 'Hoje, ' + txt.replace(/de (\w)/, (_, l: string) => `de ${l.toUpperCase()}`)
})

const agenda = computed(() => obras.value.filter((o) => o.statusKey !== 'concluido'))
const historico = computed(() => obras.value.filter((o) => o.statusKey === 'concluido'))
const listaAtual = computed(() => (abaAtiva.value === 'historico' ? historico.value : agenda.value))

function mapearStatus(status: string): { statusKey: StatusKey; statusLabel: string } {
  const s = (status || '').toUpperCase()
  if (s.includes('CONCLU') || s.includes('FINAL')) {
    return { statusKey: 'concluido', statusLabel: 'CONCLUÍDO' }
  }
  // Liberado/Em instalação = técnico já pode ir a campo
  if (s.includes('LIBER') || s.includes('INSTAL') || s.includes('ROTA')) {
    return { statusKey: 'em_rota', statusLabel: 'EM ROTA' }
  }
  return { statusKey: 'pendente', statusLabel: 'PENDENTE' }
}

async function carregarAgenda() {
  carregando.value = true
  try {
    const headers = { Authorization: `Bearer ${getToken()}` }
    const [resProjetos, resOrcamentos] = await Promise.all([
      fetch(`${API_URL}/projeto`, { headers }),
      fetch(`${API_URL}/orcamento`, { headers }),
    ])

    const projetos: ProjetoApi[] = resProjetos.ok ? await resProjetos.json() : []
    const orcamentos: OrcamentoApi[] = resOrcamentos.ok ? await resOrcamentos.json() : []
    const mapa = new Map(orcamentos.map((o) => [o.id, o]))

    obras.value = projetos
      .filter((p) => p.tecnicoId === usuarioLogado?.id) // só as obras do técnico logado
      .map((p) => {
        const orc = mapa.get(p.orcamentoId)
        return {
          id: p.id,
          os: `OS #${p.id}`,
          cliente: orc?.nomeCliente || `Orçamento #${p.orcamentoId}`,
          endereco: orc?.enderecoObra || 'Endereço não informado',
          ...mapearStatus(p.statusProducao),
        }
      })
      .sort((a, b) => b.id - a.id)
  } catch (err) {
    console.error('Erro ao carregar agenda:', err)
  } finally {
    carregando.value = false
  }
}

function abrirMapa(endereco: string) {
  window.open(
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`,
    '_blank',
  )
}

// Ajuste os destinos conforme o fluxo do seu app
function verDetalhes(_obra: Obra) {
  router.push('/projetos')
}

function iniciarObra(_obra: Obra) {
  router.push('/liberacao')
}

function chamarSuporte() {
  // TODO: trocar pelo canal de suporte real (WhatsApp, telefone, ocorrência...)
  router.push('/ocorrencia')
}

onMounted(carregarAgenda)
</script>

<template>
  <div class="mob-wrapper">
    <div class="mob-screen">
      <!-- Cabeçalho -->
      <header class="hero">
        <div class="hero-top">
          <div>
            <p class="hero-greeting">{{ saudacao }}, {{ primeiroNome }}</p>
            <h1 class="hero-title">Minha Agenda</h1>
          </div>
          <div class="avatar" aria-hidden="true">
            {{ iniciais }}
            <span class="avatar-online"></span>
          </div>
        </div>

        <div class="hero-pills">
          <span class="pill-date">{{ dataHoje }}</span>
          <span class="pill-count">{{ agenda.length }} {{ agenda.length === 1 ? 'OBRA' : 'OBRAS' }}</span>
        </div>
      </header>

      <!-- Conteúdo -->
      <main class="content">
        <!-- Agenda / Histórico -->
        <template v-if="abaAtiva !== 'perfil'">
          <p v-if="carregando" class="feedback">Carregando obras...</p>

          <p v-else-if="listaAtual.length === 0" class="feedback">
            {{
              abaAtiva === 'agenda'
                ? 'Nenhuma obra atribuída a você no momento.'
                : 'Você ainda não concluiu nenhuma obra.'
            }}
          </p>

          <article v-for="(obra, i) in listaAtual" :key="obra.id" class="obra-card">
            <div class="obra-head">
              <div>
                <span class="obra-os">{{ obra.os }}</span>
                <h2 class="obra-cliente">{{ obra.cliente }}</h2>
              </div>
              <span :class="['badge', `badge-${obra.statusKey}`]">
                <svg v-if="obra.statusKey === 'em_rota'" width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                </svg>
                <svg v-else-if="obra.statusKey === 'pendente'" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="9" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 7v5l3 2" />
                </svg>
                <svg v-else width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {{ obra.statusLabel }}
              </span>
            </div>

            <div class="endereco-box">
              <span class="pin">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
                </svg>
              </span>
              <span class="endereco-txt">{{ obra.endereco }}</span>
              <button
                type="button"
                :class="['map-btn', { 'map-btn-ativo': i === 0 && obra.statusKey === 'em_rota' }]"
                aria-label="Abrir no mapa"
                @click="abrirMapa(obra.endereco)"
              >
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
                </svg>
              </button>
            </div>

            <!-- Ações: obra em rota tem ação principal; demais só visualizam -->
            <div v-if="obra.statusKey === 'em_rota'" class="acoes">
              <button type="button" class="btn-secundario" @click="verDetalhes(obra)">Detalhes</button>
              <button type="button" class="btn-primario" @click="iniciarObra(obra)">Iniciar Obra</button>
            </div>
            <button v-else type="button" class="btn-visualizar" @click="verDetalhes(obra)">
              VISUALIZAR DADOS
            </button>
          </article>

          <p v-if="!carregando && listaAtual.length > 0" class="fim-agenda">
            {{ abaAtiva === 'agenda' ? 'FIM DA AGENDA DE HOJE' : 'FIM DO HISTÓRICO' }}
          </p>
        </template>

        <!-- Perfil -->
        <section v-else class="perfil">
          <div class="avatar avatar-grande">{{ iniciais }}</div>
          <h2>{{ usuarioLogado?.nome || 'Usuário' }}</h2>
          <p>Técnico de campo</p>
          <div class="perfil-menu"><UserMenu /></div>
        </section>
      </main>

      <!-- Botão flutuante de suporte -->
      <button type="button" class="fab" aria-label="Chamar suporte" @click="chamarSuporte">
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 1a9 9 0 00-9 9v7a3 3 0 003 3h1a1 1 0 001-1v-7a1 1 0 00-1-1H5v-1a7 7 0 0114 0v1h-2a1 1 0 00-1 1v7a1 1 0 001 1h1v1a2 2 0 01-2 2h-3v2h3a4 4 0 004-4v-1a3 3 0 003-3v-7a9 9 0 00-9-9z" />
        </svg>
      </button>

      <!-- Navegação inferior -->
      <nav class="bottom-nav">
        <button type="button" :class="['nav-item', { ativo: abaAtiva === 'agenda' }]" @click="abaAtiva = 'agenda'">
          <span class="nav-icon">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10z" />
            </svg>
          </span>
          Agenda
        </button>
        <button type="button" :class="['nav-item', { ativo: abaAtiva === 'historico' }]" @click="abaAtiva = 'historico'">
          <span class="nav-icon">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 12a9 9 0 109-9 9 9 0 00-6.36 2.64L3 8m0-5v5h5m4-1v5l3 2" />
            </svg>
          </span>
          Histórico
        </button>
        <button type="button" :class="['nav-item', { ativo: abaAtiva === 'perfil' }]" @click="abaAtiva = 'perfil'">
          <span class="nav-icon">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 3a3 3 0 110 6 3 3 0 010-6zm0 14.2a7.2 7.2 0 01-6-3.22c.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08A7.2 7.2 0 0112 19.2z" />
            </svg>
          </span>
          Perfil
        </button>
      </nav>
    </div>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.mob-wrapper {
  min-height: 100vh;
  background: #e2e8f0;
  display: flex;
  justify-content: center;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1e293b;
}

.mob-screen {
  position: relative;
  width: 100%;
  max-width: 480px;
  min-height: 100vh;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}

/* Cabeçalho */
.hero {
  position: relative;
  z-index: 1;
  background: #1e3a8a;
  color: #fff;
  padding: 36px 24px 28px;
  border-radius: 0 0 40px 40px;
  overflow: hidden;
}

.hero::before,
.hero::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  pointer-events: none;
}

.hero::before {
  width: 150px;
  height: 150px;
  top: -50px;
  left: -40px;
}

.hero::after {
  width: 130px;
  height: 130px;
  right: -30px;
  bottom: -50px;
}

.hero-top {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hero-greeting {
  margin: 0;
  font-size: 13px;
  color: #dbeafe;
}

.hero-title {
  margin: 4px 0 0;
  font-size: 26px;
  font-weight: 700;
}

.avatar {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #3b82f6;
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  flex-shrink: 0;
}

.avatar-online {
  position: absolute;
  right: -4px;
  bottom: -4px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #22c55e;
  border: 2px solid #1e3a8a;
}

.hero-pills {
  position: relative;
  display: flex;
  gap: 10px;
  margin-top: 22px;
}

.pill-date,
.pill-count {
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
}

.pill-date {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.pill-count {
  background: rgba(16, 185, 129, 0.18);
  color: #34d399;
  font-size: 10px;
  letter-spacing: 0.06em;
  display: flex;
  align-items: center;
}

/* Conteúdo */
.content {
  flex: 1;
  padding: 16px 16px 170px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feedback {
  margin: 32px 0;
  text-align: center;
  font-size: 13px;
  color: #64748b;
}

.obra-card {
  background: #fff;
  border: 1px solid #f1f5f9;
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}

.obra-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.obra-os {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #94a3b8;
}

.obra-cliente {
  margin: 2px 0 0;
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}

.badge-em_rota { background: #dbeafe; color: #1d4ed8; }
.badge-pendente { background: #fef9c3; color: #a16207; }
.badge-concluido { background: #dcfce7; color: #15803d; }

.endereco-box {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  padding: 10px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 14px;
}

.pin {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #1e3a8a;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.endereco-txt {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.map-btn {
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 10px;
  background: #e2e8f0;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.map-btn-ativo {
  background: #1e3a8a;
  color: #fff;
}

.acoes {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.btn-secundario,
.btn-primario,
.btn-visualizar {
  border: none;
  border-radius: 12px;
  padding: 13px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.btn-secundario {
  flex: 1;
  background: #eef2f7;
  color: #475569;
}

.btn-primario {
  flex: 1.6;
  background: #1e3a8a;
  color: #fff;
}

.btn-visualizar {
  width: 100%;
  margin-top: 14px;
  background: #eef2f7;
  color: #64748b;
  font-size: 11px;
  letter-spacing: 0.06em;
}

.btn-secundario:active,
.btn-visualizar:active { background: #e2e8f0; }
.btn-primario:active { background: #1e40af; }

.fim-agenda {
  margin: 8px 0 0;
  text-align: center;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: #94a3b8;
}

/* Perfil */
.perfil {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 32px;
  text-align: center;
}

.avatar-grande {
  width: 84px;
  height: 84px;
  border-radius: 22px;
  font-size: 32px;
  background: #1e3a8a;
  color: #fff;
}

.perfil h2 { margin: 16px 0 2px; font-size: 18px; }
.perfil p { margin: 0; font-size: 13px; color: #64748b; }
.perfil-menu { margin-top: 20px; }

/* Botão flutuante */
.fab {
  position: fixed;
  bottom: 92px;
  right: max(16px, calc(50% - 224px));
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 18px;
  background: #ef4444;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.35);
  cursor: pointer;
  z-index: 30;
}

.fab:active { background: #dc2626; }

/* Navegação inferior */
.bottom-nav {
  position: fixed;
  bottom: 0;
  width: 100%;
  max-width: 480px;
  background: #fff;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-around;
  padding: 10px 0 calc(10px + env(safe-area-inset-bottom, 0px));
  z-index: 20;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  cursor: pointer;
  padding: 0 18px;
}

.nav-icon {
  width: 46px;
  height: 32px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-item.ativo { color: #1e3a8a; font-weight: 700; }
.nav-item.ativo .nav-icon { background: #e8edf8; }

.fab:focus-visible,
.nav-item:focus-visible,
.btn-primario:focus-visible,
.btn-secundario:focus-visible,
.btn-visualizar:focus-visible,
.map-btn:focus-visible {
  outline: 3px solid #93c5fd;
  outline-offset: 2px;
}
</style>