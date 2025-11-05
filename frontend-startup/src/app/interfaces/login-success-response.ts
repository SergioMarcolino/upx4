// Em src/app/interfaces/login-success-response.ts

export interface ILoginSuccessResponse {
  // 👇 TOKEN direto no nível principal 👇
  token: string; 

  // 👇 USER direto no nível principal 👇
  user: {
    id: number;
    email: string;
  };
  // (Remova 'message' e 'data' se o backend não os envia no login)
}