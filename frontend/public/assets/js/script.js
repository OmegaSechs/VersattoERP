// ─────────────────────────────────────────────────────────────
//  script.js  —  Utilitários globais
// ─────────────────────────────────────────────────────────────

function searchTables() {
  const input  = document.getElementById('searchInput');
  if (!input) return;
  const filter = input.value.toLowerCase();
  const table  = document.getElementById('searchTable');
  if (!table) return;
  const trs = table.getElementsByTagName('tr');

  for (let i = 1; i < trs.length; i++) {
    const tds   = trs[i].getElementsByTagName('td');
    const match = Array.from(tds).some(td => td.innerText.toLowerCase().includes(filter));
    trs[i].style.display = match ? '' : 'none';
  }
}

function loadSidebar() {
  fetch('sidebar.html')
    .then(r => r.text())
    .then(html => {
      document.getElementById('sidebar-container').innerHTML = html;
      const u = Auth.usuario();
      const el = document.getElementById('sidebar-usuario');
      if (el && u) el.textContent = u.nome;

      // Oculta links exclusivos de admin para não-admins
      if (!u || u.perfil !== 'admin') {
        document.querySelectorAll('[data-admin]').forEach(link => {
          link.style.display = 'none';
        });
      }
    });
}

function loadFooter() {
  fetch('footer.html')
    .then(r => r.text())
    .then(html => { document.getElementById('footer-container').innerHTML = html; });
}

function toggleSidebar() {
  const sidebar = document.getElementById('mySidebar');
  const main    = document.getElementById('home');
  if (!sidebar) return;
  if (sidebar.style.width === '250px') {
    sidebar.style.width = '0';
    if (main) main.style.marginLeft = '0';
  } else {
    sidebar.style.width = '250px';
    if (main) main.style.marginLeft = '250px';
  }
}

// Logout — delega ao Auth que limpa cookie e localStorage
function logout() {
  Auth.logout();
}

// Carrega sidebar e footer ao inicializar
window.addEventListener('DOMContentLoaded', () => {
  loadSidebar();
  loadFooter();

  // Substitui links de logout pelo handler real
  document.querySelectorAll('[onclick*="login.html"]').forEach(el => {
    el.removeAttribute('onclick');
    el.addEventListener('click', e => { e.preventDefault(); logout(); });
  });
});
