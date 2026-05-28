import jwt from "jsonwebtoken";

/**
 * Middleware de autenticação via JWT.
 * Valida o token Bearer no header Authorization e anexa o usuário em req.usuario.
 */
export function autenticarToken(req, res, next) {
  // Garante que o JWT_SECRET está configurado antes de qualquer operação
  if (!process.env.JWT_SECRET) {
    console.error("[autenticarToken] FATAL: JWT_SECRET não definido nas variáveis de ambiente.");
    return res.status(500).json({ error: "Erro interno de configuração do servidor" });
  }

  const authHeader = req.headers["authorization"];

  // Valida o formato "Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const usuario = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = usuario;
    next();
  } catch (err) {
    // Distingue internamente os tipos de erro para facilitar o monitoramento,
    // mas retorna uma mensagem genérica ao cliente por segurança
    if (err.name === "TokenExpiredError") {
      console.warn("[autenticarToken] Token expirado.");
    } else {
      console.warn("[autenticarToken] Token inválido:", err.message);
    }

    return res.status(403).json({ error: "Token inválido ou expirado" });
  }
}