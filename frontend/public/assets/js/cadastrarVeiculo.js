let _clientesCache = [];

document.addEventListener("DOMContentLoaded", () => {
  carregarClientes();
  document.getElementById('formVeiculo').addEventListener('submit', async e => {
    e.preventDefault();
    await cadastrarVeiculo();
  });
});

async function carregarClientes() {
  try {
    const r = await api.get('/clientes');
    if (!r) return;
    const clientes = await r.json();
    if (!Array.isArray(clientes)) return;
    _clientesCache = clientes;

    const input = document.getElementById('cliente');
    const dl = document.createElement('datalist');
    dl.id = 'clientes-list';
    document.body.appendChild(dl);

    clientes.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.nome;
      opt.dataset.id = c.pessoa_id;
      dl.appendChild(opt);
    });
    input.setAttribute('list', 'clientes-list');

    // 'input' dispara ao selecionar do datalist; 'change' ao sair do campo
    const resolverCliente = () => {
      const nome = input.value.trim();
      const found = _clientesCache.find(c => c.nome.trim() === nome);
      document.getElementById('cliente-id-hidden').value = found ? found.pessoa_id : '';
    };
    input.addEventListener('input',  resolverCliente);
    input.addEventListener('change', resolverCliente);
  } catch(err) { console.error('Erro ao carregar clientes:', err); }
}

async function cadastrarVeiculo() {
  const placa = document.getElementById('placa').value.trim();
  if (!placa) { alert('Placa é obrigatória.'); return; }

  const kmRaw  = document.getElementById('km').value;
  const anoRaw = document.getElementById('ano').value;

  const dados = {
    cliente_id:    document.getElementById('cliente-id-hidden').value || null,
    marca:         document.getElementById('marca').value,
    modelo:        document.getElementById('modelo').value,
    ano:           anoRaw !== '' ? parseInt(anoRaw, 10) : null,
    placa,
    cor:           document.getElementById('cor').value,
    quilometragem: kmRaw !== '' ? parseFloat(kmRaw) : null,
    observacoes:   document.getElementById('observacoes').value,
  };

  try {
    const r = await api.post('/veiculos', dados);
    if (!r) return; // 401 — redirecionando para login
    if (r.ok) {
      alert('Veículo cadastrado!');
      window.location.href = 'listaVeiculos.html';
    } else {
      const er = await r.json();
      alert(er.erro || 'Erro ao cadastrar veículo.');
    }
  } catch(err) { alert('Erro de conexão: ' + err.message); }
}
