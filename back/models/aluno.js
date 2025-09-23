"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Aluno extends Model {
    static associate(models) {
      this.belongsTo(models.Usuario, {
        foreignKey: "id_usuario",
        as: "dadosUsuario",
      });
      // Adiciona a associação com a tabela de Cursos
      this.belongsTo(models.Curso, {
        foreignKey: "id_curso",
        as: "cursoInfo",
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
      id_usuario: DataTypes.INTEGER,
      id_curso: DataTypes.INTEGER, // Chave estrangeira para Curso
    },
    {
      sequelize,
      modelName: "Aluno",
      tableName: "alunos",
    }
  );
  return Aluno;
};
