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

// Componente do Modal
const AtaDefesaModal = ({ open, onClose, banca, onSaveSuccess }) => {
  const [conceitoAprovacao, setConceitoAprovacao] = useState(
    banca?.conceito_aprovacao || ""
  );
  const [conceitoFinal, setConceitoFinal] = useState(
    banca?.conceito_final || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingRascunho, setIsDownloadingRascunho] = useState(false); // Novo estado para download do rascunho

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
      await handleDownloadPdf(); // Chama a função de download

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

  // Função separada para lidar com o download do PDF
  const handleDownloadPdf = async () => {
    try {
      const blob = await downloadAtaPdf(banca.id_banca);
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
    } catch (downloadError) {
      // Erro específico do download
      toast.error("Erro ao baixar a ata.", {
        description: downloadError.message || "Verifique a conexão ou a API.",
      });
      // Importante: Lança o erro para que a função chamadora (handleSaveAndDownload) saiba que falhou
      throw downloadError;
    }
  };

  // Nova função para baixar apenas o rascunho
  const handleDownloadRascunho = async () => {
    setIsDownloadingRascunho(true);
    try {
      // Chama diretamente a função de download do PDF, sem salvar conceitos
      await handleDownloadPdf();
    } catch (error) {
      // O erro já é tratado em handleDownloadPdf, mas podemos adicionar algo aqui se necessário
      console.error("Erro ao baixar rascunho:", error);
    } finally {
      setIsDownloadingRascunho(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gerar Ata de Defesa</DialogTitle>
          <DialogDescription>
            Defina o conceito da defesa para a banca de{" "}
            {banca.orientacao?.aluno?.dadosUsuario?.nome || "Aluno"}. Os
            conceitos serão salvos antes de gerar o PDF final.
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
              disabled={isSaving || isDownloading || isDownloadingRascunho}
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
              disabled={isSaving || isDownloading || isDownloadingRascunho}
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
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          {/* Botão para baixar rascunho (à esquerda) */}
          <Button
            variant="outline"
            onClick={handleDownloadRascunho}
            disabled={
              isSaving ||
              isDownloading ||
              isDownloadingRascunho ||
              !banca.data_defesa ||
              !banca.local_defesa
            } // Desabilita se data/local não definidos
            title={
              !banca.data_defesa || !banca.local_defesa
                ? "Defina Data, Hora e Local primeiro"
                : "Baixa a ata sem salvar os conceitos atuais"
            }
          >
            {isDownloadingRascunho && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isDownloadingRascunho ? "Baixando..." : "Baixar Rascunho da Ata"}
            {!isDownloadingRascunho && (
              <DownloadIcon className="ml-2 h-4 w-4" />
            )}
          </Button>

          {/* Botões originais (à direita) */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSaving || isDownloading || isDownloadingRascunho}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveAndDownload}
              disabled={
                isSaving ||
                isDownloading ||
                isDownloadingRascunho ||
                !conceitoAprovacao ||
                !conceitoFinal
              }
            >
              {(isSaving || isDownloading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSaving
                ? "Salvando..."
                : isDownloading
                ? "Baixando..."
                : "Salvar e Baixar Ata Final"}
              {!isSaving && !isDownloading && (
                <DownloadIcon className="ml-2 h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AtaDefesaModal;
