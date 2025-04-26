document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Verifique todos os elementos importantes
    const loginModal = document.getElementById('admin-loginModal');
    const mainContent = document.querySelector('.admin-main-content');
    const loginForm = document.getElementById('admin-loginForm');
    const loginError = document.getElementById('admin-loginError');
    const reabrirLoginItem = document.getElementById('reabrir-login-item');
    const sidebarLoginBtn = document.getElementById('btn-login-sidebar');

    // Estado inicial - Verifique se os elementos existem antes de manipular
    if (loginModal) loginModal.style.display = 'block';
    if (mainContent) mainContent.style.display = 'none';
    if (reabrirLoginItem) reabrirLoginItem.style.display = 'none';

    // Eventos - Verifique se os elementos existem antes de adicionar listeners
    if (sidebarLoginBtn) {
        sidebarLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            abrirLoginModal();
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('admin-login').value;
            const password = document.getElementById('admin-senha').value;

            try {
                const response = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache'
                    },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (data.success) {
                    fecharLoginModal();
                    mainContent.style.display = 'block';
                    reabrirLoginItem.style.display = 'none';
                    loginError.textContent = '';
                    carregarDados();
                } else {
                    loginError.textContent = 'Credenciais inválidas. Tente novamente.';
                    document.getElementById('admin-senha').value = '';
                }
            } catch {
                loginError.textContent = 'Erro na conexão com o servidor';
            }
        });
    }

    // Adicione verificações para outros elementos que você está usando
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const input = document.getElementById('admin-senha');
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            togglePassword.classList.toggle('fa-eye-slash');
        });
    }

    // Função para adicionar nova porção
    const adicionarPorcao = () => {
        const nome = document.getElementById('nova-porcao-nome').value;
        const preco = document.getElementById('nova-porcao-preco').value;
        
        if (!nome || !preco) {
            alert('Preencha todos os campos!');
            return;
        }

        const novaPorcao = {
            nome,
            preco: parseFloat(preco.replace(/\D/g, '')) / 100
        };

        // Adiciona à lista visual
        const lista = document.getElementById('porcoes-list');
        if (lista) {
            lista.appendChild(criarItemPorcao(novaPorcao));
        }

        // Limpa os campos
        document.getElementById('nova-porcao-nome').value = '';
        document.getElementById('nova-porcao-preco').value = '';
    };

    // Função para adicionar novo creme
    const adicionarCreme = () => {
        const nome = document.getElementById('novo-creme-nome').value;
        
        if (!nome) {
            alert('Preencha o nome do creme!');
            return;
        }

        const novoCreme = { nome };

        // Adiciona à lista visual
        const lista = document.getElementById('cremes-list');
        lista.appendChild(criarItemCreme(novoCreme));

        // Limpa o campo
        document.getElementById('novo-creme-nome').value = '';
    };

    // Vincular dentro do DOMContentLoaded
    const formUploadProduto = document.getElementById('form-upload-produto');
    if (formUploadProduto) {
        formUploadProduto.addEventListener('submit', async (e) => {
            e.preventDefault();
            await uploadImagem('imagemProduto', '/api/admin/upload-produto', 'preview-imagem-produto');
        });
    }

    const formUploadLogo = document.getElementById('form-upload-logo');
    if (formUploadLogo) {
        formUploadLogo.addEventListener('submit', async (e) => {
            e.preventDefault();
            await uploadImagem('logoLoja', '/api/admin/upload-logo', 'preview-logo-loja');
        });
    }

    const formPix = document.getElementById('admin-form-pix');
    if (formPix) {
        formPix.addEventListener('submit', async (e) => {
            e.preventDefault(); // Impede o reload da página
            
            try {
                const response = await fetch('/api/admin/salvar-pix', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nomeRecebedor: document.getElementById('admin-nome-recebedor').value,
                        chavePix: document.getElementById('admin-chave-pix').value,
                        email: document.getElementById('admin-email').value
                    })
                });

                const data = await response.json();

                Swal.fire({
                    icon: data.success ? 'success' : 'error',
                    title: data.success ? 'Salvo!' : 'Erro!',
                    text: data.message,
                    timer: 2000,
                    showConfirmButton: false
                });

            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Erro',
                    text: 'Falha ao salvar dados PIX',
                    timer: 2000
                });
            }
        });
    }

    // Função para adicionar novo produto
    const adicionarProduto = () => {
        const nome = document.getElementById('admin-nome-produto').value;
        const tamanho = document.getElementById('admin-produto-tamanho').value;
        const preco = document.getElementById('admin-produto-preco').value;
        
        if (!nome || !tamanho || !preco) {
            alert('Preencha todos os campos do produto!');
            return;
        }

        const novoProduto = {
            nome,
            tamanho,
            preco: parseFloat(preco.replace(/\D/g, '')) / 100
        };

        // Adiciona à lista visual
        const lista = document.getElementById('produtos-list');
        lista.appendChild(criarItemProduto(novoProduto));

        // Limpa os campos
        document.getElementById('admin-nome-produto').value = '';
        document.getElementById('admin-produto-tamanho').value = '';
        document.getElementById('admin-produto-preco').value = '';
    };

    const camposJustify = [
    
        "admin-nome-produto",
        "admin-produto-tamanho",
        "admin-produto-preco" 
    ];

    camposJustify.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener("input", () => justify(input));
        }
    }); // FIM 
    
    
    const preencherLista = (elementId, itens, criarElemento) => {
        const lista = document.getElementById(elementId);
        if (!lista) {
            console.error(`Elemento #${elementId} não encontrado!`);
            return;
        }
        lista.innerHTML = '';
        itens.forEach(item => lista.appendChild(criarElemento(item)));
    };

    // Mascará de Preço com formato Real Brasileiro R$ 0,00
   const camposPreco = document.querySelectorAll("[data-preco]");

   camposPreco.forEach(input => {
       input.addEventListener("input", () => aplicarMascaraPreco(input));

       input.addEventListener("keypress", (e) => {
           // Bloqueia qualquer tecla que não seja número
           if (!/\d/.test(e.key)) {
               e.preventDefault();
           }
       });

       // Aplica a máscara ao carregar se já houver valor
       if (input.value.trim() !== "") {
           aplicarMascaraPreco(input);
       }
   });


    // Função que aplica a formatação de moeda brasileira
    function aplicarMascaraPreco(input) {
    let valor = input.value.replace(/\D/g, ""); // Remove tudo que não for número

    if (valor.length === 0) {
        input.value = "";
        return;
    }

    valor = (parseInt(valor, 10) / 100).toFixed(2); // Converte para centavos
    input.value = parseFloat(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
    }

    const criarItemProduto = (produto) => {
        const div = document.createElement('div');
        div.classList.add('editable-list-item');
        div.innerHTML = `
            <input type="text" value="${produto.nome}" class="admin-form-control" readonly>
            <input type="text" value="${produto.tamanho}" class="admin-form-control" readonly>
            <input type="text" value="${produto.preco}" class="admin-form-control" readonly>
            <button type="button" class="admin-btn admin-btn-danger" onclick="removerProduto(this)">Remover</button>
        `;
        return div;
    };

    // Função para carregar os dados do servidor
    const carregarDados = async () => {
        try {
            const response = await fetch('/api/admin/dados'); 
            
            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || `Erro ${response.status}`);
            }
            
            const data = await response.json();

            if (!data.success) {
                console.error('Erro no servidor:', data.message);
                return;
            }


            const dados = data.dados;

            // ========== CONFIGURAÇÕES DA LOJA ==========
            const configLoja = dados.configLoja || {};
            document.getElementById('admin-horario-abertura').value = configLoja.horarioAbertura || '';
            document.getElementById('admin-horario-fechamento').value = configLoja.horarioFechamento || '';
            document.getElementById('admin-instagram').value = configLoja.instagramLink || '';

            // ========== INFORMAÇÕES DE CONTATO ==========
            const contato = dados.contato || {};

            // Remove o DDI (55) e formata o telefone para exibição
            const telefoneBruto = contato.telefone ? contato.telefone.replace(/^55/, '') : '';
            document.getElementById('admin-telefone').value = telefoneBruto;

            // Aplica a máscara apenas se houver valor
            if (telefoneBruto) {
                mascaraTelefone({ target: document.getElementById('admin-telefone') });
            }

            document.getElementById('admin-tempo-entrega').value = contato.tempoEntrega || '';
            document.getElementById('admin-taxa-entrega').value = contato.taxaEntrega ? 
                contato.taxaEntrega.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}) : '';
                        
            // ========== PRODUTOS ==========
            const produtos = dados.produtos || [];
            preencherLista('produtos-list', produtos, criarItemProduto);

            // ========== DADOS DE PAGAMENTO PIX ========== [ADICIONE AQUI]
            const pagamento = dados.pagamento || {};
            const pix = pagamento.pix || {};
            document.getElementById('admin-nome-recebedor').value = pix.nomeRecebedor || '';
            document.getElementById('admin-chave-pix').value = pix.chavePix || '';
            document.getElementById('admin-email').value = pix.email || '';


            // Preencher listas
            preencherLista('produtos-list', produtos, criarItemProduto);
            preencherLista('porcoes-list', dados.porcoes || [], criarItemPorcao);
            preencherLista('cremes-list', dados.cremes || [], criarItemCreme);

        } catch (error) {
            console.error('Falha ao carregar dados:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erro ao carregar dados',
                text: error.message || 'Erro desconhecido',
                timer: 3000
            });
        }
    };




    const criarItemPorcao = (porcao) => {
        const div = document.createElement('div');
        div.classList.add('editable-list-item');
        div.innerHTML = `
            <input type="text" value="${porcao.nome}" class="admin-form-control" readonly>
            <input type="text" value="${porcao.preco ? porcao.preco.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}) : ''}" 
                class="admin-form-control" readonly>
            <button type="button" class="admin-btn admin-btn-danger" onclick="removerPorcao(this)">Remover</button>
        `;
        return div;
    };

    const criarItemCreme = (creme) => {
        const div = document.createElement('div');
        div.classList.add('editable-list-item');
        div.innerHTML = `
            <input type="text" value="${creme.nome}" class="admin-form-control" readonly>
            <button type="button" class="admin-btn admin-btn-danger" onclick="removerCreme(this)">Remover</button>
        `;
        return div;
    };

    

    // Modal de login
    const abrirLoginModal = () => {
        loginModal.style.display = 'block';
        reabrirLoginItem.style.display = 'none';
        document.getElementById('admin-login').focus();
    };

    const fecharLoginModal = () => {
        loginModal.style.display = 'none';
        if (mainContent.style.display === 'none') {
            reabrirLoginItem.style.display = 'block';
        }
    };

    // Estado inicial
    loginModal.style.display = 'block';
    mainContent.style.display = 'none';
    reabrirLoginItem.style.display = 'none';


    window.addEventListener('click', (e) => {
        if (e.target === loginModal) fecharLoginModal();
    });

    window.addEventListener('click', (e) => {
        const loginModal = document.getElementById('admin-loginModal');
        if (loginModal && e.target === loginModal) {
            fecharLoginModal();
        }
    });

    // Adicione no final do admin.js
    window.removerProduto = function(elemento) {
        // Implementação para remover produto
        elemento.parentElement.remove();
    };

    window.removerPorcao = function(elemento) {
        // Implementação para remover porção
        elemento.parentElement.remove();
    };

    window.removerCreme = function(elemento) {
        // Implementação para remover creme
        elemento.parentElement.remove();
    };


    // Formulário de alteração de senha
    const formAlterar = document.getElementById('admin-alterarSenhaForm');
    if (formAlterar) {
        formAlterar.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                currentUsername: document.getElementById('admin-usuarioAtual').value,
                newUsername: document.getElementById('admin-novoUsuario').value || undefined,
                currentPassword: document.getElementById('admin-senhaAtual').value,
                newPassword: document.getElementById('admin-novaSenha').value,
                confirmPassword: document.getElementById('admin-confirmarSenha').value
            };

            if (formData.newPassword !== formData.confirmPassword) {
                document.getElementById('alterarSenhaMensagem').textContent = 'As senhas não coincidem';
                return;
            }

            try {
                const response = await fetch('/api/admin/update-credentials', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Credenciais atualizadas!',
                        text: 'O nome de usuário e/ou senha foram alterados com sucesso.',
                        confirmButtonText: 'OK',
                        timer: 3000
                    });

                    fecharModalAlterarSenha();
                    document.getElementById('alterarSenhaMensagem').textContent = '';
                } else {
                    document.getElementById('alterarSenhaMensagem').textContent = data.message || 'Erro na atualização';
                }
            } catch {
                document.getElementById('alterarSenhaMensagem').textContent = 'Erro na conexão';
            }
        });
    }

    const formLoja = document.getElementById('admin-form-loja');
    if (formLoja) {
        formLoja.addEventListener('submit', async (event) => {
            event.preventDefault();
    
            try {
                const response = await fetch('/api/config-loja', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        horarioAbertura: document.getElementById('admin-horario-abertura').value,
                        horarioFechamento: document.getElementById('admin-horario-fechamento').value,
                        instagramLink: document.getElementById('admin-instagram').value
                    })
                });
    
                const result = await response.json();
    
                Swal.fire({
                    icon: result.success ? 'success' : 'error',
                    title: result.success ? 'Salvo!' : 'Erro!',
                    text: result.message,
                    timer: 2000,
                    showConfirmButton: false
                });
    
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Erro de conexão',
                    text: 'Não foi possível conectar ao servidor',
                    timer: 2000
                });
            }
        });
    }
    

    // Exportar funções globais
    window.abrirLoginModal = abrirLoginModal;
    window.fecharLoginModal = fecharLoginModal;
    // Exportar funções para uso no HTML
    window.adicionarPorcao = adicionarPorcao;
    window.adicionarCreme = adicionarCreme;
    window.adicionarProduto = adicionarProduto;
    window.fecharModalAlterarSenha = fecharModalAlterarSenha;
    window.abrirModalAlterarSenha = abrirModalAlterarSenha;
    
    });

