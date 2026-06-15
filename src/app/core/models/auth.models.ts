// Lo que mandamos al microservicio
export interface LoginRequest {
  username: string;
  password: string;
}

// Lo que el microservicio nos devuelve
export interface AuthResponse {
  success: boolean;
  token: string;
  username: string;
  role: string;
  expiresAt: string;
  message: string;
}

// Lo que guardamos en sessionStorage
export interface AuthUser {
  username: string;
  role: string;
  token: string;
  expiresAt: Date;
}