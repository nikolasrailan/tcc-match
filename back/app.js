const express = require("express");
const app = express();
const cors = require("cors");
const acl = require("express-acl");
const jwt = require("jsonwebtoken"); // <-- 1. IMPORTADO O JWT
const aclConfig = require("./config/acl-config");

app.use(cors());
app.use(express.json());

acl.config(aclConfig);

app.use((req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    req.user = { role: "guest" };
    return next();
  }

  jwt.verify(token, "seu-segredo", (err, decodedPayload) => {
    if (err) {
      console.error("Erro ao verificar token:", err.message);
      req.user = { role: "guest" };
    } else {
      req.user = decodedPayload;
    }
    next();
  });
});

app.use(acl.authorize.unless({ path: ["/login", "/register"] }));

const usuariosRoutes = require("./usuarios/usuariosRoutes");
const loginRoutes = require("./auth/loginRoutes");
const professorRoutes = require("./professores/professorRoutes");
const alunoRoutes = require("./alunos/alunoRoutes");

app.use("/usuarios", usuariosRoutes);
app.use("/login", loginRoutes);
app.use("/professores", professorRoutes);
app.use("/alunos", alunoRoutes);

const port = 8000;
app.listen(port, () => {
  console.log("Servidor escutando na porta " + port);
});
