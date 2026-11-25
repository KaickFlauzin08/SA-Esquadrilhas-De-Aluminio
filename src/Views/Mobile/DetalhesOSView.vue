<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const itens = ['Porta de entrada', 'Janela de correr (sala)', 'Maxim-ar (banheiro)']
function iniciar() { router.push({ name: 'ExecucaoOS', params: { id: route.params.id } }) }
function abrirMapa() { window.open('https://www.google.com/maps/search/?api=1&query=Barra+da+Tijuca+RJ', '_blank') }
function mensagemDocumentos() { window.alert('A visualização dos documentos será conectada à API do projeto.') }
</script>

<template>
  <main class="mobile-page">
    <header class="top">
      <div class="topline">
        <button class="back" type="button" aria-label="Voltar" @click="router.back()">‹</button>
        <div>
          <h1>Detalhes da OS</h1>
          <p>Informações da ordem de serviço</p>
        </div>
      </div>
    </header>
    <section class="content">
      
      <div class="card">
        <div class="row"><span class="eyebrow">Ordem de serviço</span><span class="pill">Programada</span></div>
        <h2>#{{ route.params.id }} - Residencial Marina Lins</h2>
        <p class="muted">Instalação de esquadrias de alumínio</p>
      </div>
      <div class="card">
        <h3>⌖ Endereço da obra</h3>
        <p class="muted">Rua das Orquídeas, 120 - Bloco B, Apto 402<br>Barra da Tijuca, RJ</p>
        <button class="secondary" @click="abrirMapa">Abrir no GPS</button>
      </div>
      <div class="card">
        <div class="row"><h3>Documentação</h3><span class="pill">Disponível</span></div>
        <p class="muted">Documentos e orientações vinculados à ordem de serviço.</p>
        <button class="secondary" @click="mensagemDocumentos">Ver projeto</button>
      </div>
      <div class="card">
        <div class="row"><h3>Itens liberados</h3><span class="pill">3 itens</span></div>
        <div class="item" v-for="item in itens" :key="item"><span class="step-icon">✓</span><div><strong>{{ item }}</strong><div class="muted">Liberado para instalação</div></div></div>
      </div>
      <div class="card"><h3>Observações</h3><p class="muted">Confira os materiais e as condições do local antes de iniciar o serviço.</p></div>
      <div class="actions"><button class="primary" @click="iniciar">▶ Iniciar execução</button></div>

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

