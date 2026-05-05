let itensOS = [];
let parcelasOS = [];

document.addEventListener("DOMContentLoaded", () => {
  carregarClientesOS();
  document.getElementById("formOS").addEventListener("submit", async e => {
    e.preventDefault();
    await cadastrarOS();
  });
});

async function carregarClientesOS() {
  try {
    const r = await api.get('/clientes');
    const clientes = await r.json();
    const input = document.getElementById('nome');
    let dl = document.createElement('datalist');
    dl.id = 'clientes-os-list';
    document.body.appendChild(dl);
    clientes.forEach(c => { const o = document.createElement('option'); o.value = c.nome; dl.appendChild(o); });
    input.setAttribute('list','clientes-os-list');
    input.addEventListener('change', () => {
      const found = clientes.find(c => c.nome === input.value);
      if (found) {
        document.getElementById('cliente-id-os').value = found.pessoa_id;
        const end = document.getElementById('endereco');
        if (end) end.value = [found.rua,found.numero,found.bairro,found.cidade].filter(Boolean).join(', ');
        const cpf = document.getElementById('cpf');
        if (cpf) cpf.value = found.cpf_cnpj||'';
        const tel = document.getElementById('telefone');
        if (tel) tel.value = found.telefone||found.celular||'';
        carregarVeiculosCliente(found.pessoa_id);
      }
    });
  } catch(err) { console.error(err); }
}

async function carregarVeiculosCliente(clienteId) {
  try {
    const r = await api.get(`/veiculos?cliente_id=${clienteId}`);
    const veiculos = await r.json();
    const input = document.getElementById('veiculo');
    let dl = document.getElementById('veiculos-os-list');
    if (dl) dl.remove();
    dl = document.createElement('datalist'); dl.id = 'veiculos-os-list';
    document.body.appendChild(dl);
    veiculos.forEach(v => { const o = document.createElement('option'); o.value = `${v.marca||''} ${v.modelo||''}`.trim(); dl.appendChild(o); });
    input.setAttribute('list','veiculos-os-list');
    input.addEventListener('change', () => {
      const nome = `${input.value}`.trim();
      const found = veiculos.find(v => `${v.marca||''} ${v.modelo||''}`.trim() === nome);
      if (found) {
        document.getElementById('veiculo-id-os').value = found.id;
        document.getElementById('placa').value = found.placa||'';
      }
    });
  } catch(err) { console.error(err); }
}

function abrirModal() {
  let modal = document.getElementById('modalProduto');
  if (modal) modal.remove();
  modal = document.createElement('div');
  modal.id = 'modalProduto';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
  document.body.appendChild(modal);
  modal.innerHTML = `
    <div style="background:#fff;padding:30px;border-radius:8px;width:90%;max-width:500px;">
      <h3 style="margin-bottom:16px;color:#2D3E50;">Adicionar Produto/Serviço</h3>
      <label>Buscar produto/serviço:</label><br>
      <input id="busca-produto" type="text" placeholder="Digite o nome…" style="width:100%;padding:8px;margin:4px 0 0;border:1px solid #ccc;border-radius:4px;" oninput="buscarProdutos(this.value)">
      <div id="resultados-produto" style="border:1px solid #ccc;border-top:none;max-height:160px;overflow-y:auto;display:none;border-radius:0 0 4px 4px;"></div>
      <input type="hidden" id="produto-selecionado-id">
      <input type="hidden" id="produto-selecionado-nome">
      <div style="margin:12px 0 0;">
        <label>Quantidade:</label><br>
        <input id="item-qtd" type="number" value="1" min="1" style="width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:4px;">
      </div>
      <div style="margin:12px 0 0;">
        <label>Valor Unitário (R$):</label><br>
        <input id="item-valor" type="number" step="0.01" style="width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:4px;">
      </div>
      <div style="display:flex;gap:12px;margin-top:16px;">
        <button onclick="adicionarItem()" style="flex:1;padding:10px;background:#2D3E50;color:#fff;border:none;border-radius:6px;cursor:pointer;">Adicionar</button>
        <button onclick="document.getElementById('modalProduto').remove()" style="flex:1;padding:10px;background:#ccc;border:none;border-radius:6px;cursor:pointer;">Cancelar</button>
      </div>
    </div>`;
}

async function buscarProdutos(q) {
  const div = document.getElementById('resultados-produto');
  if (!q||q.length<2) { div.style.display='none'; return; }
  try {
    const r = await api.get(`/catalogo?nome=${encodeURIComponent(q)}`);
    const lista = await r.json();
    div.innerHTML = '';
    if (!lista.length) { div.style.display='none'; return; }
    div.style.display = 'block';
    lista.forEach(p => {
      const d = document.createElement('div');
      d.style.cssText = 'padding:8px;cursor:pointer;border-bottom:1px solid #eee;';
      d.textContent = `${p.nome} — R$ ${Number(p.preco_padrao).toFixed(2)}`;
      d.onmouseover = () => d.style.background='#f0f0f0';
      d.onmouseout  = () => d.style.background='';
      d.onclick = () => {
        document.getElementById('busca-produto').value = p.nome;
        document.getElementById('produto-selecionado-id').value = p.id;
        document.getElementById('produto-selecionado-nome').value = p.nome;
        document.getElementById('item-valor').value = Number(p.preco_padrao).toFixed(2);
        div.style.display = 'none';
      };
      div.appendChild(d);
    });
  } catch(err) { console.error(err); }
}

