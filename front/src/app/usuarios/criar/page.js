"use client";
import useAuth from "@/hooks/useAuth";
import LoginRegisterForm from "@/app/components/login/LoginRegisterForm";

export default function UsuarioCriar() {
  const { login } = useAuth();

  const handleFormSubmit = async (formData) => {
    const apiUrl = process.env.NEXT_PUBLIC_URL_API;

    try {
      const registerResponse = await fetch(`${apiUrl}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (registerResponse.ok) {
        alert("Usuário registrado com sucesso!");
        await login(formData.email, formData.senha);
      } else {
        alert("Erro ao criar usuário.");
      }
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      alert("Erro na conexão com o servidor.");
    }
  };

  return (
    <section>
      <LoginRegisterForm onSubmit={handleFormSubmit} />
    </section>
  );
}
