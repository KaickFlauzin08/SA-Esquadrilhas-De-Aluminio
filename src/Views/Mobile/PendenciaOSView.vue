<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const motivo = 'Aguardando a chegada de materiais adicionais para finalizar o trecho. Previsão de entrega informada pelo fornecedor: amanhã às 09:00.'
function notificar() {
  window.alert('A solicitação de suporte precisa ser conectada ao serviço de atendimento da API.')
}
</script>

<template>
  <main class="mobile-page">
    <header class="top">
      <div class="topline">
        <button class="back" type="button" aria-label="Voltar" @click="router.back()">‹</button>
        <div>
          <h1>Finalização de Obra</h1>
          <p>Acompanhamento de pendência</p>
        </div>
      </div>
    </header>
    <section class="content">
      
      <div class="card" style="text-align:center;padding:24px 16px">
        <div style="font-size:38px">⌛</div>
        <h2>Aguardando resolução</h2>
        <span class="pill" style="background:#fff3dc;color:#a66a00">Pendente</span>
      </div>
      <div class="card">
        <div class="row"><span class="eyebrow">Ordem de serviço</span><strong>#{{ route.params.id }}</strong></div>
        <div class="item"><span class="step-icon">♙</span><div><span class="eyebrow">Cliente</span><strong>Condomínio Solar das Palmeiras</strong></div></div>
        <div class="item"><span class="step-icon">▦</span><div><span class="eyebrow">Data e hora</span><strong>24 de outubro, 14:30h</strong></div></div>
        <div class="notice" style="margin-top:14px"><strong>Motivo da pendência</strong><br>{{ motivo }}</div>
      </div>
      <div class="actions">
        <button class="primary" @click="router.push({ name: 'DetalhesOS', params: { id: route.params.id } })">⌕ Ver detalhes da pendência</button>
        <button class="secondary" @click="notificar">♧ Notificar suporte</button>
        <button class="secondary" @click="router.push('/agenda')">Voltar para agenda</button>
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

