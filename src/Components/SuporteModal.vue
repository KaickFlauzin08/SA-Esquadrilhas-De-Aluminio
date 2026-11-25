<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'

// ⚠️ TROQUE pelo e-mail real do suporte da empresa
const EMAIL_SUPORTE = 'suporte@seudominio.com.br'

const props = defineProps<{ aberto: boolean }>()
const emit = defineEmits<{ (e: 'fechar'): void }>()

const categorias = [
  'Problema de acesso / login',
  'Dúvida sobre projetos e pedidos',
  'Erro no sistema',
  'Sugestão de melhoria',
  'Outro assunto',
]

const assunto = ref('')
const categoria = ref('')
const mensagem = ref('')
const erro = ref('')
const enviado = ref(false)

function limpar() {
  assunto.value = ''
  categoria.value = ''
  mensagem.value = ''
  erro.value = ''
  enviado.value = false
}

function fechar() {
  emit('fechar')
}

function enviar() {
  erro.value = ''

  if (!assunto.value.trim() || !categoria.value || !mensagem.value.trim()) {
    erro.value = 'Preencha o assunto, a categoria e a mensagem.'
    return
  }

  // Abre o programa de e-mail do usuário já com tudo preenchido
  const titulo = encodeURIComponent(`[${categoria.value}] ${assunto.value.trim()}`)
  const corpo = encodeURIComponent(mensagem.value.trim())
  window.location.href = `mailto:${EMAIL_SUPORTE}?subject=${titulo}&body=${corpo}`

  enviado.value = true
  setTimeout(fechar, 2200)
}

// Fecha com a tecla ESC
function aoApertarTecla(e: KeyboardEvent) {
  if (e.key === 'Escape') fechar()
}

watch(
  () => props.aberto,
  (aberto) => {
    if (aberto) {
      limpar()
      window.addEventListener('keydown', aoApertarTecla)
    } else {
      window.removeEventListener('keydown', aoApertarTecla)
    }
  },
)

onBeforeUnmount(() => window.removeEventListener('keydown', aoApertarTecla))
</script>

<template>
  <!-- Teleport: desenha a janela por cima de TUDO na página -->
  <Teleport to="body">
    <div v-if="aberto" class="suporte-fundo" @click.self="fechar">
      <div class="suporte-caixa" role="dialog" aria-modal="true" aria-labelledby="suporte-titulo">
        <div class="suporte-topo">
          <div class="suporte-titulo-grupo">
            <span class="suporte-icone" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m12 3 9 5-9 5-9-5 9-5z" />
                <path d="m3 13 9 5 9-5" />
                <path d="m3 17.5 9 5 9-5" />
              </svg>
            </span>
            <h2 id="suporte-titulo">Contatar Suporte</h2>
          </div>
          <button type="button" class="suporte-x" aria-label="Fechar" @click="fechar">&times;</button>
        </div>

        <p class="suporte-texto">
          Precisa de ajuda? Preencha os campos abaixo e nossa equipe de especialistas entrará em
          contato o mais breve possível.
        </p>

        <form v-if="!enviado" class="suporte-form" @submit.prevent="enviar" novalidate>
          <label class="suporte-campo">
            <span class="suporte-rotulo">ASSUNTO</span>
            <input v-model="assunto" type="text" placeholder="Ex: Problema no faturamento" />
          </label>

          <label class="suporte-campo">
            <span class="suporte-rotulo">CATEGORIA</span>
            <select v-model="categoria">
              <option value="" disabled>Selecione uma categoria</option>
              <option v-for="c in categorias" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>

          <label class="suporte-campo">
            <span class="suporte-rotulo">MENSAGEM</span>
            <textarea v-model="mensagem" rows="4" placeholder="Descreva detalhadamente o que aconteceu..."></textarea>
          </label>

          <p v-if="erro" class="suporte-erro" role="alert">{{ erro }}</p>

          <div class="suporte-aviso">
            <span class="suporte-aviso-icone" aria-hidden="true">✓</span>
            Tempo médio de resposta: 15 minutos
          </div>

          <div class="suporte-botoes">
            <button type="button" class="suporte-btn suporte-btn--claro" @click="fechar">Cancelar</button>
            <button type="submit" class="suporte-btn suporte-btn--azul">Enviar Mensagem</button>
          </div>
        </form>

        <div v-else class="suporte-sucesso" role="status">
          <span class="suporte-sucesso-icone" aria-hidden="true">✓</span>
          <strong>Mensagem pronta para envio!</strong>
          <p>Seu programa de e-mail foi aberto. É só confirmar o envio por lá.</p>
        </div>

        <div class="suporte-rodape">
          <span class="suporte-seguro">
            <span class="suporte-info" aria-hidden="true">i</span>
            PROTOCOLO SEGURO
          </span>
          <span class="suporte-bolinhas" aria-hidden="true">
            <span class="b-amarelo">▲</span>
            <span class="b-vermelho">×</span>
          </span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.suporte-fundo {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgb(15 23 42 / 0.5);
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}