function adicionarItem() {
  const id   = document.getElementById('produto-selecionado-id').value;
  const nome = document.getElementById('produto-selecionado-nome').value || document.getElementById('busca-produto').value;
  const qtd  = parseFloat(document.getElementById('item-qtd').value)||1;
  const val  = parseFloat(document.getElementById('item-valor').value)||0;
  if (!nome) { alert('Selecione um produto/serviço.'); return; }
  itensOS.push({ catalogo_id: id||null, nome, quantidade: qtd, valor_unitario: val, subtotal: qtd*val });
  renderizarItens();
  document.getElementById('modalProduto').remove();
}

function renderizarItens() {
  const tbody = document.querySelector('#itens-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  let total = 0;
  itensOS.forEach((it, i) => {
    total += it.subtotal;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${it.catalogo_id||'-'}</td><td>${it.nome}</td>
      <td>${it.quantidade}</td><td>R$ ${Number(it.valor_unitario).toFixed(2)}</td>
      <td><button onclick="removerItem(${i})" style="background:#c0392b;color:#fff;border:none;padding:3px 8px;border-radius:4px;cursor:pointer;">×</button></td>`;
    tbody.appendChild(tr);
  });
  const trT = document.createElement('tr');
  trT.innerHTML = `<td colspan="3" style="text-align:right;font-weight:bold;">Total:</td><td><strong>R$ ${total.toFixed(2)}</strong></td><td></td>`;
  tbody.appendChild(trT);
}

function removerItem(i) { itensOS.splice(i,1); renderizarItens(); }

function onTipoChange(val) {
  document.getElementById('sec-parcelamento').style.display =
    val === 'ordem_servico' ? 'block' : 'none';
  if (val !== 'ordem_servico') parcelasOS = [];
}

function gerarParcelasPreview() {
  const qtd   = Math.max(1, parseInt(document.getElementById('parc-qtd').value) || 1);
  const venc1 = document.getElementById('parc-venc1').value;
  if (!venc1) { alert('Informe a data do primeiro vencimento.'); return; }

  const total = itensOS.reduce((acc, it) => acc + it.subtotal, 0);
  if (total <= 0) { alert('Adicione itens à OS antes de gerar parcelas.'); return; }

  const valorBase = parseFloat((total / qtd).toFixed(2));
  parcelasOS = [];

  const [ano, mes, dia] = venc1.split('-').map(Number);
  for (let i = 0; i < qtd; i++) {
    const d = new Date(ano, mes - 1 + i, dia);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    // última parcela absorve resíduo de arredondamento
    const valor = i === qtd - 1
      ? parseFloat((total - valorBase * (qtd - 1)).toFixed(2))
      : valorBase;
    parcelasOS.push({ descricao: `Parcela ${i+1}/${qtd}`, valor, vencimento: dateStr });
  }

  const div = document.getElementById('parcelas-preview');
  div.innerHTML = '';
  const table = document.createElement('table');
  table.style.cssText = 'width:100%;border-collapse:collapse;font-size:13px;';
  table.innerHTML = `<thead><tr style="background:#e8ecf0;">
    <th style="padding:7px 10px;border:1px solid #ddd;text-align:left;">Parcela</th>
    <th style="padding:7px 10px;border:1px solid #ddd;">Vencimento</th>
    <th style="padding:7px 10px;border:1px solid #ddd;text-align:right;">Valor</th>
  </tr></thead><tbody></tbody>`;
  const tbody = table.querySelector('tbody');
  parcelasOS.forEach((p, i) => {
    const [y,m,d2] = p.vencimento.split('-');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="padding:7px 10px;border:1px solid #ddd;">${i+1}/${qtd}</td>
      <td style="padding:7px 10px;border:1px solid #ddd;text-align:center;">${d2}/${m}/${y}</td>
      <td style="padding:7px 10px;border:1px solid #ddd;text-align:right;">R$ ${p.valor.toFixed(2)}</td>`;
    tbody.appendChild(tr);
  });
  div.appendChild(table);
}

async function cadastrarOS() {
  const veiculo = document.getElementById('veiculo').value;
  const placa   = document.getElementById('placa').value;
  const dtE     = document.getElementById('dataEntrada').value;
  const hrE     = document.getElementById('horaEntrada').value;
  const tipo    = document.getElementById('tipo').value;
  if (!veiculo||!placa||!dtE||!hrE||!tipo) { alert('Preencha todos os campos obrigatórios.'); return; }

  const dados = {
    cliente_id:    document.getElementById('cliente-id-os').value||null,
    veiculo_id:    document.getElementById('veiculo-id-os').value||null,
    veiculo, placa,
    os_dt_entrada: dtE,
    os_dt_saida:   document.getElementById('dataSaida').value||null,
    os_hr_entrada: hrE,
    os_hr_saida:   document.getElementById('horaSaida').value||null,
    tipo, status: 'aberta',
    itens: itensOS,
    parcelas: parcelasOS,
  };
  try {
    const r = await api.post('/ordens-servico', dados);
    if (r.ok) { alert('OS cadastrada com sucesso!'); window.location.href = 'listaOS.html'; }
    else { const er = await r.json(); alert(er.erro||'Erro ao cadastrar OS'); }
  } catch { alert('Erro de conexão.'); }
}
