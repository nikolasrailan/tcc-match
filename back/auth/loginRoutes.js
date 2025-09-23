const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { Usuario, Aluno, Professor, Curso } = require("../models"); // Importa o modelo Curso
const bcrypt = require("bcryptjs");

router.post("/", async (req, res) => {
  const { email, senha } = req.body;

  try {
    const usuario = await Usuario.findOne({
      where: { email },
      include: [
        {
          model: Aluno,
          as: "dadosAluno",
          include: {
            model: Curso,
            as: "cursoInfo",
            attributes: ["id_curso", "nome"],
          },
        },
        { model: Professor, as: "dadosProfessor" },
      ],
    });

    if (!usuario) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({ message: "Senha incorreta" });
    }

    let role = "usuario";
    if (usuario.isAdmin) {
      role = "admin";
    } else if (usuario.dadosProfessor) {
      role = "professor";
    } else if (usuario.dadosAluno) {
      role = "aluno";
    }

    const token = jwt.sign(
      {
        id: usuario.id_usuario,
        role: role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    const usuarioSemSenha = usuario.toJSON();
    delete usuarioSemSenha.senha;

    res.json({ token, user: usuarioSemSenha });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ message: "Erro no login" });
  }
});

module.exports = router;
