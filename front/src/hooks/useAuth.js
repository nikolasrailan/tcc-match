"use client";
import { useRouter } from "next/navigation";

export default function useAuth() {
  const router = useRouter();

  const login = async (email, senha) => {
    const apiUrl = process.env.NEXT_PUBLIC_URL_API;

    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      if (response.ok) {
        const { token } = await response.json();
        localStorage.setItem("token", token);
        router.push("/usuarios");
        return true;
      } else {
        alert("Erro ao fazer login.");
        return false;
      }
    } catch (error) {
      console.error("Erro no login:", error);
      alert("Erro na conexão com o servidor.");
      return false;
    }
  };

  return { login };
}
