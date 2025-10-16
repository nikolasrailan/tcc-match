"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Reuniao extends Model {
    static associate(models) {
      this.belongsTo(models.Orientacao, {
        foreignKey: "id_orientacao",
        as: "orientacao",
      });
    }
  }
  Reuniao.init(
    {
      id_reuniao: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      data_horario: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      pauta: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("marcada", "realizada", "cancelada"),
        allowNull: false,
        defaultValue: "marcada",
      },
      id_orientacao: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Reuniao",
      tableName: "reunioes",
    }
  );
  return Reuniao;
};
