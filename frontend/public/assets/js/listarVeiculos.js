document.addEventListener("DOMContentLoaded", async () => {
  document.querySelector("#searchTable thead").innerHTML = `
    <tr><th>ID</th><th>Marca</th><th>Modelo</th><th>Ano</th>
    <th>Placa</th><th>Cor</th><th>KM</th><th>Ações</th></tr>`;
  await carregarVeiculos();
});

async function carregarVeiculos() {
  const tbody = document.querySelector("#searchTable tbody");
  tbody.innerHTML = '<tr><td colspan="8">Carregando…</td></tr>';
  try {
    const r = await api.get('/veiculos');
    const lista = await r.json();
    tbody.innerHTML = '';
    if (!lista.length) { tbody.innerHTML = '<tr><td colspan="8">Nenhum veículo cadastrado</td></tr>'; return; }
    lista.forEach(v => {
      const placaSafe = (v.placa||'').replace(/'/g,"\\'");
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${v.id}</td><td>${v.marca||''}</td><td>${v.modelo||''}</td>
        <td>${v.ano||''}</td><td>${v.placa||''}</td><td>${v.cor||''}</td>
        <td>${v.quilometragem??''}</td>
        <td>
          <button class="btn-editar" onclick="abrirModalEdicaoVeiculo(${v.id})">Editar</button>
          <button class="btn-excluir" onclick="excluirVeiculo(${v.id},'${placaSafe}')">Excluir</button>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch { tbody.innerHTML = '<tr><td colspan="8">Erro ao carregar dados</td></tr>'; }
}

async function excluirVeiculo(id, placa) {
  if (!confirm(`Excluir veículo placa "${placa}"?`)) return;
  const r = await api.delete(`/veiculos/${id}`);
  if (r.ok) { alert('Excluído!'); await carregarVeiculos(); }
  else { const e = await r.json(); alert(e.erro||'Erro ao excluir'); }
}

async function abrirModalEdicaoVeiculo(id) {
  const r = await api.get(`/veiculos?id=${id}`);
  const lista = await r.json();
  if (!lista.length) { alert('Veículo não encontrado.'); return; }
  const v = lista[0];

  let modal = document.getElementById('modalEdicaoVeiculo');
  if (modal) modal.remove();
  modal = document.createElement('div');
  modal.id = 'modalEdicaoVeiculo';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
  document.body.appendChild(modal);

  modal.innerHTML = `
    <div style="background:#fff;padding:30px;border-radius:8px;width:90%;max-width:600px;max-height:90vh;overflow-y:auto;">
      <h2 style="margin-bottom:20px;color:#2D3E50;">Editar Veículo</h2>
      <form id="formEdicaoVeiculo">
        <div style="display:flex;flex-wrap:wrap;gap:12px;">
          ${ic('Marca','ev_marca',v.marca)}${ic('Modelo','ev_modelo',v.modelo)}
          ${ic('Ano','ev_ano',v.ano,'number')}${ic('Placa','ev_placa',v.placa,'',' required')}
          ${ic('Cor','ev_cor',v.cor)}${ic('Quilometragem','ev_km',v.quilometragem,'number')}
          <div style="width:100%;"><label>Observações</label><br>
            <textarea id="ev_obs" style="width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:4px;height:70px;">${v.observacoes||''}</textarea></div>
        </div>
        <div style="display:flex;gap:12px;margin-top:20px;">
          <button type="submit" style="flex:1;padding:10px;background:#2D3E50;color:#fff;border:none;border-radius:6px;cursor:pointer;">Salvar</button>
          <button type="button" onclick="document.getElementById('modalEdicaoVeiculo').remove()" style="flex:1;padding:10px;background:#ccc;border:none;border-radius:6px;cursor:pointer;">Cancelar</button>
        </div>
      </form>
    </div>`;

  document.getElementById('formEdicaoVeiculo').onsubmit = async e => {
    e.preventDefault();
    const dados = {
      cliente_id: v.cliente_id,
      marca:  document.getElementById('ev_marca').value,
      modelo: document.getElementById('ev_modelo').value,
      ano:    parseInt(document.getElementById('ev_ano').value)||null,
      placa:  document.getElementById('ev_placa').value,
      cor:    document.getElementById('ev_cor').value,
      quilometragem: parseFloat(document.getElementById('ev_km').value)||null,
      observacoes:   document.getElementById('ev_obs').value,
    };
    const resp = await api.put(`/veiculos/${id}`, dados);
    if (resp.ok) { alert('Atualizado!'); document.getElementById('modalEdicaoVeiculo').remove(); await carregarVeiculos(); }
    else { const er = await resp.json(); alert(er.erro||'Erro'); }
  };
}

function ic(label, id, val, type='text', extra='') {
  return `<div style="flex:1;min-width:140px;"><label>${label}</label><br>
    <input id="${id}" type="${type||'text'}" value="${val??''}" ${extra} style="width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:4px;"></div>`;
}
