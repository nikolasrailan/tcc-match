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

const isAdminOrSelf = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.user.id);
    const isSelf = req.user.id.toString() === req.params.id;

    if ((usuario && usuario.isAdmin) || isSelf) {
      next();
    } else {
      res.status(403).json({
        message:
          "Acesso proibido. Requer acesso de administrador ou ser o próprio usuário.",
      });
    }
  } catch (error) {
    console.error("Erro ao verificar permissão de admin/self:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

module.exports = {
  authenticateToken,
  isAdmin: isAdminOrSelf, // Exportando como 'isAdmin' para não ter que mudar em todos os lugares
};
