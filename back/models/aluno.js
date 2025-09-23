"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Aluno extends Model {
    static associate(models) {
      Aluno.belongsTo(models.Usuario, {
        foreignKey: "id_usuario",
        as: "dadosUsuario",
      });
      Aluno.belongsTo(models.Curso, {
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
        allowNull: false,
      },
      matricula: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },

      id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: "Usuarios",
          key: "id_usuario",
        },
      },
      id_curso: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Cursos",
          key: "id_curso",
        },
      },
    },
    {
      sequelize,
      modelName: "Aluno",
      tableName: "alunos",
      paranoid: true, // Habilita soft-delete
    }
  );
  return Aluno;
};
