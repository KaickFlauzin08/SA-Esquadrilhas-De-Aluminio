<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from '../Components/Sidebar.vue'

type PaymentMethod = 'cartao' | 'boleto' | 'cheque'

interface UploadedFile {
  name: string
  size?: string
}

function aoNavegar(menu: string) {
  console.log('Menu selecionado:', menu)
}

// Informações do Cliente
const nomeCompleto = ref<string>('')
const whatsapp = ref<string>('')
const cpfCnpj = ref<string>('')
const enderecoObra = ref<string>('')

// Especificações Técnicas
const alturaMm = ref<string>('')
const larguraMm = ref<string>('')
const tipoAbertura = ref<string>('Correr (2 Folhas)')
const ladoAbertura = ref<string>('Direita (p/ fora)')
const posicaoFechadura = ref<string>('')
const localResidencia = ref<string>('')
const observacoesTecnicas = ref<string>('')

// Condição de Pagamento
const condicaoPagamento = ref<PaymentMethod>('cartao')

// Upload de Arquivos
const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref<boolean>(false)
const arquivos = ref<UploadedFile[]>([
  { name: 'planta_baixa_v2.pdf' },
])

function abrirSeletorArquivo() {
  fileInputRef.value?.click()
}

function adicionarArquivos(fileList: FileList | null) {
  if (!fileList) return
  Array.from(fileList).forEach((file) => {
    arquivos.value.push({ name: file.name })
  })
}

function aoSelecionarArquivo(event: Event) {
  const target = event.target as HTMLInputElement
  adicionarArquivos(target.files)
  target.value = ''
}

function aoSoltarArquivo(event: DragEvent) {
  isDragging.value = false
  adicionarArquivos(event.dataTransfer?.files ?? null)
}

function removerArquivo(index: number) {
  arquivos.value.splice(index, 1)
}

function voltarPagina() {
  window.history.back()
}

function validarMedicao() {
  const payload = {
    cliente: {
      nomeCompleto: nomeCompleto.value,
      whatsapp: whatsapp.value,
      cpfCnpj: cpfCnpj.value,
      enderecoObra: enderecoObra.value,
    },
    especificacoes: {
      alturaMm: alturaMm.value || '2100',
      larguraMm: larguraMm.value || '1500',
      tipoAbertura: tipoAbertura.value,
      ladoAbertura: ladoAbertura.value,
      posicaoFechadura: posicaoFechadura.value || 'Centralizada a 1.10m',
      localResidencia: localResidencia.value || 'Suíte Master',
      observacoesTecnicas: observacoesTecnicas.value,
    },
    condicaoPagamento: condicaoPagamento.value,
    arquivos: arquivos.value.map((a) => a.name),
  }

  console.log('Medição validada:', payload)
  alert('Medição validada com sucesso!')
}
</script>

