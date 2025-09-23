"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Curso extends Model {
    static associate(models) {
      this.hasMany(models.Aluno, {
        foreignKey: "id_curso",
        as: "alunos",
      });
    }
  }
  Curso.init(
    {
      id_curso: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nome: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Curso",
      tableName: "cursos",
    }
  );
  return Curso;
};
