"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Usuario extends Model {
    static associate(models) {
      // Associação com Professor
      this.hasOne(models.Professor, {
        foreignKey: "id_usuario",
        as: "dadosProfessor",
      });

      // Associação com Aluno
      this.hasOne(models.Aluno, {
        foreignKey: "id_usuario",
        as: "dadosAluno",
      });
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