<template>
  <div class="layout-wrapper">
    <Sidebar @navigate="aoNavegar" />

    <main class="main-area">
      <!-- Topbar -->
      <header class="topbar">
        <div class="topbar-inner">
          <div class="topbar-left">
            <button type="button" class="back-btn" aria-label="Voltar" @click="voltarPagina">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 class="page-title">Novo Cadastro e Medição Final</h1>
          </div>

          <div class="operator-box">
            <div class="operator-info">
              <span class="operator-label">OPERADOR</span>
              <span class="operator-name">Ricardo Almeida</span>
            </div>
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
              alt="Ricardo Almeida"
              class="operator-avatar"
            />
          </div>
        </div>
      </header>

      <!-- Conteúdo do Formulário -->
      <form class="form-container" @submit.prevent="validarMedicao">
        <div class="columns-grid">
          <!-- COLUNA ESQUERDA -->
          <div class="column-stack">
            <!-- Card 1: Informações do Cliente -->
            <section class="card">
              <div class="card-header">
                <div class="card-icon blue">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                </div>
                <h2>Informações do Cliente</h2>
              </div>

              <div class="fields-stack">
                <div class="field-group">
                  <label>NOME COMPLETO</label>
                  <input
                    v-model="nomeCompleto"
                    type="text"
                    class="input-soft"
                    placeholder="Ex: Marina Lins de Albuquerque"
                  />
                </div>

                <div class="two-cols">
                  <div class="field-group">
                    <label>WHATSAPP</label>
                    <div class="input-with-icon">
                      <svg class="wa-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.758.459 3.475 1.331 4.988L2 22l5.184-1.359a9.927 9.927 0 004.847 1.258h.004c5.515 0 9.968-4.453 9.968-9.969A9.93 9.93 0 0019.08 4.91 9.914 9.914 0 0012.031 2zm5.816 14.258c-.245.691-1.425 1.321-1.976 1.404-.507.076-1.148.108-1.853-.116-.428-.136-.977-.318-1.678-.621-2.951-1.274-4.878-4.244-5.025-4.44-.147-.196-1.2-1.596-1.2-3.045s.76-2.161 1.03-2.456c.27-.295.589-.369.785-.369.196 0 .393.002.564.01.181.009.423-.069.662.505.245.59.834 2.038.908 2.185.073.148.122.32.024.516-.098.197-.147.32-.294.491-.147.172-.309.384-.441.516-.147.147-.3.306-.129.601.172.295.763 1.258 1.638 2.038 1.126 1.003 2.075 1.314 2.37 1.461.294.148.466.123.638-.073.172-.197.736-.86.932-1.155.197-.295.393-.246.663-.147.27.098 1.718.81 2.012.958.295.147.491.221.564.344.074.123.074.713-.171 1.404z" />
                      </svg>
                      <input
                        v-model="whatsapp"
                        type="text"
                        class="input-soft has-icon"
                        placeholder="(11) 99999-0000"
                      />
                    </div>
                  </div>

                  <div class="field-group">
                    <label>CPF / CNPJ</label>
                    <input
                      v-model="cpfCnpj"
                      type="text"
                      class="input-soft"
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>

                <div class="field-group">
                  <label>ENDEREÇO DA OBRA</label>
                  <input
                    v-model="enderecoObra"
                    type="text"
                    class="input-soft"
                    placeholder="Rua, Número, Bairro, Cidade - UF"
                  />
                </div>
              </div>
            </section>

            <!-- Card 2: Upload de Projetos & Desenhos -->
            <section class="card">
              <div class="card-header">
                <div class="card-icon indigo">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                  </svg>
                </div>
                <h2>Upload de Projetos &amp; Desenhos</h2>
              </div>

              <input
                ref="fileInputRef"
                type="file"
                class="hidden-input"
                accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg"
                multiple
                @change="aoSelecionarArquivo"
              />

              <div
                :class="['dropzone', { dragging: isDragging }]"
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="aoSoltarArquivo"
              >
                <div class="pdf-badge">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <path d="M6 2h8l6 6v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" fill="#EF4444" />
                    <path d="M14 2v6h6" fill="#FCA5A5" />
                    <text x="12" y="17.5" text-anchor="middle" fill="#FFFFFF" font-size="6.2" font-weight="700" font-family="sans-serif">PDF</text>
                  </svg>
                </div>

                <p class="drop-title">Arraste seu PDF ou DWG aqui</p>
                <p class="drop-subtitle">Formatos aceitos: PDF, DXF, PNG, JPG (Máx 25MB)</p>

                <button type="button" class="select-file-btn" @click="abrirSeletorArquivo">
                  Selecionar Arquivo
                </button>
              </div>

              <!-- Lista de Arquivos Enviados -->
              <div v-if="arquivos.length > 0" class="files-list">
                <div v-for="(arquivo, idx) in arquivos" :key="`${arquivo.name}-${idx}`" class="file-item">
                  <div class="file-info">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" class="file-doc-icon">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm1 7V3.5L18.5 9H15z" />
                    </svg>
                    <span class="file-name">{{ arquivo.name }}</span>
                  </div>
                  <button
                    type="button"
                    class="remove-file-btn"
                    title="Remover arquivo"
                    @click="removerArquivo(idx)"
                  >
                    &times;
                  </button>
                </div>
              </div>
            </section>
          </div>

          <!-- COLUNA DIREITA -->
          <div class="column-stack">
            <!-- Card 3: Especificações Técnicas (Medição Final) -->
            <section class="card">
              <div class="card-header">
                <div class="card-icon orange">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 5v14a1 1 0 001 1h14M8 20v-3m4 3v-2m4 2v-3M4 9h3m-3 4h2m-2 4h3" />
                  </svg>
                </div>
                <h2>Especificações Técnicas (Medição Final)</h2>
              </div>

              <div class="fields-stack">
                <div class="two-cols">
                  <div class="field-group">
                    <label>ALTURA (MM)</label>
                    <input
                      v-model="alturaMm"
                      type="number"
                      class="input-soft"
                      placeholder="2100"
                    />
                  </div>

                  <div class="field-group">
                    <label>LARGURA (MM)</label>
                    <input
                      v-model="larguraMm"
                      type="number"
                      class="input-soft"
                      placeholder="1500"
                    />
                  </div>
                </div>

                <div class="two-cols">
                  <div class="field-group">
                    <label>TIPO DE ABERTURA</label>
                    <div class="select-wrapper">
                      <select v-model="tipoAbertura" class="select-outlined">
                        <option value="Correr (2 Folhas)">Correr (2 Folhas)</option>
                        <option value="Correr (4 Folhas)">Correr (4 Folhas)</option>
                        <option value="Maxim-Ar">Maxim-Ar</option>
                        <option value="Pivotante">Pivotante</option>
                        <option value="Giro (1 Folha)">Giro (1 Folha)</option>
                      </select>
                      <svg class="chevron-icon" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  <div class="field-group">
                    <label>LADO DE ABERTURA</label>
                    <div class="select-wrapper">
                      <select v-model="ladoAbertura" class="select-outlined">
                        <option value="Direita (p/ fora)">Direita (p/ fora)</option>
                        <option value="Esquerda (p/ fora)">Esquerda (p/ fora)</option>
                        <option value="Direita (p/ dentro)">Direita (p/ dentro)</option>
                        <option value="Esquerda (p/ dentro)">Esquerda (p/ dentro)</option>
                        <option value="Bilateral">Bilateral</option>
                      </select>
                      <svg class="chevron-icon" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div class="two-cols">
                  <div class="field-group">
                    <label>POSIÇÃO FECHADURA</label>
                    <input
                      v-model="posicaoFechadura"
                      type="text"
                      class="input-soft"
                      placeholder="Centralizada a 1.10m"
                    />
                  </div>

                  <div class="field-group">
                    <label>LOCAL NA RESIDÊNCIA</label>
                    <input
                      v-model="localResidencia"
                      type="text"
                      class="input-soft"
                      placeholder="Suíte Master"
                    />
                  </div>
                </div>

                <div class="field-group">
                  <label>OBSERVAÇÕES TÉCNICAS</label>
                  <textarea
                    v-model="observacoesTecnicas"
                    rows="3"
                    class="textarea-outlined"
                    placeholder="Detalhes sobre soleira, pingadeira ou vãos..."
                  ></textarea>
                </div>
              </div>
            </section>

            <!-- Card 4: Condição de Pagamento -->
            <section class="card">
              <div class="card-header">
                <div class="card-icon emerald">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                  </svg>
                </div>
                <h2>Condição de Pagamento</h2>
              </div>

              <div class="payment-grid">
                <!-- Cartão -->
                <label :class="['payment-card', { selected: condicaoPagamento === 'cartao' }]">
                  <input v-model="condicaoPagamento" type="radio" value="cartao" class="sr-only" />
                  <span class="radio-indicator"></span>
                  <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24" class="payment-icon">
                    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                  </svg>
                  <span class="payment-label">Cartão</span>
                </label>

                <!-- Boleto -->
                <label :class="['payment-card', { selected: condicaoPagamento === 'boleto' }]">
                  <input v-model="condicaoPagamento" type="radio" value="boleto" class="sr-only" />
                  <span class="radio-indicator"></span>
                  <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24" class="payment-icon">
                    <path d="M2 6h2v12H2V6zm3 0h1v12H5V6zm2 0h3v12H7V6zm4 0h1v12h-1V6zm3 0h2v12h-2V6zm3 0h1v12h-1V6zm2 0h3v12h-3V6z" />
                  </svg>
                  <span class="payment-label">Boleto</span>
                </label>

                <!-- Cheque -->
                <label :class="['payment-card', { selected: condicaoPagamento === 'cheque' }]">
                  <input v-model="condicaoPagamento" type="radio" value="cheque" class="sr-only" />
                  <span class="radio-indicator"></span>
                  <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24" class="payment-icon">
                    <path d="M3 6h18v12H3V6zm2 2v8h14V8H5zm2 2h4v4H7v-4zm6 0h4v1.5h-4V10zm0 2.5h4V14h-4v-1.5z" />
                  </svg>
                  <span class="payment-label">Cheque</span>
                </label>
              </div>
            </section>
          </div>
        </div>

        <!-- Rodapé de Ações -->
        <footer class="form-footer">
          <div class="footer-info">
            <div class="delivery-estimate">
              <span class="estimate-label">PREVISÃO DE ENTREGA</span>
              <strong class="estimate-value">Até 45 dias úteis</strong>
            </div>

            <div class="warning-note">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <span>Atenção: Revise as medidas antes de validar.</span>
            </div>
          </div>

          <div class="footer-actions">
            <button type="button" class="btn-cancel" @click="voltarPagina">
              Cancelar
            </button>
            <button type="submit" class="btn-validate">
              <span>Validar Medição</span>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7m-6 6l4 4L23 7" />
              </svg>
            </button>
          </div>
        </footer>
      </form>
    </main>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.layout-wrapper {
  display: flex;
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1E293B;
}

