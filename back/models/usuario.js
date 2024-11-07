"use strict";
const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Verifique se o caminho está correto

class Usuario extends Model {}
Usuario.init(
  {
    id_usuario: {
      type: DataTypes.INTEGER,
      primaryKey: true, // Especifica que é a chave primária
      autoIncrement: true, // Adiciona incremento automático se aplicável
    },
    nome: DataTypes.STRING,
    email: DataTypes.STRING,
    senha: DataTypes.STRING,
    isAdmin: DataTypes.INTEGER,
  },
  {
    sequelize,
    modelName: "Usuario",
    tableName: "usuarios", // Certifica-se de que o nome da tabela é o correto
  }
);

module.exports = Usuario;
