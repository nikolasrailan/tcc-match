"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { getReunioesProfessor, atualizarReuniao } from "@/api/apiService"; // Importar atualizarReuniao
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
import { Loader2, AlertCircle, Edit, Check } from "lucide-react"; // Importar ícones
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import { AlertCircle } from "lucide-react"; // <- Removido, pois já foi importado acima
import { Dialog } from "@/components/ui/dialog"; // Importar o Dialog root
import { Button } from "@/components/ui/button"; // Importar Button
import { toast } from "sonner"; // Importar toast
import ConfirmationDialog from "../components/reuniao/ConfirmacaoDialog"; // Importar ConfirmationDialog
import ReuniaoModal from "../components/reuniao/ReuniaoModal"; // Importar ReuniaoModal

export default function ReunioesProfessorPage() {
  useAuthRedirect(); // Protege a rota
  const [reunioes, setReunioes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para controlar os modais
  const [reuniaoModalState, setReuniaoModalState] = useState({
    open: false,
    initialData: null,
  });
  const [confirmationState, setConfirmationState] = useState({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

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

  // --- Handlers para os Modais ---

  const handleOpenEditModal = (reuniao) => {
    setReuniaoModalState({ open: true, initialData: reuniao });
  };

  const handleCloseReuniaoModal = () => {
    setReuniaoModalState({ open: false, initialData: null });
  };

  const handleSaveReuniao = () => {
    fetchReunioes(); // Atualiza a lista
    handleCloseReuniaoModal(); // Fecha o modal
  };

  const handleReuniaoStatusChange = (reuniaoId, status) => {
    const actionText =
      status === "realizada" ? "marcar como realizada" : "cancelar";
    const title = `Confirmar Ação`;
    const description = `Tem certeza que deseja ${actionText} esta reunião?`;

    setConfirmationState({
      open: true,
      title,
      description,
      onConfirm: async () => {
        try {
          await atualizarReuniao(reuniaoId, { status });
          toast.success(
            `Reunião ${
              status === "realizada" ? "marcada como realizada" : "cancelada"
            }.`
          );
          fetchReunioes(); // Atualiza a lista
        } catch (error) {
          toast.error(`Erro ao ${actionText} reunião: ${error.message}`);
        } finally {
          setConfirmationState({
            open: false,
            title: "",
            description: "",
            onConfirm: () => {},
          });
        }
      },
    });
  };

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
                  <TableHead>Projeto</TableHead>
                  <TableHead>Pauta</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>{" "}
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
                      <TableCell>
                        {reuniao.orientacao?.ideiaTcc?.titulo ||
                          "Projeto não encontrado"}
                      </TableCell>
                      <TableCell>{reuniao.pauta || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{reuniao.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {reuniao.status === "marcada" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenEditModal(reuniao)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleReuniaoStatusChange(
                                  reuniao.id_reuniao,
                                  "realizada"
                                )
                              }
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleReuniaoStatusChange(
                                  reuniao.id_reuniao,
                                  "cancelada"
                                )
                              }
                            >
                              Cancelar
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      Nenhuma reunião agendada encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={reuniaoModalState.open}
        onOpenChange={(isOpen) => !isOpen && handleCloseReuniaoModal()}
      >
        <ReuniaoModal
          orientacaoId={reuniaoModalState.initialData?.id_orientacao}
          initialData={reuniaoModalState.initialData}
          onSave={handleSaveReuniao}
          onClose={handleCloseReuniaoModal}
        />
      </Dialog>

      <ConfirmationDialog
        open={confirmationState.open}
        onOpenChange={(isOpen) =>
          !isOpen &&
          setConfirmationState({
            open: false,
            title: "",
            description: "",
            onConfirm: () => {},
          })
        }
        title={confirmationState.title}
        description={confirmationState.description}
        onConfirm={confirmationState.onConfirm}
      />
    </div>
  );
}
