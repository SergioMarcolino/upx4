// Em src/config.ts
import { config as MSSQLConfig } from 'mssql'; 

export const JWT_SECRET = 'SuaChaveSecretaMuitoSeguraAqui123!@#$'; 
export const SERVER_PORT = 3000;

const DB_USER = 'fluxa_app_user';     
const DB_PASSWORD = 'sergio'; 

export const sqlConfig: MSSQLConfig = {

  server: 'DESKTOP-8OAV9DP', 
  database: 'FluxaDB',        
  port: 1433,                 

  user: DB_USER,
  password: DB_PASSWORD,

  options: {
    trustServerCertificate: true, 
  },

  pool: { 
    max: 10, 
    min: 0, 
    idleTimeoutMillis: 30000 
  }
};
