"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { getReunioesProfessor } from "@/api/apiService"; // Usar a nova função da API
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function ReunioesProfessorPage() {
  useAuthRedirect(); // Protege a rota
  const [reunioes, setReunioes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReunioes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReunioesProfessor();
      if (data) {
        setReunioes(data);
      } else {
        // Se a API retornar null ou undefined, assume que não há reuniões ou erro
        setReunioes([]);
      }
    } catch (err) {
      setError(
        err.message ||
          "Erro ao buscar reuniões. Verifique se você está logado como professor."
      );
      setReunioes([]); // Limpa as reuniões em caso de erro
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReunioes();
  }, [fetchReunioes]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Minhas Próximas Reuniões</CardTitle>
          <CardDescription>
            Visualize todas as reuniões marcadas com seus orientandos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data e Hora</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Pauta</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reunioes.length > 0 ? (
                  reunioes.map((reuniao) => (
                    <TableRow key={reuniao.id_reuniao}>
                      <TableCell>
                        {new Date(reuniao.data_horario).toLocaleString(
                          "pt-BR",
                          {
                            dateStyle: "short",
                            timeStyle: "short",
                          }
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {reuniao.orientacao?.aluno?.dadosUsuario?.nome ||
                          "Aluno não encontrado"}
                      </TableCell>
                      <TableCell>{reuniao.pauta || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{reuniao.status}</Badge>{" "}
                        {/* Apenas marcadas são listadas */}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      Nenhuma reunião agendada encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
