// Em src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

// Importa a chave secreta do arquivo de configuração centralizado
import { JWT_SECRET } from '../config';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {

  // Verifica se a chave secreta foi carregada corretamente do config.ts
  if (!JWT_SECRET) {
    console.error("ERRO FATAL: JWT_SECRET não definida ou vazia no arquivo src/config.ts (middleware)");
    res.status(500).json({ error: 'Erro de configuração interna', message: 'O servidor não está configurado corretamente para autenticação.' });
    return;
  }

  // --- LOGS DE DEBUG ---
  console.log('\n--- MIDDLEWARE ---'); // Marcador de início
  // --- FIM LOGS DE DEBUG ---

  // Pega o header 'Authorization'
  const authHeader = req.headers['authorization'];

  // --- LOG DE DEBUG ---
  console.log('Authorization Header Recebido:', authHeader); // Log: Mostra o header bruto
  // --- FIM LOG DE DEBUG ---

  // Tenta extrair o token APÓS "Bearer "
  let token: string | undefined = undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Pega a string a partir do 7º caractere
  }

  // --- LOGS DE DEBUG ---
  console.log('Token EXTRAÍDO:', token); // Log: Mostra o token limpo
  console.log('JWT_SECRET usada para VERIFY:', JWT_SECRET); // Log: Mostra a chave usada para verificar
  // --- FIM LOGS DE DEBUG ---

  // Se não houver token ou o formato estiver incorreto
  if (!token) {
    console.log('Middleware: Token não encontrado ou formato inválido no header.'); // Log adicional
    res.status(401).json({
      error: 'Token de acesso requerido',
      message: 'Forneça um token JWT válido no header Authorization no formato "Bearer seu_token".'
    });
    return;
  }

  // Tenta verificar o token usando a chave secreta importada
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // --- LOG DE DEBUG ---
    console.log('Token VERIFICADO com sucesso:', decoded); // Log: Mostra o payload se válido
    // --- FIM LOG DE DEBUG ---

    req.user = decoded; // Anexa os dados do usuário à requisição
    next(); // Passa para a próxima etapa (controller)

  } catch (error: any) { // Captura qualquer erro da verificação

    // --- LOG DE DEBUG ---
    console.error('ERRO na verificação JWT:', error.name, '-', error.message); // Log: Mostra detalhes do erro JWT
    // --- FIM LOG DE DEBUG ---

    // Verifica se o erro é de token expirado
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'Token expirado',
        message: 'O seu token de acesso expirou. Por favor, faça login novamente.'
      });
      return;
    }

    // Verifica se o erro é de token inválido (assinatura errada, malformado, etc.)
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({
        error: 'Token inválido',
        message: `O token fornecido é inválido (${error.message}). Verifique a chave secreta ou o formato do token.`
      });
      return;
    }

    // Se for outro tipo de erro durante a verificação
    console.error("Erro desconhecido na validação do token:", error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Ocorreu um problema ao tentar validar o token de acesso.'
    });
  }
};