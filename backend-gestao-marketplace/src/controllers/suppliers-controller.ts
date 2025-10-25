// Em src/controllers/suppliers-controller.ts
import { Request, Response } from 'express';
import { db } from '../repository';
import { SupplierRequest, Supplier } from '../types'; // Importar Supplier

// GET: Listar todos os fornecedores
export const getSuppliers = (req: Request, res: Response): void => {
  try {
    const data = db.read();
    res.status(200).json({
      message: 'Fornecedores listados com sucesso',
      // Garante que retorne um array mesmo se o arquivo não existir inicialmente
      data: data.suppliers || [] 
    });
  } catch (error: any) {
    console.error("Erro em getSuppliers:", error);
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
  }
};

// POST: Criar um novo fornecedor
export const createSupplier = (req: Request, res: Response): void => {
  try {
    const { companyName, cnpj, contactName, phone }: SupplierRequest = req.body;

    // Validação básica de campos obrigatórios
    if (!companyName || !cnpj) {
      res.status(400).json({ error: 'Campos obrigatórios', message: 'Nome da Empresa e CNPJ são obrigatórios.' });
      return;
    }

    const data = db.read();
    // Garante que data.suppliers seja um array
    const suppliers = data.suppliers || []; 

    // Validação de CNPJ duplicado
    // Remove caracteres não numéricos do CNPJ para comparação
    const cleanCnpj = cnpj.replace(/\D/g, ''); 
    if (suppliers.some(s => s.cnpj.replace(/\D/g, '') === cleanCnpj)) {
       res.status(400).json({ error: 'CNPJ duplicado', message: 'Já existe um fornecedor com este CNPJ.' });
       return;
    }

    // Calcula o próximo ID
    const newSupplierId = suppliers.length > 0 ? Math.max(...suppliers.map(s => s.id)) + 1 : 1;

    const newSupplier: Supplier = {
      id: newSupplierId,
      companyName: companyName.trim(), // Remove espaços extras
      cnpj: cnpj, // Salva o CNPJ como foi enviado (pode incluir máscara)
      contactName: contactName?.trim(),
      phone: phone?.trim()
    };

    // Adiciona ao array e salva
    suppliers.push(newSupplier);
    data.suppliers = suppliers; // Atualiza o objeto data
    db.write(data);

    res.status(201).json({
      message: 'Fornecedor criado com sucesso',
      data: newSupplier
    });

  } catch (error: any) {
     console.error("Erro em createSupplier:", error);
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
  }
};