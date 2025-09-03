"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Aluno extends Model {
    static associate(models) {
      this.belongsTo(models.Usuario, {
        foreignKey: "id_usuario",
        as: "dadosUsuario", // Apelido para a associação
      });
    }
  }
  Aluno.init(
    {
      id_aluno: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      matricula: DataTypes.STRING,
      curso: DataTypes.STRING,
      id_usuario: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Aluno",
      tableName: "alunos",
    }
  );
  return Aluno;
};
