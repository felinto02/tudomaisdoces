// Funções Globais
window.fecharLoginModal = function() {
    document.getElementById('admin-loginModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    atualizarVisibilidadeLogin();
    
    // Verifica se o usuário está autenticado após fechar o modal
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        document.querySelector('.admin-main-content').style.display = 'none';
    }
};

window.abrirLoginModal = function() {
    document.getElementById('admin-loginModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.getElementById('admin-login').focus();
};

window.atualizarVisibilidadeLogin = function() {
    const authToken = localStorage.getItem('authToken');
    const loginItem = document.getElementById('reabrir-login-item');
    
    if (loginItem) {
        loginItem.style.display = authToken ? 'none' : 'block';
    }
};



// Função verifyAuth corrigida para garantir verificação síncrona inicial
window.verifyAuth = async function() {
    // Verificação imediata do token no localStorage
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        localStorage.removeItem('authToken');
        return false;
    }
    
    // Verificação assíncrona com o servidor
    try {
        const response = await fetch('/api/verify-auth', {
            headers: {'Authorization': `Basic ${authToken}`}
        });
        
        if (!response.ok) {
            localStorage.removeItem('authToken');
            return false;
        }
        return true;
    } catch (error) {
        console.error('Erro na verificação:', error);
        localStorage.removeItem('authToken');
        return false;
    }
};



window.toggleSidebar = function() {
    document.querySelector('.admin-sidebar').classList.toggle('active');
};

window.adicionarPorcao = function() {
    const nome = document.getElementById('nova-porcao-nome').value;
    const preco = document.getElementById('nova-porcao-preco').value;
    
    if (!nome || !preco) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Preencha todos os campos!'
        });
        return;
    }
    
    const porcoesList = document.getElementById('porcoes-list');
    const novoId = Date.now().toString();
    
    const item = document.createElement('div');
    item.className = 'editable-list-item';
    item.innerHTML = `
        <input type="text" value="${nome}" data-id="${novoId}" data-field="nome">
        <input type="text" value="${preco}" data-id="${novoId}" data-field="preco" oninput="aplicarMascara(this)">
        <div class="editable-list-actions">
            <button class="delete-item-btn" onclick="removerPorcao('${novoId}')">
                <i class="fas fa-trash"></i> Remover
            </button>
        </div>
    `;
    
    porcoesList.appendChild(item);
    document.getElementById('nova-porcao-nome').value = '';
    document.getElementById('nova-porcao-preco').value = '';
};

window.removerPorcao = function(id) {
    const item = document.querySelector(`.editable-list-item input[data-id="${id}"]`)?.parentNode;
    if (item) {
        item.remove();
    }
};

window.removerCreme = function(id) {
    const item = document.querySelector(`#cremes-list .editable-list-item input[data-id="${id}"]`)?.parentNode;
    if (item) {
        item.remove();
    }
};

window.salvarPorcoes = async function() {
    if (!verifyAuth()) return;
    
    const itens = document.querySelectorAll('#porcoes-list .editable-list-item');
    const porcoes = [];
    
    itens.forEach(item => {
        const inputs = item.querySelectorAll('input');
        porcoes.push({
            id: inputs[0].dataset.id,
            nome: inputs[0].value,
            preco: parseFloat(inputs[1].value.replace(',', '.'))
        });
    });
    
    try {
        const response = await fetch('/api/porcoes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(porcoes)
        });
        
        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Sucesso!',
                text: 'Porções salvas com sucesso!'
            });
        } else {
            throw new Error('Erro ao salvar porções');
        }
    } catch (error) {
        console.error('Erro:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro!',
            text: 'Não foi possível salvar as porções'
        });
    }
};

window.adicionarCreme = async function() {
    if (!verifyAuth()) return;
    
    const nome = document.getElementById('novo-creme-nome').value.trim();
    
    if (!nome) {
        Swal.fire('Erro', 'Digite o nome do creme', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/cremes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ nome })
        });
    
        if (response.ok) {
            document.getElementById('novo-creme-nome').value = '';
            carregarDados();
            Swal.fire('Sucesso!', 'Creme adicionado', 'success');
        }
    } catch (error) {
        Swal.fire('Erro', 'Falha ao adicionar creme', 'error');
    }
};

