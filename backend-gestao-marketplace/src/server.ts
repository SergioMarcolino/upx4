// Em src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import usersRoutes from './routes/users-routes';
import appRoutes from './routes/app-routes';
import baseRoutes from './routes/base-routes';
import productsRoutes from './routes/products-routes';
import salesRoutes from './routes/sales-routes';
import suppliersRoutes from './routes/suppliers-routes'; // Importar rota de fornecedores

// Configurar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globais
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Aumentar limite para Base64
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware de log simples
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Montando os roteadores
app.use('/api/users', usersRoutes);       // Rotas de Usuário (login, register)
app.use('/api', appRoutes);               // Rota protegida de exemplo (/api/protected)
app.use('/', baseRoutes);                 // Rota base (/)
app.use('/api/products', productsRoutes); // Rotas de Produtos (CRUD)
app.use('/api/sales', salesRoutes);       // Rotas de Vendas (Criar)
app.use('/api/suppliers', suppliersRoutes); // Rotas de Fornecedores (Listar, Criar)

// Middleware para tratar rotas não encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.method} ${req.originalUrl} não existe neste servidor.`
  });
});

// Middleware global de tratamento de erros (500)
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro não tratado:', err.stack || err); // Log detalhado do erro
  res.status(500).json({
    error: 'Erro interno do servidor',
    // Mostrar mensagem de erro detalhada apenas em desenvolvimento
    message: process.env.NODE_ENV === 'development' ? err.message : 'Ocorreu um erro inesperado.'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando em http://localhost:${PORT}`);
});

export default app; // Exportar para possíveis testes