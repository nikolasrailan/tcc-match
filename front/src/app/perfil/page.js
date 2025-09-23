"use client";

import React, { useState, useEffect } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { updateUsuario } from "@/api/apiService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PerfilPage() {
  useAuthRedirect();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // A pagina só deve carregar se o user estiver no localStorage.
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setFormData({
            nome: parsedUser.nome || "",
            email: parsedUser.email || "",
            matricula: parsedUser.dadosAluno?.matricula || "",
            curso: parsedUser.dadosAluno?.curso || "",
            especializacao: parsedUser.dadosProfessor?.especializacao || "",
            disponibilidade: parsedUser.dadosProfessor?.disponibilidade
              ? "disponivel"
              : "indisponivel",
          });
        } catch (e) {
          console.error("Falha ao analisar o usuário do localStorage", e);
        }
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setFormData((prev) => ({ ...prev, disponibilidade: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!user) {
      setError("Usuário não encontrado.");
      setLoading(false);
      return;
    }

    const dataToUpdate = {
      nome: formData.nome,
      email: formData.email,
      ...(user.dadosAluno && {
        matricula: formData.matricula,
        curso: formData.curso,
      }),
      ...(user.dadosProfessor && {
        especializacao: formData.especializacao,
        disponibilidade: formData.disponibilidade === "disponivel",
      }),
    };

    // Ajusta o formato da disponibilidade para o backend
    if (user.dadosProfessor) {
      dataToUpdate.disponibilidade = dataToUpdate.disponibilidade ? 1 : 0;
    }

    const result = await updateUsuario(user.id_usuario, dataToUpdate);
    setLoading(false);

    if (result && result.user) {
      setSuccess("Perfil atualizado com sucesso!");
      // Atualizar o localStorage com os novos dados recebidos do backend
      localStorage.setItem("user", JSON.stringify(result.user));
      setUser(result.user);
    } else {
      setError("Ocorreu um erro ao atualizar o perfil.");
    }
  };

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Meu Perfil</CardTitle>
          <CardDescription>Atualize suas informações pessoais.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                name="nome"
                value={formData.nome || ""}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email || ""}
                onChange={handleChange}
              />
            </div>
            {/* Campos para Aluno */}
            {user.dadosAluno && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="matricula">Matrícula</Label>
                  <Input
                    id="matricula"
                    name="matricula"
                    value={formData.matricula || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="curso">Curso</Label>
                  <Input
                    id="curso"
                    name="curso"
                    value={formData.curso || ""}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}
            {/* Campos para Professor */}
            {user.dadosProfessor && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="especializacao">Especialização</Label>
                  <Input
                    id="especializacao"
                    name="especializacao"
                    value={formData.especializacao || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disponibilidade">Disponibilidade</Label>
                  <Select
                    value={formData.disponibilidade}
                    onValueChange={handleSelectChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disponivel">Disponível</SelectItem>
                      <SelectItem value="indisponivel">Indisponível</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {success && <p className="text-green-500 text-sm">{success}</p>}
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
