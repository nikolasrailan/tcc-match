"use client";
import React, { useState, useEffect } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Importa o radio group que você criou
import { toast } from "sonner";
import { Loader2, DownloadIcon } from "lucide-react";
import { salvarConceitoAta, downloadAtaPdf } from "@/api/apiService"; // Importa as funções da API

// REMOVIDO: import jsPDF from 'jspdf';
// REMOVIDO: import { format, parseISO } from 'date-fns';
// REMOVIDO: import { ptBR } from 'date-fns/locale';

// Componente do Modal
const AtaDefesaModal = ({ open, onClose, banca, onSaveSuccess }) => {
  const [conceitoAprovacao, setConceitoAprovacao] = useState(
    banca?.conceito_aprovacao || ""
  );
  const [conceitoFinal, setConceitoFinal] = useState(
    banca?.conceito_final || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false); // Mudado de isGenerating para isDownloading

  // Reseta os estados quando a banca muda ou o modal abre/fecha
  useEffect(() => {
    if (open && banca) {
      setConceitoAprovacao(banca.conceito_aprovacao || "");
      setConceitoFinal(banca.conceito_final || "");
    } else if (!open) {
      setConceitoAprovacao("");
      setConceitoFinal("");
    }
  }, [open, banca]);

  if (!banca) return null; // Não renderiza se não houver banca

  const handleSaveAndDownload = async () => {
    if (!conceitoAprovacao || !conceitoFinal) {
      toast.error(
        "Por favor, selecione ambos os conceitos (aprovação e final)."
      );
      return;
    }

    setIsSaving(true);
    setIsDownloading(true); // Ativa ambos os loadings

    try {
      // 1. Salvar os conceitos no banco de dados
      await salvarConceitoAta(banca.id_banca, {
        conceito_aprovacao: conceitoAprovacao,
        conceito_final: conceitoFinal,
      });
      toast.success("Conceitos salvos com sucesso!");

      // 2. Baixar o PDF gerado pelo backend
      const blob = await downloadAtaPdf(banca.id_banca);

      // Cria um link temporário para o download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const alunoNome = banca.orientacao?.aluno?.dadosUsuario?.nome || "aluno";
      a.download = `Ata_Defesa_${alunoNome.replace(/\s+/g, "_")}.pdf`; // Nome do arquivo
      document.body.appendChild(a);
      a.click();
      a.remove(); // Remove o link após o clique
      window.URL.revokeObjectURL(url); // Libera a memória
      toast.info("Download da Ata iniciado.");

      onSaveSuccess(); // Chama a função de sucesso
    } catch (error) {
      toast.error("Erro ao salvar conceitos ou baixar a ata.", {
        description: error.message || "Verifique os dados e tente novamente.",
      });
    } finally {
      setIsSaving(false);
      setIsDownloading(false); // Desativa ambos os loadings
    }
  };

  // REMOVIDO: A função generatePdf() que usava jspdf foi removida.

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gerar Ata de Defesa</DialogTitle>
          <DialogDescription>
            Defina o conceito da defesa para a banca de{" "}
            {banca.orientacao?.aluno?.dadosUsuario?.nome || "Aluno"}. Os
            conceitos serão salvos antes de gerar o PDF.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          {/* Conceito de Aprovação */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Conceito de Aprovação
            </Label>
            <RadioGroup
              value={conceitoAprovacao}
              onValueChange={setConceitoAprovacao}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              disabled={isSaving || isDownloading}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="aprovado" id="aprovado" />
                <Label htmlFor="aprovado" className="font-normal">
                  Aprovado
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="aprovado_com_ressalvas"
                  id="aprovado_com_ressalvas"
                />
                <Label htmlFor="aprovado_com_ressalvas" className="font-normal">
                  Aprovado com Ressalvas
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="reprovado" id="reprovado" />
                <Label htmlFor="reprovado" className="font-normal">
                  Reprovado
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Conceito Final (Nota) */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Conceito Final (Nota)
            </Label>
            <RadioGroup
              value={conceitoFinal}
              onValueChange={setConceitoFinal}
              className="flex space-x-6"
              disabled={isSaving || isDownloading}
            >
              {["A", "B", "C", "D"].map((conceito) => (
                <div key={conceito} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={conceito}
                    id={`conceito_${conceito}`}
                  />
                  <Label
                    htmlFor={`conceito_${conceito}`}
                    className="font-normal"
                  >
                    {conceito}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSaving || isDownloading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveAndDownload} // Mudou a função chamada
            disabled={
              isSaving || isDownloading || !conceitoAprovacao || !conceitoFinal
            }
          >
            {(isSaving || isDownloading) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isSaving
              ? "Salvando..."
              : isDownloading
              ? "Baixando..."
              : "Salvar e Baixar Ata"}
            {!isSaving && !isDownloading && (
              <DownloadIcon className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AtaDefesaModal;
