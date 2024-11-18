// pages/api/login.js
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export default async function login(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  const { email, password } = req.body;

  // Simulação de busca de usuário (substitua por verificação de BD)
  const fakeUser = {
    email: "teste@exemplo.com",
    passwordHash: await bcrypt.hash("senha123", 10), // A senha é armazenada como hash
  };

  if (email === fakeUser.email) {
    // Verifica se a senha fornecida corresponde ao hash
    const isPasswordValid = await bcrypt.compare(
      password,
      fakeUser.passwordHash
    );

    if (isPasswordValid) {
      // Gera um token JWT
      const token = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      return res.status(200).json({ token });
    } else {
      return res.status(401).json({ message: "Senha inválida" });
    }
  } else {
    return res.status(401).json({ message: "Usuário não encontrado" });
  }
}
