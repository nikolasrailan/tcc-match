"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Usuario extends Model {
    static associate(models) {
      this.hasOne(models.Professor, {
        foreignKey: "id_usuario",
        as: "dadosProfessor", // Apelido para a relação
      });

      // depois adicionar a associação para Aluno aqui também
      // this.hasOne(models.Aluno, { ... });
    }
  }

  Usuario.init(
    {
      id_usuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nome: DataTypes.STRING,
      email: DataTypes.STRING,
      senha: DataTypes.STRING,
      isAdmin: DataTypes.INTEGER,
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Usuario",
      tableName: "usuarios",
      paranoid: true, // Ativa o soft delete
    }
  );

  return Usuario;
};
