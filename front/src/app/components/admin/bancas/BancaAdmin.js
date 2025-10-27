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
} from "@/api/apiService"; // Importa a nova função
import { toast } from "sonner";
import { Loader2, CalendarIcon, MapPinIcon, PencilIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils"; // Para o botão de calendário

const BancaAdmin = () => {
  const [bancas, setBancas] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [editingBanca, setEditingBanca] = useState(null); // Guarda a banca sendo editada
  const [editData, setEditData] = useState({
    data_defesa: null,
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
      toast.error("Erro ao gerar bancas.", { description: error.message });
    } finally {
      setLoadingGenerate(false);
    }
  };

  const handleOpenEdit = (banca) => {
    setEditingBanca(banca);
    setEditData({
      // Se a data_defesa existe e é válida, parseia, senão null
      data_defesa:
        banca.data_defesa && !isNaN(parseISO(banca.data_defesa).valueOf())
          ? parseISO(banca.data_defesa)
          : null,
      local_defesa: banca.local_defesa || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingBanca(null);
    setEditData({ data_defesa: null, local_defesa: "" });
  };

  const handleDateSelect = (date) => {
    setEditData((prev) => ({ ...prev, data_defesa: date }));
    setCalendarOpen(false); // Fecha o popover após selecionar
  };

  const handleLocalChange = (e) => {
    setEditData((prev) => ({ ...prev, local_defesa: e.target.value }));
  };

  const handleSaveEdit = async () => {
    if (!editingBanca) return;
    setLoadingGenerate(true); // Reutiliza o estado de loading para salvar
    try {
      const dataToSave = {
        // Formata a data para YYYY-MM-DD se ela existir, senão null
        data_defesa: editData.data_defesa
          ? format(editData.data_defesa, "yyyy-MM-dd")
          : null,
        local_defesa: editData.local_defesa || null, // Salva null se vazio
      };

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
                  <TableHead>Data Defesa</TableHead>
                  <TableHead>Local Defesa</TableHead>
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
                      <TableCell>
                        {editingBanca?.id_banca === banca.id_banca ? (
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
                        ) : banca.data_defesa ? (
                          format(parseISO(banca.data_defesa), "dd/MM/yyyy")
                        ) : (
                          "Não definida"
                        )}
                      </TableCell>
                      <TableCell>
                        {editingBanca?.id_banca === banca.id_banca ? (
                          <Input
                            value={editData.local_defesa}
                            onChange={handleLocalChange}
                            placeholder="Local da defesa"
                          />
                        ) : (
                          banca.local_defesa || "Não definido"
                        )}
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
