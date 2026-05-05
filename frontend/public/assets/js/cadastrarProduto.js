document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("formProduto").addEventListener("submit", async e => {
    e.preventDefault();
    const tipo = document.getElementById("tipo").value;
    const tipoMap = { servico:1, produto:2, material:3 };
    const dados = {
      nome: document.getElementById("nome").value,
      tipo: tipoMap[tipo] || 0,
      preco_custo:  parseFloat(document.getElementById("preco_custo").value)||0,
      preco_padrao: parseFloat(document.getElementById("preco_padrao").value)||0,
      quantidade_minima: parseInt(document.getElementById("estoque_minimo").value)||0,
      quantidade_maxima: parseInt(document.getElementById("estoque_maximo").value)||0,
      descricao: document.getElementById("descricao_produto").value,
    };
    try {
      const r = await api.post('/catalogo', dados);
      if (r.ok) { alert("Produto cadastrado!"); document.getElementById("formProduto").reset(); window.location.href = 'listaProdutos.html'; }
      else { const er = await r.json(); alert(`Erro: ${er.erro||er.message}`); }
    } catch { alert("Erro de conexão."); }
  });
});
