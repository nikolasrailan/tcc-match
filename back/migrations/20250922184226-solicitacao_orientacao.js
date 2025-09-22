"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("solicitacao_orientacao", {
      id_solicitacao: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
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
      },
      status: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      data_solicitacao: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("solicitacao_orientacao");
  },
};
