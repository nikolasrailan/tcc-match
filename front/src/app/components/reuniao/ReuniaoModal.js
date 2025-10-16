"use client";
import React, { useState, useEffect } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { criarReuniao, atualizarReuniao } from "@/api/apiService";

const ReuniaoModal = ({
  orientacaoId,
  onSave,
  initialData = null,
  onClose,
}) => {
  const [dataHorario, setDataHorario] = useState("");
  const [pauta, setPauta] = useState("");

  useEffect(() => {
    if (initialData) {
      // Formata a data para o input datetime-local (YYYY-MM-DDTHH:mm)
      const formattedDate = new Date(initialData.data_horario)
        .toISOString()
        .slice(0, 16);
      setDataHorario(formattedDate);
      setPauta(initialData.pauta || "");
    } else {
      setDataHorario("");
      setPauta("");
    }
  }, [initialData]);

  const handleSubmit = async () => {
    if (!dataHorario) {
      alert("Por favor, selecione data e hora.");
      return;
    }
    const reuniaoData = {
      data_horario: dataHorario,
      pauta,
    };

    try {
      if (initialData) {
        await atualizarReuniao(initialData.id_reuniao, reuniaoData);
      } else {
        await criarReuniao(orientacaoId, reuniaoData);
      }
      onSave();
    } catch (error) {
      console.error("Failed to save meeting:", error);
      alert(`Erro ao salvar reunião: ${error.message}`);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {initialData ? "Editar Reunião" : "Agendar Nova Reunião"}
        </DialogTitle>
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
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit}>
          {initialData ? "Salvar Alterações" : "Agendar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default ReuniaoModal;
