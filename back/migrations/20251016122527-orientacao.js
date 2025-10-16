"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("orientacao", {
      id_orientacao: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      data_inicio: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      data_fim: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM(
          "em desenvolvimento",
          "finalizado",
          "cancelado",
          "pausado"
        ),
        allowNull: false,
        defaultValue: "em desenvolvimento",
      },
      url_projeto: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      observacoes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      id_aluno: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "alunos",
          key: "id_aluno",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      id_professor: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "professor",
          key: "id_professor",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      id_ideia_tcc: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "ideia_tcc",
          key: "id_ideia_tcc",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        unique: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("orientacao");
  },
};
