"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { getProfessorDashboard, responderSolicitacao } from "@/api/apiService";
import { Button } from "@/components/ui/button";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Users,
  BookOpenCheck,
  MailQuestion,
  Check,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function ProfessorDashboardPage() {
  useAuthRedirect();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProfessorDashboard();
      if (data) {
        setDashboardData(data);
      } else {
        setError(
          "Não foi possível carregar os dados. Verifique se você tem permissão para aceder a esta página."
        );
      }
    } catch (e) {
      setError(e.message || "Ocorreu um erro de rede.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleResponder = async (id, aceito) => {
    setError(null);
    try {
      const result = await responderSolicitacao(id, aceito);
      if (result) {
        fetchData(); // Recarrega os dados após a resposta
      } else {
        setError("Ocorreu um erro ao responder à solicitação.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Dashboard do Professor</h1>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {dashboardData && (
        <>
          {/* STATS CARDS */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Orientações Atuais
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.stats.orientandos}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Vagas Disponíveis
                </CardTitle>
                <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.stats.vagas}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Solicitações Pendentes
                </CardTitle>
                <MailQuestion className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.stats.pendentes}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PENDING REQUESTS */}
          <Card>
            <CardHeader>
              <CardTitle>Solicitações Pendentes</CardTitle>
              <CardDescription>
                Avalie as propostas de TCC enviadas pelos alunos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Proposta de TCC</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.solicitacoesPendentes.length > 0 ? (
                    dashboardData.solicitacoesPendentes.map((sol) => (
                      <TableRow key={sol.id_solicitacao}>
                        <TableCell className="font-medium">
                          {sol.aluno?.dadosUsuario?.nome || "N/A"}
                        </TableCell>
                        <TableCell>
                          {sol.aluno?.dadosUsuario?.email || "N/A"}
                        </TableCell>
                        <TableCell>{sol.ideiaTcc?.titulo || "N/A"}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleResponder(sol.id_solicitacao, true)
                            }
                          >
                            Aceitar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleResponder(sol.id_solicitacao, false)
                            }
                          >
                            Rejeitar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        Nenhuma solicitação pendente.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* CURRENT ADVISEES */}
          <Card>
            <CardHeader>
              <CardTitle>Meus Orientandos</CardTitle>
              <CardDescription>
                Lista de alunos que você está a orientar atualmente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Título do TCC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.orientandosAtuais.length > 0 ? (
                    dashboardData.orientandosAtuais.map((sol) => (
                      <TableRow key={sol.id_solicitacao}>
                        <TableCell className="font-medium">
                          {sol.aluno?.dadosUsuario?.nome || "N/A"}
                        </TableCell>
                        <TableCell>
                          {sol.aluno?.dadosUsuario?.email || "N/A"}
                        </TableCell>
                        <TableCell>
                          {sol.aluno?.cursoInfo?.nome || "N/A"}
                        </TableCell>
                        <TableCell>{sol.ideiaTcc?.titulo || "N/A"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        Você ainda não está a orientar nenhum aluno.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
