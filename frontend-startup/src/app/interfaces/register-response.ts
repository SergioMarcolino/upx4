export interface IRegisterResponse {
  message: string;
  user: {
    id: number;
    email: string;
  };
}