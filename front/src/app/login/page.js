// pages/login.js
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const Login = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Envia os dados usando fetch
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Erro de autenticação");
      }

      const data = await response.json();

      // Armazena o token no localStorage (ou em cookies)
      localStorage.setItem("token", data.token);

      // Redireciona o usuário após o login bem-sucedido
      router.push("/dashboard");
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      alert("Credenciais inválidas");
    }
  };

  return (
    <main>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Senha:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Entrar</button>
      </form>
    </main>
  );
};

export default Login;
