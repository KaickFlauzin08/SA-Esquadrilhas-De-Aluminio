<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Sidebar from '../Components/Sidebar.vue'
import { getToken, getUsuario } from '../utils/auth'

interface UserTech {
  id: number
  nome: string
  email?: string
  perfil: string
  ativo: boolean
}

interface EquipeMembroItem {
  usuarioId: number
  nome: string
  funcaoNaEquipe: string
}

interface EquipeGrupo {
  id: number
  nome: string
  especialidade: string
  membros: EquipeMembroItem[]
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

const tecnicos = ref<UserTech[]>([])
const equipes = ref<EquipeGrupo[]>([])
const carregando = ref(false)
const feedback = ref<string | null>(null)

// Formulário: Novo Técnico (User)
const techNome = ref('')
const techEmail = ref('')
const techNumero = ref('')
const techPassword = ref('')
const salvandoTech = ref(false)

// Formulário: Novo Grupo de Técnicos (Equipe)
const grupoNome = ref('')
const grupoEspecialidade = ref('Instalação Geral')
const selecionadosIds = ref<number[]>([])
const liderId = ref<number | null>(null)
const salvandoGrupo = ref(false)

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
      .join('') || 'TC'
  )
}

function mostrarAviso(msg: string) {
  feedback.value = msg
  setTimeout(() => {
    feedback.value = null
  }, 3500)
}

async function carregarTudo() {
  carregando.value = true
  try {
    const headers = getAuthHeaders()
    const [resUsers, resEquipes] = await Promise.all([
      fetch(`${API_URL}/user`, { headers }),
      fetch(`${API_URL}/equipe`, { headers }),
    ])

    const listaUsers: UserTech[] = resUsers.ok ? await resUsers.json() : []
    tecnicos.value = listaUsers.filter(
      (u) => u.ativo !== false && (u.perfil || '').toUpperCase() !== 'GESTOR'
    )

    equipes.value = resEquipes.ok ? await resEquipes.json() : []
  } catch (err) {
    console.error(err)
    mostrarAviso('Erro ao carregar técnicos e equipes.')
  } finally {
    carregando.value = false
  }
}

async function cadastrarTecnico() {
  if (!techNome.value.trim() || !techNumero.value.trim() || !techPassword.value.trim()) {
    mostrarAviso('Preencha Nome, Telefone/Número e Senha do técnico.')
    return
  }

  salvandoTech.value = true
  try {
    const res = await fetch(`${API_URL}/user/cadastrar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        nome: techNome.value.trim(),
        email: techEmail.value.trim() || null,
        numero: techNumero.value.trim(),
        password: techPassword.value,
        roles: 'TECNICO_CAMPO',
        ativo: true,
      }),
    })

    if (!res.ok) throw new Error('Falha ao cadastrar técnico')

    techNome.value = ''
    techEmail.value = ''
    techNumero.value = ''
    techPassword.value = ''

    await carregarTudo()
    mostrarAviso('Técnico cadastrado com sucesso!')
  } catch (err) {
    console.error(err)
    mostrarAviso('Erro ao cadastrar técnico na API.')
  } finally {
    salvandoTech.value = false
  }
}

function toggleSelecionado(id: number) {
  const idx = selecionadosIds.value.indexOf(id)
  if (idx >= 0) {
    selecionadosIds.value.splice(idx, 1)
    if (liderId.value === id) {
      liderId.value = selecionadosIds.value[0] ?? null
    }
  } else {
    selecionadosIds.value.push(id)
    if (!liderId.value) liderId.value = id
  }
}

async function criarGrupoEquipe() {
  if (!grupoNome.value.trim() || selecionadosIds.value.length === 0) {
    mostrarAviso('Informe o nome da equipe e selecione ao menos 1 técnico.')
    return
  }

  salvandoGrupo.value = true
  try {
    const res = await fetch(`${API_URL}/equipe/cadastrar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        nome: grupoNome.value.trim(),
        especialidade: grupoEspecialidade.value.trim(),
        liderId: liderId.value,
        tecnicosIds: selecionadosIds.value,
      }),
    })

    if (!res.ok) throw new Error('Falha ao criar equipe')

    grupoNome.value = ''
    grupoEspecialidade.value = 'Instalação Geral'
    selecionadosIds.value = []
    liderId.value = null

    await carregarTudo()
    mostrarAviso('Equipe criada com sucesso!')
  } catch (err) {
    console.error(err)
    mostrarAviso('Erro ao criar equipe.')
  } finally {
    salvandoGrupo.value = false
  }
}

