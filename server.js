const express = require('express');
const fs = require('fs').promises;
//const bodyParser = require('bosy-parser')
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Configuração correta do rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // limite de 100 requisições por IP
});

const dadosPath = path.join(__dirname, 'data', 'dados.json');


app.set('trust proxy', 1); // Ou true, mas 1 é mais seguro pra ambientes como Render


// Middleware para permitir JSON no body das requisições
app.use(express.json());
app.use(cors());
app.use(express.static('public'));
app.use(express.static('template'));
app.use(express.static(__dirname)); // Serve a raiz do projeto, onde está o paymentService.js
app.use(limiter)
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
// Servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de log das requisições
app.use((req, _, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'template', 'index.html'));
});

// Rota de login do administrador
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;

  console.log('Tentativa de login:', 'Usuário:', username, '/ Senha:', password); // <-- AQUI

  try {
      const data = await fs.readFile(dadosPath, 'utf8'); // Use readFile com await
      const dados = JSON.parse(data);

      // Verifique as credenciais
      if (username === dados.adminCredentials.username && password === dados.adminCredentials.password)
        {
          return res.json({ success: true });
      } else {
          return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
      }
  } catch (error) {
      console.error('Erro ao ler dados:', error);
      return res.status(500).json({ success: false, message: 'Erro ao processar a requisição' });
  }
});

// Rota para salvar as configurações da loja
app.post('/api/config-loja', async (req, res) => {
  try {
    const { horarioAbertura, horarioFechamento, instagramLink } = req.body;

    const data = await fs.readFile(dadosPath, 'utf8');
    const dados = JSON.parse(data);

    // Cria a seção configLoja se não existir
    dados.configLoja = dados.configLoja || {}; 
    dados.configLoja.horarioAbertura = horarioAbertura;
    dados.configLoja.horarioFechamento = horarioFechamento;
    dados.configLoja.instagramLink = instagramLink;

    await fs.writeFile(dadosPath, JSON.stringify(dados, null, 2));
    res.json({ 
      success: true,
      message: 'Configurações da loja atualizadas com sucesso!'
     });

  } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao salvar configurações da loja.' 
  });
  }
});



// Rota para atualizar as credenciais do admin
app.post('/api/admin/update-credentials', async (req, res) => {
    try {
        const data = await fs.readFile(dadosPath, 'utf-8');
        const dados = JSON.parse(data);

        // Validação de credenciais atuais
        if (
            req.body.currentUsername !== dados.adminCredentials.username ||
            req.body.currentPassword !== dados.adminCredentials.password
        ) {
            return res.status(403).json({
                success: false,
                message: 'Credenciais atuais incorretas'
            });
        }

        // Verifica se as novas senhas coincidem
        if (req.body.newPassword !== req.body.confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'As novas senhas não coincidem'
            });
        }

        // Atualiza os dados
        dados.adminCredentials = {
            username: req.body.newUsername || dados.adminCredentials.usuario,
            password: req.body.newPassword
        };

        await fs.writeFile(dadosPath, JSON.stringify(dados, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao atualizar credenciais:', error);
        res.status(500).json({
            success: false,
            message: 'Erro na atualização'
        });
    }
});


// Rota para servir o admin.html (novo caminho)
app.get('/admin', (_, res) => {
    res.sendFile(path.join(__dirname, 'template', 'admin.html'));
});



// Rota para salvar um novo produto
app.post('/api/admin/salvar-produto', async (req, res) => {
  try {
      const { nome, tamanho, preco, imagem } = req.body;

      // Ler os dados existentes
      const data = await fs.readFile(dadosPath, 'utf-8');
      const dados = JSON.parse(data);

      // Adicionar o novo produto
      const novoProduto = { nome, tamanho, preco, imagem };
      dados.produtos.push(novoProduto);

      // Salvar os dados atualizados
      await fs.writeFile(dadosPath, JSON.stringify(dados, null, 2));
      res.json({ success: true, message: 'Produto salvo com sucesso!' });
  } catch (error) {
      console.error('Erro ao salvar o produto:', error);
      res.status(500).json({ success: false, message: 'Erro ao salvar o produto.' });
  }
});

// ========== CONFIGURAÇÃO DO MULTER ==========
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = '';
    if (file.fieldname === 'imagemProduto') folder = 'produtos';
    if (file.fieldname === 'logoLoja') folder = 'logos';
    
    const dir = path.join(__dirname, 'public', 'uploads', folder);

    fs.mkdir(dir, { recursive: true })
      .then(() => cb(null, dir))
      .catch(err => cb(err, dir));

  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado. Use apenas JPEG, PNG ou WebP'));
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});

// Rota para atualizar imagem do produto
app.post('/api/admin/upload-produto', upload.single('imagemProduto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Nenhuma imagem enviada' });
    }

    const imagePath = `/uploads/produtos/${req.file.filename}`;
    
    // Atualize no seu banco de dados ou dados.json
    res.json({ 
      success: true, 
      imagePath,
      message: 'Imagem do produto atualizada com sucesso' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});



