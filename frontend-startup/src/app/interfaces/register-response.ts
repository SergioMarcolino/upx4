// Esta interface corresponde ao que o backend (auth-controller.ts) envia
export interface IRegisterResponse {
  message: string;
  user: {
    id: number;
    email: string;
  };
}