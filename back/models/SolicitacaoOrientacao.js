"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class SolicitacaoOrientacao extends Model {
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
    }
  }
  SolicitacaoOrientacao.init(
    {
      id_solicitacao: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      id_aluno: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "alunos",
          key: "id_aluno",
        },
      },
      id_professor: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "professor",
          key: "id_professor",
        },
      },
      id_ideia_tcc: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "ideia_tcc",
          key: "id_ideia_tcc",
        },
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0, // 0: Pendente, 1: Aceito, 2: Rejeitado, 3: cancelada
      },
      data_solicitacao: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "SolicitacaoOrientacao",
      tableName: "solicitacao_orientacao",
      timestamps: false,
    }
  );
  return SolicitacaoOrientacao;
};
