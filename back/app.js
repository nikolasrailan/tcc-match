require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
// const acl = require("express-acl"); // Removido
// const jwt = require("jsonwebtoken"); // Não é mais necessário aqui
// const aclConfig = require("./config/acl-config"); // Removido

app.use(cors());
app.use(express.json());

// acl.config(aclConfig); // Removido

// Middleware global de ACL foi removido para simplificar a autorização
// A verificação agora é feita pelo 'authenticateToken' em cada rota protegida

// app.use(acl.authorize.unless({ path: ["/login", "/register"] })); // Removido

const usuariosRoutes = require("./usuarios/usuariosRoutes");
const loginRoutes = require("./auth/loginRoutes");
const professorRoutes = require("./professores/professorRoutes");
const alunoRoutes = require("./alunos/alunoRoutes");
const ideiaTccRoutes = require("./ideiaTcc/ideiaTccRoutes");

app.use("/usuarios", usuariosRoutes);
app.use("/login", loginRoutes);
app.use("/professores", professorRoutes);
app.use("/alunos", alunoRoutes);
app.use("/ideias-tcc", ideiaTccRoutes);

const port = 8000;
app.listen(port, () => {
  console.log("Servidor escutando na porta " + port);
});
