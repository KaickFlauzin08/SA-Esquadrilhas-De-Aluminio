<script setup lang="ts">
import Sidebar from '../Components/Sidebar.vue'

function aoNavegar(menu: string) {
  console.log('Menu selecionado:', menu)
}
</script>

<template>
  <div style="display: flex; min-height: 100vh;">
    <Sidebar @navigate="aoNavegar" />
    
    <main style="flex: 1; padding: 24px;">
      <h1>Conteúdo Principal</h1>
    </main>
  </div>
</template>