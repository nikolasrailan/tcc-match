const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "kika2008.",
  database: "tcc-match",
});

connection.connect((error) => {
  if (error) console.error("Erro ao conectar ao mysql: ", error);
  else console.log("Conectado ao mysql!");
});

module.exports = connection;
