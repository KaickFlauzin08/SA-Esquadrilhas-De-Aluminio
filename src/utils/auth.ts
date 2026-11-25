import { ref } from 'vue'

export interface UsuarioLogado {
  id: number
  nome: string
  email: string
  numero?: string
  roles: string
}

// Armazenado apenas em memória RAM: ao dar F5 / atualizar a página, tudo é zerado
let tokenMemoria: string | null = null
// "ref" faz as telas atualizarem sozinhas quando o perfil muda (nome no topo, por exemplo)
const usuarioMemoria = ref<UsuarioLogado | null>(null)

export function setSessao(token: string, usuario: UsuarioLogado): void {
  tokenMemoria = token
  usuarioMemoria.value = usuario
}

// Atualiza só alguns campos do usuário logado (usado ao editar o perfil)
export function atualizarUsuario(dados: Partial<UsuarioLogado>): void {
  if (!usuarioMemoria.value) return
  usuarioMemoria.value = { ...usuarioMemoria.value, ...dados }
}

export function getToken(): string | null {
  return tokenMemoria
}

export function getUsuario(): UsuarioLogado | null {
  return usuarioMemoria.value
}

export function isAutenticado(): boolean {
  return Boolean(tokenMemoria && tokenMemoria.trim().length > 0)
}

export function getRole(): string | null {
  return usuarioMemoria.value?.roles?.trim().toUpperCase() || 'TECNICO_CAMPO'
}

export function isGestor(): boolean {
  return getRole() === 'GESTOR'
}

export function logout(): void {
  tokenMemoria = null
  usuarioMemoria.value = null
}
