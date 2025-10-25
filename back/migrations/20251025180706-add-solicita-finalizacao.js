"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("orientacao", "solicitacao_finalizacao", {
      type: Sequelize.ENUM("nenhuma", "aluno"), // Apenas o aluno solicita
      allowNull: false,
      defaultValue: "nenhuma",
      after: "solicitacao_cancelamento",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("orientacao", "solicitacao_finalizacao");
  },
};
