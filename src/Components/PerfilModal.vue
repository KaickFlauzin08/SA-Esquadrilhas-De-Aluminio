<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { atualizarUsuario, getToken, getUsuario } from '../utils/auth'

const props = defineProps<{ aberto: boolean }>()
const emit = defineEmits<{ (e: 'fechar'): void }>()

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5037/api').replace(/\/+$/, '')

// ---------- dados pessoais ----------
const nome = ref('')
const email = ref('')
const numero = ref('')
const salvandoDados = ref(false)
const erroDados = ref('')
const okDados = ref('')

// ---------- senha ----------
const senhaAtual = ref('')
const novaSenha = ref('')
const confirmarSenha = ref('')
const mostrarSenhas = ref(false)
const salvandoSenha = ref(false)
const erroSenha = ref('')
const okSenha = ref('')

const usuario = computed(() => getUsuario())
const cargo = computed(() =>
  usuario.value?.roles?.toUpperCase() === 'GESTOR' ? 'Gestor de Produção' : 'Técnico de Campo',
)
const iniciais = computed(() =>
  (usuario.value?.nome || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join(''),
)

function carregarFormulario() {
  nome.value = usuario.value?.nome ?? ''
  email.value = usuario.value?.email ?? ''
  numero.value = usuario.value?.numero ?? ''
  senhaAtual.value = ''
  novaSenha.value = ''
  confirmarSenha.value = ''
  mostrarSenhas.value = false
  erroDados.value = okDados.value = erroSenha.value = okSenha.value = ''
}

// Lê a mensagem de erro que a API devolveu (ou usa uma padrão)
async function lerMensagem(res: Response, padrao: string): Promise<string> {
  try {
    const texto = await res.text()
    try {
      const j = JSON.parse(texto)
      return j.mensagem || j.message || j.title || padrao
    } catch {
      return texto || padrao
    }
  } catch {
    return padrao
  }
}

async function salvarDados() {
  erroDados.value = okDados.value = ''

  if (!nome.value.trim()) {
    erroDados.value = 'Informe o seu nome.'
    return
  }
  if (!email.value.trim() || !email.value.includes('@')) {
    erroDados.value = 'Informe um e-mail válido.'
    return
  }

  salvandoDados.value = true
  try {
    const res = await fetch(`${API_URL}/User/meu-perfil`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        nome: nome.value.trim(),
        email: email.value.trim(),
        numero: numero.value.trim(),
      }),
    })

    if (!res.ok) {
      erroDados.value = await lerMensagem(res, `Não foi possível salvar (erro ${res.status}).`)
      return
    }

    // Atualiza o nome/e-mail que aparecem no topo de todas as telas
    atualizarUsuario({
      nome: nome.value.trim(),
      email: email.value.trim(),
      numero: numero.value.trim(),
    })
    okDados.value = 'Dados atualizados com sucesso!'
  } catch (e) {
    console.error('Erro ao salvar perfil:', e)
    erroDados.value = 'Não foi possível conectar ao servidor.'
  } finally {
    salvandoDados.value = false
  }
}

async function salvarSenha() {
  erroSenha.value = okSenha.value = ''

  if (!senhaAtual.value || !novaSenha.value || !confirmarSenha.value) {
    erroSenha.value = 'Preencha os três campos de senha.'
    return
  }
  if (novaSenha.value.length < 6) {
    erroSenha.value = 'A nova senha precisa ter pelo menos 6 caracteres.'
    return
  }
  if (novaSenha.value !== confirmarSenha.value) {
    erroSenha.value = 'A confirmação não é igual à nova senha.'
    return
  }
  if (novaSenha.value === senhaAtual.value) {
    erroSenha.value = 'A nova senha deve ser diferente da atual.'
    return
  }

  salvandoSenha.value = true
  try {
    const res = await fetch(`${API_URL}/User/minha-senha`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        senhaAtual: senhaAtual.value,
        novaSenha: novaSenha.value,
      }),
    })

    if (!res.ok) {
      erroSenha.value = await lerMensagem(res, `Não foi possível alterar (erro ${res.status}).`)
      return
    }

    senhaAtual.value = novaSenha.value = confirmarSenha.value = ''
    okSenha.value = 'Senha alterada com sucesso!'
  } catch (e) {
    console.error('Erro ao alterar senha:', e)
    erroSenha.value = 'Não foi possível conectar ao servidor.'
  } finally {
    salvandoSenha.value = false
  }
}

function aoApertarTecla(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('fechar')
}

watch(
  () => props.aberto,
  (aberto) => {
    if (aberto) {
      carregarFormulario()
      window.addEventListener('keydown', aoApertarTecla)
    } else {
      window.removeEventListener('keydown', aoApertarTecla)
    }
  },
)
onBeforeUnmount(() => window.removeEventListener('keydown', aoApertarTecla))
</script>