.main-area {
  flex: 1;
  min-width: 0;
  background-color: #F8FAFC;
  display: flex;
  flex-direction: column;
}

/* Topbar */
.topbar {
  background: #FFFFFF;
  border-bottom: 1px solid #F1F5F9;
  padding: 14px 28px;
  position: sticky;
  top: 0;
  z-index: 20;
}

.topbar-inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  background: transparent;
  border: none;
  color: #64748B;
  padding: 6px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.15s;
}

.back-btn:hover {
  background: #F1F5F9;
  color: #1E293B;
}

.page-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #1E293B;
}

.operator-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.operator-info {
  display: flex;
  flex-direction: column;
  text-align: right;
}

.operator-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #94A3B8;
}

.operator-name {
  font-size: 13px;
  font-weight: 700;
  color: #1E293B;
}

.operator-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid #E2E8F0;
}

/* Container Principal */
.form-container {
  max-width: 1120px;
  width: 100%;
  margin: 0 auto;
  padding: 28px 24px 36px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 28px;
}

.columns-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}

.column-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Cards */
.card {
  background: #FFFFFF;
  border-radius: 18px;
  border: 1px solid #F1F5F9;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.card-header h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #1E293B;
}

.card-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon.blue {
  background: #DBEAFE;
  color: #1E3A8A;
}

