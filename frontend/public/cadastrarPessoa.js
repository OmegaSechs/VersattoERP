document.addEventListener("DOMContentLoaded", () => {

    const form = document.querySelector("form");

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const is_cliente = document.getElementById("cliente").checked;
        const is_fornecedor = document.getElementById("fornecedor").checked;
        const is_pessoaFisica = document.getElementById("pessoaFisica").checked;
        const is_essoaJuridica = document.getElementById("pessoaJuridica").checked;

        const pessoaData = {
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
            is_cliente: is_cliente,
            is_fornecedor: is_fornecedor,
            is_pessoaFisica: is_pessoaFisica,
            is_pessoaJuridica: is_pessoaJuridica,
        };

//        console.log("Dados que serão enviados para a API:", pessoaData); -- Habilitar para depuração

        try {
            const response = await fetch('http://localhost:3000/pessoas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pessoaData)
            });

            if (response.ok) {
                alert("Pessoa cadastrada com sucesso!");
                form.reset();
                window.location.href = 'listaPessoas.html'; 
            } else {
                const errorData = await response.json();
                alert(`Erro ao cadastrar pessoa: ${errorData.message}`);
            }
        } catch (error) {
            console.error("Erro ao enviar dados:", error);
            alert("Erro ao cadastrar pessoa. Tente novamente mais tarde.");
        }
    });
});




document.addEventListener("DOMContentLoaded", function () {
    const labelCpfCnpj = document.getElementById("labelCpfCnpj");
    const inputCpfCnpj = document.getElementById("cpfCnpj");
    const pessoaFisica = document.getElementById("pessoaFisica");
    const pessoaJuridica = document.getElementById("pessoaJuridica");
    const camposPJ = document.getElementById("camposPJ");
    const inputCep = document.getElementById("cep");

    // Atualiza CPF/CNPJ e campos PJ conforme checkbox
    function atualizarCampo() {
        if (pessoaFisica.checked && !pessoaJuridica.checked) {
            labelCpfCnpj.textContent = "CPF";
            inputCpfCnpj.placeholder = "Digite o CPF";
            inputCpfCnpj.maxLength = 14;
            camposPJ.style.display = "none";
        } else if (pessoaJuridica.checked && !pessoaFisica.checked) {
            labelCpfCnpj.textContent = "CNPJ";
            inputCpfCnpj.placeholder = "Digite o CNPJ";
            inputCpfCnpj.maxLength = 18;
            camposPJ.style.display = "flex";
        } else {
            labelCpfCnpj.textContent = "CPF/CNPJ";
            inputCpfCnpj.placeholder = "Digite o CPF ou CNPJ";
            inputCpfCnpj.maxLength = 18;
            camposPJ.style.display = "none";
        }
    }

    pessoaFisica.addEventListener("change", function() {
        if (pessoaFisica.checked) {
            pessoaJuridica.checked = false;
        }
        atualizarCampo();
    });
    pessoaJuridica.addEventListener("change", function() {
        if (pessoaJuridica.checked) {
            pessoaFisica.checked = false;
        }
        atualizarCampo();
    });
    atualizarCampo();

    // Busca endereço pelo CEP
    if (inputCep) {
        inputCep.addEventListener("blur", function () {
            const cep = this.value.replace(/\D/g, '');
            if (cep.length === 8) {
                fetch(`https://viacep.com.br/ws/${cep}/json/`)
                    .then(response => response.json())
                    .then(data => {
                        if (!data.erro) {
                            document.getElementById('rua').value = data.logradouro || '';
                            document.getElementById('bairro').value = data.bairro || '';
                            document.getElementById('cidade').value = data.localidade || '';
                            document.getElementById('estado').value = data.uf || '';
                        } else {
                            alert('CEP não encontrado.');
                        }
                    })
                    .catch(error => {
                        alert('Erro ao buscar o CEP.');
                        console.error(error);
                    });
            } else {
                alert('CEP inválido.');
            }
        });
    }

    // Função para validar CPF
    function validarCPF(cpf) {
        cpf = cpf.replace(/\D/g, '');
        if (cpf.length !== 11 || /^(\u0000{11}|(\d)\1{10})$/.test(cpf)) return false;
        let soma = 0, resto;
        for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.substring(9, 10))) return false;
        soma = 0;
        for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.substring(10, 11))) return false;
        return true;
    }

    // Função para validar CNPJ
    function validarCNPJ(cnpj) {
        cnpj = cnpj.replace(/\D/g, '');
        if (cnpj.length !== 14) return false;
        if (/^(\d)\1+$/.test(cnpj)) return false;
        let tamanho = cnpj.length - 2;
        let numeros = cnpj.substring(0, tamanho);
        let digitos = cnpj.substring(tamanho);
        let soma = 0;
        let pos = tamanho - 7;
        for (let i = tamanho; i >= 1; i--) {
            soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
            if (pos < 2) pos = 9;
        }
        let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado !== parseInt(digitos.charAt(0))) return false;
        tamanho = tamanho + 1;
        numeros = cnpj.substring(0, tamanho);
        soma = 0;
        pos = tamanho - 7;
        for (let i = tamanho; i >= 1; i--) {
            soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
            if (pos < 2) pos = 9;
        }
        resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado !== parseInt(digitos.charAt(1))) return false;
        return true;
    }

    // Validação ao sair do campo CPF/CNPJ
    inputCpfCnpj.addEventListener('blur', function() {
        const valor = inputCpfCnpj.value.replace(/\D/g, '');
        inputCpfCnpj.classList.remove('input-error');
        let erro = false;
        let mensagem = '';
        if (pessoaFisica.checked && valor.length > 0) {
            if (!validarCPF(valor)) {
                erro = true;
                mensagem = 'CPF inválido!\nCertifique-se de que o campo está preenchido corretamente e que o tipo selecionado é Pessoa Física.';
            }
        } else if (pessoaJuridica.checked && valor.length > 0) {
            if (!validarCNPJ(valor)) {
                erro = true;
                mensagem = 'CNPJ inválido!\nCertifique-se de que o campo está preenchido corretamente e que o tipo selecionado é Pessoa Jurídica.';
            }
        } else if ((pessoaFisica.checked || pessoaJuridica.checked) && valor.length > 0) {
            erro = true;
            mensagem = 'O valor informado não corresponde ao tipo selecionado.\nVerifique se está preenchendo um CPF para Pessoa Física ou um CNPJ para Pessoa Jurídica.';
        }
        if (erro) {
            inputCpfCnpj.classList.add('input-error');
            alert(mensagem);
        }
    });

    // Máscara automática para CPF e CNPJ
    inputCpfCnpj.addEventListener('input', function() {
        let valor = inputCpfCnpj.value.replace(/\D/g, '');
        if (pessoaFisica.checked) {
            // Máscara CPF: 000.000.000-00
            valor = valor.slice(0, 11);
            valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
            valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
            valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else if (pessoaJuridica.checked) {
            // Máscara CNPJ: 00.000.000/0000-00
            valor = valor.slice(0, 14);
            valor = valor.replace(/(\d{2})(\d)/, '$1.$2');
            valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
            valor = valor.replace(/(\d{3})(\d)/, '$1/$2');
            valor = valor.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
        }
        inputCpfCnpj.value = valor;
    });
});
