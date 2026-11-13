<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { setSessao } from '../utils/auth'

const router = useRouter()

const email = ref('')
const senha = ref('')
const lembrar = ref(false)
const mostrarSenha = ref(false)
const carregando = ref(false)
const erro = ref('')

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5037/api'

const stats = [
  { valor: '142', rotulo: 'Projetos ativos' },
  { valor: '82.4%', rotulo: 'Conversão' },
  { valor: '4.9', rotulo: 'Avaliação NPS', estrela: true },
]

async function entrar() {
  erro.value = ''

  if (!email.value || !senha.value) {
    erro.value = 'Informe seu e-mail e sua senha.'
    return
  }

  carregando.value = true

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value,
        numero: '',
        password: senha.value,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      erro.value = data.mensagem || data.title || 'Credenciais inválidas.'
      return
    }

    // Salva apenas em memória (perde o acesso ao atualizar a página)
    setSessao(data.token, data.usuario)

    const role = data.usuario.roles?.toUpperCase() || 'TECNICO_CAMPO'

    if (role === 'GESTOR') {
      router.push('/home')
    } else {
      router.push('/projetos')
    }
  } catch (e) {
    erro.value = 'Não foi possível conectar ao servidor. Verifique se a API está rodando.'
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <div class="login">
    <section class="login__form-side">
      <div class="login__box">
      <div class="brand">
        <img src="/Sa_logo.jpg" alt="SA Esquadrias de Alumínio" class="brand__img" />
      </div>

        <h1 class="login__title">Bem-vindo de volta</h1>
        <p class="login__subtitle">
          Acesse sua conta para gerenciar seus pedidos e projetos.
        </p>

        <form class="form" @submit.prevent="entrar" novalidate>
          <label class="field">
            <span class="field__label">E-mail</span>
            <span class="input">
              <svg class="input__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              <input
                v-model.trim="email"
                type="email"
                placeholder="seu@email.com.br"
                autocomplete="email"
              />
            </span>
          </label>
          <label class="field">
            <span class="field__row">
              <span class="field__label">Senha</span>
              <a href="#" class="link">Esqueceu a senha?</a>
            </span>
            <span class="input">
              <svg class="input__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              <input
                v-model="senha"
                :type="mostrarSenha ? 'text' : 'password'"
                placeholder="••••••••"
                autocomplete="current-password"
              />
              <button
                type="button"
                class="input__toggle"
                :aria-label="mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'"
                @click="mostrarSenha = !mostrarSenha"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                  <path v-if="mostrarSenha" d="M4 4l16 16" />
                </svg>
              </button>
            </span>
          </label>

          <label class="check">
            <input v-model="lembrar" type="checkbox" />
            <span class="check__box" aria-hidden="true"></span>
            <span>Lembrar de mim</span>
          </label>

          <p v-if="erro" class="erro" role="alert">{{ erro }}</p>

          <button class="btn" type="submit" :disabled="carregando">
            {{ carregando ? 'Entrando...' : 'Entrar na conta' }}
          </button>
        </form>

        <a href="#" class="support">
          <span class="support__icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
              <rect x="2" y="14" width="4" height="6" rx="1.5" />
              <rect x="18" y="14" width="4" height="6" rx="1.5" />
            </svg>
          </span>
          <span class="support__text">
            <strong>Dificuldades no acesso?</strong>
            <small>Fale com o suporte técnico</small>
          </span>
          <svg class="support__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </a>
      </div>
    </section>

    <aside class="login__hero" aria-hidden="false">
      <div class="facade" aria-hidden="true"></div>
      <div class="hero__shade" aria-hidden="true"></div>

      <div class="hero__badge-shape" aria-hidden="true">
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" stroke-width="3.2" stroke-linecap="round">
          <path d="M12 4v16M4 12h16" />
        </svg>
      </div>

      <div class="hero__content">
        <span class="hero__tag">EXCELÊNCIA EM ALUMÍNIO</span>
        <h2>Transformando arquitetura em realidade.</h2>
        <p>
          Tecnologia de ponta e precisão milimétrica para projetos de alto
          padrão em todo o Brasil.
        </p>

        <dl class="stats">
          <div v-for="s in stats" :key="s.rotulo" class="stats__item">
            <dt>{{ s.valor }}</dt>
            <dd>
              <span v-if="s.estrela" class="star">★</span>{{ s.rotulo }}
            </dd>
          </div>
        </dl>
      </div>
    </aside>
  </div>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
}

.login {
  --azul-900: #1b2f7a;
  --azul-800: #1e3a8a;
  --azul-600: #2848b5;
  --azul-50: #eff4ff;
  --texto: #1e293b;
  --texto-suave: #64748b;
  --borda: #e2e8f0;
  --campo: #f8fafc;

  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  color: var(--texto);
  background: #fff;
}

.login__form-side {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 32px;
}

.login__box {
  width: 100%;
  max-width: 440px;
}

.brand {
  display: flex;
  align-items: center;
  margin-bottom: 32px;
}

