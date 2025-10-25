"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react"; // Importar Loader

// Adiciona props para loading e customização do botão
const ConfirmationDialog = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = "Confirmar", // Texto padrão
  confirmVariant, // ex: 'destructive'
  isSubmitting = false, // Estado de loading
}) => {
  // Gera um ID único para acessibilidade
  const titleId = React.useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* FIX: Associa o DialogContent ao DialogTitle */}
      <DialogContent aria-labelledby={titleId}>
        <DialogHeader>
          {/* FIX: Adiciona o ID ao DialogTitle */}
          <DialogTitle id={titleId}>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isSubmitting}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            onClick={onConfirm}
            variant={confirmVariant} // Aplica a variante (ex: 'destructive')
            disabled={isSubmitting} // Desabilita no loading
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationDialog;
