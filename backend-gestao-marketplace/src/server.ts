// Em src/server.ts
import 'reflect-metadata'; 
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDataSource } from './data-source'; // 👈 2. Importa o inicializador do TypeORM

// Importa os arquivos de rotas
import usersRoutes from './routes/users-routes';
import appRoutes from './routes/app-routes'; // Rota protegida de exemplo
import baseRoutes from './routes/base-routes'; // Rota base '/'
import productsRoutes from './routes/products-routes';
import salesRoutes from './routes/sales-routes';
import suppliersRoutes from './routes/suppliers-routes';
import reportsRoutes from './routes/reports-routes';

// Função assíncrona para encapsular a inicialização
const startServer = async () => {
  // Configurar variáveis de ambiente do .env
  dotenv.config();

  // 3. INICIALIZAR a conexão com o banco de dados via TypeORM
  // O aplicativo só continuará se a conexão for bem-sucedida
  await initializeDataSource();

  // Cria a instância do Express APÓS conectar ao DB
  const app = express();
  const PORT = process.env.PORT || 3000;

  // --- Middlewares Globais ---
  app.use(cors()); // Habilita CORS para permitir requisições do frontend
  app.use(express.json({ limit: '50mb' })); // Permite receber JSON no corpo (aumentado para base64)
  app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Permite receber dados de formulário URL-encoded

  // Middleware de log simples para cada requisição
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next(); // Passa para o próximo middleware ou rota
  });

  // --- Montando os Roteadores ---
  app.use('/api/users', usersRoutes);       // Rotas de Usuário (ex: /api/users/login)
  app.use('/api', appRoutes);               // Rotas genéricas protegidas (ex: /api/protected)
  app.use('/', baseRoutes);                 // Rota Raiz (ex: /)
  app.use('/api/products', productsRoutes); // Rotas de Produtos (CRUD)
  app.use('/api/sales', salesRoutes);       // Rotas de Vendas (Criar, Listar)
  app.use('/api/suppliers', suppliersRoutes); // Rotas de Fornecedores (Listar, Criar)
  app.use('/api/reports', reportsRoutes); // Rotas de Relatórios

  // --- Middlewares de Tratamento de Erro (devem vir DEPOIS das rotas) ---

  // Middleware para Rotas Não Encontradas (404)
  // Captura qualquer requisição que não correspondeu a nenhuma rota anterior
  app.use((req, res) => {
    res.status(404).json({
      error: 'Rota não encontrada',
      message: `O endpoint ${req.method} ${req.originalUrl} não existe neste servidor.`
    });
  });

  // Middleware Global de Tratamento de Erros (500)
  // Captura erros lançados pelos controllers ou outros middlewares
  // Nota: Precisa ter os 4 argumentos (err, req, res, next) para ser reconhecido como error handler
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Erro não tratado:', err.stack || err); // Log detalhado do erro no console do servidor
    res.status(500).json({
      error: 'Erro interno do servidor',
      // Envia mensagem detalhada apenas em ambiente de desenvolvimento
      message: process.env.NODE_ENV === 'development' ? err.message : 'Ocorreu um erro inesperado no servidor.'
    });
  });

  // --- Iniciar o Servidor Express ---
  app.listen(PORT, () => {
    console.log(`🚀 Servidor backend rodando em http://localhost:${PORT}`);
    console.log(`🟢 Conectado ao banco de dados via TypeORM`); // Mensagem de sucesso do TypeORM
  });

}; // Fim da função startServer

// --- Ponto de Entrada ---
// Chama a função assíncrona para iniciar todo o processo
startServer().catch(error => {
  // Captura erros que podem ocorrer ANTES do Express iniciar (ex: falha na conexão com DB)
  console.error("❌ Falha crítica ao iniciar o servidor:", error);
  process.exit(1); // Encerra a aplicação em caso de falha na inicialização
});

// Não precisamos mais exportar 'app' diretamente se este for o ponto de entrada principal
// export default app;