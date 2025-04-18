function gerarPayloadPix({ chave, nome, cidade, valor, txid = '***' }) {
    function formatarCampo(id, valor) {
        const tamanho = valor.length.toString().padStart(2, '0');
        return `${id}${tamanho}${valor}`;
    }

    // Normalização da cidade
    const cidadeFormatada = cidade
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/[^A-Z ]/g, "")
        .substring(0, 15);

    // Campo 26 dinâmico
    const merchantAccountInfo = 
        formatarCampo('00', 'BR.GOV.BCB.PIX') +
        formatarCampo('01', chave);

    const payloadSemCRC =
        '000201' +
        formatarCampo('26', merchantAccountInfo) +
        '52040000' +
        '5303986' +
        formatarCampo('54', valor.toFixed(2)) +
        '5802BR' +
        formatarCampo('59', nome.substring(0, 25)) +
        formatarCampo('60', cidadeFormatada) +
        formatarCampo('62', formatarCampo('05', txid)) +
        '6304';

    const crc = calcularCRC(payloadSemCRC);
    return payloadSemCRC + crc;
}

function calcularCRC(payload) {
    let polinomio = 0x1021;
    let resultado = 0xFFFF;

    for (let i = 0; i < payload.length; i++) {
        resultado ^= (payload.charCodeAt(i) << 8);
        for (let j = 0; j < 8; j++) {
            if ((resultado & 0x8000) !== 0) {
                resultado = (resultado << 1) ^ polinomio;
            } else {
                resultado = (resultado << 1);
            }
        }
    }

    resultado = resultado & 0xFFFF;
    return resultado.toString(16).toUpperCase().padStart(4, '0');
}

async function carregarDadosPix() {
    try {
        const response = await fetch('/api/pix-config');
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro no servidor');
        }

        if (!data.chave || !data.nome) {
            throw new Error('Dados PIX incompletos');
        }

        return data;
    } catch (error) {
        console.error('Erro detalhado:', error);
        Swal.fire({
            icon: 'error',
            title: 'Falha no pagamento',
            html: `Erro ao carregar dados PIX:<br><small>${error.message}</small>`
        });
        throw error;
    }
}


async function mostrarModalPix(valorFinal, payloadPix) {
    const qrCodeDataUrl = await QRCode.toDataURL(payloadPix);

    Swal.fire({
        title: 'Pagamento via PIX',
        html: `
            <p style="margin-bottom: 10px;"><strong>Valor:</strong> ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorFinal)}</p>
            <p >Escaneie o QR Code abaixo para realizar o pagamento:</p>            
            <img src="${qrCodeDataUrl}" alt="QR Code PIX" style="width: 200px; margin: 10px 0;" /> 
            <p><strong>Ou copie e cole o código abaixo:</strong></p>
            <div style="display: flex; gap: 5px; align-items: center;">
                <input id="pixPayload" readonly value="${payloadPix}" style="flex: 1; font-size: 0.85em; padding: 5px;" />
                <button onclick="copiarPix()" style="padding: 5px 10px;">📋</button>
            </div>
        `,
        confirmButtonText: 'Fechar',
        width: 400
    });
}

function copiarPix() {
    const textarea = document.getElementById('pixPayload');
    if (textarea) {
        textarea.select();
        document.execCommand('copy');
        Swal.fire({
            icon: 'success',
            title: 'Código copiado!',
            text: 'Cole no app do seu banco para pagar manualmente.',
            timer: 2000,
            showConfirmButton: false
        });
    }
}



