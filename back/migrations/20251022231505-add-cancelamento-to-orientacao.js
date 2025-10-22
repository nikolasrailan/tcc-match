"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("orientacao", "solicitacao_cancelamento", {
      type: Sequelize.ENUM("nenhuma", "aluno", "professor"),
      allowNull: false,
      defaultValue: "nenhuma",
      after: "status",
    });
    await queryInterface.addColumn("orientacao", "feedback_cancelamento", {
      type: Sequelize.TEXT,
      allowNull: true,
      after: "observacoes",
    });

    await queryInterface.changeColumn("orientacao", "status", {
      type: Sequelize.ENUM(
        "em desenvolvimento",
        "finalizado",
        "cancelado",
        "pausado",
        "encerrado"
      ),
      allowNull: false,
      defaultValue: "em desenvolvimento",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("orientacao", "solicitacao_cancelamento");
    await queryInterface.removeColumn("orientacao", "feedback_cancelamento");

    await queryInterface.changeColumn("orientacao", "status", {
      type: Sequelize.ENUM(
        "em desenvolvimento",
        "finalizado",
        "cancelado",
        "pausado"
      ),
      allowNull: false,
      defaultValue: "em desenvolvimento",
    });
  },
};
