document.addEventListener('DOMContentLoaded', function() {
    // --- Estado da Aplicação ---
    const state = {
        currentProduct: null,
        currentPrice: 0,
        savedState: JSON.parse(localStorage.getItem('cardapioState')) || null
    };

    // --- Serviços de Dados ---
    const DataService = {
        async fetchData() {
            try {
                const response = await fetch('/api/dados');
                if (!response.ok) throw new Error(`Erro HTTP! status: ${response.status}`);
                return await response.json();
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
                return null;
            }
        }
    };

    // --- Controladores de Interface ---
    const UIUpdater = {
        // Atualizações gerais
        updateLogo(logoPath) {
            const logoElement = document.getElementById('logoLoja');
            if (logoElement && logoPath) {
                logoElement.src = logoPath;
                logoElement.style.display = 'block';
            }
        },

        updateImagemProduto(imagePath) {
            const imgElement = document.getElementById("imagemProduto");
            if (imgElement && imagePath) {
                imgElement.src = imagePath;
                imgElement.style.display = 'block';
            }
        },

        updateContactInfo(contato) {
            if (!contato) return;

            if (contato.telefone) {
                const telefoneElement = document.getElementById('telefone-whatsapp');
                telefoneElement.textContent = contato.telefone;
                this._updateWhatsAppLink(contato.telefone);
            }

            const updateIfExists = (id, value, formatter) => {
                const element = document.getElementById(id);
                if (element && value !== undefined) {
                    element.textContent = formatter ? formatter(value) : value;
                }
            };

            updateIfExists('tempoEntrega', contato.tempoEntrega);
            updateIfExists('taxa-entrega', contato.taxaEntrega, v => v.toFixed(2).replace('.', ','));
        },

        // Métodos de restauração de estado
        restoreCheckboxes(acrescimoSalvos) {
            document.querySelectorAll('.cardapio-acrescimo-check').forEach(checkbox => {
                const nomeAcrescimo = checkbox.parentElement.querySelector('.cardapio-acrescimo-nome').textContent;
                checkbox.checked = acrescimoSalvos.includes(nomeAcrescimo);
            });
        },

        restoreCremeSelection(cremeSalvo) {
            const select = document.getElementById('cardapio-creme');
            if (select) {
                select.value = cremeSalvo;
            }
        },

        // Atualizações de produtos
        updateProductInfo(product) {
            if (!product) return;

            state.currentProduct = product;
            state.currentPrice = product.preco;

            this.updateImagemProduto(product.imagePath);
            this.updateDescricaoProduto(product);

            const setContent = (selector, value) => {
                const element = document.querySelector(selector);
                if (element && value) element.textContent = value;
            };

            setContent('.cardapio-product-nome', product.nome);
            setContent('.cardapio-product-ml', `- ${product.tamanho}`);
            setContent('.cardapio-product-preco', product.preco?.toFixed(2).replace('.', ','));
        },

        updateDescricaoProduto(produto) {
            const descricaoElement = document.querySelector('.cardapio-product-descricao');
            if (descricaoElement && produto?.descricao) {
                descricaoElement.textContent = produto.descricao;
            }
        },

        // Criação de elementos
        populateAcrescimos(acrescimos) {
            const lista = document.querySelector('.cardapio-acrescimos-lista');
            if (!lista || !acrescimos) return;

            lista.innerHTML = acrescimos.map(acrescimo => `
                <li>
                    <label class="cardapio-checkbox-index-container">
                        <input type="checkbox" 
                            class="cardapio-acrescimo-check" 
                            data-preco="${acrescimo.preco.toFixed(2)}">
                        <span class="cardapio-checkmark"></span>
                        <span class="cardapio-acrescimo-nome">${acrescimo.nome}</span>
                        <span class="cardapio-preco-acrescimo">
                            R$ ${acrescimo.preco.toFixed(2).replace('.', ',')}
                        </span>
                    </label>
                </li>
            `).join('');
        },

        populateCremes(cremes) {
            const select = document.getElementById('cardapio-creme');
            if (!select || !cremes) return;

            select.innerHTML = '<option value="" disabled selected>Escolha</option>' +
                cremes.map(creme => 
                    `<option value="${creme.nome.toLowerCase()}">${creme.nome}</option>`
                ).join('');
        },

        // Métodos auxiliares
        _updateWhatsAppLink(telefone) {
            const whatsappBtn = document.getElementById('btn-whatsapp');
            if (whatsappBtn) {
                const numero = telefone.replace(/\D/g, '');
                whatsappBtn.href = `https://wa.me/${numero}`;
            }
        }
    };

    // --- Lógica de Negócio ---
    const BusinessLogic = {
        setupEventListeners() {
            // Controles de quantidade
            document.getElementById('btn-decrease')?.addEventListener('click', () => {
                this._adjustQuantity(-1);
                this.saveState();
            });
            
            document.getElementById('btn-increase')?.addEventListener('click', () => {
                this._adjustQuantity(1);
                this.saveState();
            });

            // Atualizações de checkboxes
            document.querySelectorAll('.cardapio-acrescimo-check').forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    this.calcularTotal();
                    this.saveState();
                });
            });

            // Atualização de creme
            document.getElementById('cardapio-creme')?.addEventListener('change', () => {
                this.calcularTotal();
                this.saveState();
            });

            // Observações
            document.getElementById('cardapio-observacao')?.addEventListener('input', () => {
                this.saveState();
            });

            // Botão de compra
            document.getElementById('btn-comprar')?.addEventListener('click', e => this._handlePurchase(e));
        },

        calcularTotal() {
            if (!state.currentProduct) return;

            const getValue = (selector, parser) => {
                const element = document.querySelector(selector);
                return element ? parser(element.textContent) : 0;
            };

            const quantidade = getValue('#cardapio-quantity', v => parseInt(v));
            const valorProduto = state.currentProduct.preco * quantidade;

            const acrescimos = Array.from(document.querySelectorAll('.cardapio-acrescimo-check:checked'))
                                  .reduce((sum, el) => sum + parseFloat(el.dataset.preco), 0);

            const taxaEntrega = getValue('#taxa-entrega', v => parseFloat(v.replace(',', '.')));
            const subtotal = valorProduto + acrescimos;

            document.getElementById('cardapio-total').textContent = 
                (subtotal).toFixed(2).replace('.', ',');

            return { subtotal, total: subtotal + taxaEntrega, taxaEntrega };
        },

        saveState() {
            const stateToSave = {
                creme: document.getElementById('cardapio-creme').value,
                acrescimos: Array.from(document.querySelectorAll('.cardapio-acrescimo-check:checked'))
                    .map(el => el.parentElement.querySelector('.cardapio-acrescimo-nome').textContent),
                quantidade: parseInt(document.getElementById('cardapio-quantity').textContent),
                observacao: document.getElementById('cardapio-observacao').value,
                productId: state.currentProduct?.id
            };
            
            localStorage.setItem('cardapioState', JSON.stringify(stateToSave));
        },

        restoreState(savedState) {
            if (!savedState) return;

            document.getElementById('cardapio-quantity').textContent = savedState.quantidade;
            document.getElementById('cardapio-observacao').value = savedState.observacao || '';

            setTimeout(() => {
                // Verificar se as opções do creme já foram carregadas
                const selectCreme = document.getElementById('cardapio-creme');
                
                if (selectCreme && selectCreme.options.length > 0) {
                    // Restaurar todos os elementos se estiver pronto
                    UIUpdater.restoreCremeSelection(savedState.creme);
                    UIUpdater.restoreCheckboxes(savedState.acrescimos);
                    this.calcularTotal();
                } else {
                    console.warn('Elementos não prontos - tentando novamente...');
                    // Nova tentativa após 500ms com verificação completa
                    setTimeout(() => {
                        if (selectCreme && selectCreme.options.length > 0) {
                            UIUpdater.restoreCremeSelection(savedState.creme);
                            UIUpdater.restoreCheckboxes(savedState.acrescimos);
                            this.calcularTotal();
                        } else {
                            console.error('Falha ao restaurar estado após múltiplas tentativas');
                        }
                    }, 500);
                }
            }, 200); // Tempo inicial reduzido para 200ms
        },

        _adjustQuantity(step) {
            const element = document.getElementById('cardapio-quantity');
            let quantity = parseInt(element.textContent) + step;
            quantity = Math.max(1, quantity);
            element.textContent = quantity;
            this.calcularTotal();
        },

        _handlePurchase(event) {
            event.preventDefault();
        
            // Validação do creme (mantida da versão anterior)
            const cremeSelect = document.getElementById('cardapio-creme');
            if (!cremeSelect.value) {
                Swal.fire('Selecione um creme!', 'Escolha o tipo de creme para continuar.', 'error');
                return;
            }
        
            // Cálculo do total (método independente como na versão antiga)
            this.calcularTotal();
        
            // Construção do pedido (adaptação da versão antiga)
            const pedido = {
                produto: {
                    nome: document.querySelector('.cardapio-product-nome').textContent,
                    preco: parseFloat(document.querySelector('.cardapio-product-preco')
                    .textContent
                    .replace(/[^\d,]/g, '')
                    .replace(',', '.')),
                    tamanho: document.querySelector('.cardapio-product-ml').textContent.replace('-', '').trim()
                },
                quantidade: parseInt(document.getElementById('cardapio-quantity').textContent),
                creme: cremeSelect.options[cremeSelect.selectedIndex].text,
                acrescimos: Array.from(document.querySelectorAll('.cardapio-acrescimo-check:checked'))
                              .map(checkbox => parseFloat(checkbox.dataset.preco)),
                observacao: document.getElementById('cardapio-observacao').value || "Nenhuma",
                taxaEntrega: parseFloat(document.getElementById('taxa-entrega').textContent.replace(',', '.')),
                total: parseFloat(document.getElementById('cardapio-total').textContent.replace(',', '.'))
            };
        
            // Debug melhorado
            console.log('Dados do Pedido:', {
                ...pedido,
                produto: { ...pedido.produto, preco: `R$ ${pedido.produto.preco.toFixed(2)}` },
                total: `R$ ${pedido.total.toFixed(2)}`
            });
        
            localStorage.setItem('pedido', JSON.stringify(pedido));
            console.log('[DEBUG] Pedido parseado:', pedido);
            window.location.href = 'pedido.html';
        }
    };

    // --- Inicialização da Aplicação ---
    (async function init() {
        const data = await DataService.fetchData();

        if (performance.navigation.type === 2) {
            localStorage.removeItem('cardapioState');
        }

        if (!data) {
            Swal.fire({
                icon: 'error',
                title: 'Erro!', 
                text: 'Não foi possível carregar o cardápio. Tente recarregar a página.'});
            return;
        }

        // Configurações iniciais
        if (data.configLoja) UIUpdater.updateLogo(data.configLoja.logoPath);
        UIUpdater.updateContactInfo(data.contato);
        UIUpdater.populateAcrescimos(data.porcoes);
        UIUpdater.populateCremes(data.cremes);

        // Carregar produto
        if (data.produtos?.length > 0) {
            const produto = state.savedState?.productId 
                ? data.produtos.find(p => p.id === state.savedState.productId) 
                : data.produtos[0];
                
            UIUpdater.updateProductInfo(produto || data.produtos[0]);
        }

        // Restaurar estado
        if (state.savedState) BusinessLogic.restoreState(state.savedState);

        // Inicialização final
        BusinessLogic.setupEventListeners();
        BusinessLogic.calcularTotal();
    })();
});