// Função global para alternar visibilidade da senha
function toggleSenha(icon, inputId) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
    }
}

// Modal de alteração de senha
// Modal de alteração de senha
async function abrirModalAlterarSenha() {
    try {
        // Faz requisição para obter dados atualizados
        const response = await fetch('/api/admin/dados');
        const data = await response.json();
        
        if (data.success && data.dados) {
            const modal = document.getElementById('admin-alterarSenhaModal');
            const username = data.dados.adminCredentials.username;
            
            // Preenche o campo com o usuário atual
            document.getElementById('admin-usuarioAtual').value = username;
            modal.style.display = 'block';
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: 'Não foi possível carregar os dados do usuário',
                timer: 2000
            });
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Erro de conexão',
            text: 'Não foi possível conectar ao servidor',
            timer: 2000
        });
    }
}

function fecharModalAlterarSenha() {
    document.getElementById('admin-alterarSenhaModal').style.display = 'none';
}

function justify(input) {
    const excecoes = ["da", "de", "e", "do", "a", "as", "o", "os", "em", "para", "com"];
    
    input.value = input.value
        .toLowerCase()
        .split(" ")
        .map((palavra, index) => {
            if (excecoes.includes(palavra) && index !== 0) {
                return palavra;
            }
            return palavra.charAt(0).toUpperCase() + palavra.slice(1);
        })
        .join(" ");
}