<template>
  <Teleport to="body">
    <div v-if="aberto" class="perfil-fundo" @click.self="emit('fechar')">
      <div class="perfil-caixa" role="dialog" aria-modal="true" aria-labelledby="perfil-titulo">
        <div class="perfil-topo">
          <h2 id="perfil-titulo">Meu Perfil</h2>
          <button type="button" class="perfil-x" aria-label="Fechar" @click="emit('fechar')">&times;</button>
        </div>

        <div class="perfil-resumo">
          <div class="perfil-avatar">{{ iniciais }}</div>
          <div>
            <strong>{{ usuario?.nome }}</strong>
            <span>{{ cargo }}</span>
          </div>
        </div>

        <!-- DADOS PESSOAIS -->
        <form class="perfil-secao" @submit.prevent="salvarDados" novalidate>
          <h3>Dados pessoais</h3>

          <label class="perfil-campo">
            <span>NOME</span>
            <input v-model="nome" type="text" autocomplete="name" />
          </label>

          <label class="perfil-campo">
            <span>E-MAIL</span>
            <input v-model="email" type="email" autocomplete="email" />
          </label>

          <label class="perfil-campo">
            <span>TELEFONE / NÚMERO</span>
            <input v-model="numero" type="text" autocomplete="tel" />
          </label>

          <label class="perfil-campo">
            <span>CARGO</span>
            <input :value="cargo" type="text" disabled />
            <small>O cargo só pode ser alterado por um gestor.</small>
          </label>

          <p v-if="erroDados" class="perfil-erro" role="alert">{{ erroDados }}</p>
          <p v-if="okDados" class="perfil-ok" role="status">{{ okDados }}</p>

          <button type="submit" class="perfil-btn" :disabled="salvandoDados">
            {{ salvandoDados ? 'Salvando...' : 'Salvar dados' }}
          </button>
        </form>

        <!-- SENHA -->
        <form class="perfil-secao perfil-secao--senha" @submit.prevent="salvarSenha" novalidate>
          <h3>Alterar senha</h3>

          <label class="perfil-campo">
            <span>SENHA ATUAL</span>
            <input v-model="senhaAtual" :type="mostrarSenhas ? 'text' : 'password'" autocomplete="current-password" />
          </label>

          <label class="perfil-campo">
            <span>NOVA SENHA</span>
            <input v-model="novaSenha" :type="mostrarSenhas ? 'text' : 'password'" autocomplete="new-password" />
          </label>

          <label class="perfil-campo">
            <span>CONFIRMAR NOVA SENHA</span>
            <input v-model="confirmarSenha" :type="mostrarSenhas ? 'text' : 'password'" autocomplete="new-password" />
          </label>

          <label class="perfil-mostrar">
            <input v-model="mostrarSenhas" type="checkbox" />
            Mostrar senhas
          </label>

          <p v-if="erroSenha" class="perfil-erro" role="alert">{{ erroSenha }}</p>
          <p v-if="okSenha" class="perfil-ok" role="status">{{ okSenha }}</p>

          <button type="submit" class="perfil-btn" :disabled="salvandoSenha">
            {{ salvandoSenha ? 'Alterando...' : 'Alterar senha' }}
          </button>
        </form>

        <div class="perfil-rodape">
          <button type="button" class="perfil-btn perfil-btn--claro" @click="emit('fechar')">Fechar</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.perfil-fundo {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgb(15 23 42 / 0.5);
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}

.perfil-caixa {
  width: 100%;
  max-width: 460px;
  max-height: 94vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 24px 60px rgb(15 23 42 / 0.3);
  color: #1e293b;
}

.perfil-topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px 0;
}

.perfil-topo h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
}

.perfil-x {
  border: 0;
  background: transparent;
  font-size: 26px;
  line-height: 1;
  color: #94a3b8;
  cursor: pointer;
}

.perfil-x:hover {
  color: #1e3a8a;
}

.perfil-resumo {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 18px 28px 0;
  padding: 14px 16px;
  background: #eff4ff;
  border: 1px solid #dbe6ff;
  border-radius: 14px;
}

.perfil-resumo div:last-child {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.perfil-resumo strong {
  font-size: 15px;
}

.perfil-resumo span {
  font-size: 12px;
  color: #64748b;
}

.perfil-avatar {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #1e3a8a;
  color: #fff;
  font-size: 17px;
  font-weight: 800;
}

.perfil-secao {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 22px 28px 0;
}

.perfil-secao--senha {
  margin-top: 22px;
  border-top: 1px solid #f1f5f9;
}

.perfil-secao h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: #1e3a8a;
}

.perfil-campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.perfil-campo span {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #334155;
}

.perfil-campo small {
  font-size: 11px;
  color: #94a3b8;
}

.perfil-campo input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  font: inherit;
  font-size: 14px;
  color: #1e293b;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 11px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.perfil-campo input:focus {
  background: #fff;
  border-color: #2848b5;
  box-shadow: 0 0 0 3px rgb(40 72 181 / 0.15);
}

.perfil-campo input:disabled {
  color: #94a3b8;
  cursor: not-allowed;
}

.perfil-mostrar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
}

.perfil-erro {
  margin: 0;
  font-size: 12px;
  color: #b91c1c;
}

.perfil-ok {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  color: #047857;
}

.perfil-btn {
  height: 44px;
  border: 0;
  border-radius: 11px;
  background: #1e3a8a;
  color: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 14px rgb(30 58 138 / 0.25);
}

.perfil-btn:hover:not(:disabled) {
  background: #1b2f7a;
}

.perfil-btn:disabled {
  opacity: 0.7;
  cursor: progress;
}

.perfil-btn--claro {
  width: 100%;
  background: #f1f5f9;
  color: #334155;
  box-shadow: none;
}

.perfil-btn--claro:hover {
  background: #e2e8f0 !important;
}

.perfil-rodape {
  padding: 22px 28px 26px;
}
</style>

