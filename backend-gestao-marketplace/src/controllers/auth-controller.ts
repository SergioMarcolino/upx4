// Em src/controllers/auth-controller.ts
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { db } from '../repository';
import { JWT_SECRET } from '../config'; // Importa a chave secreta
import {
    User,
    LoginRequest,
    RegisterRequest,
    JWTPayload,
    LoginResponse,
    RegisterResponse
} from '../types';

const SALT_ROUNDS = 10;

// =======================================================
// POST: Registrar Novo Usuário (/api/users/register)
// =======================================================
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: RegisterRequest = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Campos obrigatórios', message: 'Email e senha são obrigatórios.' });
      return;
    }
    if (password.length < 6) {
       res.status(400).json({ error: 'Senha inválida', message: 'A senha deve ter pelo menos 6 caracteres.' });
       return;
    }

    const data = db.read();
    const users = data.users || [];

    if (users.some(user => user.email.toLowerCase() === email.toLowerCase())) {
      res.status(400).json({ error: 'Email já cadastrado', message: 'Este endereço de email já está em uso.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUserId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const newUser: User = {
      id: newUserId,
      email: email.toLowerCase(),
      password: hashedPassword
    };

    users.push(newUser);
    data.users = users;
    db.write(data);

    const responsePayload: RegisterResponse = {
      message: 'Usuário registrado com sucesso!',
      user: {
        id: newUser.id,
        email: newUser.email
      }
    };
    res.status(201).json(responsePayload);

  } catch (error: any) {
    console.error('Erro no registro de usuário:', error);
    if (error.message.includes('Falha ao ler') || error.message.includes('Falha ao salvar')) {
      res.status(500).json({ error: 'Erro de Persistência', message: error.message });
      return;
    }
    if (error.message.includes('bcrypt')) {
       res.status(500).json({ error: 'Erro de Segurança', message: 'Não foi possível processar a senha.' });
       return;
    }
    res.status(500).json({ error: 'Erro interno do servidor', message: 'Não foi possível completar o registro.' });
  }
};

// =======================================================
// POST: Login do Usuário (/api/users/login)
// =======================================================
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!JWT_SECRET) {
      console.error("ERRO CRÍTICO: JWT_SECRET não está definida no config.ts. Login impossibilitado.");
      res.status(500).json({ error: 'Erro de configuração interna', message: 'Falha na configuração de autenticação do servidor.' });
      return;
    }

    // --- LOGS DE DEBUG ---
    console.log('\n--- LOGIN ---'); // Log 1: Marcador de início
    console.log('JWT_SECRET usada para SIGN:', JWT_SECRET); // Log 2: Mostra a chave usada para criar
    // --- FIM LOGS DE DEBUG ---

    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Campos obrigatórios', message: 'Email e senha são obrigatórios para login.' });
      return;
    }

    const data = db.read();
    const users = data.users || [];

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      res.status(401).json({ error: 'Credenciais inválidas', message: 'Email ou senha incorretos.' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Credenciais inválidas', message: 'Email ou senha incorretos.' });
      return;
    }

    const payload: JWTPayload = { userId: user.id, email: user.email };

    // Usa a chave importada para criar o token
    const token = jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // --- LOG DE DEBUG ---
    console.log('Token CRIADO:', token); // Log 3: Mostra o token gerado
    // --- FIM LOG DE DEBUG ---

    const responsePayload: LoginResponse = {
      token: token,
      user: {
        id: user.id,
        email: user.email
      }
    };
    res.status(200).json(responsePayload);

  } catch (error: any) {
    console.error('Erro durante o login:', error);
     if (error.message.includes('Falha ao ler') || error.message.includes('Falha ao salvar')) {
      res.status(500).json({ error: 'Erro de Persistência', message: error.message });
      return;
    }
    if (error.message.includes('bcrypt')) {
       res.status(500).json({ error: 'Erro de Autenticação', message: 'Não foi possível verificar as credenciais.' });
       return;
    }
    res.status(500).json({ error: 'Erro interno do servidor', message: 'Não foi possível realizar o login.' });
  }
};


// =======================================================
// GET: Obter Perfil do Usuário Logado (Ex: /api/users/profile)
// =======================================================
export const getProfile = (req: Request, res: Response): void => {
  const userPayload = req.user;

  if (!userPayload) {
    res.status(401).json({ error: 'Não autenticado', message: 'Nenhuma informação de usuário encontrada. Token pode estar faltando ou inválido.' });
    return;
  }

  res.status(200).json({
    message: 'Perfil do usuário obtido com sucesso.',
    user: {
      id: userPayload.userId,
      email: userPayload.email
    }
  });
};