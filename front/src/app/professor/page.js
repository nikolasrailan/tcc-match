"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { getProfessorDashboard, responderSolicitacao } from "@/api/apiService";
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
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

// Componente Modal separado (como estava antes)
const SolicitacaoModal = ({ open, onClose, solicitacao, onResponder }) => {
  if (!open || !solicitacao) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="fixed inset-0" onClick={onClose} />
      <Card className="z-10 w-full max-w-lg">
        <CardHeader>
          <CardTitle>Detalhes da Solicitação</CardTitle>
          <CardDescription>
            De: {solicitacao.aluno?.dadosUsuario?.nome || "N/A"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-semibold">Título da Proposta</Label>
            <p className="text-sm">{solicitacao.ideiaTcc?.titulo || "N/A"}</p>
          </div>
          <div>
            <Label className="text-sm font-semibold">Descrição</Label>
            <p className="text-sm">
              {solicitacao.ideiaTcc?.descricao || "N/A"}
            </p>
          </div>
          <div>
            <Label className="text-sm font-semibold">Áreas de Interesse</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {solicitacao.ideiaTcc?.areasDeInteresse?.length > 0 ? (
                solicitacao.ideiaTcc.areasDeInteresse.map((area) => (
                  <Badge key={area.id_area} variant="secondary">
                    {area.nome}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma área especificada.
                </p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button
            variant="destructive"
            onClick={() => onResponder(solicitacao.id_solicitacao, false)}
          >
            Rejeitar
          </Button>
          <Button onClick={() => onResponder(solicitacao.id_solicitacao, true)}>
            Aceitar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default function ProfessorDashboardPage() {
  useAuthRedirect();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProfessorDashboard();
      if (data) {
        setDashboardData(data);
      } else {
        const msg =
          "Não foi possível carregar os dados. Verifique se você tem permissão para aceder a esta página.";
        setError(msg);
        toast.error(msg);
      }
    } catch (e) {
      setError(e.message || "Ocorreu um erro de rede.");
      toast.error(e.message || "Ocorreu um erro de rede.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (solicitacao) => {
    setSelectedSolicitacao(solicitacao);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedSolicitacao(null);
    setModalOpen(false);
  };

  const handleResponder = async (id, aceito) => {
    setError(null);
    try {
      const result = await responderSolicitacao(id, aceito);
      if (result) {
        if (aceito) {
          toast.success("Solicitação aceita com sucesso!", {
            description: "Agora é possível baixar o documento de ciência.", // Mensagem adicionada
          });
        } else {
          toast.success("Solicitação rejeitada com sucesso!");
        }
        handleCloseModal();
        fetchData();
      } else {
        const msg = "Ocorreu um erro ao responder à solicitação.";
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.solicitacoesPendentes.length > 0 ? (
                    dashboardData.solicitacoesPendentes.map((sol) => (
                      <TableRow
                        key={sol.id_solicitacao}
                        onClick={() => handleOpenModal(sol)}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">
                          {sol.aluno?.dadosUsuario?.nome || "N/A"}
                        </TableCell>
                        <TableCell>
                          {sol.aluno?.dadosUsuario?.email || "N/A"}
                        </TableCell>
                        <TableCell>{sol.ideiaTcc?.titulo || "N/A"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">
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

      <SolicitacaoModal
        open={modalOpen}
        onClose={handleCloseModal}
        solicitacao={selectedSolicitacao}
        onResponder={handleResponder}
      />
    </div>
  );
}
