"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ideia_tcc", {
      id_ideia_tcc: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      titulo: {
        type: Sequelize.STRING(45),
        allowNull: false,
      },
      descricao: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      data_submissao: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      status: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("ideia_tcc");
  },
};
