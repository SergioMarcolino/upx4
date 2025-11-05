// Em src/repository.ts
import fs from 'fs';
import path from 'path';
// Importa todos os tipos
import { Product, User, Sale, StockMovement, Supplier } from './types';

// Define o caminho para a raiz do projeto (onde estão os .json)
const dbRoot = path.join(__dirname, '..');

// Interface para a "forma" do nosso banco de dados
interface DbSchema {
  products: Product[];
  users: User[];
  sales: Sale[];
  stock_movements: StockMovement[];
  suppliers: Supplier[]; // Adicionado
}

// Objeto central para ler e escrever
export const db = {
  /**
   * Lê todos os arquivos .json e retorna um objeto único
   */
  read: (): DbSchema => {
    try {
      // Função auxiliar para ler um arquivo JSON ou retornar array vazio
      const readFileOrDefault = <T>(fileName: string): T[] => {
        const filePath = path.join(dbRoot, fileName);
        if (fs.existsSync(filePath)) {
          const data = fs.readFileSync(filePath, 'utf-8');
          return JSON.parse(data) as T[];
        }
        return []; // Retorna array vazio se o arquivo não existe
      };

      const products = readFileOrDefault<Product>('products.json');
      const users = readFileOrDefault<User>('users.json');
      const sales = readFileOrDefault<Sale>('sales.json');
      const stock_movements = readFileOrDefault<StockMovement>('stock_movements.json');
      const suppliers = readFileOrDefault<Supplier>('suppliers.json'); // Adicionado

      // Retorna tudo em um objeto organizado
      return { products, users, sales, stock_movements, suppliers };

    } catch (err: any) {
      console.error("ERRO FATAL AO LER ARQUIVOS .json:", err);
      // Lança um erro mais informativo
      throw new Error(`Falha ao ler o banco de dados JSON: ${err.message}`);
    }
  },

  /**
   * Recebe o objeto do banco e salva cada parte em seu respectivo .json
   */
  write: (data: DbSchema) => {
    try {
      // Função auxiliar para escrever em um arquivo JSON
      const writeFile = (fileName: string, content: any): void => {
        const filePath = path.join(dbRoot, fileName);
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf-8');
      };

      writeFile('products.json', data.products);
      writeFile('users.json', data.users);
      writeFile('sales.json', data.sales);
      writeFile('stock_movements.json', data.stock_movements);
      writeFile('suppliers.json', data.suppliers); // Adicionado

    } catch (err: any) {
      console.error("ERRO FATAL AO SALVAR ARQUIVOS .json:", err);
       // Lança um erro mais informativo
      throw new Error(`Falha ao salvar o banco de dados JSON: ${err.message}`);
    }
  }
};