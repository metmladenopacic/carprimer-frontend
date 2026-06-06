import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  sub: string;
  roles: string[];
  exp: number;
}

export const getUserRoles = (): string[] => {
  const token = localStorage.getItem("token");
  if (!token) return [];
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.roles || [];
  } catch {
    return [];
  }
};


export const getUsername = (): string => {
  const token = localStorage.getItem("token");
  if (!token) return '';
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.sub;
  } catch {
    return '';
  }
};

export const isAdmin = (): boolean => {
  return getUserRoles().includes("ROLE_ADMIN");
};