document.addEventListener('DOMContentLoaded', function() {
    const resumoPedido = document.getElementById("pedido-resumo-pedido");
   
    // Obter o pedido do localStorage (ADICIONE ESTA LINHA)
    const pedido = JSON.parse(localStorage.getItem('pedido'));

    if (!pedido) {
        Swal.fire({
            icon: 'warning',
            title: 'Pedido não encontrado!',
            text: 'Redirecionando para o cardápio...',
            willClose: () => window.location.href = 'cardapio.html'
        });
        return;
    }
    
// Na seção onde o resumo é gerado
if (resumoPedido && pedido?.produto) {
    // Adicione este console.log para verificar o elemento
    console.log('Elemento resumoPedido encontrado:', resumoPedido);

    // Verificação de segurança adicional
    if (!pedido.produto.preco || isNaN(pedido.produto.preco)) {
        console.error('Preço do produto inválido:', pedido.produto.preco);
        return;
    }

    // Adicione verificação de segurança para valores numéricos
    const precoUnitario = Number(pedido.produto.preco) || 0;
    const quantidade = Number(pedido.quantidade) || 1;
    const taxaEntrega = Number(pedido.taxaEntrega) || 0;
    

    // Garantir que acrescimos é um array
    const acrescimosArray = Array.isArray(pedido.acrescimos) ? pedido.acrescimos : [];
    // Calcule os acréscimos com verificação
    const totalAcrescimos = acrescimosArray.reduce((total, a) => total + (Number(a) || 0), 0);

    // Cálculos seguros
    const subtotal = (precoUnitario * quantidade) + totalAcrescimos;
    const totalFinal = subtotal + taxaEntrega;

    // Formatação monetária
    const formatador = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    // Geração do HTML com fallbacks
    resumoPedido.innerHTML = `
        <li><span>Produto:</span> <span>${pedido.produto.nome || 'Não especificado'} (${pedido.produto.tamanho || 'Tamanho não informado'})</span></li>
        <li><span>Quantidade:</span> <span>${quantidade}</span></li>
        <li><span>Creme:</span> <span>${pedido.creme || 'Não selecionado'}</span></li>
        <li><span>Acréscimos:</span> <span>${totalAcrescimos > 0 ? formatador.format(totalAcrescimos) : "Nenhum"}</span></li>
        <li><span>Observações:</span> <span>${pedido.observacao || "Nenhuma"}</span></li>
        <li><span>Preço Unitário:</span> <span>${formatador.format(precoUnitario)}</span></li>
        <li><span>Subtotal:</span> <span>${formatador.format(subtotal)}</span></li>
        <li><span>Taxa de Entrega:</span> <span>${formatador.format(taxaEntrega)}</span></li>
        <li class="total-line"><span>Valor Total:</span> <span>${formatador.format(totalFinal)}</span></li>
    `;

    // Adicione estilos dinâmicos
    const totalLines = resumoPedido.querySelectorAll('.total-line');
    totalLines.forEach(line => {
        line.style.backgroundColor = '#e8e9eb';
        
        line.style.borderRadius = '4px';
        line.style.fontWeight = '600';
        line.style.fontSize = '1rem';
    });
}

// ========== BUSCA DE CEP ==========
const cepInput = document.getElementById("pedido-cep");
const searchIcon = document.getElementById("cep-search-icon");

if (cepInput && searchIcon) {
    // Formatação do CEP durante a digitação
    cepInput.addEventListener("input", function(e) {
        let cep = e.target.value.replace(/\D/g, "");
        if (cep.length > 5) {
            cep = cep.substring(0, 5) + "-" + cep.substring(5);
        }
        e.target.value = cep;
        
        // Busca automática quando completo
        if (cep.length === 9) {
            buscarCEP(cep.replace("-", ""));
        }
    });

    // Busca manual pelo ícone
    searchIcon.addEventListener("click", function() {
        const cep = cepInput.value.replace("-", "");
        buscarCEP(cep);
    });

    // Validação de entrada numérica
    cepInput.addEventListener("keypress", function(e) {
        if (!/[0-9]/.test(e.key)) {
            e.preventDefault();
        }
    });
}

function buscarCEP(cep) {
    // Verificação de elementos primeiro
    const elementosEndereco = {
        logradouro: document.getElementById("pedido-logradouro"),
        bairro: document.getElementById("pedido-bairro"),
        cidade: document.getElementById("pedido-cidade"),
        uf: document.getElementById("pedido-uf")
    };

    // Validação inicial
    if (!cep || cep.length !== 8) {
        Swal.fire({
            icon: "warning",
            title: "CEP inválido!",
            text: "Por favor, insira um CEP válido (8 dígitos).",
        });
        return;
    }

    // Verifica se elementos existem
    if (!Object.values(elementosEndereco).every(el => el)) {
        console.error("Elementos do endereço não encontrados!");
        return;
    }

    // Adiciona o spinner ao ícone de busca
    searchIcon.classList.remove("fa-search");
    searchIcon.classList.add("fa-spinner", "fa-spin");

    fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then(response => {
        if (!response.ok) throw new Error("Erro na conexão");
        return response.json();
    })
    .then(data => {
        if (data.erro) {
            Swal.fire({
                icon: "error",
                title: "CEP não encontrado",
                text: "Verifique o número digitado."
            });
            limparCamposEndereco();
        } else {
            // Preenche os campos com verificação
            elementosEndereco.logradouro.value = data.logradouro || "";
            elementosEndereco.bairro.value = data.bairro || "";
            elementosEndereco.cidade.value = data.localidade || "";
            elementosEndereco.uf.value = data.uf || "";
        }
    })
    .catch(error => {
        console.error("Erro:", error);
        Swal.fire({
            icon: "error",
            title: "Falha na busca",
            text: "Serviço indisponível. Tente novamente mais tarde."
        });
    })
    .finally(() => {
        // Restaura o ícone de lupa após a busca
        searchIcon.classList.remove("fa-spinner", "fa-spin");
        searchIcon.classList.add("fa-search");
    });
}
    // Função auxiliar para limpar campos
function limparCamposEndereco() {
    const campos = ["pedido-logradouro", "pedido-bairro", "pedido-cidade", "pedido-uf"];
    campos.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) campo.value = "";
    });
}

    // ========== MASCARA DE NOME JUSTIFY ================//
    window.onload = function () {
        const inputNome = document.getElementById("pedido-nome");
        const inputComplemento = document.getElementById("pedido-complemento");
    
        // Lista de exceções (artigos, preposições, conjunções)
        const excecoes = ["da", "de", "e", "do", "a", "as", "o", "os", "em", "para", "com"];
    
        // Função para formatar o nome
        function formatarNome(nome) {
            return nome
                .split(" ")  // Dividir o nome em palavras
                .map(function (palavra, index) {
                    // Se a palavra for uma exceção, não capitaliza
                    if (excecoes.includes(palavra.toLowerCase()) && index !== 0) {
                        return palavra.toLowerCase();  // Deixa em minúsculas se for exceção
                    }
                    return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();  // Capitaliza normalmente
                })
                .join(" ");  // Junta as palavras de volta em uma string
        }
    
        // Função para configurar a formatação
        function configurarFormatacao(input) {
            if (input) {
                input.addEventListener("input", function () {
                    let posicaoCursor = this.selectionStart;
                    let valorFormatado = formatarNome(this.value);
                    this.value = valorFormatado;
                    this.setSelectionRange(posicaoCursor, posicaoCursor);  // Manter o cursor no mesmo local
                });
    
                input.addEventListener("keydown", function (event) {
                    if (event.key === " ") {
                        let posicaoCursor = this.selectionStart;
                        this.value = this.value.substring(0, posicaoCursor) + " " + this.value.substring(posicaoCursor);
                        this.setSelectionRange(posicaoCursor + 1, posicaoCursor + 1);  // Manter o cursor após o espaço
                        event.preventDefault();
                    }
                });
            }
        }
    
        // Chama a função para os inputs
        configurarFormatacao(inputNome);
        configurarFormatacao(inputComplemento);
    };
    

    // ========== MASCARA DE TELEFONE ================//
    function mascaraTelefone(input) {
        let valor = input.value.replace(/\D/g, '');
        if (valor.length <= 2) {
            input.value = `(${valor}`;
        } else if (valor.length <= 7) {
            input.value = `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
        } else {
            input.value = `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7, 11)}`;
        }
    }

    // Adiciona o listener para o input do telefone
    const telefoneInput = document.getElementById('pedido-telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function() {
            mascaraTelefone(this);
        });
    }
});



// ========== MENSAGEM DE CAMPOS OBRIGATORIOS E BOTÃO ================//
document.getElementById('pedido-btn').addEventListener('click', function(event) {
    event.preventDefault();  // Previne o envio do formulário para validar antes
    
    // Lista de campos obrigatórios
    const camposObrigatorios = [
        'pedido-cep', 'pedido-logradouro', 'pedido-numero', 'pedido-bairro', 'pedido-cidade', 'pedido-uf',
        'pedido-nome', 'pedido-telefone'
    ];
    
    let todosPreenchidos = true;

    for (let campo of camposObrigatorios) {
        const input = document.getElementById(campo);
        if (!input.value.trim()) {
            todosPreenchidos = false;
            break;
        }
    }

    // Validação específica do telefone
    const telefoneInput = document.getElementById('pedido-telefone');
    const telefoneNumerico = telefoneInput.value.replace(/\D/g, ''); // Remove tudo que não for número
    if (telefoneNumerico.length !== 11) {
        todosPreenchidos = false;
    }

    if (!todosPreenchidos) {
        // Alerta de erro caso falte algum campo ou telefone esteja incompleto
        Swal.fire({
            icon: 'error',
            title: 'Erro!',
            text: 'Todos os campos são obrigatórios!',
            confirmButtonText: 'OK'
        });
    } else {
        // Alerta de confirmação caso todos os campos estejam preenchidos corretamente
        Swal.fire({
            title: "Deseja realmente fazer o pedido?",
            text: "Verifique as informações antes de confirmar.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sim, confirmar pedido",
            cancelButtonText: "Cancelar"
        // No evento de clique do botão de pedido (substitua a parte do .then do Swal.fire)
        }).then(async (result) => {
            if (result.isConfirmed) {
                // Carrega dados do PIX do servidor
                const pixData = await carregarDadosPix();
                // Obter dados do localStorage e calcular valor total
                const pedidoStorage = JSON.parse(localStorage.getItem("pedido"));
                const taxaEntrega = Number(pedidoStorage.taxaEntrega) || 0;
                const totalAcrescimos = pedidoStorage.acrescimos?.length > 0 
                    ? pedidoStorage.acrescimos.reduce((total, a) => total + Number(a), 0)
                    : 0;
                
                const subtotal = (Number(pedidoStorage.produto.preco) * pedidoStorage.quantidade) + totalAcrescimos;
                const totalFinal = subtotal + taxaEntrega;

                // Capturar dados do formulário
                const pedido = {
                    ...pedidoStorage,
                    endereco: {
                        cep: document.getElementById('pedido-cep').value,
                        logradouro: document.getElementById('pedido-logradouro').value,
                        numero: document.getElementById('pedido-numero').value,
                        bairro: document.getElementById('pedido-bairro').value,
                        cidade: document.getElementById('pedido-cidade').value,
                        uf: document.getElementById('pedido-uf').value,
                        complemento: document.getElementById('pedido-complemento').value
                    },
                    cliente: {
                        nome: document.getElementById('pedido-nome').value,
                        telefone: document.getElementById('pedido-telefone').value
                    },
                    total: totalFinal
                };

                // Salva pedido completo no localStorage
                localStorage.setItem("pedidoFinal", JSON.stringify(pedido));
                // Adicionar após confirmação bem-sucedida
                localStorage.removeItem('cardapioState'); 
                localStorage.removeItem('pedido');
                try {
                    const payloadPix = gerarPayloadPix({
                        chave: pixData.chave,
                        nome: pixData.nome,
                        cidade: "PORTO VELHO",
                        valor: totalFinal
                    });
                
                    await mostrarModalPix(totalFinal, payloadPix);

                    // Limpar storage
                    localStorage.removeItem('cardapioState');
                    localStorage.removeItem('pedido');
                    
                } catch (error) {
                    console.error("Erro ao processar pagamento PIX:", error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Erro no processamento',
                        text: 'Não foi possível gerar o QR Code PIX. Por favor, tente novamente.'
                    });
                }
            }
        });

    }

});

