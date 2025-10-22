"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Orientacao extends Model {
    static associate(models) {
      this.belongsTo(models.Aluno, {
        foreignKey: "id_aluno",
        as: "aluno",
      });
      this.belongsTo(models.Professor, {
        foreignKey: "id_professor",
        as: "professor",
      });
      this.belongsTo(models.IdeiaTcc, {
        foreignKey: "id_ideia_tcc",
        as: "ideiaTcc",
      });
      this.hasMany(models.Reuniao, {
        foreignKey: "id_orientacao",
        as: "reunioes",
      });
      this.hasMany(models.Topico, {
        foreignKey: "id_orientacao",
        as: "topicos",
      });
    }
  }
  Orientacao.init(
    {
      id_orientacao: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      data_inicio: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      data_fim: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(
          "em desenvolvimento",
          "finalizado",
          "cancelado",
          "pausado",
          "encerrado"
        ),
        allowNull: false,
        defaultValue: "em desenvolvimento",
      },
      solicitacao_cancelamento: {
        type: DataTypes.ENUM("nenhuma", "aluno", "professor"),
        allowNull: false,
        defaultValue: "nenhuma",
      },
      url_projeto: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      observacoes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      feedback_cancelamento: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      id_aluno: DataTypes.INTEGER,
      id_professor: DataTypes.INTEGER,
      id_ideia_tcc: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Orientacao",
      tableName: "orientacao",
    }
  );
  return Orientacao;
};
