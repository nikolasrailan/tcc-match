"use client";
import useAuth from "@/hooks/useAuth";
import LoginRegisterForm from "@/app/components/login/LoginRegisterForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useState } from "react";

export default function UsuarioCriar() {
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFormSubmit = async (formData) => {
    setError("");
    setSuccess("");
    const apiUrl = process.env.NEXT_PUBLIC_URL_API;

    try {
      const registerResponse = await fetch(`${apiUrl}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (registerResponse.ok) {
        setSuccess("Usuário registrado com sucesso! Fazendo login...");
        await login(formData.email, formData.senha);
      } else {
        const errorData = await registerResponse.json();
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors
            .map((err) => err.msg)
            .join("\n");
          setError(`Erro ao criar usuário:\n${errorMessages}`);
        } else {
          setError(
            errorData.error || "Erro ao criar usuário. Tente novamente."
          );
        }
      }
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      setError("Erro na conexão com o servidor.");
    }
  };

  return (
    <section>
      {error && (
        <Alert variant="destructive" className="mb-4 max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="mb-4 max-w-md mx-auto">
          <AlertTitle>Sucesso</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      <LoginRegisterForm onSubmit={handleFormSubmit} />
    </section>
  );
}
