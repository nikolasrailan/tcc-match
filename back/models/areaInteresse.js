"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class AreaInteresse extends Model {
    static associate(models) {
      this.belongsToMany(models.Professor, {
        through: "professor_areas",
        foreignKey: "id_area",
        as: "professores",
        timestamps: false,
      });
      this.belongsToMany(models.IdeiaTcc, {
        through: "ideia_tcc_areas",
        foreignKey: "id_area",
        as: "ideiasTcc",
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
      status: {
        type: DataTypes.ENUM("aprovada", "pendente", "rejeitada"),
        defaultValue: "pendente",
      },
    },
    {
      sequelize,
      modelName: "AreaInteresse",
      tableName: "areas_de_interesse",
    }
  );
  return AreaInteresse;
};
