"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("alunos", "curso");
  },
  async down(queryInterface, Sequelize) {
    // Se precisar reverter, adicione a coluna de volta.
    // Lembre-se que o tipo de dado pode ser diferente no seu banco.
    await queryInterface.addColumn("alunos", "curso", {
      type: Sequelize.STRING,
      allowNull: true, // Ou false, dependendo da sua regra de negócio
    });
  },
};
