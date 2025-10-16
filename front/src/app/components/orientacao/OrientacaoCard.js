"use client";
import React, { useState, useEffect, useCallback } from "react";
import { getReunioes, criarReuniao, atualizarReuniao } from "@/api/apiService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, PlusCircle, Trash2 } from "lucide-react";

const ConfirmationDialog = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            Cancelar
          </Button>
        </DialogClose>
        <Button onClick={onConfirm}>Confirmar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const ReuniaoModal = ({ orientacaoId, onSave }) => {
  const [dataHorario, setDataHorario] = useState("");
  const [pauta, setPauta] = useState("");

  const handleSubmit = async () => {
    if (!dataHorario) {
      alert("Por favor, selecione data e hora.");
      return;
    }
    await criarReuniao(orientacaoId, {
      data_horario: dataHorario,
      pauta,
    });
    onSave();
    setDataHorario("");
    setPauta("");
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Agendar Nova Reunião</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="data_horario">Data e Hora</Label>
          <Input
            id="data_horario"
            type="datetime-local"
            value={dataHorario}
            onChange={(e) => setDataHorario(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pauta">Pauta/Assunto</Label>
          <Textarea
            id="pauta"
            value={pauta}
            onChange={(e) => setPauta(e.target.value)}
            placeholder="Tópicos a serem discutidos..."
          />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            Cancelar
          </Button>
        </DialogClose>
        <Button onClick={handleSubmit}>Agendar</Button>
      </DialogFooter>
    </DialogContent>
  );
};

const OrientacaoCard = ({ orientacao, userRole, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [reunioes, setReunioes] = useState([]);
  const [isReuniaoModalOpen, setIsReuniaoModalOpen] = useState(false);
  const [confirmationState, setConfirmationState] = useState({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });
  const [formData, setFormData] = useState({
    url_projeto: orientacao.url_projeto || "",
    observacoes: orientacao.observacoes || "",
  });

  const fetchReunioes = useCallback(async () => {
    if (orientacao.id_orientacao) {
      const data = await getReunioes(orientacao.id_orientacao);
      if (data) {
        setReunioes(data);
      }
    }
  }, [orientacao.id_orientacao]);

  useEffect(() => {
    fetchReunioes();
  }, [fetchReunioes]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = () => {
    onUpdate(orientacao.id_orientacao, formData);
    setIsEditing(false);
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
        await atualizarReuniao(reuniaoId, { status });
        fetchReunioes();
        setConfirmationState({
          open: false,
          title: "",
          description: "",
          onConfirm: () => {},
        });
      },
    });
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "em desenvolvimento":
        return <Badge>Em Desenvolvimento</Badge>;
      case "finalizado":
        return <Badge className="bg-green-500">Finalizado</Badge>;
      case "cancelado":
        return <Badge variant="destructive">Cancelado</Badge>;
      case "pausado":
        return <Badge variant="secondary">Pausado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderReuniaoStatusBadge = (status) => {
    switch (status) {
      case "marcada":
        return <Badge variant="secondary">Marcada</Badge>;
      case "realizada":
        return <Badge className="bg-green-500">Realizada</Badge>;
      case "cancelada":
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{orientacao.ideiaTcc.titulo}</CardTitle>
        <CardDescription>
          {userRole === "aluno"
            ? `Professor: ${orientacao.professor.usuario.nome}`
            : `Aluno: ${orientacao.aluno.dadosUsuario.nome}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Status</Label>
            <div className="mt-1">{renderStatusBadge(orientacao.status)}</div>
          </div>
          <div>
            <Label>Data de Início</Label>
            <p className="text-sm mt-1">
              {new Date(orientacao.data_inicio).toLocaleDateString()}
            </p>
          </div>
          <div>
            <Label>Data de Fim</Label>
            <p className="text-sm mt-1">
              {orientacao.data_fim
                ? new Date(orientacao.data_fim).toLocaleDateString()
                : "Não definida"}
            </p>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="url_projeto">
                URL do Projeto (Google Drive, GitHub, etc.)
              </Label>
              <Input
                id="url_projeto"
                name="url_projeto"
                value={formData.url_projeto}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                rows={5}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>URL do Projeto</Label>
              {orientacao.url_projeto ? (
                <a
                  href={orientacao.url_projeto}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline block mt-1"
                >
                  {orientacao.url_projeto}
                </a>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  Nenhum link adicionado.
                </p>
              )}
            </div>
            <div>
              <Label>Observações</Label>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">
                {orientacao.observacoes || "Nenhuma observação."}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Dialog
            open={isReuniaoModalOpen}
            onOpenChange={setIsReuniaoModalOpen}
          >
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">Reuniões</Label>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" /> Agendar Reunião
                </Button>
              </DialogTrigger>
            </div>
            <ReuniaoModal
              orientacaoId={orientacao.id_orientacao}
              onSave={() => {
                fetchReunioes();
                setIsReuniaoModalOpen(false);
              }}
            />
          </Dialog>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data e Hora</TableHead>
                  <TableHead>Pauta</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reunioes.length > 0 ? (
                  reunioes.map((reuniao) => (
                    <TableRow key={reuniao.id_reuniao}>
                      <TableCell>
                        {new Date(reuniao.data_horario).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell>{reuniao.pauta}</TableCell>
                      <TableCell>
                        {renderReuniaoStatusBadge(reuniao.status)}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {reuniao.status === "marcada" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleReuniaoStatusChange(
                                  reuniao.id_reuniao,
                                  "realizada"
                                )
                              }
                            >
                              Realizada
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
                    <TableCell colSpan={4} className="text-center h-24">
                      Nenhuma reunião agendada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate}>Salvar</Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditing(true)}>Editar Detalhes</Button>
        )}
      </CardFooter>
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
    </Card>
  );
};

export default OrientacaoCard;
