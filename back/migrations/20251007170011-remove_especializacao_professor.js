"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("professor", "especializacao");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("professor", "especializacao", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
