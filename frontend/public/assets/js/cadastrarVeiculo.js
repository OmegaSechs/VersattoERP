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
    const clientes = await r.json();
    const input = document.getElementById('cliente');
    let dl = document.createElement('datalist');
    dl.id = 'clientes-list';
    document.body.appendChild(dl);
    clientes.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.nome; dl.appendChild(opt);
    });
    input.setAttribute('list','clientes-list');
    input.addEventListener('change', () => {
      const found = clientes.find(c => c.nome === input.value);
      document.getElementById('cliente-id-hidden').value = found ? found.pessoa_id : '';
    });
  } catch(err) { console.error('Erro ao carregar clientes:', err); }
}

async function cadastrarVeiculo() {
  const placa = document.getElementById('placa').value;
  if (!placa) { alert('Placa é obrigatória.'); return; }
  const dados = {
    cliente_id:    document.getElementById('cliente-id-hidden').value || null,
    marca:         document.getElementById('marca').value,
    modelo:        document.getElementById('modelo').value,
    ano:           parseInt(document.getElementById('ano').value)||null,
    placa,
    cor:           document.getElementById('cor').value,
    quilometragem: parseFloat(document.getElementById('km').value)||null,
    observacoes:   document.getElementById('observacoes').value,
  };
  try {
    const r = await api.post('/veiculos', dados);
    if (r.ok) { alert('Veículo cadastrado!'); window.location.href = 'listaVeiculos.html'; }
    else { const er = await r.json(); alert(er.erro||'Erro'); }
  } catch { alert('Erro de conexão.'); }
}
