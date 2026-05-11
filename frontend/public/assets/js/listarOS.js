document.addEventListener("DOMContentLoaded", async () => {
  document.querySelector("#searchTable thead").innerHTML = `
    <tr>
      <th>OS Nº</th><th>Cliente</th><th>Veículo</th><th>Placa</th>
      <th>Tipo</th><th>Status</th><th>Data Entrada</th><th>Total R$</th><th>Ações</th>
    </tr>`;
  await carregarOS();
});

const statusMap  = { aberta:'Aberta', em_andamento:'Em Andamento', concluida:'Concluída', cancelada:'Cancelada' };
const tipoOSMap  = { orcamento:'Orçamento', ordem_servico:'Ordem de Serviço' };

async function carregarOS() {
  const tbody = document.querySelector("#searchTable tbody");
  tbody.innerHTML = '<tr><td colspan="9">Carregando…</td></tr>';
  try {
    const r = await api.get('/ordens-servico');
    const lista = await r.json();
    tbody.innerHTML = '';
    if (!lista.length) { tbody.innerHTML = '<tr><td colspan="9">Nenhuma OS cadastrada</td></tr>'; return; }
    lista.forEach(os => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${os.os_id}</td>
        <td>${os.cliente_nome||os.cliente_id||'-'}</td>
        <td>${os.veiculo||''}</td>
        <td>${os.placa||''}</td>
        <td>${tipoOSMap[os.tipo]||os.tipo||''}</td>
        <td><span class="status-badge status-${os.status||'aberta'}">${statusMap[os.status]||os.status||'Aberta'}</span></td>
        <td>${os.os_dt_entrada?new Date(os.os_dt_entrada).toLocaleDateString('pt-BR'):''}</td>
        <td>${os.valor_total?Number(os.valor_total).toFixed(2):'0.00'}</td>
        <td>
          <button class="btn-editar" onclick="abrirModalEdicaoOS(${os.os_id})">Editar</button>
          <button class="btn-excluir" onclick="excluirOS(${os.os_id})">Excluir</button>
          <button class="btn-imprimir-os" onclick="imprimirOS(${os.os_id})">Imprimir</button>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch { tbody.innerHTML = '<tr><td colspan="9">Erro ao carregar dados</td></tr>'; }
}

async function excluirOS(id) {
  if (!confirm(`Excluir OS nº ${id}? O estoque dos itens será revertido.`)) return;
  const r = await api.delete(`/ordens-servico/${id}`);
  if (r.ok) { alert('OS excluída e estoque revertido.'); await carregarOS(); }
  else { const e = await r.json(); alert(e.erro||'Erro ao excluir'); }
}

let itensEdicaoOS = [];
let parcelasConversaoOS = [];

function renderItensEdicao() {
  const tbody = document.getElementById('itens-edicao-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  let total = 0;
  itensEdicaoOS.forEach((it, i) => {
    const sub = Number(it.quantidade) * Number(it.valor_unitario);
    total += sub;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="padding:8px;border:1px solid #ddd;">${it.nome}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right;">${Number(it.quantidade).toFixed(1)}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right;">R$ ${Number(it.valor_unitario).toFixed(2)}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right;">R$ ${sub.toFixed(2)}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:center;">
        <button onclick="removerItemEdicao(${i})" style="background:#c0392b;color:#fff;border:none;padding:3px 8px;border-radius:4px;cursor:pointer;">×</button>
      </td>`;
    tbody.appendChild(tr);
  });
  const trT = document.createElement('tr');
  trT.innerHTML = `<td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold;">Total:</td><td style="padding:8px;border:1px solid #ddd;text-align:right;"><strong>R$ ${total.toFixed(2)}</strong></td><td></td>`;
  tbody.appendChild(trT);
}

function removerItemEdicao(i) { itensEdicaoOS.splice(i, 1); renderItensEdicao(); }

function abrirModalAdicionarItemEdicao() {
  let modal = document.getElementById('modalItemEdicao');
  if (modal) modal.remove();
  modal = document.createElement('div');
  modal.id = 'modalItemEdicao';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:10000;display:flex;align-items:center;justify-content:center;';
  document.body.appendChild(modal);
  modal.innerHTML = `
    <div style="background:#fff;padding:30px;border-radius:8px;width:90%;max-width:500px;">
      <h3 style="margin-bottom:16px;color:#2D3E50;">Adicionar Produto/Serviço</h3>
      <label>Buscar produto/serviço:</label><br>
      <input id="busca-produto-ed" type="text" placeholder="Digite o nome…" style="width:100%;padding:8px;margin:4px 0 0;border:1px solid #ccc;border-radius:4px;" oninput="buscarProdutosEdicao(this.value)">
      <div id="resultados-produto-ed" style="border:1px solid #ccc;border-top:none;max-height:160px;overflow-y:auto;display:none;border-radius:0 0 4px 4px;"></div>
      <input type="hidden" id="produto-ed-id">
      <input type="hidden" id="produto-ed-nome">
      <div style="margin:12px 0 0;">
        <label>Quantidade:</label><br>
        <input id="item-ed-qtd" type="number" value="1" min="0.01" step="0.01" style="width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:4px;">
      </div>
      <div style="margin:12px 0 0;">
        <label>Valor Unitário (R$):</label><br>
        <input id="item-ed-valor" type="number" step="0.01" style="width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:4px;">
      </div>
      <div style="display:flex;gap:12px;margin-top:16px;">
        <button onclick="confirmarAdicionarItemEdicao()" style="flex:1;padding:10px;background:#2D3E50;color:#fff;border:none;border-radius:6px;cursor:pointer;">Adicionar</button>
        <button onclick="document.getElementById('modalItemEdicao').remove()" style="flex:1;padding:10px;background:#ccc;border:none;border-radius:6px;cursor:pointer;">Cancelar</button>
      </div>
    </div>`;
}

async function buscarProdutosEdicao(q) {
  const div = document.getElementById('resultados-produto-ed');
  if (!q || q.length < 2) { div.style.display = 'none'; return; }
  try {
    const r = await api.get(`/catalogo?nome=${encodeURIComponent(q)}`);
    const lista = await r.json();
    div.innerHTML = '';
    if (!lista.length) { div.style.display = 'none'; return; }
    div.style.display = 'block';
    lista.forEach(p => {
      const d = document.createElement('div');
      d.style.cssText = 'padding:8px;cursor:pointer;border-bottom:1px solid #eee;';
      d.textContent = `${p.nome} — R$ ${Number(p.preco_padrao).toFixed(2)}`;
      d.onmouseover = () => d.style.background = '#f0f0f0';
      d.onmouseout  = () => d.style.background = '';
      d.onclick = () => {
        document.getElementById('busca-produto-ed').value = p.nome;
        document.getElementById('produto-ed-id').value = p.id;
        document.getElementById('produto-ed-nome').value = p.nome;
        document.getElementById('item-ed-valor').value = Number(p.preco_padrao).toFixed(2);
        div.style.display = 'none';
      };
      div.appendChild(d);
    });
  } catch(err) { console.error(err); }
}

function confirmarAdicionarItemEdicao() {
  const id   = document.getElementById('produto-ed-id').value;
  const nome = document.getElementById('produto-ed-nome').value || document.getElementById('busca-produto-ed').value;
  const qtd  = parseFloat(document.getElementById('item-ed-qtd').value) || 1;
  const val  = parseFloat(document.getElementById('item-ed-valor').value) || 0;
  if (!nome) { alert('Selecione um produto/serviço.'); return; }
  itensEdicaoOS.push({ catalogo_id: id || null, nome, quantidade: qtd, valor_unitario: val, subtotal: qtd * val });
  renderItensEdicao();
  document.getElementById('modalItemEdicao').remove();
}

async function abrirModalEdicaoOS(id) {
  try {
    const r = await api.get(`/ordens-servico/${id}`);
    const os = await r.json();
    if (os.erro) { alert('OS não encontrada.'); return; }

    parcelasConversaoOS = [];
    itensEdicaoOS = (os.itens || []).map(it => ({
      catalogo_id: it.catalogo_id,
      nome: it.nome,
      quantidade: Number(it.quantidade),
      valor_unitario: Number(it.valor_unitario),
      subtotal: Number(it.subtotal),
    }));

    let modal = document.getElementById('modalEdicaoOS');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'modalEdicaoOS';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
    document.body.appendChild(modal);

    const dtE = os.os_dt_entrada ? String(os.os_dt_entrada).split('T')[0] : '';
    const dtS = os.os_dt_saida  ? String(os.os_dt_saida).split('T')[0]  : '';
    const sel = (val, cur) => val === cur ? 'selected' : '';

    const veiculoInfo = [os.marca, os.modelo, os.ano ? String(os.ano) : '', os.cor].filter(Boolean).join(' ');

    modal.innerHTML = `
      <div style="background:#fff;padding:30px;border-radius:8px;width:95%;max-width:750px;max-height:90vh;overflow-y:auto;">
        <h2 style="margin-bottom:20px;color:#2D3E50;">Editar OS Nº ${os.os_id}</h2>
        <form id="formEdicaoOS">
          <div style="display:flex;flex-wrap:wrap;gap:12px;">
            <div style="flex:3;min-width:200px;"><label>Cliente</label><br>
              <input value="${(os.cliente_nome||'—').replace(/"/g,'&quot;')}" readonly style="width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:4px;background:#f4f4f4;color:#555;"></div>
            ${veiculoInfo ? `<div style="flex:2;min-width:180px;"><label>Dados do Veículo</label><br>
              <input value="${veiculoInfo.replace(/"/g,'&quot;')}" readonly style="width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:4px;background:#f4f4f4;color:#555;"></div>` : ''}
            <div style="flex:2;min-width:200px;"><label>Veículo (texto)</label><br>
              <input id="os_veiculo" value="${(os.veiculo||'').replace(/"/g,'&quot;')}" required style="width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:4px;"></div>
            <div style="flex:1;min-width:130px;"><label>Placa</label><br>
              <input id="os_placa" value="${(os.placa||'').replace(/"/g,'&quot;')}" style="width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:4px;"></div>
            <div style="flex:1;min-width:150px;"><label>Data Entrada</label><br>
              <input id="os_dt_e" type="date" value="${dtE}" required style="width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:4px;"></div>
            <div style="flex:1;min-width:150px;"><label>Data Saída</label><br>
              <input id="os_dt_s" type="date" value="${dtS}" style="width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:4px;"></div>
            <div style="flex:1;min-width:130px;"><label>Hora Entrada</label><br>
              <input id="os_hr_e" type="time" value="${os.os_hr_entrada||''}" required style="width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:4px;"></div>
            <div style="flex:1;min-width:130px;"><label>Hora Saída</label><br>
              <input id="os_hr_s" type="time" value="${os.os_hr_saida||''}" style="width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:4px;"></div>
            <div style="flex:1;min-width:180px;"><label>Tipo</label><br>
              <select id="os_tipo" data-original-tipo="${os.tipo}" onchange="onTipoChangeEdicao(this.value)" style="width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:4px;">
                <option value="orcamento" ${sel('orcamento',os.tipo)}>Orçamento</option>
                <option value="ordem_servico" ${sel('ordem_servico',os.tipo)}>Ordem de Serviço</option>
              </select></div>
            <div style="flex:1;min-width:180px;"><label>Status</label><br>
              <select id="os_status" style="width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:4px;">
                <option value="aberta" ${sel('aberta',os.status)}>Aberta</option>
                <option value="em_andamento" ${sel('em_andamento',os.status)}>Em Andamento</option>
                <option value="concluida" ${sel('concluida',os.status)}>Concluída</option>
                <option value="cancelada" ${sel('cancelada',os.status)}>Cancelada</option>
              </select></div>
            <div style="width:100%;"><label>Observações</label><br>
              <textarea id="os_obs" style="width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:4px;height:70px;">${os.observacoes||''}</textarea></div>
          </div>

          <div style="margin-top:20px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <strong style="color:#2D3E50;">Itens da OS</strong>
              <button type="button" onclick="abrirModalAdicionarItemEdicao()" style="padding:6px 14px;background:#27ae60;color:#fff;border:none;border-radius:4px;cursor:pointer;">+ Adicionar Item</button>
            </div>
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="background:#f4f4f8;">
                  <th style="padding:8px;border:1px solid #ddd;text-align:left;">Produto/Serviço</th>
                  <th style="padding:8px;border:1px solid #ddd;text-align:right;">Qtd</th>
                  <th style="padding:8px;border:1px solid #ddd;text-align:right;">Valor Unit.</th>
                  <th style="padding:8px;border:1px solid #ddd;text-align:right;">Subtotal</th>
                  <th style="padding:8px;border:1px solid #ddd;text-align:center;">×</th>
                </tr>
              </thead>
              <tbody id="itens-edicao-tbody"></tbody>
            </table>
          </div>

          ${os.tipo === 'ordem_servico' ? `
          <div id="sec-parcelas-edicao" style="margin-top:20px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <strong style="color:#2D3E50;">💳 Parcelas a Receber</strong>
              <button type="button" onclick="abrirModalNovaParcelaOS(${os.os_id})" style="padding:6px 14px;background:#2980b9;color:#fff;border:none;border-radius:4px;cursor:pointer;">+ Nova Parcela</button>
            </div>
            <div id="parcelas-os-lista">Carregando…</div>
          </div>` : ''}

          <div id="sec-parcelamento-conversao" style="display:none;margin-top:20px;border:1px solid #ccc;border-radius:6px;padding:16px;background:#fafafa;">
            <strong style="color:#2D3E50;">Parcelamento</strong>
            <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end;margin-top:8px;">
              <div>
                <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:4px;">Nº de Parcelas</label>
                <input type="number" id="conv-parc-qtd" min="1" max="36" value="1" style="width:90px;padding:8px;border:1px solid #ccc;border-radius:4px;">
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:4px;">Primeiro Vencimento</label>
                <input type="date" id="conv-parc-venc1" style="padding:8px;border:1px solid #ccc;border-radius:4px;">
              </div>
              <button type="button" onclick="gerarParcelasConversao()" style="padding:9px 18px;background:#2D3E50;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;">Gerar</button>
            </div>
            <div id="conv-parcelas-preview" style="margin-top:12px;"></div>
          </div>

          <div style="display:flex;gap:12px;margin-top:20px;">
            <button type="submit" style="flex:1;padding:10px;background:#2D3E50;color:#fff;border:none;border-radius:6px;cursor:pointer;">Salvar</button>
            <button type="button" onclick="document.getElementById('modalEdicaoOS').remove()" style="flex:1;padding:10px;background:#ccc;border:none;border-radius:6px;cursor:pointer;">Cancelar</button>
          </div>
        </form>
      </div>`;

    renderItensEdicao();

    // Carrega parcelas vinculadas à OS (se for ordem_servico)
    if (os.tipo === 'ordem_servico') {
      carregarParcelasNoModal(id);
    }

    document.getElementById('formEdicaoOS').onsubmit = async e => {
      e.preventDefault();
      const dados = {
        cliente_id:    os.cliente_id,
        veiculo_id:    os.veiculo_id,
        veiculo:       document.getElementById('os_veiculo').value,
        placa:         document.getElementById('os_placa').value,
        os_dt_entrada: document.getElementById('os_dt_e').value,
        os_dt_saida:   document.getElementById('os_dt_s').value || null,
        os_hr_entrada: document.getElementById('os_hr_e').value,
        os_hr_saida:   document.getElementById('os_hr_s').value || null,
        tipo:          document.getElementById('os_tipo').value,
        status:        document.getElementById('os_status').value,
        observacoes:   document.getElementById('os_obs').value,
        itens:         itensEdicaoOS,
        parcelas:      parcelasConversaoOS,
      };
      try {
        const resp = await api.put(`/ordens-servico/${id}`, dados);
        if (resp.ok) {
          alert('OS atualizada!');
          parcelasConversaoOS = [];
          document.getElementById('modalEdicaoOS').remove();
          await carregarOS();
        } else {
          const er = await resp.json();
          alert(er.erro || 'Erro ao salvar');
        }
      } catch(err) { alert('Erro ao salvar: ' + err.message); }
    };
  } catch(err) { alert('Erro ao abrir OS: ' + err.message); }
}

function imprimirOS(id) {
  window.open(`imprimirOS.html?id=${id}`, '_blank');
}

async function carregarParcelasNoModal(osId) {
  const div = document.getElementById('parcelas-os-lista');
  if (!div) return;
  try {
    const r = await api.get(`/financeiro/receber?os_id=${osId}`);
    const lista = await r.json();
    if (!lista.length) { div.innerHTML = '<p style="color:#999;font-size:13px;">Nenhuma parcela cadastrada.</p>'; return; }

    const statusCor = { pendente:'#fff3cd;color:#856404', pago:'#d4edda;color:#155724', cancelado:'#e2e3e5;color:#383d41' };
    const statusLabel = { pendente:'Pendente', pago:'Pago', cancelado:'Cancelado' };

    const hoje = new Date().toISOString().split('T')[0];

    let html = `<table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead><tr style="background:#f4f4f8;">
        <th style="padding:7px 9px;border:1px solid #ddd;text-align:left;">Descrição</th>
        <th style="padding:7px 9px;border:1px solid #ddd;">Vencimento</th>
        <th style="padding:7px 9px;border:1px solid #ddd;text-align:right;">Valor</th>
        <th style="padding:7px 9px;border:1px solid #ddd;">Status</th>
        <th style="padding:7px 9px;border:1px solid #ddd;"></th>
      </tr></thead><tbody>`;

    lista.forEach(p => {
      const venc = p.vencimento ? String(p.vencimento).split('T')[0] : '';
      const [y,m,d] = venc.split('-');
      const vencLabel = venc ? `${d}/${m}/${y}` : '—';
      const atrasado = p.status === 'pendente' && venc < hoje;
      const cor = atrasado ? 'background:#f8d7da;color:#721c24' : (statusCor[p.status] || '');
      html += `<tr>
        <td style="padding:7px 9px;border:1px solid #ddd;">${p.descricao}</td>
        <td style="padding:7px 9px;border:1px solid #ddd;text-align:center;${atrasado?'color:#c0392b;font-weight:600;':''}">${vencLabel}</td>
        <td style="padding:7px 9px;border:1px solid #ddd;text-align:right;">R$ ${Number(p.valor).toFixed(2)}</td>
        <td style="padding:7px 9px;border:1px solid #ddd;text-align:center;">
          <span style="padding:2px 8px;border-radius:10px;font-size:12px;font-weight:600;background:${cor.split(';')[0].replace('background:','')};${cor.split(';')[1]||''}">${atrasado ? 'Atrasado' : (statusLabel[p.status]||p.status)}</span>
        </td>
        <td style="padding:7px 9px;border:1px solid #ddd;text-align:center;">
          ${p.status === 'pendente' ? `<button onclick="receberParcela(${p.id},${osId})" style="padding:3px 8px;background:#27ae60;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;">Receber</button>` : ''}
          <button onclick="excluirParcelaOS(${p.id},${osId})" style="padding:3px 8px;background:#c0392b;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;margin-left:4px;">×</button>
        </td>
      </tr>`;
    });
    html += '</tbody></table>';
    div.innerHTML = html;
  } catch(err) { div.innerHTML = '<p style="color:#c0392b;">Erro ao carregar parcelas.</p>'; }
}

async function receberParcela(parcelaId, osId) {
  const hoje = new Date().toISOString().split('T')[0];
  const data = prompt('Data do recebimento (YYYY-MM-DD):', hoje);
  if (!data) return;
  const r = await api.put(`/financeiro/receber/${parcelaId}`, { status: 'pago', data_pagamento: data });
  if (!r) return;
  if (r.ok) carregarParcelasNoModal(osId);
  else { const e = await r.json(); alert(e.erro || 'Erro ao registrar recebimento'); }
}

async function excluirParcelaOS(parcelaId, osId) {
  if (!confirm('Excluir esta parcela?')) return;
  const r = await api.delete(`/financeiro/receber/${parcelaId}`);
  if (!r) return;
  if (r.ok) carregarParcelasNoModal(osId);
  else { const e = await r.json(); alert(e.erro || 'Erro ao excluir parcela'); }
}

function abrirModalNovaParcelaOS(osId) {
  let modal = document.getElementById('modalNovaParcelaOS');
  if (modal) modal.remove();
  modal = document.createElement('div');
  modal.id = 'modalNovaParcelaOS';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:10001;display:flex;align-items:center;justify-content:center;';
  document.body.appendChild(modal);
  const hoje = new Date().toISOString().split('T')[0];
  modal.innerHTML = `
    <div style="background:#fff;padding:28px;border-radius:8px;width:90%;max-width:420px;">
      <h3 style="margin-bottom:16px;color:#2D3E50;">Nova Parcela</h3>
      <label style="font-size:13px;font-weight:600;">Descrição</label><br>
      <input id="np-desc" type="text" style="width:100%;padding:8px;margin:4px 0 10px;border:1px solid #ccc;border-radius:4px;">
      <label style="font-size:13px;font-weight:600;">Valor (R$)</label><br>
      <input id="np-valor" type="number" step="0.01" style="width:100%;padding:8px;margin:4px 0 10px;border:1px solid #ccc;border-radius:4px;">
      <label style="font-size:13px;font-weight:600;">Vencimento</label><br>
      <input id="np-venc" type="date" value="${hoje}" style="width:100%;padding:8px;margin:4px 0 10px;border:1px solid #ccc;border-radius:4px;">
      <div style="display:flex;gap:12px;margin-top:8px;">
        <button onclick="salvarNovaParcelaOS(${osId})" style="flex:1;padding:10px;background:#2D3E50;color:#fff;border:none;border-radius:6px;cursor:pointer;">Salvar</button>
        <button onclick="document.getElementById('modalNovaParcelaOS').remove()" style="flex:1;padding:10px;background:#ccc;border:none;border-radius:6px;cursor:pointer;">Cancelar</button>
      </div>
    </div>`;
}

function onTipoChangeEdicao(val) {
  const originalTipo = document.getElementById('os_tipo').dataset.originalTipo;
  const sec = document.getElementById('sec-parcelamento-conversao');
  if (!sec) return;
  if (val === 'ordem_servico' && originalTipo === 'orcamento') {
    sec.style.display = 'block';
  } else {
    sec.style.display = 'none';
    parcelasConversaoOS = [];
    const preview = document.getElementById('conv-parcelas-preview');
    if (preview) preview.innerHTML = '';
  }
}

function gerarParcelasConversao() {
  const qtd   = Math.max(1, parseInt(document.getElementById('conv-parc-qtd').value) || 1);
  const venc1 = document.getElementById('conv-parc-venc1').value;
  if (!venc1) { alert('Informe a data do primeiro vencimento.'); return; }

  const total = itensEdicaoOS.reduce((acc, it) => acc + Number(it.quantidade) * Number(it.valor_unitario), 0);
  if (total <= 0) { alert('Adicione itens com valor antes de gerar parcelas.'); return; }

  const valorBase = parseFloat((total / qtd).toFixed(2));
  parcelasConversaoOS = [];

  const [ano, mes, dia] = venc1.split('-').map(Number);
  for (let i = 0; i < qtd; i++) {
    const d = new Date(ano, mes - 1 + i, dia);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const valor = i === qtd - 1
      ? parseFloat((total - valorBase * (qtd - 1)).toFixed(2))
      : valorBase;
    parcelasConversaoOS.push({ descricao: `Parcela ${i+1}/${qtd}`, valor, vencimento: dateStr });
  }

  const div = document.getElementById('conv-parcelas-preview');
  div.innerHTML = '';
  const table = document.createElement('table');
  table.style.cssText = 'width:100%;border-collapse:collapse;font-size:13px;margin-top:4px;';
  table.innerHTML = `<thead><tr style="background:#e8ecf0;">
    <th style="padding:7px 10px;border:1px solid #ddd;text-align:left;">Parcela</th>
    <th style="padding:7px 10px;border:1px solid #ddd;">Vencimento</th>
    <th style="padding:7px 10px;border:1px solid #ddd;text-align:right;">Valor</th>
  </tr></thead><tbody></tbody>`;
  const tbody = table.querySelector('tbody');
  parcelasConversaoOS.forEach((p, i) => {
    const [y, m, d2] = p.vencimento.split('-');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="padding:7px 10px;border:1px solid #ddd;">${i+1}/${qtd}</td>
      <td style="padding:7px 10px;border:1px solid #ddd;text-align:center;">${d2}/${m}/${y}</td>
      <td style="padding:7px 10px;border:1px solid #ddd;text-align:right;">R$ ${p.valor.toFixed(2)}</td>`;
    tbody.appendChild(tr);
  });
  div.appendChild(table);
}

async function salvarNovaParcelaOS(osId) {
  const desc  = document.getElementById('np-desc').value.trim();
  const valor = parseFloat(document.getElementById('np-valor').value);
  const venc  = document.getElementById('np-venc').value;
  if (!desc || !valor || !venc) { alert('Preencha todos os campos.'); return; }
  const r = await api.post('/financeiro/receber', { os_id: osId, descricao: desc, valor, vencimento: venc });
  if (!r) return;
  if (r.ok) {
    document.getElementById('modalNovaParcelaOS').remove();
    carregarParcelasNoModal(osId);
  } else { const e = await r.json(); alert(e.erro || 'Erro ao salvar parcela'); }
}
