"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import {
  getProfessoresDisponiveis,
  getMinhasIdeias,
  enviarSolicitacao,
} from "@/api/apiService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

export default function SolicitarOrientacaoPage() {
  useAuthRedirect();
  const router = useRouter();
  const [professores, setProfessores] = useState([]);
  const [ideias, setIdeias] = useState([]);
  const [selectedProfessor, setSelectedProfessor] = useState("");
  const [selectedIdeia, setSelectedIdeia] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [profData, ideiasData] = await Promise.all([
      getProfessoresDisponiveis(),
      getMinhasIdeias(),
    ]);

    if (profData) {
      setProfessores(profData);
    }
    if (ideiasData) {
      // Filtrar ideias que ainda não foram submetidas ou estão pendentes
      const ideiasDisponiveis = ideiasData.filter(
        (ideia) => ideia.status === 0
      );
      setIdeias(ideiasDisponiveis);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!selectedProfessor || !selectedIdeia) {
      setError("Por favor, selecione um professor e uma ideia.");
      setLoading(false);
      return;
    }

    const result = await enviarSolicitacao({
      id_professor: selectedProfessor,
      id_ideia_tcc: selectedIdeia,
    });

    setLoading(false);
    if (result) {
      setSuccess("Solicitação enviada com sucesso!");
      setTimeout(() => router.push("/aluno"), 2000);
    } else {
      // A mensagem de erro específica já é mostrada pelo alert no apiService
      setError(
        "Não foi possível enviar a solicitação. Verifique se já não existe uma solicitação para esta ideia."
      );
    }
  };

  if (loading && professores.length === 0 && ideias.length === 0) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Solicitar Orientação</CardTitle>
          <CardDescription>
            Escolha uma de suas ideias de TCC e um professor disponível para
            enviar uma solicitação de orientação.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Professor</Label>
              <Select
                onValueChange={setSelectedProfessor}
                value={selectedProfessor}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um professor..." />
                </SelectTrigger>
                <SelectContent>
                  {professores.map((prof) => (
                    <SelectItem
                      key={prof.id_professor}
                      value={prof.id_professor.toString()}
                    >
                      {prof.usuario.nome} - {prof.especializacao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Minha Ideia de TCC</Label>
              <Select onValueChange={setSelectedIdeia} value={selectedIdeia}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione sua ideia..." />
                </SelectTrigger>
                <SelectContent>
                  {ideias.length > 0 ? (
                    ideias.map((ideia) => (
                      <SelectItem
                        key={ideia.id_ideia_tcc}
                        value={ideia.id_ideia_tcc.toString()}
                      >
                        {ideia.titulo}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="disabled" disabled>
                      Você não tem ideias disponíveis para orientação.
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {success && <p className="text-green-500 text-sm">{success}</p>}
            </div>
            <Button type="submit" disabled={loading || ideias.length === 0}>
              {loading ? "Enviando..." : "Enviar Solicitação"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
