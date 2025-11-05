// Em src/controllers/auth-controller.ts
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source'; // Importa o DataSource
import { User } from '../entities/User';       // Importa a ENTIDADE User
import { JWT_SECRET } from '../config';
import { LoginRequest, RegisterRequest, JWTPayload, LoginResponse, RegisterResponse } from '../types';
import { QueryFailedError } from 'typeorm'; // Para tratar erros específicos

const SALT_ROUNDS = 10;
// Obtém o repositório para a entidade User UMA VEZ
const userRepository = AppDataSource.getRepository(User);

// =======================================================
// POST: Registrar Novo Usuário (/api/users/register)
// =======================================================
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: RegisterRequest = req.body;

    // --- Validações ---
    if (!email || !password) { /* ... */ return; }
    if (password.length < 6) { /* ... */ return; }
    // Adicione validação de formato de email se desejar
    // --- Fim Validações ---

    // Verifica se o email já existe usando o repositório
    const existingUser = await userRepository.findOneBy({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ error: 'Email já cadastrado', message: 'Este endereço de email já está em uso.' });
      return;
    }

    // Cria o HASH da senha
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Cria uma NOVA instância da entidade User
    const newUser = userRepository.create({
      email: email.toLowerCase(),
      password: hashedPassword
      // outros campos (ex: name) podem ser adicionados aqui
    });

    // Salva o novo usuário no banco de dados
    const savedUser = await userRepository.save(newUser);

    // Cria a resposta sem a senha hashada
    const responsePayload: RegisterResponse = {
      message: 'Usuário registrado com sucesso!',
      user: {
        id: savedUser.id,
        email: savedUser.email
      }
    };
    res.status(201).json(responsePayload);

  } catch (error: any) {
    console.error('Erro no registro de usuário:', error);
    // Trata erro específico de violação de constraint (ex: UNIQUE do email, caso findOneBy falhe por concorrência)
     if (error instanceof QueryFailedError && error.message.includes('UNIQUE constraint')) {
        res.status(400).json({ error: 'Email já cadastrado', message: 'Este endereço de email já está em uso (concorrência).' });
        return;
    }
    // Trata erros do bcrypt
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
    if (!JWT_SECRET) { /* ... (verificação JWT_SECRET) */ return; }

    const { email, password }: LoginRequest = req.body;
    if (!email || !password) { /* ... (validação) */ return; }

    // Encontra o usuário pelo email usando o repositório (case-insensitive se o DB collation for)
    // O ideal é buscar sempre em minúsculas
    const user = await userRepository.findOneBy({ email: email.toLowerCase() });

    // Se o usuário não existe
    if (!user) {
      res.status(401).json({ error: 'Credenciais inválidas', message: 'Email ou senha incorretos.' });
      return;
    }

    // Compara a senha enviada com o HASH armazenado
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // Se a senha não bate
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Credenciais inválidas', message: 'Email ou senha incorretos.' });
      return;
    }

    // --- Autenticação OK ---
    const payload: JWTPayload = { userId: user.id, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    const responsePayload: LoginResponse = {
      token: token,
      user: { id: user.id, email: user.email }
    };
    res.status(200).json(responsePayload);

  } catch (error: any) {
    console.error('Erro durante o login:', error);
    if (error.message.includes('bcrypt')) {
       res.status(500).json({ error: 'Erro de Autenticação', message: 'Não foi possível verificar as credenciais.' });
       return;
    }
    res.status(500).json({ error: 'Erro interno do servidor', message: 'Não foi possível realizar o login.' });
  }
};

// =======================================================
// GET: Obter Perfil do Usuário Logado (/api/users/profile)
// =======================================================
export const getProfile = async (req: Request, res: Response): Promise<void> => { // Pode ser async se buscar no DB
  const userPayload = req.user;

  if (!userPayload) {
    res.status(401).json({ error: 'Não autenticado', message: 'Nenhuma informação de usuário encontrada.' });
    return;
  }

  // Opcional: Buscar dados frescos do usuário no banco
  // try {
  //   const user = await userRepository.findOneBy({ id: userPayload.userId });
  //   if (!user) {
  //     res.status(404).json({ error: 'Usuário não encontrado', message: 'Usuário associado ao token não existe mais.'});
  //     return;
  //   }
  //   res.status(200).json({
  //     message: 'Perfil obtido com sucesso.',
  //     user: { id: user.id, email: user.email /*, outros campos */ }
  //   });
  // } catch (error: any) {
  //    res.status(500).json({ error: 'Erro interno', message: 'Não foi possível buscar perfil.'});
  // }

  // Ou apenas retornar o payload do token (mais rápido)
   res.status(200).json({
     message: 'Perfil do usuário obtido com sucesso (do token).',
     user: {
       id: userPayload.userId,
       email: userPayload.email
     }
   });
};