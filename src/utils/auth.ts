export interface UsuarioLogado {
  id: number
  nome: string
  email: string
  numero?: string
  roles: string
}

// Armazenado apenas em memória RAM: ao dar F5 / atualizar a página, tudo é zerado
let tokenMemoria: string | null = null
let usuarioMemoria: UsuarioLogado | null = null

export function setSessao(token: string, usuario: UsuarioLogado): void {
  tokenMemoria = token
  usuarioMemoria = usuario
}

export function getToken(): string | null {
  return tokenMemoria
}

export function getUsuario(): UsuarioLogado | null {
  return usuarioMemoria
}

export function isAutenticado(): boolean {
  return !!tokenMemoria
}

export function getRole(): string | null {
  return usuarioMemoria?.roles?.toUpperCase() || null
}

export function isGestor(): boolean {
  return getRole() === 'GESTOR'
}

export function logout(): void {
  tokenMemoria = null
  usuarioMemoria = null
}