.brand__img {
  height: 64px;
  width: auto;
  object-fit: contain;
  border-radius: 50%;
}

.login__title {
  margin: 0 0 8px;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.login__subtitle {
  margin: 0 0 32px;
  font-size: 14px;
  color: var(--texto-suave);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.field__label {
  font-size: 12px;
  font-weight: 600;
}

.link {
  font-size: 11px;
  font-weight: 700;
  color: var(--azul-800);
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.input {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 46px;
  padding: 0 14px;
  background: var(--campo);
  border: 1px solid var(--borda);
  border-radius: 10px;
  color: #94a3b8;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.input:focus-within {
  border-color: var(--azul-600);
  box-shadow: 0 0 0 3px rgb(40 72 181 / 0.15);
  background: #fff;
}

.input input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
  font-size: 14px;
  color: var(--texto);
}

.input input::placeholder {
  color: #94a3b8;
}

.input__toggle {
  display: grid;
  place-items: center;
  padding: 2px;
  border: 0;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
}

.input__toggle:hover {
  color: var(--azul-800);
}

.check {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--texto-suave);
  cursor: pointer;
}

.check input {
  position: absolute;
  opacity: 0;
}

.check__box {
  width: 15px;
  height: 15px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: #fff;
  display: grid;
  place-items: center;
}

.check input:checked + .check__box {
  background: var(--azul-800);
  border-color: var(--azul-800);
}

.check input:checked + .check__box::after {
  content: '';
  width: 4px;
  height: 7px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg) translate(-1px, -1px);
}

.check input:focus-visible + .check__box {
  outline: 2px solid var(--azul-600);
  outline-offset: 2px;
}

.erro {
  margin: 0;
  font-size: 12px;
  color: #b91c1c;
}

.btn {
  height: 48px;
  border: 0;
  border-radius: 10px;
  background: var(--azul-800);
  color: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 14px rgb(30 58 138 / 0.28);
  transition: background 0.15s, transform 0.05s;
}

.btn:hover:not(:disabled) {
  background: var(--azul-900);
}

.btn:active:not(:disabled) {
  transform: translateY(1px);
}

.btn:disabled {
  opacity: 0.7;
  cursor: progress;
}

.btn:focus-visible {
  outline: 2px solid var(--azul-600);
  outline-offset: 2px;
}

.support {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 32px;
  padding: 14px;
  background: var(--azul-50);
  border: 1px solid #dbe6ff;
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
}

.support__icon {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #fff;
  color: var(--azul-800);
}

.support__text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.support__text strong {
  font-size: 11px;
  font-weight: 700;
  color: var(--azul-800);
}

.support__text small {
  font-size: 10px;
  color: var(--azul-600);
}

.support__arrow {
  color: var(--texto-suave);
}

.login__hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  background: #1a3a9c;
}

.facade {
  position: absolute;
  inset: -10%;
  transform: perspective(900px) rotateY(-18deg) rotateZ(-4deg) scale(1.2);
  background:
    repeating-linear-gradient(90deg, rgb(255 255 255 / 0.16) 0 3px, transparent 3px 92px),
    repeating-linear-gradient(0deg, rgb(255 255 255 / 0.12) 0 3px, transparent 3px 70px),
    linear-gradient(160deg, #3b63d6 0%, #2144b3 45%, #14308a 100%);
}

.hero__shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgb(20 48 138 / 0.25) 0%, rgb(20 48 138 / 0.55) 55%, rgb(20 48 138 / 0.92) 100%);
}

.hero__badge-shape {
  position: absolute;
  top: 16px;
  right: 16px;
  display: grid;
  place-items: center;
  width: 92px;
  height: 92px;
  border-radius: 30px 30px 30px 8px;
  background: rgb(255 255 255 / 0.14);
  backdrop-filter: blur(6px);
}

.hero__content {
  position: relative;
  width: 90%;
  max-width: 460px;
  padding: 0 38px 40px;
  color: #fff;
}

.hero__tag {
  display: inline-block;
  padding: 5px 10px;
  border: 1px solid rgb(255 255 255 / 0.25);
  border-radius: 6px;
  background: rgb(255 255 255 / 0.12);
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.1em;
}

.hero__content h2 {
  margin: 16px 0 12px;
  font-size: clamp(26px, 3vw, 34px);
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.hero__content p {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: rgb(255 255 255 / 0.72);
}

.stats {
  display: flex;
  gap: 24px;
  margin: 36px 0 0;
  padding-top: 18px;
  border-top: 1px solid rgb(255 255 255 / 0.14);
}

.stats__item dt {
  font-size: 14px;
  font-weight: 700;
}

.stats__item dd {
  margin: 4px 0 0;
  font-size: 7px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgb(255 255 255 / 0.6);
}

.star {
  margin-right: 3px;
  color: #facc15;
}

@media (max-width: 900px) {
  .login {
    grid-template-columns: 1fr;
  }
  .login__hero {
    display: none;
  }
}
</style>