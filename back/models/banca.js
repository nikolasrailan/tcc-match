"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Banca extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Orientacao, {
        foreignKey: "id_orientacao",
        as: "orientacao",
      });
      // Associações para cada avaliador
      this.belongsTo(models.Professor, {
        foreignKey: "id_avaliador1",
        as: "avaliador1",
      });
      this.belongsTo(models.Professor, {
        foreignKey: "id_avaliador2",
        as: "avaliador2",
      });
      this.belongsTo(models.Professor, {
        foreignKey: "id_avaliador3",
        as: "avaliador3",
      });
    }
  }
  Banca.init(
    {
      id_banca: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      id_orientacao: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, // Garante que só haja uma banca por orientação
      },
      id_avaliador1: {
        type: DataTypes.INTEGER,
        allowNull: true, // Pode ser nulo se não encontrar professor
      },
      id_avaliador2: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      id_avaliador3: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      data_defesa: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      local_defesa: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Banca",
      tableName: "bancas",
      // timestamps: true // createdAt e updatedAt já definidos na migration
    }
  );
  return Banca;
};
