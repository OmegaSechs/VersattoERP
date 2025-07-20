document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formProduto");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        // Mapeamento do tipo
        const tipoSelecionado = document.getElementById("tipo").value;
        let tipoInt = 0;
        if (tipoSelecionado === "servico") tipoInt = 1;
        else if (tipoSelecionado === "produto") tipoInt = 2;
        else if (tipoSelecionado === "material") tipoInt = 3;

        const produtoData = {
            nome: document.getElementById("nome").value,
            tipo: tipoInt,
            preco_custo: parseFloat(document.getElementById("preco_custo").value),
            preco_padrao: parseFloat(document.getElementById("preco_padrao").value),
            quantidade_minima: parseInt(document.getElementById("estoque_minimo").value),
            quantidade_maxima: parseInt(document.getElementById("estoque_maximo").value),
            descricao: document.getElementById("descricao_produto").value
        };

    console.log("Dados que serão enviados para a API:", produtoData); // Habilitar para depuração

        try {
            const response = await fetch('http://localhost:3000/catalogo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(produtoData)
            });

            if (response.ok) {
                alert("Produto cadastrado com sucesso!");
                form.reset();
                window.location.href = 'listaProdutos.html';
            } else {
                const errorData = await response.json();
                alert(`Erro ao cadastrar produto: ${errorData.message}`);
            }
        } catch (error) {
            console.error("Erro ao enviar dados:", error);
            alert("Erro ao cadastrar produto. Tente novamente mais tarde.");
        }
    });
});