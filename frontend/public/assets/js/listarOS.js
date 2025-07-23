document.addEventListener("DOMContentLoaded", async () => {
    // Adiciona o cabeçalho da tabela
    document.querySelector("#searchTable thead").innerHTML = `
      <tr>
        <th>Cliente</th>
        <th>Veículo</th>
        <th>Placa</th>
        <th>Data Entrada</th>
        <th>Hora Entrada</th>
      </tr>
    `;

    const tabela = document.querySelector("#searchTable tbody");
    tabela.innerHTML = ""; // Limpa a tabela antes de popular

    try {
        const response = await fetch('http://localhost:3000/ordens-servico');
        const ordens = await response.json();

        ordens.forEach(os => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${os.cliente_id || ''}</td>
                <td>${os.veiculo || ''}</td>
                <td>${os.placa || ''}</td>
                <td>${os.os_dt_entrada ? new Date(os.os_dt_entrada).toLocaleDateString('pt-BR') : ''}</td>
                <td>${os.os_hr_entrada || ''}</td>
            `;
            tabela.appendChild(tr);
        });
    } catch (error) {
        console.error("Erro ao buscar ordens de serviço:", error);
        tabela.innerHTML = "<tr><td colspan='5'>Erro ao carregar dados</td></tr>";
    }
});