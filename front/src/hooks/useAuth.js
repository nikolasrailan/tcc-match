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
        const { token, user } = await response.json();
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        if (user.isAdmin) {
          router.push("/usuarios");
        } else if (user.dadosProfessor) {
          router.push("/professor");
        } else if (user.dadosAluno) {
          router.push("/aluno");
        } else {
          router.push("/");
        }
        return true;
      } else {
        // Limpa dados antigos em caso de falha
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return false;
      }
    } catch (error) {
      console.error("Erro no login:", error);
      alert("Erro na conexão com o servidor.");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return { login, logout };
}
