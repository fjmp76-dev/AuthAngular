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

export enum PermissionLevel { W = 2 , R = 1 , N = 0 }

export interface Permission {
  screen: string;
  level: PermissionLevel;
}

export interface PermissionsResponse {
  success: boolean;
  username: string;
  permissions: Permission[];
  message: string;
}

export interface CurrentUser extends AuthUser{
  permissions: Permission[];
}

export interface CapturaRecord {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  notas: string;
}