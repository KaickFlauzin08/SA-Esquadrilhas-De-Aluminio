<script setup lang="ts">
import { ref } from 'vue'

const menuAtivo = ref('Dashboard')

const emit = defineEmits<{
  (e: 'navigate', menu: string): void
}>()

function selecionarMenu(nome: string) {
  menuAtivo.value = nome
  emit('navigate', nome)
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar__brand">
      <img src="/Sa_logo.jpg" alt="SA Esquadrias" class="sidebar__logo" />
    </div>

    <nav class="sidebar__nav">
      <a 
        href="#" 
        class="sidebar__link" 
        :class="{ active: menuAtivo === 'Dashboard' }"
        @click.prevent="selecionarMenu('Dashboard')"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
        </svg>
        Dashboard
      </a>

      <a 
        href="#" 
        class="sidebar__link" 
        :class="{ active: menuAtivo === 'Projetos' }"
        @click.prevent="selecionarMenu('Projetos')"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        Projetos
      </a>

      <a 
        href="#" 
        class="sidebar__link" 
        :class="{ active: menuAtivo === 'Liberações' }"
        @click.prevent="selecionarMenu('Liberações')"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        Liberações
      </a>

      <a 
        href="#" 
        class="sidebar__link" 
        :class="{ active: menuAtivo === 'Clientes' }"
        @click.prevent="selecionarMenu('Clientes')"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        Clientes
      </a>

      <a 
        href="#" 
        class="sidebar__link" 
        :class="{ active: menuAtivo === 'Relatórios' }"
        @click.prevent="selecionarMenu('Relatórios')"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        Relatórios
      </a>
    </nav>

    <div class="sidebar__footer">
      <div class="support-card">
        <div class="support-card__header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
          </svg>
          <strong>Suporte Técnico</strong>
        </div>
        <p>Precisa de ajuda com o sistema de pedidos?</p>
        <button class="support-card__btn">Contatar</button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.sidebar {
  width: 260px;
  height: 100vh;
  background-color: #1b388a;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  padding: 24px 20px;
  box-sizing: border-box;
  flex-shrink: 0;
  font-family: 'Inter', system-ui, -apple-system, Roboto, sans-serif;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 32px;
}

.sidebar__logo {
  height: 60px;
  width: auto;
  object-fit: contain;
  border-radius: 50%;
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.sidebar__link {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  color: #93c5fd;
  text-decoration: none;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 500;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.sidebar__link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.sidebar__link.active {
  background-color: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  font-weight: 700;
}

.sidebar__footer {
  margin-top: auto;
}

.support-card {
  background-color: rgba(255, 255, 255, 0.08);
  padding: 16px;
  border-radius: 12px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
}

.support-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
}

.support-card p {
  margin: 0 0 14px;
  opacity: 0.8;
  line-height: 1.4;
  font-size: 12px;
}

.support-card__btn {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background-color: #ffffff;
  color: #1b388a;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.support-card__btn:hover {
  background-color: #f8fafc;
}
</style>