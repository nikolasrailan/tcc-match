"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Adiciona o campo conceito_aprovacao
    await queryInterface.addColumn("bancas", "conceito_aprovacao", {
      type: Sequelize.ENUM("aprovado", "aprovado_com_ressalvas", "reprovado"),
      allowNull: true,
      after: "local_defesa",
    });

    // Adiciona o campo conceito_final
    await queryInterface.addColumn("bancas", "conceito_final", {
      type: Sequelize.ENUM("A", "B", "C", "D"),
      allowNull: true,
      after: "conceito_aprovacao",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("bancas", "conceito_final");
    await queryInterface.removeColumn("bancas", "conceito_aprovacao");
  },
};
