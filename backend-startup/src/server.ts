import 'reflect-metadata'; 
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDataSource } from './data-source'; 


import usersRoutes from './routes/users-routes';
import appRoutes from './routes/app-routes'; 
import baseRoutes from './routes/base-routes'; 
import productsRoutes from './routes/products-routes';
import salesRoutes from './routes/sales-routes';
import suppliersRoutes from './routes/suppliers-routes';
import reportsRoutes from './routes/reports-routes';

const startServer = async () => {
  dotenv.config();

  await initializeDataSource();

  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors()); 
  app.use(express.json({ limit: '50mb' })); 
  app.use(express.urlencoded({ extended: true, limit: '50mb' })); 

  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next(); 
  });

  // --- Montando os Roteadores ---
  app.use('/api/users', usersRoutes);       // Rotas de Usuário (ex: /api/users/login)
  app.use('/api', appRoutes);               // Rotas genéricas protegidas (ex: /api/protected)
  app.use('/', baseRoutes);                 // Rota Raiz (ex: /)
  app.use('/api/products', productsRoutes); // Rotas de Produtos (CRUD)
  app.use('/api/sales', salesRoutes);       // Rotas de Vendas (Criar, Listar)
  app.use('/api/suppliers', suppliersRoutes); // Rotas de Fornecedores (Listar, Criar)
  app.use('/api/reports', reportsRoutes); // Rotas de Relatórios


  app.use((req, res) => {
    res.status(404).json({
      error: 'Rota não encontrada',
      message: `O endpoint ${req.method} ${req.originalUrl} não existe neste servidor.`
    });
  });

  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Erro não tratado:', err.stack || err); 
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Ocorreu um erro inesperado no servidor.'
    });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Servidor backend rodando em http://localhost:${PORT}`);
    console.log(`🟢 Conectado ao banco de dados via TypeORM`);
  });

}; 

startServer().catch(error => {
  console.error("❌ Falha crítica ao iniciar o servidor:", error);
  process.exit(1); 
});
