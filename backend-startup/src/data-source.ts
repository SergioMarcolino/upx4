// Em src/data-source.ts
import 'reflect-metadata'; // Import necessário no topo
import { DataSource, DataSourceOptions } from 'typeorm';
import { sqlConfig } from './config'; // Importa nossa configuração base (com user/password)

// 1. IMPORTE TODAS AS SUAS ENTIDADES AQUI
import { User } from './entities/User';
import { Product } from './entities/Product';
import { Supplier } from './entities/Supplier';
import { Sale } from './entities/Sale';
import { SaleItem } from './entities/SaleItem';
import { StockMovement } from './entities/StockMovement';


export const AppDataSource = new DataSource({
    type: 'mssql', // Indica SQL Server
    host: sqlConfig.server, // Pega do config.ts
    port: sqlConfig.port || 1433, // Pega do config.ts ou usa padrão 1433
    database: sqlConfig.database, // Pega do config.ts

    // 👇 ==============================================
    // 👇 AUTENTICAÇÃO SQL SERVER (CORRIGIDO) 👇
    // 👇 ==============================================
    username: sqlConfig.user,     // 👈 USA O USUÁRIO definido no config.ts
    password: sqlConfig.password, // 👈 USA A SENHA definida no config.ts
    // 👆 ==============================================

    // 👇 OPÇÕES (SEM trustedConnection) 👇
    options: {
        // trustedConnection: true, // REMOVIDO!
        trustServerCertificate: sqlConfig.options?.trustServerCertificate ?? true, // Pega da config ou default true
        // encrypt: sqlConfig.options?.encrypt ?? false // Pega da config ou default false
    },

    synchronize: false, // Mantenha false para segurança
    logging: true, // Mantenha true para debug durante o desenvolvimento

    // 👇 LISTA AS ENTIDADES DIRETAMENTE (Mais confiável com ts-node) 👇
    entities: [
        User,
        Supplier,
        Product,
        StockMovement,
        Sale,
        SaleItem
        // Adicione outras entidades aqui se criar mais
    ],
    // migrationsRun: false, // Descomente se usar migrations

    // Caminho para futuras migrações (ajuste se necessário)
    migrations: [__dirname + '/migrations/**/*.js'], // Ou .ts se usar ts-node diretamente

    // Configurações extras do pool (opcional)
    extra: {
        pool: sqlConfig.pool
    }

} as DataSourceOptions);

// Função para inicializar a conexão (sem alterações)
export const initializeDataSource = async () => {
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log('[TypeORM] DataSource inicializado com sucesso!');
        }
    } catch (error) {
        console.error('[TypeORM] Erro ao inicializar DataSource:', error);
        // Em vez de process.exit(1), podemos apenas lançar o erro
        // para que o startServer() no server.ts possa capturá-lo.
        throw error; 
       // process.exit(1);
    }
};