document.addEventListener("DOMContentLoaded", async () => {
    document.querySelector("#searchTable thead").innerHTML = `                    
    <tr>
        <th>ID</th>
        <th>Nome</th>
        <th>Quantidade Mínima</th>
        <th>Quantidade Máxima</th>
        <th>Estoque Disponível</th>
        <th>Custo</th>
        <th>Venda</th>
    </tr>
`;
    
    
    const tabela = document.querySelector("#searchTable tbody");
    tabela.innerHTML = ""; // Limpa a tabela antes de popular

    try {
        const response = await fetch('http://localhost:3000/catalogo');
        const produtos = await response.json();

        produtos.forEach(produto => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${produto.id}</td>
                <td>${produto.nome}</td>
                <td>${produto.quantidade_minima}</td>
                <td>${produto.quantidade_maxima}</td>
                <td>${produto.quantidade_estoque}</td>
                <td>${Number(produto.preco_custo).toFixed(2)}</td>
                <td>${Number(produto.preco_padrao).toFixed(2)}</td>
            `;
            tabela.appendChild(tr);
        });
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        tabela.innerHTML = "<tr><td colspan='7'>Erro ao carregar dados</td></tr>";
    }
});