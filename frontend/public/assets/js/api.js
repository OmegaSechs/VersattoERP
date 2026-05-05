// ─────────────────────────────────────────────────────────────
//  api.js  —  Camada de comunicação autenticada com o backend
//  Inclua este script ANTES de qualquer outro JS da aplicação.
// ─────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:5500';

// Salva / recupera token no localStorage
const Auth = {
  salvar(token, usuario) {
    localStorage.setItem('versatto_token',   token);
    localStorage.setItem('versatto_usuario', JSON.stringify(usuario));
  },
  token()   { return localStorage.getItem('versatto_token'); },
  usuario() {
    try { return JSON.parse(localStorage.getItem('versatto_usuario')); }
    catch { return null; }
  },
  logado()  { return !!this.token(); },
  logout()  {
    localStorage.removeItem('versatto_token');
    localStorage.removeItem('versatto_usuario');
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

// fetch autenticado — usa o token JWT em todas as requisições
async function apiFetch(path, options = {}) {
  const token = Auth.token();
  const headers = {
    ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
