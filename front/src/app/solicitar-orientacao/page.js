"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import {
  getProfessores,
  getMinhaIdeiaTcc,
  enviarSolicitacao,
  getMinhasSolicitacoes,
  cancelarSolicitacao,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Modal, Box, Typography, Alert } from "@mui/material";

const styleModal = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

export default function SolicitarOrientacaoPage() {
  useAuthRedirect();
  const [professores, setProfessores] = useState([]);
  const [ideias, setIdeias] = useState([]);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [selectedProfessor, setSelectedProfessor] = useState("");
  const [selectedIdeia, setSelectedIdeia] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [solicitacaoToCancel, setSolicitacaoToCancel] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [profData, ideiasData, solicitacoesData] = await Promise.all([
      getProfessores(true),
      getMinhaIdeiaTcc(),
      getMinhasSolicitacoes(),
    ]);

    if (profData) {
      setProfessores(profData);
    }
    if (ideiasData) {
      const ideiasDisponiveis = ideiasData.filter(
        (ideia) => ideia.status === 0
      );
      setIdeias(ideiasDisponiveis);
    }
    if (solicitacoesData) {
      setSolicitacoes(solicitacoesData);
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

    try {
      const result = await enviarSolicitacao({
        id_professor: selectedProfessor,
        id_ideia_tcc: selectedIdeia,
      });

      if (result) {
        setSuccess("Solicitação enviada com sucesso!");
        fetchData(); // Re-fetch data to update the table
        setSelectedIdeia("");
        setSelectedProfessor("");
      }
    } catch (err) {
      setError(
        err.message ||
          "Não foi possível enviar a solicitação. Verifique se já não existe uma solicitação para esta ideia ou alguma pendente."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCancelModal = (solicitacao) => {
    setSolicitacaoToCancel(solicitacao);
    setCancelModalOpen(true);
  };

  const handleCloseCancelModal = () => {
    setSolicitacaoToCancel(null);
    setCancelModalOpen(false);
  };

  const handleConfirmCancel = async () => {
    if (!solicitacaoToCancel) return;

    setLoading(true);
    const result = await cancelarSolicitacao(
      solicitacaoToCancel.id_solicitacao
    );
    if (result) {
      setSuccess("Solicitação cancelada com sucesso!");
      fetchData();
    } else {
      setError("Não foi possível cancelar a solicitação.");
    }
    setLoading(false);
    handleCloseCancelModal();
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0:
        return <Badge variant="secondary">Pendente</Badge>;
      case 1:
        return <Badge>Aceito</Badge>;
      case 2:
        return <Badge variant="destructive">Rejeitado</Badge>;
      case 3:
        return <Badge variant="outline">Cancelada</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  if (loading && !solicitacoes.length) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
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
                      {prof.usuario.nome}
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

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Minhas Solicitações</CardTitle>
          <CardDescription>
            Acompanhe o status das suas solicitações de orientação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Professor</TableHead>
                <TableHead>Ideia de TCC</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {solicitacoes.length > 0 ? (
                solicitacoes.map((solicitacao) => (
                  <TableRow key={solicitacao.id_solicitacao}>
                    <TableCell className="font-medium">
                      {solicitacao.professor?.usuario?.nome || "N/A"}
                    </TableCell>
                    <TableCell>
                      {solicitacao.ideiaTcc?.titulo || "N/A"}
                    </TableCell>
                    <TableCell>
                      {new Date(
                        solicitacao.data_solicitacao
                      ).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getStatusText(solicitacao.status)}</TableCell>
                    <TableCell>
                      {solicitacao.status === 0 && (
                        <a
                          href="#"
                          className="text-red-600 p-0 h-auto"
                          onClick={(e) => {
                            e.preventDefault();
                            handleOpenCancelModal(solicitacao);
                          }}
                          disabled={loading}
                        >
                          Cancelar
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Você ainda não enviou nenhuma solicitação.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Modal open={cancelModalOpen} onClose={handleCloseCancelModal}>
        <Box sx={styleModal}>
          <Typography variant="h6">Confirmar Cancelamento</Typography>
          <Typography>
            Tem certeza que deseja cancelar esta solicitação?
          </Typography>
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}
          >
            <Button variant="outline" onClick={handleCloseCancelModal}>
              Não
            </Button>
            <Button variant="destructive" onClick={handleConfirmCancel}>
              Sim, cancelar
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}
