export function getLoggedUserEmail(): string {
  if (typeof window === 'undefined') return "SISTEMA";
  
  try {
    const userJson = localStorage.getItem("user");
    if (!userJson) return "SISTEMA";
    
    const user = JSON.parse(userJson);
    // El objeto del login tiene 'email', pero cubrimos otras posibilidades por seguridad
    return user.email || user.usuario_email || user.id || "SISTEMA";
  } catch (e) {
    return "SISTEMA";
  }
}
