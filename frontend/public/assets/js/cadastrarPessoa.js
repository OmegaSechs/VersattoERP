document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const dados = {
      nome: document.getElementById("nomeCompleto").value,
      cpf_cnpj: document.getElementById("cpfCnpj").value,
      email: document.getElementById("email").value,
      telefone: document.getElementById("telefone").value,
      celular: document.getElementById("celular").value,
      rua: document.getElementById("rua").value,
      bairro: document.getElementById("bairro").value,
      numero: document.getElementById("numero").value,
      nome_fantasia: document.getElementById("fantasia").value,
      inscricao_estadual: document.getElementById("inscricaoEstadual").value,
      complemento: document.getElementById("complemento").value,
      cep: document.getElementById("cep").value,
      cidade: document.getElementById("cidade").value,
      estado: document.getElementById("estado").value,
      is_cliente: document.getElementById("cliente").checked,
      is_fornecedor: document.getElementById("fornecedor").checked,
      is_pessoa_fisica: document.getElementById("pessoaFisica").checked,
      is_pessoa_juridica: document.getElementById("pessoaJuridica").checked,
    };
    try {
      const r = await api.post('/pessoas', dados);
      if (r.ok) { alert("Pessoa cadastrada!"); form.reset(); window.location.href = 'listaPessoas.html'; }
      else { const er = await r.json(); alert(`Erro: ${er.erro||er.message}`); }
    } catch { alert("Erro de conexão."); }
  });

  // Lógica PF/PJ
  const labelCpf = document.getElementById("labelCpfCnpj");
  const inputCpf = document.getElementById("cpfCnpj");
  const pf = document.getElementById("pessoaFisica");
  const pj = document.getElementById("pessoaJuridica");
  const camposPJ = document.getElementById("camposPJ");

  function atualizarTipo() {
    if (pf.checked && !pj.checked) {
      labelCpf.textContent = "CPF"; inputCpf.placeholder = "Digite o CPF"; inputCpf.maxLength = 14;
      camposPJ.style.display = "none";
    } else if (pj.checked && !pf.checked) {
      labelCpf.textContent = "CNPJ"; inputCpf.placeholder = "Digite o CNPJ"; inputCpf.maxLength = 18;
      camposPJ.style.display = "flex";
    } else {
      labelCpf.textContent = "CPF/CNPJ"; camposPJ.style.display = "none";
    }
  }
  pf.addEventListener("change", () => { if(pf.checked) pj.checked=false; atualizarTipo(); });
  pj.addEventListener("change", () => { if(pj.checked) pf.checked=false; atualizarTipo(); });
  atualizarTipo();

  // CEP
  const inputCep = document.getElementById("cep");
  inputCep.addEventListener("blur", function() {
    const cep = this.value.replace(/\D/g,'');
    if (cep.length === 8) {
      fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(r => r.json()).then(d => {
          if (!d.erro) {
            document.getElementById('rua').value = d.logradouro||'';
            document.getElementById('bairro').value = d.bairro||'';
            document.getElementById('cidade').value = d.localidade||'';
            document.getElementById('estado').value = d.uf||'';
          } else alert('CEP não encontrado.');
        }).catch(() => alert('Erro ao buscar CEP.'));
    }
  });

  // Máscara CPF/CNPJ
  inputCpf.addEventListener('input', function() {
    let v = this.value.replace(/\D/g,'');
    if (pf.checked) {
      v = v.slice(0,11).replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2');
    } else if (pj.checked) {
      v = v.slice(0,14).replace(/(\d{2})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1/$2').replace(/(\d{4})(\d{1,2})$/,'$1-$2');
    }
    this.value = v;
  });
});
