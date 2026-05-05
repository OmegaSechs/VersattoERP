document.addEventListener("DOMContentLoaded", async () => {
  document.querySelector("#searchTable thead").innerHTML = `
    <tr>
      <th>ID</th><th>Nome</th><th>E-mail</th><th>Celular</th>
      <th>Endereço</th><th>Cadastro</th><th>Ações</th>
    </tr>`;
  await carregarPessoas();
});

async function carregarPessoas() {
  const tbody = document.querySelector("#searchTable tbody");
  tbody.innerHTML = '<tr><td colspan="7">Carregando…</td></tr>';
  try {
    const r = await api.get('/pessoas');
    const lista = await r.json();
    tbody.innerHTML = '';
    if (!lista.length) { tbody.innerHTML = '<tr><td colspan="7">Nenhuma pessoa cadastrada</td></tr>'; return; }
    lista.forEach(p => {
      const nomeSafe = (p.nome||'').replace(/'/g,"\\'");
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.pessoa_id}</td><td>${p.nome||''}</td><td>${p.email||''}</td>
        <td>${p.celular||''}</td>
        <td>${[p.rua,p.numero,p.bairro].filter(Boolean).join(', ')}</td>
        <td>${p.criado_em?new Date(p.criado_em).toLocaleDateString('pt-BR'):''}</td>
        <td>
          <button class="btn-editar" onclick="abrirModalEdicao(${p.pessoa_id})">Editar</button>
          <button class="btn-excluir" onclick="excluirPessoa(${p.pessoa_id},'${nomeSafe}')">Excluir</button>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch { tbody.innerHTML = '<tr><td colspan="7">Erro ao carregar dados</td></tr>'; }
}

async function excluirPessoa(id, nome) {
  if (!confirm(`Excluir "${nome}"?`)) return;
  const r = await api.delete(`/pessoas/${id}`);
  if (r.ok) { alert('Excluído com sucesso!'); await carregarPessoas(); }
  else { const e = await r.json(); alert(e.erro||'Erro ao excluir'); }
}

async function abrirModalEdicao(id) {
  try {
    const r = await api.get(`/pessoas?pessoa_id=${id}`);
    if (!r) { alert('Sessão expirada. Faça login novamente.'); return; }
    const lista = await r.json();
    if (!Array.isArray(lista) || !lista.length) { alert('Pessoa não encontrada.'); return; }
    const p = lista[0];

    let modal = document.getElementById('modalEdicao');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'modalEdicao';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
    document.body.appendChild(modal);
    modal.innerHTML = `
      <div style="background:#fff;padding:30px;border-radius:8px;width:90%;max-width:700px;max-height:90vh;overflow-y:auto;">
        <h2 style="margin-bottom:20px;color:#2D3E50;">Editar Pessoa</h2>
        <form id="formEdicaoPessoa">
          <div style="display:flex;flex-wrap:wrap;gap:12px;">
            ${campo('Nome Completo','edit_nome',p.nome,2,'required')}
            ${campo('CPF/CNPJ','edit_cpf_cnpj',p.cpf_cnpj)}
            ${campo('E-mail','edit_email',p.email,1,'type="email"')}
            ${campo('Telefone','edit_telefone',p.telefone)}
            ${campo('Celular','edit_celular',p.celular)}
            ${campo('CEP','edit_cep',p.cep)}
            ${campo('Rua','edit_rua',p.rua,3)}
            ${campo('Número','edit_numero',p.numero,1)}
            ${campo('Complemento','edit_complemento',p.complemento,2)}
            ${campo('Bairro','edit_bairro',p.bairro)}
            ${campo('Cidade','edit_cidade',p.cidade)}
            ${campo('Estado (UF)','edit_estado',p.estado,1)}
            ${campo('Nome Fantasia','edit_nome_fantasia',p.nome_fantasia)}
            ${campo('Insc. Estadual','edit_inscricao_estadual',p.inscricao_estadual)}
            <div style="width:100%;display:flex;gap:16px;margin-top:8px;">
              <label><input type="checkbox" id="edit_is_cliente" ${p.is_cliente?'checked':''}> Cliente</label>
              <label><input type="checkbox" id="edit_is_fornecedor" ${p.is_fornecedor?'checked':''}> Fornecedor</label>
              <label><input type="checkbox" id="edit_is_pf" ${p.is_pessoa_fisica?'checked':''}> PF</label>
              <label><input type="checkbox" id="edit_is_pj" ${p.is_pessoa_juridica?'checked':''}> PJ</label>
            </div>
          </div>
          <div style="display:flex;gap:12px;margin-top:20px;">
            <button type="submit" style="flex:1;padding:10px;background:#2D3E50;color:#fff;border:none;border-radius:6px;cursor:pointer;">Salvar</button>
            <button type="button" onclick="document.getElementById('modalEdicao').remove()" style="flex:1;padding:10px;background:#ccc;border:none;border-radius:6px;cursor:pointer;">Cancelar</button>
          </div>
        </form>
      </div>`;

    document.getElementById('formEdicaoPessoa').onsubmit = async e => {
      e.preventDefault();
      try {
        const dados = {
          nome: v('edit_nome'), cpf_cnpj: v('edit_cpf_cnpj'), email: v('edit_email'),
          telefone: v('edit_telefone'), celular: v('edit_celular'), cep: v('edit_cep'),
          rua: v('edit_rua'), numero: v('edit_numero'), bairro: v('edit_bairro'),
          complemento: v('edit_complemento'), cidade: v('edit_cidade'), estado: v('edit_estado'),
          nome_fantasia: v('edit_nome_fantasia'), inscricao_estadual: v('edit_inscricao_estadual'),
          is_cliente: cb('edit_is_cliente'), is_fornecedor: cb('edit_is_fornecedor'),
          is_pessoa_fisica: cb('edit_is_pf'), is_pessoa_juridica: cb('edit_is_pj'),
        };
        const resp = await api.put(`/pessoas/${id}`, dados);
        if (!resp) { alert('Sessão expirada. Faça login novamente.'); return; }
        if (resp.ok) {
          document.getElementById('modalEdicao').remove();
          await carregarPessoas();
        } else {
          const er = await resp.json();
          alert(er.erro || 'Erro ao salvar.');
        }
      } catch (err) {
        alert('Erro ao salvar: ' + err.message);
      }
    };
  } catch (err) {
    alert('Erro ao abrir edição: ' + err.message);
  }
}

function campo(label, id, val, flex=1, extra='') {
  const s = (val != null && val !== '') ? String(val) : '';
  return `<div style="flex:${flex};min-width:150px;"><label>${label}</label><br>
    <input id="${id}" type="text" value="${s.replace(/"/g,'&quot;')}" ${extra} style="width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:4px;"></div>`;
}
function v(id)  { return document.getElementById(id)?.value||''; }
function cb(id) { return document.getElementById(id)?.checked||false; }
