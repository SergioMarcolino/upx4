import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
// Certifique-se que o caminho para 'types' está correto
import { Product, ProductRequest } from '../types'; 

// Ajuste o caminho conforme a estrutura real do seu backend
const PRODUCTS_FILE = path.join(__dirname, '../../products.json'); 

// Carregar produtos do arquivo JSON
const loadProducts = (): Product[] => {
    try {
        const productsData = fs.readFileSync(PRODUCTS_FILE, 'utf8');
        return JSON.parse(productsData) as Product[];
    } catch (error) {
        // CORREÇÃO: Asserção de tipo para que o TypeScript reconheça a propriedade 'code'
        const fileError = error as any; 
        
        // Se o arquivo não existir ou estiver vazio, retorna um array vazio
        if (fileError.code === 'ENOENT') {
            return [];
        }
        console.error('Erro ao carregar produtos:', error);
        return [];
    }
};

// Salvar produtos no arquivo JSON
const saveProducts = (products: Product[]): void => {
    try {
        fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
    } catch (error) {
        console.error('Erro ao salvar produtos:', error);
    }
};

// =======================================================
// GET: Listar Produtos
// =======================================================
export const getProducts = (req: Request, res: Response): void => {
    try {
        const products = loadProducts();
        
        res.status(200).json({
            message: 'Produtos listados com sucesso',
            data: products
        });
    } catch (error) {
        console.error('Erro ao listar produtos:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível listar os produtos'
        });
    }
};

// =======================================================
// POST: Criar Produto
// =======================================================
export const createProduct = (req: Request, res: Response): void => {
    try {
        const { 
            title, 
            purchase_price, 
            sale_price, 
            description, 
            category, 
            imageBase64,
            supplier,
            quantity
        }: ProductRequest = req.body;

        // 🎯 VALIDAÇÃO FINAL E ROBUSTA: 
        const requiredStringFields = [title, description, category, imageBase64, supplier];
        const requiredNumberFields = [purchase_price, sale_price, quantity];

        // Checa se alguma string é null, undefined ou vazia/só espaços
        const hasEmptyString = requiredStringFields.some(field => 
            field === undefined || field === null || (typeof field === 'string' && field.trim() === '')
        );
        
        // Checa se algum número é null ou undefined (aceitando 0 no payload se a validação > 0 for separada)
        const hasUndefinedNumber = requiredNumberFields.some(field => field === undefined || field === null);

        if (hasEmptyString || hasUndefinedNumber) {
            res.status(400).json({
                error: 'Campos obrigatórios',
                message: 'Título, preços, descrição, categoria, imagem, fornecedor e quantidade são obrigatórios.'
            });
            return;
        }
        
        // Validação de valores numéricos (garantindo que são positivos)
        

        const products = loadProducts();
        const newProductId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;

        const newProduct: Product = {
            id: newProductId,
            title,
            purchase_price,
            sale_price,
            description,
            category,
            status: "anunciado",
            imageBase64,
            supplier,
            quantity,
            date: new Date().toISOString()
        };

        products.push(newProduct);
        saveProducts(products);

        res.status(201).json({
            message: 'Produto cadastrado com sucesso',
            data: newProduct
        });

    } catch (error) {
        console.error('Erro ao cadastrar produto:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível cadastrar o produto'
        }
        );
    }
};

// =======================================================
// PUT: Atualizar Produto
// =======================================================
export const updateProduct = (req: Request, res: Response): void => {
    try {
        const { id } = req.params;
        const updateData = req.body; 

        const products = loadProducts();
        const productIndex = products.findIndex(p => p.id === parseInt(id));

        if (productIndex === -1) {
            res.status(404).json({
                error: 'Produto não encontrado',
                message: `Nenhum produto com o ID ${id} foi encontrado.`
            });
            return;
        }

        const updatedDataWithDate = { ...updateData, date: new Date().toISOString() };
        const updatedProduct: Product = { ...products[productIndex], ...updatedDataWithDate };
        products[productIndex] = updatedProduct;

        saveProducts(products);

        res.status(200).json({
            message: `Produto com o ID ${id} atualizado com sucesso`,
            data: updatedProduct
        });

    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível atualizar o produto'
        });
    }
};