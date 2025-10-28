"use strict";
const bcrypt = require("bcryptjs");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Gera o hash da senha padrão 'senha123'
    const senhaHash = await bcrypt.hash("senha123", 10);

    await queryInterface.bulkInsert(
      "usuarios",
      [
        {
          nome: "Admin User",
          email: "admin@tccmatch.com",
          senha: senhaHash,
          isAdmin: 1, // 1 para true
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          nome: "Professor Orientador",
          email: "professor.orientador@tccmatch.com",
          senha: senhaHash,
          isAdmin: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          nome: "Professor Avaliador 1",
          email: "professor.avaliador1@tccmatch.com",
          senha: senhaHash,
          isAdmin: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          nome: "Professor Avaliador 2",
          email: "professor.avaliador2@tccmatch.com",
          senha: senhaHash,
          isAdmin: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          nome: "Aluno Um",
          email: "aluno.um@tccmatch.com",
          senha: senhaHash,
          isAdmin: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          nome: "Aluno Dois",
          email: "aluno.dois@tccmatch.com",
          senha: senhaHash,
          isAdmin: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          nome: "Usuario Sem Perfil",
          email: "sem.perfil@tccmatch.com",
          senha: senhaHash,
          isAdmin: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // Adicione mais usuários conforme necessário
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    // Remove todos os usuários inseridos
    await queryInterface.bulkDelete("usuarios", null, {});
  },
};
