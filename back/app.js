const express = require("express");
const app = express();

const cors = require("cors");
app.use(cors());

const usuariosRoutes = require("./usuarios/usuariosRoutes");

const port = 8000;
app.use(express.json());

app.use("/usuarios", usuariosRoutes);

app.listen(port, () => {
  console.log("Servidor escutando na porta " + port);
});
