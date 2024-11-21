'use client'
import { useState } from "react";
import LoginRegisterForm from "@/app/components/login/LoginRegisterForm";

export default function UsuarioCriar() {
  const handleFormSubmit = async (formData) => {
    const apiUrl = process.env.NEXT_PUBLIC_URL_API
    console.log(apiUrl);
    
    try {
      const response = await fetch(`${apiUrl}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Usuário criado com sucesso!");
      } else {
        alert("Erro ao criar usuário.");
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      alert("Erro na conexão com o servidor.");
    }
  };

  return (
    <section>
      <LoginRegisterForm onSubmit={handleFormSubmit} />
    </section>
  );
}
