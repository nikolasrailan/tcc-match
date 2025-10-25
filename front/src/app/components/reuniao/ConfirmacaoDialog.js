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
import { Loader2 } from "lucide-react"; // Import Loader2

// Adiciona a prop isSubmitting
const ConfirmationDialog = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = "Confirmar", // Texto padrão para o botão de confirmação
  confirmVariant, // Pode ser 'destructive', por exemplo
  isSubmitting = false, // Estado de loading
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    {/* Adiciona aria-labelledby e id ao DialogTitle */}
    <DialogContent aria-labelledby="confirmation-dialog-title">
      <DialogHeader>
        <DialogTitle id="confirmation-dialog-title">{title}</DialogTitle>
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
          variant={confirmVariant} // Usa a variante passada (e.g., 'destructive')
          disabled={isSubmitting} // Desabilita durante o envio
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {confirmText}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default ConfirmationDialog;
