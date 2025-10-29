"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  gerarBancas,
  listarBancas,
  atualizarDetalhesBanca,
} from "@/api/apiService";
import { toast } from "sonner";
import {
  Loader2,
  CalendarIcon,
  MapPinIcon,
  PencilIcon,
  ClockIcon,
  FileTextIcon,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, parseISO, setHours, setMinutes, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import AtaDefesaModal from "./AtaDefesaModal";
const BancaAdmin = () => {
  const [bancas, setBancas] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [editingBanca, setEditingBanca] = useState(null);
  const [editData, setEditData] = useState({
    data_defesa: null,
    hora_defesa: "",
    local_defesa: "",
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [ataModalOpen, setAtaModalOpen] = useState(false); // Estado para o modal da ata
  const [selectedBancaForAta, setSelectedBancaForAta] = useState(null); // Banca selecionada para a ata

  const fetchBancas = useCallback(async () => {
    // Não reinicia loadingList aqui para não piscar a tela em updates
    try {
      const data = await listarBancas();
      setBancas(data || []);
    } catch (error) {
      toast.error("Erro ao buscar bancas.", { description: error.message });
    } finally {
      setLoadingList(false); // Desativa o loading inicial ou após erro
    }
  }, []);

  useEffect(() => {
    setLoadingList(true); // Ativa o loading na montagem inicial
    fetchBancas();
  }, [fetchBancas]);

  const handleGerarBancas = async () => {
    setLoadingGenerate(true);
    try {
      const result = await gerarBancas();
      toast.success(result.message || "Bancas geradas/atualizadas!");
      if (result.alertas && result.alertas.length > 0) {
        result.alertas.forEach((alerta) => toast.warning(alerta));
      }
      fetchBancas();
    } catch (error) {
      if (error.alertas && Array.isArray(error.alertas)) {
        error.alertas.forEach((alerta) => toast.warning(alerta));
      } else {
        toast.error("Erro ao gerar bancas.", { description: error.message });
      }
    } finally {
      setLoadingGenerate(false);
    }
  };

  const handleOpenEdit = (banca) => {
    setEditingBanca(banca);
    let initialDate = null;
    let initialTime = "";
    if (banca.data_defesa) {
      const parsedDate = parseISO(banca.data_defesa);
      if (isValid(parsedDate)) {
        initialDate = parsedDate;
        initialTime = format(parsedDate, "HH:mm");
      }
    }
    setEditData({
      data_defesa: initialDate,
      hora_defesa: initialTime,
      local_defesa: banca.local_defesa || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingBanca(null);
    setEditData({ data_defesa: null, hora_defesa: "", local_defesa: "" });
  };

  const handleDateSelect = (date) => {
    setEditData((prev) => ({ ...prev, data_defesa: date }));
    setCalendarOpen(false);
  };

  const handleTimeChange = (e) => {
    setEditData((prev) => ({ ...prev, hora_defesa: e.target.value }));
  };

  const handleLocalChange = (e) => {
    setEditData((prev) => ({ ...prev, local_defesa: e.target.value }));
  };

  const handleSaveEdit = async () => {
    if (!editingBanca) return;
    if (
      !editData.data_defesa &&
      !editData.hora_defesa &&
      !editData.local_defesa
    ) {
      toast.info("Nenhuma alteração detectada para salvar.");
      handleCancelEdit(); // Simplesmente fecha a edição
      return;
    }

    // Validar se data E hora foram preenchidas juntas, se data foi preenchida
    let combinedDateTime = null;
    if (editData.data_defesa) {
      if (!editData.hora_defesa) {
        toast.error("Por favor, informe a hora da defesa.");
        return;
      }
      const [hours, minutes] = editData.hora_defesa.split(":").map(Number);
      if (isValid(editData.data_defesa)) {
        combinedDateTime = setHours(editData.data_defesa, hours);
        combinedDateTime = setMinutes(combinedDateTime, minutes);
      } else {
        toast.error("Data inválida selecionada.");
        return;
      }
    } else if (editData.hora_defesa) {
      // Se só a hora foi informada, mas não a data, considerar erro ou pegar data existente?
      // Vamos exigir ambos se um for preenchido
      toast.error("Por favor, selecione também a data da defesa.");
      return;
    }

    setLoadingGenerate(true); // Reutiliza o estado de loading
    try {
      const dataToSave = {
        data_defesa: combinedDateTime
          ? format(combinedDateTime, "yyyy-MM-dd'T'HH:mm:ss")
          : null,
        local_defesa: editData.local_defesa || null,
      };

      await atualizarDetalhesBanca(editingBanca.id_banca, dataToSave);
      toast.success("Detalhes da banca atualizados!");
      handleCancelEdit();
      fetchBancas(); // Atualiza a lista
    } catch (error) {
      toast.error("Erro ao salvar detalhes da banca.", {
        description: error.message,
      });
    } finally {
      setLoadingGenerate(false);
    }
  };

  // Funções para o modal da Ata de Defesa
  const handleOpenAtaModal = (banca) => {
    if (!banca.data_defesa || !banca.local_defesa) {
      toast.warning(
        "Defina a Data, Hora e Local da defesa antes de gerar a ata."
      );
      return;
    }
    setSelectedBancaForAta(banca);
    setAtaModalOpen(true);
  };

  const handleCloseAtaModal = () => {
    setSelectedBancaForAta(null);
    setAtaModalOpen(false);
  };

  const handleAtaSaved = () => {
    handleCloseAtaModal();
    fetchBancas(); // Atualiza a lista para refletir o conceito salvo (se necessário exibir)
  };

  const renderNomeAvaliador = (avaliador) => {
    return (
      avaliador?.usuario?.nome || (
        <span className="text-muted-foreground italic">N/A</span>
      )
    );
  };

  // Define as colunas que podem estar ausentes ou em edição
  const getTableCellContent = (banca, field) => {
    const isEditingCurrent = editingBanca?.id_banca === banca.id_banca;

    switch (field) {
      case "data_hora":
        if (isEditingCurrent) {
          return (
            <div className="flex flex-col gap-2 min-w-[190px]">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editData.data_defesa && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editData.data_defesa ? (
                      format(editData.data_defesa, "PPP", { locale: ptBR })
                    ) : (
                      <span>Escolha data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editData.data_defesa}
                    onSelect={handleDateSelect}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <div className="relative w-full">
                <ClockIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={editData.hora_defesa}
                  onChange={handleTimeChange}
                  className="pl-8"
                />
              </div>
            </div>
          );
        }
        return banca.data_defesa ? (
          format(parseISO(banca.data_defesa), "dd/MM/yyyy HH:mm")
        ) : (
          <span className="text-muted-foreground italic">Não definida</span>
        );
      case "local":
        if (isEditingCurrent) {
          return (
            <div className="relative min-w-[180px]">
              <MapPinIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={editData.local_defesa}
                onChange={handleLocalChange}
                placeholder="Local da defesa"
                className="pl-8"
              />
            </div>
          );
        }
        return (
          banca.local_defesa || (
            <span className="text-muted-foreground italic">Não definido</span>
          )
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <div>
          <CardTitle>Bancas Geradas</CardTitle>
          <CardDescription>
            Visualize, edite e gere as atas das bancas de defesa.
          </CardDescription>
        </div>
        <Button
          onClick={handleGerarBancas}
          disabled={loadingGenerate || loadingList}
          className="flex-shrink-0"
        >
          {loadingGenerate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Gerar/Atualizar Bancas
        </Button>
      </CardHeader>
      <CardContent>
        {loadingList ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Orientador</TableHead>
                  <TableHead>Avaliador 1</TableHead>
                  <TableHead>Avaliador 2</TableHead>
                  <TableHead>Avaliador 3</TableHead>
                  <TableHead>Data e Hora</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bancas.length > 0 ? (
                  bancas.map((banca) => (
                    <TableRow key={banca.id_banca}>
                      <TableCell>
                        {banca.orientacao?.aluno?.dadosUsuario?.nome || "N/A"}
                      </TableCell>
                      <TableCell className="min-w-[200px] max-w-[300px] whitespace-normal break-words">
                        {banca.orientacao?.ideiaTcc?.titulo || "N/A"}
                      </TableCell>
                      <TableCell>
                        {banca.orientacao?.professor?.usuario?.nome || "N/A"}
                      </TableCell>
                      <TableCell>
                        {renderNomeAvaliador(banca.avaliador1)}
                      </TableCell>
                      <TableCell>
                        {renderNomeAvaliador(banca.avaliador2)}
                      </TableCell>
                      <TableCell>
                        {renderNomeAvaliador(banca.avaliador3)}
                      </TableCell>
                      <TableCell>
                        {getTableCellContent(banca, "data_hora")}
                      </TableCell>
                      <TableCell>
                        {getTableCellContent(banca, "local")}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingBanca?.id_banca === banca.id_banca ? (
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              onClick={handleSaveEdit}
                              disabled={loadingGenerate}
                            >
                              {loadingGenerate && (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              )}{" "}
                              Salvar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              disabled={loadingGenerate}
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenAtaModal(banca)}
                              disabled={
                                !banca.data_defesa || !banca.local_defesa
                              }
                            >
                              <FileTextIcon className="h-4 w-4" />{" "}
                              <span className="ml-1 hidden sm:inline">
                                Gerar Ata
                              </span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenEdit(banca)}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      Nenhuma banca gerada ainda ou todas as orientações
                      finalizadas já possuem banca.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Modal da Ata de Defesa */}
      {selectedBancaForAta && (
        <AtaDefesaModal
          open={ataModalOpen}
          onClose={handleCloseAtaModal}
          banca={selectedBancaForAta}
          onSaveSuccess={handleAtaSaved} // Renomeado para clareza
        />
      )}
    </Card>
  );
};

export default BancaAdmin;
