"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("alunos", "id_curso", {
      type: Sequelize.INTEGER,
      references: {
        model: "cursos", // name of the target table
        key: "id_curso", // key in the target table
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
      allowNull: true, // or false if a curso is always required
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("alunos", "id_curso");
  },
};
