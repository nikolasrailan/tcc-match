const jwt = require("jsonwebtoken");
const { Usuario } = require("../models");

const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Acesso negado. Token não fornecido." });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ message: "Token inválido ou expirado." });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.user.id);

    if (usuario && usuario.isAdmin === 1) {
      next();
    } else {
      res.status(403).json({
        message: "Acesso proibido. Requer acesso de administrador.",
      });
    }
  } catch (error) {
    console.error("Erro ao verificar permissão de admin:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

module.exports = {
  authenticateToken,
  isAdmin,
};
