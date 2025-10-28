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
} from "lucide-react"; // Adicionado ClockIcon
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Importar date-fns para manipulação de datas e horas
import { format, parseISO, setHours, setMinutes, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const BancaAdmin = () => {
  const [bancas, setBancas] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [editingBanca, setEditingBanca] = useState(null);
  const [editData, setEditData] = useState({
    data_defesa: null, // Armazena o objeto Date selecionado
    hora_defesa: "", // Armazena a hora como string "HH:mm"
    local_defesa: "",
  });
  const [calendarOpen, setCalendarOpen] = useState(false);

  const fetchBancas = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await listarBancas();
      setBancas(data || []);
    } catch (error) {
      toast.error("Erro ao buscar bancas.", { description: error.message });
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
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
      fetchBancas(); // Atualiza a lista após gerar
    } catch (error) {
      // Se houver alertas específicos de conflito no erro, exibe-os
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
    setCalendarOpen(false); // Fecha o popover após selecionar
  };

  const handleTimeChange = (e) => {
    setEditData((prev) => ({ ...prev, hora_defesa: e.target.value }));
  };

  const handleLocalChange = (e) => {
    setEditData((prev) => ({ ...prev, local_defesa: e.target.value }));
  };

  const handleSaveEdit = async () => {
    if (!editingBanca) return;

    // Validar se data e hora foram selecionadas
    if (!editData.data_defesa || !editData.hora_defesa) {
      toast.error("Por favor, selecione a data e a hora da defesa.");
      return;
    }

    setLoadingGenerate(true); // Reutiliza o estado de loading para salvar
    try {
      // Combina data e hora
      const [hours, minutes] = editData.hora_defesa.split(":").map(Number);
      let combinedDateTime = editData.data_defesa;
      if (isValid(combinedDateTime)) {
        combinedDateTime = setHours(combinedDateTime, hours);
        combinedDateTime = setMinutes(combinedDateTime, minutes);
      } else {
        toast.error("Data inválida selecionada.");
        setLoadingGenerate(false);
        return;
      }

      const dataToSave = {
        // Formata data e hora para ISO string local (sem 'Z')
        data_defesa: isValid(combinedDateTime)
          ? format(combinedDateTime, "yyyy-MM-dd'T'HH:mm:ss")
          : null,
        local_defesa: editData.local_defesa || null, // Salva null se vazio
      };

      // Verifica se data_defesa não é null antes de enviar
      if (!dataToSave.data_defesa) {
        toast.error("Data ou hora inválida.");
        setLoadingGenerate(false);
        return;
      }

      await atualizarDetalhesBanca(editingBanca.id_banca, dataToSave);
      toast.success("Detalhes da banca atualizados!");
      handleCancelEdit(); // Fecha edição
      fetchBancas(); // Atualiza a lista
    } catch (error) {
      toast.error("Erro ao salvar detalhes da banca.", {
        description: error.message,
      });
    } finally {
      setLoadingGenerate(false);
    }
  };

  const renderNomeAvaliador = (avaliador) => {
    return (
      avaliador?.usuario?.nome || (
        <span className="text-muted-foreground italic">N/A</span>
      )
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Bancas Geradas</CardTitle>
          <CardDescription>
            Visualize e gerencie as bancas de defesa geradas.
          </CardDescription>
        </div>
        <Button
          onClick={handleGerarBancas}
          disabled={loadingGenerate || loadingList}
        >
          {loadingGenerate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Gerar Novas Bancas
        </Button>
      </CardHeader>
      <CardContent>
        {loadingList ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orientação (ID)</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Orientador</TableHead>
                  <TableHead>Avaliador 1</TableHead>
                  <TableHead>Avaliador 2</TableHead>
                  <TableHead>Avaliador 3</TableHead>
                  <TableHead>Data e Hora</TableHead> {/* Coluna unificada */}
                  <TableHead>Local</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bancas.length > 0 ? (
                  bancas.map((banca) => (
                    <TableRow key={banca.id_banca}>
                      <TableCell>{banca.id_orientacao}</TableCell>
                      <TableCell>
                        {banca.orientacao?.aluno?.dadosUsuario?.nome || "N/A"}
                      </TableCell>
                      <TableCell>
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
                      {/* Célula de Edição ou Visualização de Data e Hora */}
                      <TableCell>
                        {editingBanca?.id_banca === banca.id_banca ? (
                          <div className="flex flex-col gap-2">
                            {/* Input de Data */}
                            <Popover
                              open={calendarOpen}
                              onOpenChange={setCalendarOpen}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-[180px] justify-start text-left font-normal",
                                    !editData.data_defesa &&
                                      "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {editData.data_defesa ? (
                                    format(editData.data_defesa, "PPP", {
                                      locale: ptBR,
                                    })
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
                            {/* Input de Hora */}
                            <div className="relative w-[180px]">
                              <ClockIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="time"
                                value={editData.hora_defesa}
                                onChange={handleTimeChange}
                                className="pl-8" // Padding para não sobrepor o ícone
                              />
                            </div>
                          </div>
                        ) : banca.data_defesa ? (
                          // Mostra data e hora formatadas
                          format(
                            parseISO(banca.data_defesa),
                            "dd/MM/yyyy HH:mm"
                          )
                        ) : (
                          "Não definida"
                        )}
                      </TableCell>
                      {/* Célula de Edição ou Visualização de Local */}
                      <TableCell>
                        {editingBanca?.id_banca === banca.id_banca ? (
                          <div className="relative w-[180px]">
                            <MapPinIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              value={editData.local_defesa}
                              onChange={handleLocalChange}
                              placeholder="Local da defesa"
                              className="pl-8"
                            />
                          </div>
                        ) : (
                          banca.local_defesa || "Não definido"
                        )}
                      </TableCell>
                      {/* Célula de Ações */}
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
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEdit(banca)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      Nenhuma banca gerada ainda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BancaAdmin;
