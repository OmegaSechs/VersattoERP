document.addEventListener("DOMContentLoaded", async () => {
  document.querySelector("#searchTable thead").innerHTML = `
    <tr>
      <th>ID</th><th>Nome</th><th>Tipo</th><th>Est.Mín</th><th>Est.Máx</th>
      <th>Estoque</th><th>Custo R$</th><th>Venda R$</th><th>Situação</th><th>Ações</th>
    </tr>`;
  await carregarProdutos();
});

const tipoMap = { 1:'Serviço', 2:'Produto', 3:'Material' };

function situacaoBadge(item) {
  const est = parseInt(item.quantidade_estoque)||0;
  const min = parseInt(item.quantidade_minima)||0;
  if (item.tipo === 1) return '<span style="color:#888;">N/A</span>';
  if (est <= 0)  return '<span style="background:#f8d7da;color:#721c24;padding:2px 8px;border-radius:10px;font-size:12px;">Zerado</span>';
  if (est < min) return '<span style="background:#fff3cd;color:#856404;padding:2px 8px;border-radius:10px;font-size:12px;">Abaixo do mínimo</span>';
  return '<span style="background:#d4edda;color:#155724;padding:2px 8px;border-radius:10px;font-size:12px;">Normal</span>';
}

async function carregarProdutos() {
  const tbody = document.querySelector("#searchTable tbody");
  tbody.innerHTML = '<tr><td colspan="10">Carregando…</td></tr>';
  try {
    const r = await api.get('/catalogo');
    const lista = await r.json();
    tbody.innerHTML = '';
    if (!lista.length) { tbody.innerHTML = '<tr><td colspan="10">Nenhum produto cadastrado</td></tr>'; return; }
    lista.forEach(p => {
      const nomeSafe = (p.nome||'').replace(/'/g,"\\'");
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.id}</td><td>${p.nome||''}</td><td>${tipoMap[p.tipo]||p.tipo||''}</td>
        <td>${p.quantidade_minima??''}</td><td>${p.quantidade_maxima??''}</td>
        <td>${p.quantidade_estoque??0}</td>
        <td>${p.preco_custo?Number(p.preco_custo).toFixed(2):'0.00'}</td>
        <td>${p.preco_padrao?Number(p.preco_padrao).toFixed(2):'0.00'}</td>
        <td>${situacaoBadge(p)}</td>
        <td>
          <button class="btn-editar" onclick="abrirModalEdicaoProduto(${p.id})">Editar</button>
          <button class="btn-excluir" onclick="excluirProduto(${p.id},'${nomeSafe}')">Excluir</button>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch { tbody.innerHTML = '<tr><td colspan="10">Erro ao carregar dados</td></tr>'; }
}

async function excluirProduto(id, nome) {
  if (!confirm(`Excluir "${nome}"?`)) return;
  const r = await api.delete(`/catalogo/${id}`);
  if (r.ok) { alert('Excluído!'); await carregarProdutos(); }
  else { const e = await r.json(); alert(e.erro||'Erro ao excluir'); }
}

async function abrirModalEdicaoProduto(id) {
  const r = await api.get(`/catalogo?id=${id}`);
  const lista = await r.json();
  if (!lista.length) { alert('Produto não encontrado.'); return; }
  const p = lista[0];

  let modal = document.getElementById('modalEdicaoProduto');
  if (modal) modal.remove();
  modal = document.createElement('div');
  modal.id = 'modalEdicaoProduto';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
  document.body.appendChild(modal);

  const s = v => v === p.tipo ? 'selected' : '';
  modal.innerHTML = `
    <div style="background:#fff;padding:30px;border-radius:8px;width:90%;max-width:600px;max-height:90vh;overflow-y:auto;">
      <h2 style="margin-bottom:20px;color:#2D3E50;">Editar Produto</h2>
      <form id="formEdicaoProduto">
        <div style="display:flex;flex-wrap:wrap;gap:12px;">
          <div style="flex:2;min-width:200px;"><label>Nome</label><br>
            <input id="ep_nome" value="${(p.nome||'').replace(/"/g,'&quot;')}" required style="width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:4px;"></div>
          <div style="flex:1;min-width:150px;"><label>Tipo</label><br>
            <select id="ep_tipo" style="width:100%;padding:8px;margin-top:4px;">
              <option value="1" ${s(1)}>Serviço</option>
              <option value="2" ${s(2)}>Produto</option>
              <option value="3" ${s(3)}>Material</option>
            </select></div>
          <div style="flex:1;min-width:140px;"><label>Preço Custo</label><br>
            <input id="ep_custo" type="number" step="0.01" value="${p.preco_custo||''}" style="width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:4px;"></div>
          <div style="flex:1;min-width:140px;"><label>Preço Venda</label><br>
            <input id="ep_venda" type="number" step="0.01" value="${p.preco_padrao||''}" style="width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:4px;"></div>
          <div style="flex:1;min-width:140px;"><label>Est. Mínimo</label><br>
            <input id="ep_min" type="number" value="${p.quantidade_minima??''}" style="width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:4px;"></div>
          <div style="flex:1;min-width:140px;"><label>Est. Máximo</label><br>
            <input id="ep_max" type="number" value="${p.quantidade_maxima??''}" style="width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:4px;"></div>
          <div style="flex:1;min-width:140px;"><label>Estoque Atual</label><br>
            <input id="ep_estoque" type="number" value="${p.quantidade_estoque??0}" style="width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:4px;"></div>
          <div style="width:100%;"><label>Descrição</label><br>
            <input id="ep_desc" value="${(p.descricao||'').replace(/"/g,'&quot;')}" style="width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:4px;"></div>
        </div>
        <div style="display:flex;gap:12px;margin-top:20px;">
          <button type="submit" style="flex:1;padding:10px;background:#2D3E50;color:#fff;border:none;border-radius:6px;cursor:pointer;">Salvar</button>
          <button type="button" onclick="document.getElementById('modalEdicaoProduto').remove()" style="flex:1;padding:10px;background:#ccc;border:none;border-radius:6px;cursor:pointer;">Cancelar</button>
        </div>
      </form>
    </div>`;

  document.getElementById('formEdicaoProduto').onsubmit = async e => {
    e.preventDefault();
    const dados = {
      nome: document.getElementById('ep_nome').value,
      tipo: parseInt(document.getElementById('ep_tipo').value),
      preco_custo: parseFloat(document.getElementById('ep_custo').value)||0,
      preco_padrao: parseFloat(document.getElementById('ep_venda').value)||0,
      quantidade_minima: parseInt(document.getElementById('ep_min').value)||0,
      quantidade_maxima: parseInt(document.getElementById('ep_max').value)||0,
      quantidade_estoque: parseInt(document.getElementById('ep_estoque').value)||0,
      descricao: document.getElementById('ep_desc').value,
    };
    const resp = await api.put(`/catalogo/${id}`, dados);
    if (resp.ok) { alert('Atualizado!'); document.getElementById('modalEdicaoProduto').remove(); await carregarProdutos(); }
    else { const er = await resp.json(); alert(er.erro||'Erro'); }
  };
}
