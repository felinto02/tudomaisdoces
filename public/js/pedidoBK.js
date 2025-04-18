document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const resumoPedido = document.getElementById("pedido-resumo-pedido");
    
    // Recuperar pedido do localStorage
    const pedidoRaw = localStorage.getItem('pedido');
    
    if (!pedidoRaw) {
        Swal.fire({
            icon: 'warning',
            title: 'Pedido não encontrado!',
            text: 'Redirecionando para o cardápio...',
            willClose: () => window.location.href = 'cardapio.html'
        });
        return;
    }

    try {
        const pedido = JSON.parse(pedidoRaw);
        
        // Validação básica do objeto
        if (!pedido.produto || typeof pedido.produto !== 'object') {
            throw new Error('Estrutura do pedido inválida');
        }

        // Converter valores numéricos
        const converterNumero = (valor) => {
            if (typeof valor === 'string') {
                return parseFloat(valor.replace(/[^0-9,]/g, '').replace(',', '.')) || 0;
            }
            return Number(valor) || 0;
        };

        // Processar dados
        const processarPedido = (pedido) => ({
            produto: {
                nome: pedido.produto.nome || 'Não especificado',
                tamanho: pedido.produto.tamanho || 'Tamanho não informado',
                preco: converterNumero(pedido.produto.preco)
            },
            quantidade: converterNumero(pedido.quantidade),
            creme: pedido.creme || 'Não selecionado',
            acrescimos: Array.isArray(pedido.acrescimos) 
                ? pedido.acrescimos.map(a => converterNumero(a))
                : [],
            observacao: pedido.observacao || "Nenhuma",
            taxaEntrega: converterNumero(pedido.taxaEntrega)
        });

        const pedidoProcessado = processarPedido(pedido);

        // Cálculos finais
        const calcularTotais = () => {
            const subtotal = (pedidoProcessado.produto.preco * pedidoProcessado.quantidade) +
                            pedidoProcessado.acrescimos.reduce((a, b) => a + b, 0);
            
            return {
                subtotal,
                total: subtotal + pedidoProcessado.taxaEntrega
            };
        };

        const totais = calcularTotais();
        const formatador = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

        // Montar HTML do resumo
        if (resumoPedido) {
            resumoPedido.innerHTML = `
                <li><span>Produto:</span> <span>${pedidoProcessado.produto.nome} (${pedidoProcessado.produto.tamanho})</span></li>
                <li><span>Quantidade:</span> <span>${pedidoProcessado.quantidade}</span></li>
                <li><span>Creme:</span> <span>${pedidoProcessado.creme}</span></li>
                <li><span>Acréscimos:</span> <span>${
                    pedidoProcessado.acrescimos.length > 0 
                    ? formatador.format(pedidoProcessado.acrescimos.reduce((a, b) => a + b, 0)) 
                    : "Nenhum"
                }</span></li>
                <li><span>Observações:</span> <span>${pedidoProcessado.observacao}</span></li>
                <li><span>Preço Unitário:</span> <span>${formatador.format(pedidoProcessado.produto.preco)}</span></li>
                <li><span>Subtotal:</span> <span>${formatador.format(totais.subtotal)}</span></li>
                <li><span>Taxa de Entrega:</span> <span>${formatador.format(pedidoProcessado.taxaEntrega)}</span></li>
                <li class="total-line"><span>Valor Total:</span> <span>${formatador.format(totais.total)}</span></li>
            `;
        }

    } catch (error) {
        console.error('Erro ao processar pedido:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro no pedido',
            text: 'Não foi possível carregar o pedido. Por favor, tente novamente.',
            willClose: () => window.location.href = 'cardapio.html'
        });
    }
});

// Restante do código original (CEP, máscaras, etc)...