// Rota para atualizar logo da loja
app.post('/api/admin/upload-logo', upload.single('logoLoja'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Nenhuma imagem enviada' });
    }

    const logoPath = `/uploads/logos/${req.file.filename}`;

    // Atualiza no dados.json
    const data = await fs.readFile(dadosPath, 'utf8');
    const dados = JSON.parse(data);

    dados.configLoja = dados.configLoja || {};
    dados.configLoja.logoPath = logoPath;

    await fs.writeFile(dadosPath, JSON.stringify(dados, null, 2));

    res.json({ success: true, logoPath, message: 'Logo atualizado com sucesso!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Rota para salvar informações de contato
app.post('/api/admin/salvar-contato', async (req, res) => {
  try {
      const { telefone, tempoEntrega, taxaEntrega } = req.body;

      // Ler os dados existentes
      const data = await fs.readFile(dadosPath, 'utf-8');
      const dados = JSON.parse(data);

      // Atualizar as informações de contato
      dados.contato = { telefone, tempoEntrega, taxaEntrega };

      // Salvar os dados atualizados
      await fs.writeFile(dadosPath, JSON.stringify(dados, null, 2));
      res.json({ 
        success: true, 
        message: 'Informações de contato salvas com sucesso!' });


  } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao salvar as informações de contato.' });
  }
});

// Rota para salvar porções
app.post('/api/admin/salvar-porcoes', async (req, res) => {
  try {
      const porcoes = req.body;

      // Ler os dados existentes
      const data = await fs.readFile(dadosPath, 'utf-8');
      const dados = JSON.parse(data);

      // Atualizar as porções
      dados.porcoes = porcoes;

      // Salvar os dados atualizados
      await fs.writeFile(dadosPath, JSON.stringify(dados, null, 2));
      res.json({ success: true, message: 'Porções salvas com sucesso!' });
  } catch (error) {
      console.error('Erro ao salvar as porções:', error);
      res.status(500).json({ success: false, message: 'Erro ao salvar as porções.' });
  }
});

// Rota para salvar cremes
app.post('/api/admin/salvar-cremes', async (req, res) => {
  try {
      const cremes = req.body;

      // Ler os dados existentes
      const data = await fs.readFile(dadosPath, 'utf-8');
      const dados = JSON.parse(data);

      // Atualizar os cremes
      dados.cremes = cremes;

      // Salvar os dados atualizados
      await fs.writeFile(dadosPath, JSON.stringify(dados, null, 2));
      res.json({ success: true, message: 'Cremes salvos com sucesso!' });
  } catch (error) {
      console.error('Erro ao salvar os cremes:', error);
      res.status(500).json({ success: false, message: 'Erro ao salvar os cremes.' });
  }
});



// Rota para obter os dados
app.get('/api/admin/dados', async (req, res) => {
  // Verificar token/autorização aqui
  try {
      const data = await fs.readFile(dadosPath, 'utf8');
      const dados = JSON.parse(data);
      res.json({ success: true, dados });
  } catch (error) {
      console.error('Erro ao ler dados:', error);
      res.status(500).json({ success: false, message: 'Erro ao carregar dados' });
  }
});

// ... (outras configurações)

// ========== CRIAÇÃO DE DIRETÓRIOS ==========
const createUploadDirs = async () => {
  const dirs = [
    path.join(__dirname, 'public', 'uploads', 'logos'),
    path.join(__dirname, 'public', 'uploads', 'produtos')
  ];

  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
      
    } catch (err) {
      console.error(`Erro ao criar diretório ${dir}:`, err);
    }
  }
};

// Adicione esta rota para servir dados do cardápio
app.get('/api/dados', async (req, res) => {
  try {
      const data = await fs.readFile(dadosPath, 'utf8');
      const dados = JSON.parse(data);
      res.json(dados);
  } catch (error) {
      console.error('Erro ao carregar dados:', error);
      res.status(500).json({ error: 'Erro ao carregar dados' });
  }
});

app.post('/api/admin/salvar-pix', async (req, res) => {
  try {
      const { nomeRecebedor, chavePix, email } = req.body;

      // Ler dados existentes
      const data = await fs.readFile(dadosPath, 'utf8');
      const dados = JSON.parse(data);

      // Criar/atualizar seção de pagamento
      dados.pagamento = dados.pagamento || {};
      dados.pagamento.pix = {
          nomeRecebedor,
          chavePix,
          email
      };

      // Salvar dados atualizados
      await fs.writeFile(dadosPath, JSON.stringify(dados, null, 2));
      
      res.json({ 
          success: true,
          message: 'Dados PIX salvos com sucesso!'
      });

  } catch (error) {
      console.error('Erro ao salvar dados PIX:', error);
      res.status(500).json({
          success: false,
          message: 'Erro ao salvar dados PIX'
      });
  }
});

// Rota para obter configurações do PIX
app.get('/api/pix-config', async (req, res) => {
  try {
      const data = await fs.readFile(dadosPath, 'utf8');
      const config = JSON.parse(data).pagamento.pix;
      
      if (!config.chavePix || !config.nomeRecebedor) {
          return res.status(400).json({ error: 'Configuração do PIX incompleta no arquivo de dados' });
      }

      res.json({
          chave: config.chavePix,
          nome: config.nomeRecebedor
      });
  } catch (error) {
      console.error('Erro na rota /api/pix-config:', error);
      res.status(500).json({ 
          error: 'Erro ao obter configurações do PIX',
          details: error.message
      });
  }
});

// ========== INICIALIZAÇÃO DO SERVIDOR ==========
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

