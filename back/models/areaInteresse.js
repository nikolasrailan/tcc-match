"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class AreaInteresse extends Model {
    static associate(models) {
      this.belongsToMany(models.Professor, {
        through: "professor_areas",
        foreignKey: "id_area",
        as: "professores",
      });
    }
  }
  AreaInteresse.init(
    {
      id_area: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nome: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "AreaInteresse",
      tableName: "areas_de_interesse",
    }
  );
  return AreaInteresse;
};
