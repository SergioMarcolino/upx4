// Em src/config.ts
import { config as MSSQLConfig } from 'mssql'; 

export const JWT_SECRET = 'SuaChaveSecretaMuitoSeguraAqui123!@#$'; 
export const SERVER_PORT = 3000;

// --- Nome de Usuário e Senha do SQL Server ---
// ❗️ IMPORTANTE: NÃO coloque a senha direto aqui em produção!
//    Use variáveis de ambiente (.env) para segurança.
const DB_USER = 'fluxa_app_user';     // 👈 Coloque o nome de logon que você criou
const DB_PASSWORD = 'sergio'; // 👈 Coloque a senha que você criou

export const sqlConfig: MSSQLConfig = {

  server: 'DESKTOP-8OAV9DP', // Mantenha o nome do servidor
  database: 'FluxaDB',        
  port: 1433,                 
  // driver: 'msnodesqlv8', // REMOVA ou comente esta linha

  // Adiciona usuário e senha
  user: DB_USER,
  password: DB_PASSWORD,

  options: {
    // trustedConnection: true, // REMOVA ou comente esta linha
    trustServerCertificate: true, 
    // encrypt: false // Mantenha false para dev local, a menos que o server exija
  },

  pool: { 
    max: 10, 
    min: 0, 
    idleTimeoutMillis: 30000 
  }
};

// --- Recomendação de Segurança (Usando .env) ---
/* // 1. Crie um arquivo .env na raiz com:
//    DB_USER=fluxa_app_user
//    DB_PASSWORD=SuaSenhaForteAqui
//    DB_SERVER=DESKTOP-8OAV9DP
//    DB_DATABASE=FluxaDB

// 2. Instale dotenv: npm install dotenv

// 3. Modifique o config.ts para ler do .env:
import dotenv from 'dotenv';
dotenv.config(); // Carrega variáveis do .env

export const sqlConfig: MSSQLConfig = {
    server: process.env.DB_SERVER || 'DESKTOP-8OAV9DP', // Usa .env ou um fallback
    database: process.env.DB_DATABASE || 'FluxaDB',
    port: 1433,
    user: process.env.DB_USER, // Lê do .env
    password: process.env.DB_PASSWORD, // Lê do .env
    options: {
        trustServerCertificate: true, 
    },
    pool: { ... }
};
*/