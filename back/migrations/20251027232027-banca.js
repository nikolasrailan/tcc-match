"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("bancas", {
      id_banca: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      id_orientacao: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "orientacao",
          key: "id_orientacao",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE", // Ou 'SET NULL'/'RESTRICT' dependendo da regra de negócio
      },
      id_avaliador1: {
        type: Sequelize.INTEGER,
        allowNull: true, // Permite nulo caso não encontre professores suficientes
        references: {
          model: "professor",
          key: "id_professor",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL", // Permite que a banca exista mesmo se um professor for deletado
      },
      id_avaliador2: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "professor",
          key: "id_professor",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      id_avaliador3: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "professor",
          key: "id_professor",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      data_defesa: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      local_defesa: {
        type: Sequelize.STRING,
        allowNull: true,
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
        onUpdate: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("bancas", ["id_orientacao"], {
      unique: true,
      name: "bancas_id_orientacao_unique",
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("bancas", "bancas_id_orientacao_unique");
    await queryInterface.dropTable("bancas");
  },
};