// Salvar novo produto
async function salvarProduto(event) {
    event.preventDefault();

    try {
        const response = await fetch('/api/admin/salvar-produto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: document.getElementById('admin-nome-produto').value,
                tamanho: document.getElementById('admin-produto-tamanho').value,
                preco: document.getElementById('admin-produto-preco').value,
                imagem: document.getElementById('admin-imagem-produto').files[0]?.name || ''
            })
        });

        const data = await response.json();

        Swal.fire({
            icon: data.success ? 'success' : 'error',
            title: data.success ? 'Salvo!' : 'Erro!',
            text: data.message,
            timer: 2000,
            showConfirmButton: false
        })

    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Falha ao salvar o produto',
            timer: 2000
        })
    }
}

// Salvar informações de contato
async function salvarContato(event) {
    event.preventDefault();


    try {

        // Converter telefone para formato internacional (55 + DDD + número)
        const telefoneBruto = document.getElementById('admin-telefone').value.replace(/\D/g, '');
        const telefoneInternacional = `55${telefoneBruto}`; // Adiciona o DDI 55 automaticamente

        // Converter taxa para número
        const taxa = document.getElementById('admin-taxa-entrega').value;
        const taxaNumerica = parseFloat(taxa.replace(/[^0-9,]/g, '').replace(',', '.'));

        const response = await fetch('/api/admin/salvar-contato', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telefone: telefoneInternacional, //Formato: 55xxxxxxx
                tempoEntrega: document.getElementById('admin-tempo-entrega').value,
                taxaEntrega: taxaNumerica // Envia o número
            })
        });

        const data = await response.json();

        Swal.fire({
            icon: data.success ? 'success' : 'error',
            title: data.success ? 'Sucesso' : 'Erro!',
            text: data.message,
            timer: 2000,
            showConfirmButton: false
        })


    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Falha na conexão com o servidor!',
            timer: 2000
        })
    }
}


