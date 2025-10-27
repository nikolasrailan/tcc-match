"use client";
import { useRouter } from "next/navigation";
import { useCallback } from "react"; // Importar useCallback

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

        // Redireciona com base no perfil
        if (user.isAdmin) {
          router.push("/usuarios"); // Ou outra rota admin principal
        } else if (user.dadosProfessor) {
          router.push("/professor");
        } else if (user.dadosAluno) {
          router.push("/aluno");
        } else {
          router.push("/"); // Rota padrão se não tiver perfil específico
        }
        return true;
      } else {
        // Limpa dados antigos em caso de falha
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        const errorData = await response.json(); // Tenta pegar a mensagem de erro da API
        throw new Error(errorData.message || "Credenciais inválidas."); // Lança erro com mensagem da API
        // return false; // Não é mais necessário com throw
      }
    } catch (error) {
      console.error("Erro no login:", error);
      // alert("Erro na conexão com o servidor."); // Remover alert
      localStorage.removeItem("token"); // Garante limpeza em caso de erro de rede
      localStorage.removeItem("user");
      // Re-throw para que o componente que chamou possa tratar (ex: exibir toast)
      throw error; // Propaga o erro
      // return false; // Não é mais necessário com throw
    }
  };

  // Envolver logout com useCallback para garantir referência estável
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login"); // Redireciona para a página de login após logout
  }, [router]); // router é uma dependência estável do Next.js

  return { login, logout };
}
