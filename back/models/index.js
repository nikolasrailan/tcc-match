"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const process = require("process");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
// Usa as variáveis de ambiente diretamente se disponíveis, senão usa config.json
const config = process.env.DB_DATABASE
  ? {
      database: process.env.DB_DATABASE,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      dialect: process.env.DB_DIALECT || "mysql", // Default dialect
    }
  : require(__dirname + "/../config/config.json")[env];

const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.slice(-3) === ".js" &&
      file.indexOf(".test.js") === -1
    );
  })
  .forEach((file) => {
    // Ajuste para lidar com diferentes formas de exportação de modelos
    const modelDefiner = require(path.join(__dirname, file));
    // Verifica se é uma função antes de chamar
    if (typeof modelDefiner === "function") {
      const model = modelDefiner(sequelize, Sequelize.DataTypes);
      if (model && model.name) {
        // Garante que o modelo tem um nome
        db[model.name] = model;
      } else {
        console.warn(
          `Arquivo ${file} não exportou um modelo Sequelize válido.`
        );
      }
    } else {
      console.warn(`Arquivo ${file} não exportou uma função.`);
    }
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
