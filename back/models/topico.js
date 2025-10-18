"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Topico extends Model {
    static associate(models) {
      this.belongsTo(models.Orientacao, {
        foreignKey: "id_orientacao",
        as: "orientacao",
      });
    }
  }
  Topico.init(
    {
      id_topico: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      titulo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      descricao: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      data_criacao: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      status: {
        type: DataTypes.ENUM("enviado", "visto", "revisado"),
        allowNull: false,
        defaultValue: "enviado",
      },
      comentario_professor: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      id_orientacao: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Topico",
      tableName: "topicos",
    }
  );
  return Topico;
};
