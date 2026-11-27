<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { carregarObra, dataBR, notificarSuporte, resolverOcorrencia, type ObraCompleta } from '../../services/api'

const router = useRouter()
const route = useRoute()
const id = Number(route.params.id)

const obra = ref<ObraCompleta | null>(null)
const carregando = ref(true)
const trabalhando = ref(false)
const erro = ref('')
const aviso = ref('')
const solucao = ref('')

const pendencias = computed(() => obra.value?.abertas ?? [])
const suporteJaChamado = computed(() => pendencias.value.some((o) => o.titulo.startsWith('Suporte solicitado')))

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    obra.value = await carregarObra(id)
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Erro ao carregar a pendência.'
  } finally {
    carregando.value = false
  }
}

async function resolver(ocorrenciaId: number) {
  trabalhando.value = true
  erro.value = ''
  aviso.value = ''
  try {
    await resolverOcorrencia(ocorrenciaId, solucao.value)
    solucao.value = ''
    obra.value = await carregarObra(id)
    aviso.value = 'Pendência marcada como resolvida.'
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível resolver a pendência.'
  } finally {
    trabalhando.value = false
  }
}

async function notificar() {
  const principal = pendencias.value.find((o) => !o.titulo.startsWith('Suporte solicitado'))
  trabalhando.value = true
  erro.value = ''
  aviso.value = ''
  try {
    await notificarSuporte(id, principal ? `Motivo: ${principal.titulo} — ${principal.descricao}` : '')
    obra.value = await carregarObra(id)
    aviso.value = 'Suporte notificado. O gestor verá o chamado no painel de ocorrências.'
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível notificar o suporte.'
  } finally {
    trabalhando.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <main class="mobile-page">
    <header class="top">
      <div class="topline">
        <button class="back" type="button" aria-label="Voltar" @click="router.push('/agenda')">‹</button>
        <div>
          <h1>Pendência da OS</h1>
          <p>Acompanhamento de pendência</p>
        </div>
      </div>
    </header>
    <section class="content">
      <p v-if="carregando" class="feedback">Carregando...</p>

      <div v-else-if="!obra" class="erro">
        {{ erro || 'Obra não encontrada.' }}
        <button class="secondary" @click="carregar">Tentar novamente</button>
      </div>

      <template v-else>
        <div class="card" style="text-align:center;padding:24px 16px">
          <div style="font-size:38px">{{ pendencias.length ? '⌛' : '✓' }}</div>
          <h2>{{ pendencias.length ? 'Aguardando resolução' : 'Sem pendências' }}</h2>
          <span class="pill" :class="pendencias.length ? 'pill-warn' : ''">{{ pendencias.length ? 'Pendente' : 'Tudo certo' }}</span>
        </div>

        <div v-if="erro" class="erro">{{ erro }}</div>
        <div v-if="aviso" class="notice success" style="margin-bottom:13px">{{ aviso }}</div>

        <div class="card">
          <div class="row"><span class="eyebrow">Ordem de serviço</span><strong>#{{ id }}</strong></div>
          <div class="item"><span class="step-icon">♙</span><div><span class="eyebrow">Cliente</span><br /><strong>{{ obra.orcamento?.nomeCliente ?? `Obra #${id}` }}</strong></div></div>

          <div v-for="p in pendencias" :key="p.id" class="notice" style="margin-top:14px">
            <strong>{{ p.titulo }}</strong>
            <span class="muted"> · {{ p.severidade }} · {{ dataBR(p.dataAbertura) }}</span><br />
            {{ p.descricao }}
            <img v-if="p.fotoUrl" :src="p.fotoUrl" alt="Foto da ocorrência" style="width:100%;border-radius:11px;margin-top:8px" />
            <button class="secondary" :disabled="trabalhando" @click="resolver(p.id)">Marcar como resolvida</button>
          </div>

          <template v-if="pendencias.length">
            <label for="solucao">Solução aplicada (opcional)</label>
            <textarea id="solucao" class="field" style="min-height:70px" v-model="solucao" placeholder="Descreva o que foi feito para resolver..."></textarea>
          </template>
        </div>

        <div class="actions">
          <button class="primary" @click="router.push({ name: pendencias.length ? 'DetalhesOS' : 'ExecucaoOS', params: { id } })">
            {{ pendencias.length ? '⌕ Ver detalhes da OS' : '▶ Continuar execução' }}
          </button>
          <button v-if="pendencias.length" class="secondary" :disabled="trabalhando || suporteJaChamado" @click="notificar">
            {{ suporteJaChamado ? '♧ Suporte já notificado' : '♧ Notificar suporte' }}
          </button>
          <button class="secondary" @click="router.push('/agenda')">Voltar para agenda</button>
        </div>
      </template>
    </section>
  </main>
</template>

<style scoped>
.mobile-page{min-height:100vh;background:#f3f6fb;color:#17233d;padding-bottom:28px;font-family:Inter,Arial,sans-serif}
.top{background:#203f91;color:white;padding:22px 18px 30px;border-radius:0 0 24px 24px}
.topline{display:flex;align-items:center;gap:12px}
.back{border:0;background:#ffffff24;color:white;border-radius:10px;width:38px;height:38px;font-size:22px}
.top h1{font-size:18px;margin:0;font-weight:750}
.top p{font-size:12px;opacity:.8;margin:6px 0 0}
.content{max-width:560px;margin:-12px auto 0;padding:0 14px;position:relative}
.card{background:white;border:1px solid #e6ebf3;border-radius:17px;padding:16px;margin-bottom:13px;box-shadow:0 3px 12px #203f9108}
.eyebrow{font-size:10px;letter-spacing:.07em;font-weight:800;color:#77849b;text-transform:uppercase}
h2{font-size:17px;margin:7px 0 12px}
h3{font-size:13px;margin:0 0 10px}
.muted{color:#8491a7;font-size:12px;line-height:1.5}
.primary,.danger,.secondary{width:100%;border:0;border-radius:11px;padding:13px 14px;font-weight:750;font-size:13px;cursor:pointer}
.primary{background:#203f91;color:white}
.danger{background:#f04449;color:white}
.secondary{background:white;color:#203f91;border:1px solid #dce4f0;margin-top:8px}
.pill{display:inline-block;border-radius:20px;background:#e8f7f1;color:#15966d;padding:5px 9px;font-size:10px;font-weight:800}
.row{display:flex;align-items:center;justify-content:space-between;gap:10px}
.os-card{cursor:pointer}
.os-card:active{transform:scale(.995)}
.os-title{font-weight:750;font-size:14px;margin:7px 0}
.meta{display:flex;gap:8px;align-items:center;color:#748199;font-size:11px;margin-top:8px}
.item{display:flex;align-items:flex-start;gap:10px;padding:12px 0;border-bottom:1px solid #eef1f6}
.item:last-child{border-bottom:0;padding-bottom:0}
.check{width:19px;height:19px;accent-color:#203f91;flex:none}
.field{display:block;width:100%;border:1px solid #e2e8f1;background:#f8fafd;border-radius:11px;padding:12px;font:inherit;font-size:12px;color:#26334c;box-sizing:border-box}
textarea.field{min-height:105px;resize:vertical}
label{font-size:11px;font-weight:750;display:block;margin:12px 0 7px}
.notice{background:#fff5e4;border:1px solid #ffe3a5;color:#985600;border-radius:13px;padding:13px;font-size:12px;line-height:1.5}
.success{background:#e8f8f2;color:#168a68}
.warning{background:#fff0f0;color:#b33b42}
.step{display:flex;gap:10px;align-items:center}
.step-icon{width:34px;height:34px;border-radius:10px;background:#edf2fa;color:#203f91;display:grid;place-items:center;font-weight:800}
.actions{position:sticky;bottom:0;background:#f3f6fb;padding:12px 0 max(12px,env(safe-area-inset-bottom))}
@media(min-width:769px){.mobile-page{max-width:480px;margin:20px auto;min-height:calc(100vh - 40px);border-radius:22px;overflow:hidden;box-shadow:0 8px 35px #17233d18}.content{padding:0 16px}}
.primary:disabled,.danger:disabled,.secondary:disabled{opacity:.5;cursor:not-allowed}
.erro{background:#fff0f0;border:1px solid #ffd0d3;color:#b33b42;border-radius:13px;padding:12px;font-size:12px;line-height:1.5;margin-bottom:13px}
.pill-warn{background:#fff3dc;color:#a66a00}
.pill-gray{background:#edf1f7;color:#5d6b85}
.feedback{text-align:center;color:#8491a7;font-size:12px;padding:24px 0}
a.secondary{display:block;text-align:center;text-decoration:none;box-sizing:border-box}
</style>

