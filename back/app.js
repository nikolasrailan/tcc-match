const express = require("express");
const app = express();
const cors = require("cors");
const acl = require("express-acl");
const aclConfig = require("./config/acl-config");

app.use(cors());
app.use(express.json());

acl.config(aclConfig);

app.use((req, res, next) => {
  req.decoded = {
    role: req.headers["x-role"] || "aluno",
  };
  next();
});

app.use(acl.authorize.unless({ path: ["/login", "/register"] }));

const usuariosRoutes = require("./usuarios/usuariosRoutes");
const loginRoutes = require("./auth/loginRoutes");

app.use("/usuarios", usuariosRoutes);
app.use("/login", loginRoutes);

const port = 8000;
app.listen(port, () => {
  console.log("Servidor escutando na porta " + port);
});
