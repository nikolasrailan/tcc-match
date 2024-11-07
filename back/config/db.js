require("dotenv").config(); // Carrega as variáveis de ambiente do .env
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT, // "mysql" será lido da variável de ambiente
  }
);

sequelize
  .authenticate()
  .then(() => {
    console.log("Conectado ao MySQL com Sequelize!");
  })
  .catch((error) => {
    console.error("Erro ao conectar ao MySQL: ", error);
  });

module.exports = sequelize;
