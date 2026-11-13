<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const projetosAberto = computed(() => route.path.startsWith('/projetos'))
const equipesAberto = computed(() => route.path.startsWith('/equipes'))

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar__brand">
      <img src="/Sa_logo.jpg" alt="SA Esquadrias" class="sidebar__logo" />
    </div>

    <nav class="sidebar__nav">
      <!-- Dashboard -->
      <router-link to="/home" class="sidebar__link" :class="{ active: isActive('/home') }">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
        </svg>
        Dashboard
      </router-link>

      <!-- Projetos + submenu -->
      <router-link to="/projetos" class="sidebar__link" :class="{ active: isActive('/projetos') }">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        Projetos
      </router-link>

      <div v-if="projetosAberto" class="sidebar__sub">
        <router-link
          to="/projetos/novo"
          class="sidebar__sublink"
          :class="{ active: route.path === '/projetos/novo' }"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Novo Projeto
        </router-link>
      </div>

      <!-- Liberações -->
      <router-link to="/liberacao" class="sidebar__link" :class="{ active: isActive('/liberacao') }">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        Liberações
      </router-link>

      <!-- Clientes -->
      <router-link to="/clientes" class="sidebar__link" :class="{ active: isActive('/clientes') }">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        Clientes
      </router-link>

      <!-- Relatórios -->
      <router-link to="/relatorio" class="sidebar__link" :class="{ active: isActive('/relatorio') }">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        Relatórios
      </router-link>

      <!-- Equipes + submenu -->
      <router-link to="/equipes" class="sidebar__link" :class="{ active: isActive('/equipes') }">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
        Equipes
      </router-link>

      <div v-if="equipesAberto" class="sidebar__sub">
        <router-link
          to="/equipes/tecnicos"
          class="sidebar__sublink"
          :class="{ active: route.path === '/equipes/tecnicos' }"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
          Técnicos
        </router-link>
      </div>

      <!-- Ocorrências -->
      <router-link to="/ocorrencia" class="sidebar__link" :class="{ active: isActive('/ocorrencia') }">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        Ocorrências
      </router-link>
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
  position: sticky;
  top: 0;
  background-color: #1b388a;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  padding: 24px 20px;
  box-sizing: border-box;
  flex-shrink: 0;
  font-family: 'Inter', system-ui, -apple-system, Roboto, sans-serif;
  overflow-y: auto;
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

/* Submenu */
.sidebar__sub {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: -2px 0 0 22px;
  padding-left: 14px;
  border-left: 2px solid rgba(255, 255, 255, 0.15);
}

.sidebar__sublink {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  color: #93c5fd;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.sidebar__sublink:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.sidebar__sublink.active {
  background-color: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  font-weight: 700;
}

.sidebar__footer {
  margin-top: 16px;
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