.suporte-caixa {
  width: 100%;
  max-width: 400px;
  max-height: 95vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 26px;
  box-shadow: 0 24px 60px rgb(15 23 42 / 0.3);
  color: #1e293b;
}

.suporte-topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 26px 28px 0;
}

.suporte-titulo-grupo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.suporte-titulo-grupo h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
}

.suporte-icone {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: #1e3a8a;
  color: #fff;
}

.suporte-x {
  border: 0;
  background: transparent;
  font-size: 26px;
  line-height: 1;
  color: #94a3b8;
  cursor: pointer;
}

.suporte-x:hover {
  color: #1e3a8a;
}

.suporte-texto {
  margin: 16px 28px 0;
  font-size: 14px;
  line-height: 1.55;
  color: #64748b;
}

.suporte-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 22px 28px 26px;
}

.suporte-campo {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suporte-rotulo {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #334155;
}

.suporte-campo input,
.suporte-campo select,
.suporte-campo textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 14px 16px;
  font: inherit;
  font-size: 14px;
  color: #1e293b;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.suporte-campo textarea {
  resize: vertical;
  min-height: 100px;
}

.suporte-campo input::placeholder,
.suporte-campo textarea::placeholder {
  color: #94a3b8;
}

.suporte-campo input:focus,
.suporte-campo select:focus,
.suporte-campo textarea:focus {
  background: #fff;
  border-color: #2848b5;
  box-shadow: 0 0 0 3px rgb(40 72 181 / 0.15);
}

.suporte-erro {
  margin: 0;
  font-size: 12px;
  color: #b91c1c;
}

.suporte-aviso {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: #ecfdf5;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  color: #047857;
}

.suporte-aviso-icone {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #10b981;
  color: #fff;
  font-size: 11px;
}

.suporte-botoes {
  display: flex;
  gap: 12px;
}

.suporte-btn {
  height: 48px;
  border: 0;
  border-radius: 12px;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.suporte-btn--claro {
  flex: 1;
  background: #f1f5f9;
  color: #334155;
}

.suporte-btn--claro:hover {
  background: #e2e8f0;
}

.suporte-btn--azul {
  flex: 1.5;
  background: #1e3a8a;
  color: #fff;
  box-shadow: 0 8px 18px rgb(30 58 138 / 0.3);
}

.suporte-btn--azul:hover {
  background: #1b2f7a;
}

.suporte-sucesso {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 34px 28px;
  text-align: center;
}

.suporte-sucesso p {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.suporte-sucesso-icone {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #10b981;
  color: #fff;
  font-size: 22px;
}

.suporte-rodape {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 28px;
  border-top: 1px solid #f1f5f9;
}

.suporte-seguro {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #94a3b8;
}

.suporte-info {
  display: grid;
  place-items: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #6366f1;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
}

.suporte-bolinhas {
  display: flex;
  gap: 6px;
  font-size: 10px;
}

.b-amarelo {
  color: #f59e0b;
}

.b-vermelho {
  display: grid;
  place-items: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ef4444;
  color: #fff;
  font-size: 11px;
  line-height: 1;
}
</style>
