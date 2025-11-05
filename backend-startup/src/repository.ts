import fs from 'fs';
import path from 'path';
import { Product, User, Sale, StockMovement, Supplier } from './types';

const dbRoot = path.join(__dirname, '..');

interface DbSchema {
  products: Product[];
  users: User[];
  sales: Sale[];
  stock_movements: StockMovement[];
  suppliers: Supplier[]; 
}

export const db = {

  read: (): DbSchema => {
    try {
      const readFileOrDefault = <T>(fileName: string): T[] => {
        const filePath = path.join(dbRoot, fileName);
        if (fs.existsSync(filePath)) {
          const data = fs.readFileSync(filePath, 'utf-8');
          return JSON.parse(data) as T[];
        }
        return []; 
      };

      const products = readFileOrDefault<Product>('products.json');
      const users = readFileOrDefault<User>('users.json');
      const sales = readFileOrDefault<Sale>('sales.json');
      const stock_movements = readFileOrDefault<StockMovement>('stock_movements.json');
      const suppliers = readFileOrDefault<Supplier>('suppliers.json'); 

      return { products, users, sales, stock_movements, suppliers };

    } catch (err: any) {
      console.error("ERRO FATAL AO LER ARQUIVOS .json:", err);
      throw new Error(`Falha ao ler o banco de dados JSON: ${err.message}`);
    }
  },

  write: (data: DbSchema) => {
    try {
      const writeFile = (fileName: string, content: any): void => {
        const filePath = path.join(dbRoot, fileName);
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf-8');
      };

      writeFile('products.json', data.products);
      writeFile('users.json', data.users);
      writeFile('sales.json', data.sales);
      writeFile('stock_movements.json', data.stock_movements);
      writeFile('suppliers.json', data.suppliers); 

    } catch (err: any) {
      console.error("ERRO FATAL AO SALVAR ARQUIVOS .json:", err);
      throw new Error(`Falha ao salvar o banco de dados JSON: ${err.message}`);
    }
  }
};