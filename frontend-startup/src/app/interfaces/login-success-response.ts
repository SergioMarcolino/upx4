export interface ILoginSuccessResponse {
  token: string; 

  user: {
    id: number;
    email: string;
  };
}