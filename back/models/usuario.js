"use strict";
const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db");

class Usuario extends Model {}

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
      allowNull: true, // Permite null para registros não deletados
    },
  },
  {
    sequelize,
    modelName: "Usuario",
    tableName: "usuarios",
    paranoid: true, // Ativa o soft delete
  }
);

module.exports = Usuario;
