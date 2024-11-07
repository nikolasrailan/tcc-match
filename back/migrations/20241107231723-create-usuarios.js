"use strict";
const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Certifique-se de que o caminho está correto

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
  },
  {
    sequelize,
    modelName: "Usuario",
    tableName: "usuarios", // Certifique-se de que o nome da tabela está correto
  }
);

module.exports = Usuario;
