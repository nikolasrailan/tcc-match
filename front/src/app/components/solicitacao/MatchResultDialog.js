"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const MatchResultDialog = ({
  open,
  onClose,
  professor,
  ideiaId,
  onSendRequest,
}) => {
  const [isSending, setIsSending] = useState(false);

  // Reset sending state when dialog opens with a new professor
  React.useEffect(() => {
    if (open) {
      setIsSending(false);
    }
  }, [open, professor]);

  // Não renderiza (retorna null) se não houver professor.
  // Isso evita erros se o componente for chamado antes do match ser encontrado.
  if (!professor) return null;

  const handleSendClick = async () => {
    setIsSending(true);
    // Chama a função passada por props para enviar a solicitação
    await onSendRequest(professor.id_professor, ideiaId);
    // O estado de loading é resetado pelo useEffect quando o modal reabre ou fecha
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent aria-labelledby={titleId}>
        <DialogHeader>
          <DialogTitle id={titleId}>Professor Recomendado</DialogTitle>
          <DialogDescription>
            Encontramos um professor com áreas de interesse compatíveis com sua
            ideia:
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p className="text-lg font-semibold">{professor.nome}</p>
          <div>
            <Label className="text-sm font-semibold">Áreas de Interesse:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {professor.areasDeInteresse?.length > 0 ? (
                professor.areasDeInteresse.map((area) => (
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
          <p className="text-xs text-muted-foreground">
            Afinidade: {professor.matchScore}{" "}
            {professor.matchScore > 1 ? "áreas" : "área"} em comum.
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={handleSendClick} disabled={isSending}>
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Solicitação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MatchResultDialog;
