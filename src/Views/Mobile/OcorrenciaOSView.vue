<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { criarOcorrencia, lerFoto } from '../../services/api'

const router = useRouter()
const route = useRoute()
const id = Number(route.params.id)

// Os valores (MATERIAL, TECNICA...) são os que a API e o painel web já usam
const tipos = [
  { valor: 'MATERIAL', rotulo: 'Material com defeito ou faltando' },
  { valor: 'TECNICA', rotulo: 'Problema técnico / erro de medida' },
  { valor: 'EMBARGO', rotulo: 'Obra embargada / sem acesso' },
  { valor: 'CLIENTE', rotulo: 'Problema com o cliente' },
]
const severidades = [
  { valor: 'BAIXA', rotulo: 'Baixa' },
  { valor: 'MEDIA', rotulo: 'Média' },
  { valor: 'ALTA', rotulo: 'Alta' },
  { valor: 'CRITICA', rotulo: 'Crítica' },
]

const titulo = ref('')
const tipo = ref('MATERIAL')
const severidade = ref('MEDIA')
const descricao = ref('')
const bloqueiaObra = ref(false)
const foto = ref<string | null>(null)
const salvando = ref(false)
const erro = ref('')

// Embargo sempre bloqueia a obra
watch(tipo, (v) => {
  if (v === 'EMBARGO') bloqueiaObra.value = true
})

async function selecionarFoto(evento: Event) {
  const input = evento.target as HTMLInputElement
  const arquivo = input.files?.[0]
  if (!arquivo) return
  erro.value = ''
  try {
    foto.value = await lerFoto(arquivo)
  } catch (e) {
    foto.value = null
    erro.value = e instanceof Error ? e.message : 'Não foi possível ler a foto.'
  }
}

async function salvar() {
  erro.value = ''
  if (!titulo.value.trim() || !descricao.value.trim()) {
    erro.value = 'Informe o título e a descrição do problema.'
    return
  }

  salvando.value = true
  try {
    await criarOcorrencia({
      projetoId: id,
      titulo: titulo.value,
      tipo: tipo.value,
      severidade: severidade.value,
      descricao: descricao.value,
      fotoUrl: foto.value,
      bloqueiaObra: bloqueiaObra.value,
    })
    // Se bloqueou a obra, vai para a pendência; senão volta para a execução
    router.replace({ name: bloqueiaObra.value ? 'PendenciaOS' : 'ExecucaoOS', params: { id } })
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível salvar a ocorrência.'
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <main class="mobile-page">
    <header class="top">
      <div class="topline">
        <button class="back" type="button" aria-label="Voltar" @click="router.back()">‹</button>
        <div>
          <h1>Registro de Ocorrência</h1>
          <p>OS #{{ id }} - Relato de problema</p>
        </div>
      </div>
    </header>
    <section class="content">
      <div class="card">
        <h2>Registro de ocorrência</h2>
        <p class="muted">Informe o problema encontrado durante a execução da ordem de serviço.</p>

        <label for="titulo">Título *</label>
        <input id="titulo" class="field" v-model="titulo" maxlength="100" placeholder="Ex.: Vidro da janela trincado" />

        <label for="tipo">Tipo de ocorrência *</label>
        <select id="tipo" class="field" v-model="tipo">
          <option v-for="t in tipos" :key="t.valor" :value="t.valor">{{ t.rotulo }}</option>
        </select>

        <label for="severidade">Gravidade *</label>
        <select id="severidade" class="field" v-model="severidade">
          <option v-for="s in severidades" :key="s.valor" :value="s.valor">{{ s.rotulo }}</option>
        </select>

        <label for="descricao">Descrição do problema *</label>
        <textarea id="descricao" class="field" v-model="descricao" placeholder="Descreva detalhadamente o ocorrido..."></textarea>

        <label class="item" style="margin:12px 0 0;padding:0;border:0;cursor:pointer;font-size:12px">
          <input class="check" type="checkbox" v-model="bloqueiaObra" :disabled="tipo === 'EMBARGO'" />
          <span style="font-weight:600">Este problema impede a continuação da obra</span>
        </label>
      </div>

      <div class="card">
        <h3>Evidência (foto)</h3>
        <p class="muted">Tire ou selecione uma foto para documentar a ocorrência.</p>
        <input class="field" type="file" accept="image/*" capture="environment" @change="selecionarFoto" />
        <img v-if="foto" :src="foto" alt="Pré-visualização da foto" style="width:100%;border-radius:11px;margin-top:10px" />
      </div>

      <div class="notice warning">⚠️ Registre informações verdadeiras e imagens relacionadas à ocorrência.</div>

      <div v-if="erro" class="erro" style="margin-top:13px">{{ erro }}</div>

      <div class="actions">
        <button class="danger" :disabled="salvando" @click="salvar">{{ salvando ? 'Salvando...' : 'Salvar ocorrência ✓' }}</button>
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
.primary:disabled,.danger:disabled,.secondary:disabled{opacity:.5;cursor:not-allowed}
.erro{background:#fff0f0;border:1px solid #ffd0d3;color:#b33b42;border-radius:13px;padding:12px;font-size:12px;line-height:1.5;margin-bottom:13px}
.pill-warn{background:#fff3dc;color:#a66a00}
.pill-gray{background:#edf1f7;color:#5d6b85}
.feedback{text-align:center;color:#8491a7;font-size:12px;padding:24px 0}
a.secondary{display:block;text-align:center;text-decoration:none;box-sizing:border-box}
</style>

