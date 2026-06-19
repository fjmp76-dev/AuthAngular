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

export interface ICurrentUser {
  username: string;
  role: string;
  token: string;
  expiresAt: Date;
  permissions: Permission[];
}

export class CurrentUser implements ICurrentUser {
  username!: string;
  role!: string;
  token!: string;
  expiresAt!: Date;
  permissions!: Permission[];

  constructor(user: ICurrentUser) {
    this.username = user.username;
    this.role = user.role;
    this.token = user.token;
    this.expiresAt = user.expiresAt;
    this.permissions = user.permissions;
  }

  public CanAccessScreen(screen: string): boolean 
  {
    return this.permissions.some(p => p.screen.toLowerCase() === screen.toLowerCase() && p.level !== PermissionLevel.N);
  }
}