require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());

const usuariosRoutes = require("./usuarios/usuariosRoutes");
const loginRoutes = require("./auth/loginRoutes");
const professorRoutes = require("./professores/professorRoutes");
const alunoRoutes = require("./alunos/alunoRoutes");
const ideiaTccRoutes = require("./ideiaTcc/ideiaTccRoutes");
const solicitacaoRoutes = require("./solicitacaoOrientacao/solicitacaoRoutes");
const cursoRoutes = require("./cursos/cursoRoutes");
const areaInteresseRoutes = require("./areaInteresse/areaInteresseRoutes");
const orientacaoRoutes = require("./orientacao/orientacaoRoutes");
const reuniaoRoutes = require("./reuniao/reuniaoRoutes");
const topicoRoutes = require("./topicos/topicoRoutes");
const bancaRoutes = require("./banca/bancaRoutes");

app.use("/usuarios", usuariosRoutes);
app.use("/login", loginRoutes);
app.use("/professores", professorRoutes);
app.use("/alunos", alunoRoutes);
app.use("/ideias-tcc", ideiaTccRoutes);
app.use("/solicitacoes", solicitacaoRoutes);
app.use("/cursos", cursoRoutes);
app.use("/areas-interesse", areaInteresseRoutes);
app.use("/orientacoes", orientacaoRoutes);
app.use("/reunioes", reuniaoRoutes);
app.use("/topicos", topicoRoutes);
app.use("/bancas", bancaRoutes);

const port = 8000;
app.listen(port, () => {
  console.log("Servidor escutando na porta " + port);
});
