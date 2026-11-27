<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  carregarObra,
  iniciarExecucao,
  marcarItemInstalado,
  podeExecutar,
  type ItemOrcamento,
  type ObraCompleta,
} from '../../services/api'

const router = useRouter()
const route = useRoute()
const id = Number(route.params.id)

const obra = ref<ObraCompleta | null>(null)
const carregando = ref(true)
const erro = ref('')
const salvandoId = ref<number | null>(null)

const status = computed(() => obra.value?.projeto.statusProducao ?? '')
const liberado = computed(() => podeExecutar(status.value) && !obra.value?.bloqueada)

const checklist = computed(() =>
  (obra.value?.itens ?? []).map((item) => ({
    item,
    ok: obra.value?.instalados.includes(item.id) ?? false,
  })),
)
const concluidos = computed(() => checklist.value.filter((c) => c.ok).length)
const todosOk = computed(() => concluidos.value === checklist.value.length)

const etapas = computed(() => [
  { titulo: 'Início', texto: 'Conferência e preparação do local.', ok: status.value === 'EM_INSTALACAO' || status.value === 'CONCLUIDO' },
  { titulo: 'Andamento', texto: 'Instalação dos materiais liberados.', ok: concluidos.value > 0 },
  { titulo: 'Conclusão', texto: 'Registro final e conferência do serviço.', ok: status.value === 'CONCLUIDO' },
])

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    let dados = await carregarObra(id)
    // Ao abrir a execução de uma obra liberada, ela passa para "Em instalação"
    if (dados.projeto.statusProducao === 'LIBERADO' && !dados.bloqueada) {
      await iniciarExecucao(dados.projeto)
      dados = await carregarObra(id)
    }
    obra.value = dados
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Erro ao carregar a execução.'
  } finally {
    carregando.value = false
  }
}

// Cada item marcado é gravado na hora (RegistroObra). Depois de salvo, não desmarca.
async function marcar(item: ItemOrcamento, evento: Event) {
  const caixa = evento.target as HTMLInputElement
  if (!obra.value || salvandoId.value !== null) {
    caixa.checked = false
    return
  }
  salvandoId.value = item.id
  erro.value = ''
  try {
    await marcarItemInstalado(id, item)
    obra.value.instalados.push(item.id)
  } catch (e) {
    caixa.checked = false
    erro.value = e instanceof Error ? e.message : 'Não foi possível salvar o item.'
  } finally {
    salvandoId.value = null
  }
}

function registrarOcorrencia() {
  router.push({ name: 'OcorrenciaOS', params: { id } })
}

function finalizar() {
  router.push({ name: 'FinalizacaoOS', params: { id } })
}

onMounted(carregar)
</script>

<template>
  <main class="mobile-page">
    <header class="top">
      <div class="topline">
        <button class="back" type="button" aria-label="Voltar" @click="router.push({ name: 'DetalhesOS', params: { id } })">‹</button>
        <div>
          <h1>Execução do Serviço</h1>
          <p>Acompanhamento da instalação</p>
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
        <div class="card">
          <div class="row">
            <span class="eyebrow">OS #{{ id }}</span>
            <span class="pill" :class="status === 'CONCLUIDO' ? 'pill-gray' : ''">{{ status === 'CONCLUIDO' ? 'Concluída' : 'Em execução' }}</span>
          </div>
          <h2>Execução do serviço</h2>
          <p class="muted">Registre problemas, confira os itens e acompanhe as etapas da obra.</p>
        </div>

        <div v-if="erro" class="erro">{{ erro }}</div>

        <div v-if="obra.bloqueada" class="notice warning" style="margin-bottom:13px">
          <strong>Obra bloqueada por uma ocorrência em aberto.</strong>
          <button class="secondary" @click="router.push({ name: 'PendenciaOS', params: { id } })">Ver pendência</button>
        </div>
        <div v-else-if="!liberado && status !== 'CONCLUIDO'" class="notice" style="margin-bottom:13px">
          Esta obra ainda não foi liberada para instalação.
        </div>

        <div class="card">
          <div class="row"><h3>Relatar problema</h3><span class="eyebrow">Opcional</span></div>
          <p class="muted">Encontrou algum problema durante o serviço?</p>
          <button class="danger" @click="registrarOcorrencia">⚠ Relatar ocorrência</button>
        </div>

        <div class="card">
          <div class="row"><h3>Checklist de itens</h3><span class="muted">{{ concluidos }}/{{ checklist.length }} concluídos</span></div>
          <p v-if="checklist.length === 0" class="muted">Nenhum item cadastrado no orçamento desta obra.</p>
          <label v-for="c in checklist" :key="c.item.id" class="item" style="margin:0;cursor:pointer;font-size:13px;font-weight:400">
            <input
              class="check"
              type="checkbox"
              :checked="c.ok"
              :disabled="c.ok || !liberado || salvandoId !== null"
              @change="marcar(c.item, $event)"
            />
            <div>
              <strong>{{ c.item.quantidade }}x {{ c.item.descricaoItem }}</strong>
              <div class="muted">{{ c.item.largura }} × {{ c.item.altura }} mm<template v-if="c.item.tipoAbertura"> · {{ c.item.tipoAbertura }}</template></div>
              <div v-if="salvandoId === c.item.id" class="muted">Salvando...</div>
            </div>
          </label>
        </div>

        <div class="card">
          <h3>Etapas da obra</h3>
          <div class="item" v-for="(etapa, i) in etapas" :key="etapa.titulo">
            <span class="step-icon">{{ etapa.ok ? '✓' : i + 1 }}</span>
            <div><strong>{{ etapa.titulo }}</strong><p class="muted">{{ etapa.texto }}</p></div>
          </div>
        </div>

        <div class="actions">
          <p v-if="!todosOk" class="muted warning" style="padding:9px;border-radius:9px">Conclua todos os itens do checklist antes de finalizar.</p>
          <button class="primary" :disabled="!todosOk || !liberado" @click="finalizar">Finalizar instalação ✓</button>
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

