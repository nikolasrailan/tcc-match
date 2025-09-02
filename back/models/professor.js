"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Professor extends Model {
    static associate(models) {
      this.belongsTo(models.Usuario, {
        foreignKey: "id_usuario",
        as: "usuario",
      });
    }
  }
  Professor.init(
    {
      id_professor: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      disponibilidade: DataTypes.BOOLEAN,
      especializacao: DataTypes.STRING,
      id_usuario: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Professor",
      tableName: "professor",
    }
  );
  return Professor;
};
