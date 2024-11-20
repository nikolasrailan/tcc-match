const express = require("express");
const router = express.Router();
const Usuario = require("../models/usuario");
const bcrypt = require("bcryptjs");

// Rota GET para buscar todos os usuários
router.get("/", async (req, res) => {
  try {
    const usuarios = await Usuario.findAll(); // Usa o Sequelize para buscar todos os registros
    res.json(usuarios);
  } catch (error) {
    console.error("Erro ao buscar usuários: ", error);
    res.status(500).send("Erro ao buscar usuários");
  }
});

// Rota POST para adicionar um novo usuário
router.post("/", async (req, res) => {
  const { nome, email, senha, isAdmin = 0 } = req.body;

  try {
    const senhaHash = await bcrypt.hash(senha, 10);

    const novoUsuario = await Usuario.create({
      nome,
      email,
      senha: senhaHash,
      isAdmin,
    });

    res.status(201).json(novoUsuario);
  } catch (error) {
    console.error("Erro ao adicionar usuário: ", error);
    res.status(500).send("Erro ao adicionar usuário");
  }
});

// PATCH para editar um usuário específico
router.patch("/:id", async (req, res) => {
  // Aqui removi "/usuarios"
  const { id } = req.params; // ID do usuário a ser editado
  const { nome, email, senha, isAdmin } = req.body; // Dados para atualizar

  try {
    // Atualizar o usuário com o ID específico
    const usuario = await Usuario.update(
      { nome, email, senha, isAdmin }, // Campos que serão atualizados
      { where: { id_usuario: id } } // Condição para achar o usuário pelo ID
    );

    // Verifica se algum usuário foi atualizado
    if (usuario[0] === 0) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    res.status(200).json({ message: "Usuário atualizado com sucesso!" });
  } catch (error) {
    console.error("Erro ao editar usuário:", error);
    res.status(500).json({ message: "Erro ao editar usuário" });
  }
});

// DELETE para soft delete de um usuário
router.delete("/:id", async (req, res) => {
  const { id } = req.params; // ID do usuário a ser deletado

  try {
    // Soft delete usando 'paranoid' (automático, não precisa setar manualmente o campo 'deletedAt')
    const usuario = await Usuario.destroy({
      where: { id_usuario: id },
    });

    // Verifica se o usuário foi encontrado e "deletado"
    if (usuario === 0) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    res.status(200).json({ message: "Usuário deletado com sucesso!" });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    res.status(500).json({ message: "Erro ao deletar usuário" });
  }
});

module.exports = router;
