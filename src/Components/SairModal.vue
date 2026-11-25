<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { logout } from '../utils/auth'

const props = defineProps<{ aberto: boolean }>()
const emit = defineEmits<{ (e: 'fechar'): void }>()

const router = useRouter()

async function sair() {
  logout() // apaga o token e o usuário da memória
  emit('fechar')
  await router.replace('/') // volta para a tela de login
}

function aoApertarTecla(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('fechar')
}

watch(
  () => props.aberto,
  (aberto) => {
    if (aberto) window.addEventListener('keydown', aoApertarTecla)
    else window.removeEventListener('keydown', aoApertarTecla)
  },
)
onBeforeUnmount(() => window.removeEventListener('keydown', aoApertarTecla))
</script>

<template>
  <Teleport to="body">
    <div v-if="aberto" class="sair-fundo" @click.self="emit('fechar')">
      <div class="sair-caixa" role="alertdialog" aria-modal="true" aria-labelledby="sair-titulo">
        <span class="sair-icone" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
        </span>
        <h2 id="sair-titulo">Sair da conta?</h2>
        <p>Você precisará entrar novamente com seu e-mail e senha para acessar o sistema.</p>

        <div class="sair-botoes">
          <button type="button" class="sair-btn sair-btn--claro" @click="emit('fechar')">Cancelar</button>
          <button type="button" class="sair-btn sair-btn--vermelho" @click="sair">Sim, sair</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.sair-fundo {
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

.sair-caixa {
  width: 100%;
  max-width: 380px;
  padding: 32px 28px 28px;
  text-align: center;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 24px 60px rgb(15 23 42 / 0.3);
  color: #1e293b;
}

.sair-icone {
  display: inline-grid;
  place-items: center;
  width: 56px;
  height: 56px;
  margin-bottom: 14px;
  border-radius: 50%;
  background: #fee2e2;
  color: #dc2626;
}

.sair-caixa h2 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 800;
}

.sair-caixa p {
  margin: 0 0 24px;
  font-size: 14px;
  line-height: 1.55;
  color: #64748b;
}

.sair-botoes {
  display: flex;
  gap: 12px;
}

.sair-btn {
  flex: 1;
  height: 46px;
  border: 0;
  border-radius: 12px;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.sair-btn--claro {
  background: #f1f5f9;
  color: #334155;
}

.sair-btn--claro:hover {
  background: #e2e8f0;
}

.sair-btn--vermelho {
  background: #dc2626;
  color: #fff;
  box-shadow: 0 8px 18px rgb(220 38 38 / 0.28);
}

.sair-btn--vermelho:hover {
  background: #b91c1c;
}
</style>