window.salvarCremes = async function() {
    if (!verifyAuth()) return;
    
    const cremes = Array.from(document.querySelectorAll('#cremes-list input[type="text"]'))
        .map(input => ({
            id: input.dataset.id,
            nome: input.value.trim()
        }));
    
    try {
        const response = await fetch('/api/cremes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ cremes })
        });
    
        if (response.ok) {
            Swal.fire('Sucesso!', 'Cremes salvos', 'success');
        }
    } catch (error) {
        Swal.fire('Erro', 'Falha ao salvar cremes', 'error');
    }
};

window.atualizarCreme = async function(id, novoNome) {
    if (!verifyAuth()) return false;
    
    try {
        const response = await fetch(`/api/cremes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ nome: novoNome })
        });
    
        if (response.ok) {
            carregarDados();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Erro ao atualizar creme:', error);
        return false;
    }
};

// Funções auxiliares para formatação
window.aplicarMascara = function(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 2) {
        value = value.replace(/(\d+)(\d{2})$/, '$1,$2');
    } else if (value.length === 2) {
        value = '0,' + value;
    } else if (value.length === 1) {
        value = '0,0' + value;
    }
    
    input.value = value;
};

window.mascaraTelefone = function(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 11) {
        value = value.substring(0, 11);
    }
    
    if (value.length > 0) {
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
    }

    if (value.length > 10) {
        value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    } else if (value.length > 6) {
        value = value.replace(/(\d)(\d{3})$/, '$1-$2');
    }
    
    input.value = value;
};

window.formatarMoeda = function(input) {
    let value = input.value.replace(/\D/g, '');
    value = (value / 100).toFixed(2) + '';
    value = value.replace('.', ',');
    value = value.replace(/(\d)(\d{3})(\d{3}),/g, '$1.$2.$3,');
    value = value.replace(/(\d)(\d{3}),/g, '$1.$2,');
    input.value = value;
};

// Funções globais
window.abrirModalAlterarSenha = function() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        abrirLoginModal();
        return;
    }
    
    const usuarioAtual = atob(authToken).split(':')[0];
    document.getElementById('admin-usuarioAtual').value = usuarioAtual;
    document.getElementById('admin-alterarSenhaModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.fecharModalAlterarSenha = function() {
    document.getElementById('admin-alterarSenhaModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('admin-senhaError').textContent = '';
};

// Modificação no evento DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Garante que o conteúdo principal comece oculto
    document.querySelector('.admin-main-content').style.display = 'none';
    
    // Configuração dos listeners
    const loginForm = document.getElementById('admin-loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    
    // Verificação de autenticação
    checkAuth();
    
    // Configurar outros listeners
    setupEventListeners();
    


    // Função checkAuth corrigida
    async function checkAuth() {
        // Garante que o conteúdo fica oculto imediatamente
        document.querySelector('.admin-main-content').style.display = 'none';
        
        // Verificação em duas etapas:
        // 1. Verificação síncrona inicial (rápida)
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            abrirLoginModal();
            return;
        }
        
        // 2. Verificação assíncrona com o servidor
        try {
            const isAuthenticated = await verifyAuth();
            
            if (isAuthenticated) {
                document.querySelector('.admin-main-content').style.display = 'block';
                carregarDados();
            } else {
                abrirLoginModal();
            }
        } catch (error) {
            console.error('Erro na verificação:', error);
            abrirLoginModal();
        }
        
        atualizarVisibilidadeLogin();
    }


    // 2. Função handleLogin melhorada
    async function handleLogin(e) {
        e.preventDefault();
        const usuario = document.getElementById('admin-login').value.trim();
        const senha = document.getElementById('admin-senha').value;
        
        // Limpa mensagens de erro anteriores
        document.getElementById('admin-loginError').textContent = '';
        
        if (!usuario || !senha) {
            document.getElementById('admin-loginError').textContent = 'Preencha todos os campos';
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ usuario, senha })
            });

            if (response.ok) {
                // Login bem-sucedido
                const authToken = btoa(`${usuario}:${senha}`);
                localStorage.setItem('authToken', authToken);
                
                // Esconde o modal e mostra o conteúdo
                fecharLoginModal();
                mainContent.style.display = 'block';
                atualizarVisibilidadeLogin();
                
                // Carrega os dados do painel
                await carregarDados();
                
                // Limpa o formulário
                loginForm.reset();
            } else {
                const errorData = await response.json();
                document.getElementById('admin-loginError').textContent = 
                    errorData.message || 'Credenciais inválidas';
            }
        } catch (error) {
            console.error('Erro no login:', error);
            document.getElementById('admin-loginError').textContent = 
                'Erro na conexão com o servidor';
        }
    }

    // Restante do código permanece igual...
    function setupEventListeners() {
        // Botão de mostrar/ocultar senha
        const togglePassword = document.getElementById('togglePassword');
        if (togglePassword) {
            togglePassword.addEventListener('click', function() {
                const passwordInput = document.getElementById('admin-senha');
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                this.classList.toggle('fa-eye-slash');
            });
        }

        // Fechar modais ao clicar fora
        document.addEventListener('click', function(event) {
            if (event.target === loginModal) {
                fecharLoginModal();
            }
            if (event.target === document.getElementById('admin-alterarSenhaModal')) {
                fecharModalAlterarSenha();
            }
        });

        // Fechar modal com ESC
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                if (loginModal.style.display === 'flex') {
                    fecharLoginModal();
                }
                if (document.getElementById('admin-alterarSenhaModal').style.display === 'flex') {
                    fecharModalAlterarSenha();
                }
            }
        });
    }
    

        // Formulário de alterar senha
        const alterarSenhaForm = document.getElementById('admin-alterarSenhaForm');
        if (alterarSenhaForm) {
            alterarSenhaForm.addEventListener('submit', handleAlterarSenha);
        }
    }

);




    async function handleAlterarSenha(e) {
        e.preventDefault();
        const usuarioAtual = document.getElementById('admin-usuarioAtual').value;
        const senhaAtual = document.getElementById('admin-senhaAtual').value;
        const novoUsuario = document.getElementById('admin-novoUsuario').value;
        const novaSenha = document.getElementById('admin-novaSenha').value;
        const confirmarSenha = document.getElementById('admin-confirmarSenha').value;
        
        if (novaSenha !== confirmarSenha) {
            document.getElementById('admin-senhaError').textContent = 'As senhas não coincidem';
            return;
        }
        
        try {
            const response = await fetch('/api/alterar-credenciais', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(`${usuarioAtual}:${senhaAtual}`)}`
                },
                body: JSON.stringify({ 
                    usuarioAtual, 
                    senhaAtual, 
                    novoUsuario: novoUsuario || undefined, 
                    novaSenha 
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Sucesso!',
                    text: 'Credenciais atualizadas com sucesso!'
                });
                fecharModalAlterarSenha();
                
                // Atualizar token se o usuário ou senha foram alterados
                if (novoUsuario || novaSenha) {
                    const novoToken = btoa(`${novoUsuario || usuarioAtual}:${novaSenha}`);
                    localStorage.setItem('authToken', novoToken);
                }
            } else {
                document.getElementById('admin-senhaError').textContent = data.error || 'Erro ao alterar credenciais';
            }
        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            document.getElementById('admin-senhaError').textContent = 'Erro ao conectar com o servidor';
        }
    }

    async function carregarDados() {
        if (!verifyAuth()) return;
        
        try {
            await Promise.all([
                // Carregar configurações
                carregarConfiguracoes(),
                
                // Carregar produtos
                adicionarProduto(),
                
                // Carregar porções
                carregarPorcoes(),
                
                // Carregar cremes
                carregarCremes()
            ]);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            Swal.fire('Erro', 'Falha ao carregar dados', 'error');
        }
    }

    async function carregarConfiguracoes() {
        const configResponse = await fetch('/api/config', {
            headers: {
                'Authorization': `Basic ${localStorage.getItem('authToken')}`
            }
        });
        
        if (configResponse.ok) {
            const configData = await configResponse.json();
            document.getElementById('admin-telefone').value = configData.telefone;
            document.getElementById('admin-tempo-entrega').value = configData.tempoEntrega;
            document.getElementById('admin-taxa-entrega').value = configData.taxaEntrega.toFixed(2).replace('.', ',');
        }
    }

    async function adicionarProduto() {
        const produtosResponse = await fetch('/api/produtos', {
            headers: {
                'Authorization': `Basic ${localStorage.getItem('authToken')}`
            }
        });
        
        if (produtosResponse.ok) {
            // Implementar exibição dos produtos conforme necessário
        }
    }

    async function carregarPorcoes() {
        const porcoesResponse = await fetch('/api/porcoes', {
            headers: {
                'Authorization': `Basic ${localStorage.getItem('authToken')}`
            }
        });
        
        if (porcoesResponse.ok) {
            const porcoesData = await porcoesResponse.json();
            const porcoesList = document.getElementById('porcoes-list');
            porcoesList.innerHTML = '';
            
            porcoesData.forEach(porcao => {
                const item = document.createElement('div');
                item.className = 'editable-list-item';
                item.innerHTML = `
                    <input type="text" value="${porcao.nome}" data-id="${porcao.id}" data-field="nome">
                    <input type="text" value="${porcao.preco.toFixed(2).replace('.', ',')}" data-id="${porcao.id}" data-field="preco" oninput="aplicarMascara(this)">
                    <div class="editable-list-actions">
                        <button class="delete-item-btn" onclick="removerPorcao('${porcao.id}')">
                            <i class="fas fa-trash"></i> Remover
                        </button>
                    </div>
                `;
                porcoesList.appendChild(item);
            });
        }
    }

    async function carregarCremes() {
        const cremesResponse = await fetch('/api/cremes', {
            headers: {
                'Authorization': `Basic ${localStorage.getItem('authToken')}`
            }
        });
        
        if (cremesResponse.ok) {
            const cremesData = await cremesResponse.json();
            const cremesList = document.getElementById('cremes-list');
            cremesList.innerHTML = '';
            
            cremesData.forEach(creme => {
                const item = document.createElement('div');
                item.className = 'editable-list-item';
                item.innerHTML = `
                    <input type="text" value="${creme.nome}" data-id="${creme.id}">
                    <div class="editable-list-actions">
                        <button class="delete-item-btn" onclick="removerCreme('${creme.id}')">
                            <i class="fas fa-trash"></i> Remover
                        </button>
                    </div>
                `;
                cremesList.appendChild(item);
            });
        }
    }

    function setupFormularios() {
        setupFormularioContato();
        setupFormularioProduto();
    }

    function setupFormularioContato() {
        const formContato = document.getElementById('admin-form-contato');
        if (formContato) {
            formContato.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = {
                    telefone: document.getElementById('admin-telefone').value,
                    tempoEntrega: parseInt(document.getElementById('admin-tempo-entrega').value),
                    taxaEntrega: parseFloat(document.getElementById('admin-taxa-entrega').value.replace(',', '.'))
                };
                
                try {
                    const response = await fetch('/api/config', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Basic ${localStorage.getItem('authToken')}`
                        },
                        body: JSON.stringify(formData)
                    });
                    
                    if (response.ok) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Sucesso!',
                            text: 'Configurações salvas com sucesso!'
                        });
                    } else {
                        throw new Error('Erro ao salvar configurações');
                    }
                } catch (error) {
                    console.error('Erro:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Erro!',
                        text: 'Não foi possível salvar as configurações'
                    });
                }
            });
        }
    }

    function setupFormularioProduto() {
        const formProduto = document.getElementById('admin-form-produto');
        if (formProduto) {
            formProduto.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData();
                formData.append('nome', document.getElementById('admin-nome-produto').value);
                formData.append('tamanho', document.getElementById('admin-tamanho-produto').value);
                formData.append('preco', document.getElementById('admin-preco-produto').value);
                
                const imagemInput = document.getElementById('admin-imagem-produto');
                if (imagemInput.files[0]) {
                    formData.append('imagem', imagemInput.files[0]);
                }
                
                try {
                    const response = await fetch('/api/produtos', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Basic ${localStorage.getItem('authToken')}`
                        },
                        body: formData
                    });
                    
                    if (response.ok) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Sucesso!',
                            text: 'Produto adicionado com sucesso!'
                        });
                        
                        formProduto.reset();
                        document.getElementById('produto-preview').src = '';
                        carregarDados();
                    } else {
                        throw new Error('Erro ao adicionar produto');
                    }
                } catch (error) {
                    console.error('Erro:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Erro!',
                        text: 'Não foi possível adicionar o produto'
                    });
                }
            });
        }
        
        // Preview da imagem do produto
        const imagemInput = document.getElementById('admin-imagem-produto');
        if (imagemInput) {
            imagemInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        document.getElementById('produto-preview').src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }


    // Inicialização
    setupFormularios();
