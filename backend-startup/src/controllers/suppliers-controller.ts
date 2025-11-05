import { Request, Response } from 'express';
import { AppDataSource } from '../data-source'; 
import { Supplier } from '../entities/Supplier'; 
import { SupplierRequest } from '../types';
import { QueryFailedError } from 'typeorm'; 

// Obtém o repositório para a entidade Supplier
const supplierRepository = AppDataSource.getRepository(Supplier);

// GET: Listar todos os fornecedores
export const getSuppliers = async (req: Request, res: Response): Promise<void> => { // 👈 async
  try {
    // Usa o método find() do repositório
    const suppliers = await supplierRepository.find(); 
    res.status(200).json({
      message: 'Fornecedores listados com sucesso',
      data: suppliers 
    });
  } catch (error: any) {
    console.error("Erro em getSuppliers:", error);
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
  }
};

// POST: Criar um novo fornecedor
export const createSupplier = async (req: Request, res: Response): Promise<void> => { // 👈 async
  try {
    const { companyName, cnpj, contactName, phone }: SupplierRequest = req.body;

    if (!companyName || !cnpj) { /* ... (validação) */ return; }

    // Limpa CNPJ para verificação de duplicidade (igual antes)
    const cleanCnpj = cnpj.replace(/\D/g, ''); 

    // Tenta criar uma nova instância da Entidade
    const newSupplier = supplierRepository.create({ // Usa .create() para instanciar
       companyName: companyName.trim(),
       cnpj: cnpj, // Salva com máscara se houver
       contactName: contactName?.trim(),
       phone: phone?.trim()
    });

    // Tenta salvar no banco de dados
    const savedSupplier = await supplierRepository.save(newSupplier); // Usa .save()

    res.status(201).json({
      message: 'Fornecedor criado com sucesso',
      data: savedSupplier // Retorna o objeto salvo (com ID)
    });

  } catch (error: any) {
     console.error("Erro em createSupplier:", error);
     // Trata erro de violação de constraint UNIQUE (ex: CNPJ duplicado)
     if (error instanceof QueryFailedError && error.message.includes('UNIQUE constraint')) {
          if (error.message.includes('cnpj')) { // Verifica se foi no CNPJ
             res.status(400).json({ error: 'CNPJ duplicado', message: 'Já existe um fornecedor com este CNPJ.' });
             return;
          }
     }
    res.status(500).json({ error: 'Erro interno do servidor', message: 'Não foi possível criar o fornecedor.' });
  }
};