<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
import { computed, reactive } from 'vue'
const checklist = reactive([
  { nome: 'Vedação de vidros e esquadrias', descricao: 'Conferir vedação e acabamento', ok: false },
  { nome: 'Ajuste de dobradiças e fechaduras', descricao: 'Testar abertura e fechamento', ok: false },
  { nome: 'Limpeza dos perfis de alumínio', descricao: 'Limpeza após a instalação', ok: false }
])
const concluidos = computed(() => checklist.filter(item => item.ok).length)
function registrarOcorrencia() { router.push({ name: 'OcorrenciaOS', params: { id: route.params.id } }) }
function finalizar() { router.push({ name: 'FinalizacaoOS', params: { id: route.params.id } }) }
</script>

<template>
  <main class="mobile-page">
    <header class="top">
      <div class="topline">
        <button class="back" type="button" aria-label="Voltar" @click="router.back()">‹</button>
        <div>
          <h1>Execução do Serviço</h1>
          <p>Acompanhamento da instalação</p>
        </div>
      </div>
    </header>
    <section class="content">
      
      <div class="card">
        <div class="row"><span class="eyebrow">OS #{{ route.params.id }}</span><span class="pill">Em execução</span></div>
        <h2>Execução do serviço</h2>
        <p class="muted">Registre problemas, confira os itens e acompanhe as etapas da obra.</p>
      </div>
      <div class="card">
        <div class="row"><h3>Relatar problema inicial</h3><span class="eyebrow">Opcional</span></div>
        <p class="muted">Encontrou algum problema antes de começar?</p>
        <button class="danger" @click="registrarOcorrencia">⚠ Relatar ocorrência</button>
      </div>
      <div class="card">
        <div class="row"><h3>Checklist de itens</h3><span class="muted">{{ concluidos }}/{{ checklist.length }} concluídos</span></div>
        <div v-for="(item, index) in checklist" :key="item.nome" class="item">
          <input class="check" type="checkbox" v-model="item.ok">
          <div><strong>{{ item.nome }}</strong><div class="muted">{{ item.descricao }}</div></div>
        </div>
      </div>
      <div class="card">
        <h3>Etapas da obra</h3>
        <div class="item"><span class="step-icon">1</span><div><strong>Início</strong><p class="muted">Conferência e preparação do local.</p></div></div>
        <div class="item"><span class="step-icon">2</span><div><strong>Andamento</strong><p class="muted">Instalação dos materiais liberados.</p></div></div>
        <div class="item"><span class="step-icon">3</span><div><strong>Conclusão</strong><p class="muted">Registro final e conferência do serviço.</p></div></div>
      </div>
      <div class="actions">
        <p v-if="concluidos !== checklist.length" class="muted warning" style="padding:9px;border-radius:9px">Conclua todos os itens do checklist antes de finalizar.</p>
        <button class="primary" :disabled="concluidos !== checklist.length" @click="finalizar">Finalizar instalação ✓</button>
      </div>

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
</style>

