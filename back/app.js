const express = require("express");
const app = express();

const cors = require("cors");
app.use(cors());

const usuariosRoutes = require("./usuarios/usuariosRoutes");
const loginRoutes = require("./auth/loginRoutes");

const port = 8000;
app.use(express.json());

app.use("/usuarios", usuariosRoutes);
app.use("/login", loginRoutes);

app.listen(port, () => {
  console.log("Servidor escutando na porta " + port);
});
