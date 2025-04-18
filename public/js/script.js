// ==============================
// Função para carregar os dados do JSON
// ==============================
async function loadData() {
    try {
        const response = await fetch('/data/dados.json');
        if (!response.ok) throw new Error(`Erro HTTP! status: ${response.status}`);
        const data = await response.json();
        return data; // <--- ESSENCIAL!
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        return null;
    }
}

// ==============================
// Atualiza o Instagram
// ==============================
function updateInstagram(instagramData) {
    const instagramElement = document.getElementById('instagram-loja');
    if (!instagramElement) return;

    if (instagramData.startsWith('@')) {
        instagramElement.href = `https://instagram.com/${instagramData.replace('@', '')}`;
        instagramElement.querySelector('span').textContent = instagramData;
    } else if (instagramData.includes('instagram.com')) {
        instagramElement.href = instagramData;
        instagramElement.querySelector('span').textContent = `@${instagramData.split('/').pop()}`;
    }
}

// ==============================
// Atualiza o status da loja
// ==============================
function atualizarStatusLoja(config) {
    const agora = new Date();
    const atualEmMinutos = agora.getHours() * 60 + agora.getMinutes();

    const statusDiv = document.getElementById('index-status-loja');
    const statusTexto = document.getElementById('index-status-texto');

    if (!statusDiv || !statusTexto || !config) return;

    const abertura = timeToMinutes(config.horarioAbertura);   // "08:00"
    const fechamento = timeToMinutes(config.horarioFechamento); // "18:00"

    if (atualEmMinutos >= abertura && atualEmMinutos < fechamento) {
        statusDiv.classList.remove('offline');
        statusDiv.classList.add('online');
        statusTexto.textContent = 'Loja Aberta';
    } else {
        statusDiv.classList.remove('online');
        statusDiv.classList.add('offline');
        statusTexto.textContent = 'Loja Fechada';
    }

    // Conversão de hora para minutos
    function timeToMinutes(time) {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    }
}

// ==============================
// Atualiza o logo
// ==============================
function updateLogo(logoPath) {
    const logoElement = document.getElementById('logoLoja'); // Usa ID correto
    if (logoElement && logoPath) {
        logoElement.src = logoPath;
        logoElement.style.display = 'block';
    }
}

// ==============================
// Atualiza o link do WhatsApp
// ==============================
function updateWhatsApp(telefone) {
    const whatsappBtn = document.querySelector('.index-btn-whatsapp');
    if (whatsappBtn && telefone) {
        const numero = telefone.replace(/\D/g, '');
        whatsappBtn.onclick = () => window.location.href = `https://wa.me/${numero}`;
    }
}

// ==============================
// Inicialização ao carregar a página
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
    const data = await loadData();
    if (!data) return;

    const config = data.configLoja;
    const contato = data.contato;

    if (config?.instagram) updateInstagram(config.instagram);
    if (config?.logoPath) updateLogo(config.logoPath);
    if (contato?.telefone) updateWhatsApp(contato.telefone);

    // Atualiza status da loja
    atualizarStatusLoja(config);
    setInterval(() => atualizarStatusLoja(config), 60000);
});