// Função genérica para upload com preview
async function uploadImagem(fileInputId, apiEndpoint, previewElementId) {
    const fileInput = document.getElementById(fileInputId);
    const file = fileInput.files[0];
    
    if (!file) {
      alert('Selecione um arquivo primeiro!');
      return;
    }
  
    const formData = new FormData();
    formData.append(fileInputId, file);
  
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();

      Swal.fire({
        icon: result.success ? 'success' : 'error',
        title: result.success ? 'Sucesso!' : 'Erro!',
        text: result.message,
        timer: 2000,
        showConfirmButton: false
      });
      
      if (result.success) {
        // Atualiza o preview
        if (previewElementId) {
          const preview = document.getElementById(previewElementId);
          preview.src = result.imagePath || result.logoPath;
          preview.style.display = 'block';
        }
        
       
      } 
        } catch (error) {
        Swal.fire({
            icon: 'erro!', 
            title: 'Erro',
            text: error.message || 'Falha no upload',
            timer: 2000
        
        });
    }
}


  // Função para máscara de telefone
  function mascaraTelefone(input) {
    const inputElement = input.target ? input.target : input; // Compatível com chamada manual
    let valor = inputElement.value ? inputElement.value.replace(/\D/g, '') : '';
    
    if (valor.length <= 2) {
        inputElement.value = `(${valor}`;
    } else if (valor.length <= 7) {
        inputElement.value = `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
    } else {
        inputElement.value = `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7, 11)}`;
    }
}

 
  


