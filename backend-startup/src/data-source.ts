import 'reflect-metadata'; 
import { DataSource, DataSourceOptions } from 'typeorm';
import { sqlConfig } from './config'; 

import { User } from './entities/User';
import { Product } from './entities/Product';
import { Supplier } from './entities/Supplier';
import { Sale } from './entities/Sale';
import { SaleItem } from './entities/SaleItem';
import { StockMovement } from './entities/StockMovement';


export const AppDataSource = new DataSource({
    type: 'mssql', 
    host: sqlConfig.server, 
    port: sqlConfig.port || 1433, 
    database: sqlConfig.database, 

    username: sqlConfig.user,     
    password: sqlConfig.password, 
    options: {
        
        trustServerCertificate: sqlConfig.options?.trustServerCertificate ?? true, 
    },

    synchronize: false, 
    logging: true, 

    entities: [
        User,
        Supplier,
        Product,
        StockMovement,
        Sale,
        SaleItem
        
    ],
    

    migrations: [__dirname + '/migrations/**/*.js'], 

    extra: {
        pool: sqlConfig.pool
    }

} as DataSourceOptions);

export const initializeDataSource = async () => {
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log('[TypeORM] DataSource inicializado com sucesso!');
        }
    } catch (error) {
        console.error('[TypeORM] Erro ao inicializar DataSource:', error);

        throw error; 
    }
};