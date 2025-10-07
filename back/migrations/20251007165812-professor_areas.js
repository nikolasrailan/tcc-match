"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("professor_areas", {
      id_professor: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "professor", // Nome da tabela de professores
          key: "id_professor",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        primaryKey: true,
      },
      id_area: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "areas_de_interesse", // Nome da nova tabela de áreas
          key: "id_area",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        primaryKey: true,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("professor_areas");
  },
};
