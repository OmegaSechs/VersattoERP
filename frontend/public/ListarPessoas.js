document.addEventListener("DOMContentLoaded", async () => {
    // Adiciona o cabeçalho da tabela
    document.querySelector("#searchTable thead").innerHTML = `
      <tr>
        <th>ID</th>
        <th>Nome</th>
        <th>E-mail</th>
        <th>Celular</th>
        <th>Endereço</th>
        <th>Data de Cadastro</th>
      </tr>
    `;

    const tabela = document.querySelector("#searchTable tbody");
    tabela.innerHTML = ""; // Limpa a tabela antes de popular

    try {
        const response = await fetch('http://localhost:3000/pessoas');
        const pessoas = await response.json();

        pessoas.forEach(pessoa => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${pessoa.pessoa_id}</td>
                <td>${pessoa.nome}</td>
                <td>${pessoa.email || ''}</td>
                <td>${pessoa.celular || ''}</td>
                <td>${pessoa.rua || ''}, ${pessoa.numero || ''} - ${pessoa.bairro || ''}</td>
                <td>${new Date(pessoa.criado_em).toLocaleDateString('pt-BR')}</td>
            `;
            tabela.appendChild(tr);
        });
    } catch (error) {
        console.error("Erro ao buscar pessoas:", error);
        tabela.innerHTML = "<tr><td colspan='6'>Erro ao carregar dados</td></tr>";
    }
});


