import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

import { JWT_SECRET } from '../config';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {

  if (!JWT_SECRET) {
    console.error("ERRO FATAL: JWT_SECRET não definida ou vazia no arquivo src/config.ts (middleware)");
    res.status(500).json({ error: 'Erro de configuração interna', message: 'O servidor não está configurado corretamente para autenticação.' });
    return;
  } 


  console.log('\n--- MIDDLEWARE ---'); 



  const authHeader = req.headers['authorization'];


  console.log('Authorization Header Recebido:', authHeader); 

  let token: string | undefined = undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); 
  }

  console.log('Token EXTRAÍDO:', token); 
  console.log('JWT_SECRET usada para VERIFY:', JWT_SECRET); 

  if (!token) {
    console.log('Middleware: Token não encontrado ou formato inválido no header.'); // Log adicional
    res.status(401).json({
      error: 'Token de acesso requerido',
      message: 'Forneça um token JWT válido no header Authorization no formato "Bearer seu_token".'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // --- LOG DE DEBUG ---
    console.log('Token VERIFICADO com sucesso:', decoded); 

    req.user = decoded; 
    next(); 

  } catch (error: any) { 


    console.error('ERRO na verificação JWT:', error.name, '-', error.message); 

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'Token expirado',
        message: 'O seu token de acesso expirou. Por favor, faça login novamente.'
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({
        error: 'Token inválido',
        message: `O token fornecido é inválido (${error.message}). Verifique a chave secreta ou o formato do token.`
      });
      return;
    }

    console.error("Erro desconhecido na validação do token:", error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Ocorreu um problema ao tentar validar o token de acesso.'
    });
  }
};