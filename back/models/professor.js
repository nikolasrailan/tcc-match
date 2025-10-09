"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Professor extends Model {
    static associate(models) {
      this.belongsTo(models.Usuario, {
        foreignKey: "id_usuario",
        as: "usuario",
      });
      // Associação com as áreas de interesse
      this.belongsToMany(models.AreaInteresse, {
        through: "professor_areas",
        foreignKey: "id_professor",
        as: "areasDeInteresse",
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
      limite_orientacoes: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
      },
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
