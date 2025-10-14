"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ideia_tcc_areas", {
      id_ideia_tcc: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "ideia_tcc", // Nome da tabela de ideias
          key: "id_ideia_tcc",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        primaryKey: true,
      },
      id_area: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "areas_de_interesse", // Nome da tabela de áreas
          key: "id_area",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        primaryKey: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("ideia_tcc_areas");
  },
};
