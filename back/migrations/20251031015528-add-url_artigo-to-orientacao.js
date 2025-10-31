"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("orientacao", "url_artigo", {
      type: Sequelize.STRING,
      allowNull: true,
      after: "url_projeto", // Coloca o novo campo logo após o url_projeto
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("orientacao", "url_artigo");
  },
};
