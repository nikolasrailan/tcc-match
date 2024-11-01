const express = require("express");
const app = express();

const port = 8000;
app.use(express.json());

app.listen(port, () => {
  console.log("Escutando na porta " + port);
});