.card-icon.indigo {
  background: #EEF2FF;
  color: #4F46E5;
}

.card-icon.orange {
  background: #FFEDD5;
  color: #EA580C;
}

.card-icon.emerald {
  background: #DCFCE7;
  color: #16A34A;
}

/* Campos de Formulário */
.fields-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.two-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-group label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #64748B;
  text-transform: uppercase;
}

.input-soft {
  width: 100%;
  background: #F1F5F9;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 11px 14px;
  font-size: 13px;
  color: #1E293B;
  outline: none;
  transition: 0.15s;
}

.input-soft::placeholder {
  color: #9CA3AF;
}

.input-soft:focus {
  background: #FFFFFF;
  border-color: #93C5FD;
  box-shadow: 0 0 0 3px #EFF6FF;
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.wa-icon {
  position: absolute;
  left: 12px;
  color: #10B981;
  pointer-events: none;
}

.input-soft.has-icon {
  padding-left: 36px;
}

.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.select-outlined {
  width: 100%;
  appearance: none;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 10px 36px 10px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #1E293B;
  outline: none;
  cursor: pointer;
  transition: 0.15s;
}

.select-outlined:focus {
  border-color: #2563EB;
  box-shadow: 0 0 0 3px #EFF6FF;
}

.chevron-icon {
  position: absolute;
  right: 12px;
  color: #64748B;
  pointer-events: none;
}

.textarea-outlined {
  width: 100%;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 11px 14px;
  font-size: 13px;
  font-family: inherit;
  color: #1E293B;
  resize: vertical;
  outline: none;
  transition: 0.15s;
}

.textarea-outlined::placeholder {
  color: #9CA3AF;
}

.textarea-outlined:focus {
  border-color: #2563EB;
  box-shadow: 0 0 0 3px #EFF6FF;
}

/* Upload Dropzone */
.hidden-input {
  display: none;
}

.dropzone {
  border: 1.5px dashed #CBD5E1;
  border-radius: 14px;
  background: #FAFBFD;
  padding: 28px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: 0.2s;
}

.dropzone.dragging {
  border-color: #2563EB;
  background: #EFF6FF;
}

.pdf-badge {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #FFFFFF;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.drop-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: #1E293B;
}

.drop-subtitle {
  margin: 4px 0 16px;
  font-size: 11px;
  color: #94A3B8;
}

.select-file-btn {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  color: #1E3A8A;
  font-size: 12px;
  font-weight: 700;
  padding: 8px 18px;
  border-radius: 9px;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition: 0.15s;
}

.select-file-btn:hover {
  background: #EFF6FF;
  border-color: #93C5FD;
}

.files-list {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  background: #F1F5F9;
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-doc-icon {
  color: #64748B;
}

.file-name {
  font-size: 12px;
  font-weight: 600;
  color: #334155;
}

.remove-file-btn {
  background: transparent;
  border: none;
  color: #EF4444;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 6px;
}

.remove-file-btn:hover {
  background: #FEE2E2;
}

/* Condição de Pagamento */
.payment-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

.payment-card {
  position: relative;
  border: 1.5px solid #E2E8F0;
  background: #FFFFFF;
  border-radius: 14px;
  padding: 18px 12px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: 0.15s;
}

.payment-card:hover {
  border-color: #93C5FD;
}

.payment-card.selected {
  border-color: #1E3A8A;
  background: #FAFBFD;
}

.radio-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 1.5px solid #CBD5E1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.payment-card.selected .radio-indicator {
  border-color: #1E3A8A;
}

.payment-card.selected .radio-indicator::after {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #1E3A8A;
}

.payment-icon {
  color: #94A3B8;
}

.payment-card.selected .payment-icon {
  color: #1E293B;
}

.payment-label {
  font-size: 12px;
  font-weight: 700;
  color: #475569;
}

.payment-card.selected .payment-label {
  color: #1E293B;
}

/* Footer */
.form-footer {
  border-top: 1px solid #E2E8F0;
  padding-top: 20px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.footer-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 28px;
}

.delivery-estimate {
  display: flex;
  flex-direction: column;
}

.estimate-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #94A3B8;
}

.estimate-value {
  font-size: 15px;
  font-weight: 700;
  color: #1E293B;
  margin-top: 2px;
}

.warning-note {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #F59E0B;
  font-size: 12px;
  font-weight: 600;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 18px;
}

.btn-cancel {
  background: transparent;
  border: none;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #F1F5F9;
  color: #1E293B;
}

.btn-validate {
  background: #1E3A8A;
  color: #FFFFFF;
  border: none;
  border-radius: 12px;
  padding: 13px 24px;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(30, 58, 138, 0.22);
  transition: 0.15s;
}

.btn-validate:hover {
  background: #1E40AF;
}

/* Responsividade */
@media (max-width: 960px) {
  .columns-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .two-cols,
  .payment-grid {
    grid-template-columns: 1fr;
  }

  .operator-info {
    display: none;
  }
}
</style>