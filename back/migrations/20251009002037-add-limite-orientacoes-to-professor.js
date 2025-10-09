"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("professor", "limite_orientacoes", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 5, // Define um limite padrão de 5 orientações
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("professor", "limite_orientacoes");
  },
};