async function removerEquipe(id: number) {
  try {
    const res = await fetch(`${API_URL}/equipe/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    if (res.ok) {
      await carregarTudo()
      mostrarAviso('Equipe desativada.')
    }
  } catch (err) {
    console.error(err)
  }
}

onMounted(() => {
  carregarTudo()
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
            <h1 class="page-title">Técnicos &amp; Formação de Equipes</h1>
            <span class="title-badge">CADASTRO DE CAMPO</span>
          </div>

          <div class="topbar-actions">
            <router-link to="/equipes" class="btn-back-alocacao">
              Ir para Alocação em Obras &rarr;
            </router-link>

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

      <div class="content-container">
        <div v-if="feedback" class="toast-banner">{{ feedback }}</div>

        <div class="two-col-grid">
          <!-- COLUNA 1: Cadastrar Técnico & Lista de Técnicos -->
          <section class="card panel-box">
            <div class="panel-head">
              <div>
                <h2>1. Cadastrar Novo Técnico</h2>
                <p>Cria o acesso do instalador para o aplicativo e equipes</p>
              </div>
              <span class="pill-count">{{ tecnicos.length }} Técnicos</span>
            </div>

            <form class="form-grid" @submit.prevent="cadastrarTecnico">
              <div class="field">
                <label>Nome Completo *</label>
                <input v-model="techNome" type="text" placeholder="Ex: Carlos Mendes" required />
              </div>

              <div class="field-row">
                <div class="field">
                  <label>Telefone / WhatsApp *</label>
                  <input v-model="techNumero" type="text" placeholder="(14) 99999-0000" required />
                </div>
                <div class="field">
                  <label>Senha de Acesso *</label>
                  <input v-model="techPassword" type="password" placeholder="••••••" required />
                </div>
              </div>

              <div class="field">
                <label>E-mail (opcional)</label>
                <input v-model="techEmail" type="email" placeholder="carlos@esquadrias.com" />
              </div>

              <button type="submit" class="btn-primary" :disabled="salvandoTech">
                {{ salvandoTech ? 'Cadastrando...' : '+ Cadastrar Técnico' }}
              </button>
            </form>

            <hr class="sep" />

            <h3 class="sub-title">Técnicos Cadastrados (clique para incluir na equipe)</h3>
            <div class="list-stack">
              <div
                v-for="t in tecnicos"
                :key="t.id"
                :class="['tech-row', { selected: selecionadosIds.includes(t.id) }]"
                @click="toggleSelecionado(t.id)"
              >
                <div class="tech-left">
                  <input
                    type="checkbox"
                    :checked="selecionadosIds.includes(t.id)"
                    @change.stop="toggleSelecionado(t.id)"
                  />
                  <div class="avatar-sm">{{ gerarIniciais(t.nome) }}</div>
                  <div>
                    <p class="row-title">{{ t.nome }}</p>
                    <p class="row-sub">{{ t.email || t.perfil }}</p>
                  </div>
                </div>

                <button
                  v-if="selecionadosIds.includes(t.id)"
                  type="button"
                  :class="['leader-btn', { active: liderId === t.id }]"
                  @click.stop="liderId = t.id"
                >
                  {{ liderId === t.id ? '★ Líder' : 'Tornar Líder' }}
                </button>
              </div>

              <p v-if="!carregando && tecnicos.length === 0" class="empty-txt">
                Nenhum técnico cadastrado ainda.
              </p>
            </div>
          </section>

          <!-- COLUNA 2: Agrupar Técnicos em Equipes -->
          <section class="card panel-box">
            <div class="panel-head">
              <div>
                <h2>2. Agrupar Técnicos em Equipe</h2>
                <p>Junte os técnicos selecionados ao lado em uma equipe</p>
              </div>
              <span class="pill-count">{{ equipes.length }} Equipes</span>
            </div>

            <form class="form-grid" @submit.prevent="criarGrupoEquipe">
              <div class="field-row">
                <div class="field">
                  <label>Nome da Equipe *</label>
                  <input
                    v-model="grupoNome"
                    type="text"
                    placeholder="Ex: Equipe Alfa - Fachadas"
                    required
                  />
                </div>
                <div class="field">
                  <label>Especialidade</label>
                  <input
                    v-model="grupoEspecialidade"
                    type="text"
                    placeholder="Ex: Linha Gold / Suprema"
                  />
                </div>
              </div>

              <div class="selected-preview">
                <span class="preview-label">
                  Integrantes selecionados ({{ selecionadosIds.length }}):
                </span>
                <div v-if="selecionadosIds.length > 0" class="chips-wrap">
                  <span v-for="id in selecionadosIds" :key="id" class="mini-chip">
                    {{ tecnicos.find((x) => x.id === id)?.nome }}
                    <strong v-if="liderId === id">(Líder)</strong>
                  </span>
                </div>
                <p v-else class="preview-hint">
                  Marque os técnicos na lista à esquerda para montar o grupo.
                </p>
              </div>

              <button
                type="submit"
                class="btn-primary"
                :disabled="salvandoGrupo || selecionadosIds.length === 0 || !grupoNome.trim()"
              >
                {{ salvandoGrupo ? 'Salvando Grupo...' : 'Criar Equipe' }}
              </button>
            </form>

            <hr class="sep" />

            <h3 class="sub-title">Equipes Ativas</h3>
            <div class="list-stack">
              <div v-for="eq in equipes" :key="eq.id" class="team-card">
                <div class="team-card-top">
                  <div>
                    <p class="row-title">{{ eq.nome }}</p>
                    <p class="row-sub">{{ eq.especialidade || 'Instalação Geral' }}</p>
                  </div>
                  <button
                    type="button"
                    class="btn-remove-team"
                    title="Desativar equipe"
                    @click="removerEquipe(eq.id)"
                  >
                    Remover
                  </button>
                </div>

                <div class="chips-wrap" style="margin-top: 10px;">
                  <span v-for="m in eq.membros" :key="m.usuarioId" class="mini-chip">
                    {{ m.nome }}
                    <strong v-if="m.funcaoNaEquipe === 'Líder'">★</strong>
                  </span>
                </div>
              </div>

              <p v-if="!carregando && equipes.length === 0" class="empty-txt">
                Nenhuma equipe formada ainda.
              </p>
            </div>
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
}

.title-badge {
  background: #DBEAFE;
  color: #1D4ED8;
  font-size: 10px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.btn-back-alocacao {
  text-decoration: none;
  background: #EFF6FF;
  color: #1E3A8A;
  font-size: 12px;
  font-weight: 700;
  padding: 8px 14px;
  border-radius: 10px;
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

.toast-banner {
  background: #1E3A8A;
  color: #FFFFFF;
  padding: 12px 18px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 18px;
}

.two-col-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}

.card {
  background: #FFFFFF;
  border-radius: 18px;
  border: 1px solid #F1F5F9;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}

.panel-box {
  padding: 24px;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.panel-head h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}

.panel-head p {
  margin: 3px 0 0;
  font-size: 12px;
  color: #64748B;
}

.pill-count {
  background: #F1F5F9;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field label {
  font-size: 12px;
  font-weight: 700;
  color: #334155;
}

.field input {
  border: 1px solid #CBD5E1;
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 13px;
  outline: none;
}

.field input:focus {
  border-color: #1E3A8A;
}

.btn-primary {
  background: #1E3A8A;
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  padding: 11px 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.sep {
  border: none;
  border-top: 1px solid #F1F5F9;
  margin: 22px 0 18px;
}

.sub-title {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.list-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tech-row,
.team-card {
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 12px 14px;
  background: #FFFFFF;
}

.tech-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
}

.tech-row.selected {
  border-color: #1E3A8A;
  background: #EFF6FF;
}

.tech-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #1E3A8A;
  color: #FFFFFF;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.row-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
}

.row-sub {
  margin: 2px 0 0;
  font-size: 11px;
  color: #64748B;
}

.leader-btn {
  border: 1px solid #CBD5E1;
  background: #FFFFFF;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  cursor: pointer;
}

.leader-btn.active {
  background: #1E3A8A;
  color: #FFFFFF;
  border-color: #1E3A8A;
}

.selected-preview {
  background: #F8FAFC;
  border: 1px dashed #CBD5E1;
  border-radius: 10px;
  padding: 12px;
}

.preview-label {
  font-size: 11px;
  font-weight: 700;
  color: #475569;
}

.preview-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: #94A3B8;
}

.chips-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.mini-chip {
  background: #EFF6FF;
  color: #1E3A8A;
  border: 1px solid #DBEAFE;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
}

.team-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.btn-remove-team {
  background: #FEF2F2;
  color: #EF4444;
  border: none;
  font-size: 11px;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 8px;
  cursor: pointer;
}

.empty-txt {
  text-align: center;
  font-size: 12px;
  color: #94A3B8;
  padding: 16px 0;
}

@media (max-width: 1024px) {
  .two-col-grid {
    grid-template-columns: 1fr;
  }
}
</style>