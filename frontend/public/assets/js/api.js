// ─────────────────────────────────────────────────────────────
//  api.js  —  Camada de comunicação autenticada com o backend
//  Inclua este script ANTES de qualquer outro JS da aplicação.
// ─────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:5500';

const Auth = {
  salvar(usuario, token) {
    localStorage.setItem('versatto_usuario', JSON.stringify(usuario));
    if (token) localStorage.setItem('versatto_jwt', token);
  },
  token() { return localStorage.getItem('versatto_jwt'); },
  usuario() {
    try { return JSON.parse(localStorage.getItem('versatto_usuario')); }
    catch { return null; }
  },
  logado() { return !!localStorage.getItem('versatto_usuario'); },
  logout() {
    fetch(`${API_BASE}/auth/logout`, { method: 'POST' }).catch(() => {});
    localStorage.removeItem('versatto_usuario');
    localStorage.removeItem('versatto_jwt');
    window.location.href = 'login.html';
  },
};

// Verifica autenticação ao carregar qualquer página (exceto login)
(function guardaRota() {
  const paginaAtual = window.location.pathname.split('/').pop() || 'index.html';
  const paginasPublicas = ['login.html', ''];
  if (!paginasPublicas.includes(paginaAtual) && !Auth.logado()) {
    window.location.href = 'login.html';
  }
})();

// fetch autenticado — envia JWT via header Authorization
async function apiFetch(path, options = {}) {
  const token = Auth.token();
  const headers = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (response.status === 401) {
    Auth.logout();
    return;
  }

  return response;
}

// Atalhos semânticos
const api = {
  get:    (path)         => apiFetch(path),
  post:   (path, body)   => apiFetch(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path, body)   => apiFetch(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (path)         => apiFetch(path, { method: 'DELETE' }),
};
