"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class IdeiaTcc extends Model {
    static associate(models) {
      this.belongsTo(models.Aluno, {
        foreignKey: "id_aluno",
        as: "aluno",
      });
    }
  }
  IdeiaTcc.init(
    {
      id_ideia_tcc: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      titulo: {
        type: DataTypes.STRING(45),
        allowNull: false,
      },
      descricao: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      data_submissao: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0, // 0: Submetido, 1: Em avaliação, 2: Aprovado, 3: Rejeitado
      },
      id_aluno: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "IdeiaTcc",
      tableName: "ideia_tcc",
      timestamps: false,
    }
  );
  return IdeiaTcc;
};
