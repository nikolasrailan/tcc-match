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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";

const SelectIdeiaDialog = ({ open, onClose, ideias, onFindMatch }) => {
  const [selectedIdeia, setSelectedIdeia] = useState("");
  const [isFinding, setIsFinding] = useState(false);

  const handleFindClick = async () => {
    if (!selectedIdeia) {
      toast.error("Por favor, selecione uma ideia primeiro.");
      return;
    }
    setIsFinding(true);
    // Chama a função passada por props para encontrar o match
    await onFindMatch(selectedIdeia);
    setIsFinding(false); // Desativa o loading após a busca (mesmo se falhar)
  };

  // Reset selectedIdeia when dialog reopens
  React.useEffect(() => {
    if (open) {
      setSelectedIdeia("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Encontrar Professor Ideal</DialogTitle>
          <DialogDescription>
            Selecione uma das suas ideias disponíveis para encontrar o professor
            mais compatível com base nas áreas de interesse.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label>Minha Ideia de TCC</Label>
          <Select onValueChange={setSelectedIdeia} value={selectedIdeia}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione sua ideia..." />
            </SelectTrigger>
            <SelectContent>
              {ideias.length > 0 ? (
                ideias.map((ideia) => (
                  <SelectItem
                    key={ideia.id_ideia_tcc}
                    value={ideia.id_ideia_tcc.toString()}
                  >
                    {ideia.titulo}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="disabled" disabled>
                  Nenhuma ideia disponível para match.
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleFindClick}
            disabled={!selectedIdeia || isFinding || ideias.length === 0}
          >
            {isFinding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Buscar Professor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SelectIdeiaDialog;
