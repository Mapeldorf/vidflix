export interface User {
  id: number;
  username: string;
}

export interface LoginDto {
  login: string; // username
  password: string;
}

export interface RegisterDto {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}
