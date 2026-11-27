<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { carregarObra, concluirObra, type ObraCompleta } from '../../services/api'

const router = useRouter()
const route = useRoute()
const id = Number(route.params.id)

const obra = ref<ObraCompleta | null>(null)
const carregando = ref(true)
const salvando = ref(false)
const concluida = ref(false)
const erro = ref('')
const email = ref('')

const total = computed(() => obra.value?.itens.length ?? 0)
const feitos = computed(() => obra.value?.instalados.length ?? 0)
const faltando = computed(() => total.value > 0 && feitos.value < total.value)
const percentual = computed(() => (total.value === 0 ? 100 : Math.round((Math.min(feitos.value, total.value) / total.value) * 100)))

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    const dados = await carregarObra(id)
    obra.value = dados
    email.value = dados.orcamento?.emailCliente ?? ''
    concluida.value = dados.projeto.statusProducao === 'CONCLUIDO'
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Erro ao carregar a obra.'
  } finally {
    carregando.value = false
  }
}

async function concluir() {
  if (!obra.value) return
  erro.value = ''

  if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    erro.value = 'Informe um e-mail válido.'
    return
  }

  salvando.value = true
  try {
    await concluirObra(obra.value, email.value)
    concluida.value = true
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível concluir a ordem de serviço.'
  } finally {
    salvando.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <main class="mobile-page">
    <header class="top">
      <div class="topline">
        <button class="back" type="button" aria-label="Voltar" @click="router.push({ name: 'ExecucaoOS', params: { id } })">‹</button>
        <div>
          <h1>Finalização de Obra</h1>
          <p>Conferência final do serviço</p>
        </div>
      </div>
    </header>
    <section class="content">
      <p v-if="carregando" class="feedback">Carregando...</p>

      <div v-else-if="!obra" class="erro">
        {{ erro || 'Obra não encontrada.' }}
        <button class="secondary" @click="carregar">Tentar novamente</button>
      </div>

      <template v-else-if="concluida">
        <div class="card success" style="text-align:center;padding:25px 16px">
          <div style="font-size:34px">✓</div>
          <h2>Serviço concluído com sucesso!</h2>
          <p class="muted">A ordem de serviço #{{ id }} foi registrada como concluída.</p>
        </div>
        <div class="actions">
          <button class="primary" @click="router.push('/agenda')">Voltar para agenda inicial</button>
        </div>
      </template>

      <template v-else>
        <div class="card">
          <div class="row"><span class="eyebrow">OS #{{ id }}</span><span class="pill" :class="faltando ? 'pill-warn' : ''">{{ percentual }}% instalado</span></div>
          <h2>Conferir e concluir</h2>
          <p class="muted">Confira os dados abaixo antes de concluir a ordem de serviço.</p>
        </div>

        <div v-if="faltando" class="notice warning" style="margin-bottom:13px">
          Ainda há itens do checklist sem conferência ({{ feitos }}/{{ total }}).
          <button class="secondary" @click="router.push({ name: 'ExecucaoOS', params: { id } })">Voltar ao checklist</button>
        </div>

        <div class="card">
          <h3>E-mail do cliente</h3>
          <label for="email">Endereço de e-mail</label>
          <input id="email" class="field" type="email" v-model.trim="email" placeholder="cliente@email.com" />
          <p class="muted">O e-mail fica salvo no cadastro do cliente para o envio da avaliação.</p>
        </div>

        <div class="card">
          <div class="row"><h3>Resumo da execução</h3><span class="pill">{{ feitos }}/{{ total }} itens</span></div>
          <p><strong>{{ obra.orcamento?.nomeCliente ?? `Obra #${id}` }}</strong></p>
          <p class="muted">{{ obra.orcamento?.enderecoObra || 'Endereço não informado' }}</p>
        </div>

        <div v-if="erro" class="erro">{{ erro }}</div>

        <div class="actions">
          <button class="primary" :disabled="salvando || faltando" @click="concluir">{{ salvando ? 'Salvando...' : 'Concluir ordem de serviço ✓' }}</button>
          <button class="secondary" @click="router.push('/agenda')">Voltar para agenda inicial</button>
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

