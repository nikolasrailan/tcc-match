"use client";
import React, { useState, useEffect } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription, // Importar DialogDescription
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { criarReuniao, atualizarReuniao } from "@/api/apiService";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, setHours, setMinutes, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react"; // Import Loader2
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ReuniaoModal = ({
  orientacaoId,
  onSave,
  initialData = null,
  onClose,
}) => {
  const [selectedDate, setSelectedDate] = useState(undefined);
  const [selectedTime, setSelectedTime] = useState("");
  const [pauta, setPauta] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Add loading state

  // FIX: Generate unique IDs for dialog title and description
  const titleId = React.useId();
  const descriptionId = React.useId(); // ID para a descrição

  useEffect(() => {
    if (initialData) {
      const initialDate = parseISO(initialData.data_horario);
      if (isValid(initialDate)) {
        setSelectedDate(initialDate);
        setSelectedTime(format(initialDate, "HH:mm"));
      }
      setPauta(initialData.pauta || "");
    } else {
      setSelectedDate(undefined);
      setSelectedTime("");
      setPauta("");
    }
  }, [initialData]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setPopoverOpen(false);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Por favor, selecione data e hora.");
      return;
    }

    setIsSubmitting(true); // Start loading

    const [hours, minutes] = selectedTime.split(":").map(Number);
    let combinedDate = setHours(selectedDate, hours);
    combinedDate = setMinutes(combinedDate, minutes);

    // Formata para "YYYY-MM-DDTHH:mm:ss" (sem 'Z')
    const localISOString = format(combinedDate, "yyyy-MM-dd'T'HH:mm:ss");

    const reuniaoData = {
      data_horario: localISOString,
      pauta,
    };

    try {
      if (initialData) {
        await atualizarReuniao(initialData.id_reuniao, reuniaoData);
        toast.success("Reunião atualizada com sucesso!");
      } else {
        await criarReuniao(orientacaoId, reuniaoData);
        toast.success("Reunião agendada com sucesso!");
      }
      onSave();
    } catch (error) {
      console.error("Failed to save meeting:", error);
      toast.error("Erro ao salvar reunião", {
        description: error.message || "Tente novamente.", // Melhor descrição do erro
      });
    } finally {
      setIsSubmitting(false); // Stop loading
    }
  };

  return (
    // FIX: Add aria-labelledby and aria-describedby
    <DialogContent aria-labelledby={titleId} aria-describedby={descriptionId}>
      <DialogHeader>
        {/* FIX: Add id to DialogTitle */}
        <DialogTitle id={titleId}>
          {initialData ? "Editar Reunião" : "Agendar Nova Reunião"}
        </DialogTitle>
        {/* FIX: Add DialogDescription with id */}
        <DialogDescription id={descriptionId}>
          {initialData
            ? "Atualize os detalhes da reunião."
            : "Preencha os dados para agendar a reunião."}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Data</Label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                  disabled={isSubmitting} // Disable while loading
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: ptBR })
                  ) : (
                    <span>Escolha uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">Hora</Label>
            <Input
              id="time"
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              disabled={isSubmitting} // Disable while loading
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pauta">Pauta/Assunto</Label>
          <Textarea
            id="pauta"
            value={pauta}
            onChange={(e) => setPauta(e.target.value)}
            placeholder="Tópicos a serem discutidos..."
            disabled={isSubmitting} // Disable while loading
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Salvar Alterações" : "Agendar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default ReuniaoModal;
