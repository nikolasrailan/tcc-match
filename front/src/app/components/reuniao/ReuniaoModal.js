"use client";
import React, { useState } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { criarReuniao } from "@/api/apiService";

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

export default ReuniaoModal;
