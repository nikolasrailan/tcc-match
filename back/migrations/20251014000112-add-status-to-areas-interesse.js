"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Adiciona a nova coluna 'status'
    await queryInterface.addColumn("areas_de_interesse", "status", {
      type: Sequelize.ENUM("aprovada", "pendente", "rejeitada"),
      allowNull: false,
      defaultValue: "pendente",
    });

    // Atualiza todos os registros existentes para 'aprovada'
    await queryInterface.sequelize.query(
      `UPDATE areas_de_interesse SET status = 'aprovada'`
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("areas_de_interesse", "status");
  },
};
