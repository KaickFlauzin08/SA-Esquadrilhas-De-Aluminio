<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { getUsuario } from '../utils/auth'
import PerfilModal from './PerfilModal.vue'
import SairModal from './SairModal.vue'

const menuAberto = ref(false)
const perfilAberto = ref(false)
const sairAberto = ref(false)
const raiz = ref<HTMLElement | null>(null)

const usuario = computed(() => getUsuario())
const nome = computed(() => usuario.value?.nome || 'Usuário')
const cargo = computed(() =>
  usuario.value?.roles?.toUpperCase() === 'GESTOR' ? 'Gestor de Produção' : 'Técnico de Campo',
)
const iniciais = computed(() =>
  nome.value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join(''),
)

function abrirPerfil() {
  menuAberto.value = false
  perfilAberto.value = true
}


function abrirSair() {
  menuAberto.value = false
  sairAberto.value = true
}

// Fecha o menuzinho ao clicar fora dele ou apertar ESC
function aoClicarFora(e: MouseEvent) {
  if (menuAberto.value && raiz.value && !raiz.value.contains(e.target as Node)) {
    menuAberto.value = false
  }
}
function aoApertarTecla(e: KeyboardEvent) {
  if (e.key === 'Escape') menuAberto.value = false
}

onMounted(() => {
  document.addEventListener('click', aoClicarFora)
  document.addEventListener('keydown', aoApertarTecla)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', aoClicarFora)
  document.removeEventListener('keydown', aoApertarTecla)
})
</script>

<template>
  <div ref="raiz" class="um">
    <button
      type="button"
      class="um__botao"
      :aria-expanded="menuAberto"
      aria-haspopup="menu"
      title="Minha conta"
      @click="menuAberto = !menuAberto"
    >
      <span class="um__info">
        <span class="um__nome">{{ nome }}</span>
        <span class="um__cargo">{{ cargo }}</span>
      </span>
      <span class="um__avatar">{{ iniciais }}</span>
    </button>

    <div v-if="menuAberto" class="um__menu" role="menu">
      <div class="um__menu-topo">
        <strong>{{ nome }}</strong>
        <span>{{ usuario?.email }}</span>
      </div>

      <button type="button" class="um__item" role="menuitem" @click="abrirPerfil">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        Meu perfil
      </button>

      <button type="button" class="um__item um__item--sair" role="menuitem" @click="abrirSair">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
        Sair da conta
      </button>
    </div>

    <PerfilModal :aberto="perfilAberto" @fechar="perfilAberto = false" />
    <SairModal :aberto="sairAberto" @fechar="sairAberto = false" />
  </div>
</template>

<style scoped>
.um {
  position: relative;
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}

.um__botao {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 4px 4px 10px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  font: inherit;
  cursor: pointer;
  transition: background 0.15s;
}

.um__botao:hover {
  background: #f1f5f9;
}

.um__info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
}

.um__nome {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.um__cargo {
  font-size: 11px;
  color: #64748b;
}

.um__avatar {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #1e3a8a;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}

.um__menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 60;
  width: 230px;
  padding: 8px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 14px 32px rgb(15 23 42 / 0.16);
}

.um__menu-topo {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px 10px;
  margin-bottom: 4px;
  border-bottom: 1px solid #f1f5f9;
}

.um__menu-topo strong {
  font-size: 13px;
  color: #1e293b;
}

.um__menu-topo span {
  font-size: 11px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
}

.um__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  text-align: left;
  cursor: pointer;
}

.um__item:hover {
  background: #f1f5f9;
}

.um__item--sair {
  color: #dc2626;
}

.um__item--sair:hover {
  background: #fef2f2;
}

@media (max-width: 640px) {
  .um__info {
    display: none;
  }
}
</style>
