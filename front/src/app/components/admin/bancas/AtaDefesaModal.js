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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, DownloadIcon } from "lucide-react";
import { salvarConceitoAta } from "@/api/apiService"; // API para salvar
import jsPDF from "jspdf"; // Instalar: npm install jspdf
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// Componente do Modal
const AtaDefesaModal = ({ open, onClose, banca, onSaveSuccess }) => {
  const [conceitoAprovacao, setConceitoAprovacao] = useState(
    banca?.conceito_aprovacao || ""
  );
  const [conceitoFinal, setConceitoFinal] = useState(
    banca?.conceito_final || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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

  // Nomes dos membros
  const orientador =
    banca.orientacao?.professor?.usuario?.nome || "[Orientador não definido]";
  const avaliador1 = banca.avaliador1?.usuario?.nome || "";
  const avaliador2 = banca.avaliador2?.usuario?.nome || "";
  const avaliador3 = banca.avaliador3?.usuario?.nome || "";
  const bancaExaminadora = [
    orientador,
    avaliador1,
    avaliador2,
    avaliador3,
  ].filter(Boolean); // Filtra nomes vazios

  const handleGenerateAndSave = async () => {
    if (!conceitoAprovacao || !conceitoFinal) {
      toast.error(
        "Por favor, selecione ambos os conceitos (aprovação e final)."
      );
      return;
    }

    setIsSaving(true);
    setIsGenerating(true); // Ativa ambos os loadings

    try {
      // 1. Salvar os conceitos no banco de dados
      await salvarConceitoAta(banca.id_banca, {
        conceito_aprovacao: conceitoAprovacao,
        conceito_final: conceitoFinal,
      });
      toast.success("Conceitos salvos com sucesso!");

      // 2. Gerar o PDF
      generatePdf(); // Chama a função de geração de PDF

      onSaveSuccess(); // Chama a função de sucesso passada (geralmente fecha o modal e atualiza a lista)
    } catch (error) {
      toast.error("Erro ao salvar ou gerar a ata.", {
        description: error.message || "Tente novamente.",
      });
    } finally {
      setIsSaving(false);
      setIsGenerating(false); // Desativa ambos os loadings
    }
  };

  const generatePdf = () => {
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - 2 * margin;
    let currentY = margin + 10; // Começa um pouco abaixo da margem superior

    // --- Cabeçalho e Título ---
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text(
      "ATA DE DEFESA DO TRABALHO DE CONCLUSÃO DE CURSO",
      pageWidth / 2,
      currentY,
      { align: "center" }
    );
    currentY += 15; // Aumenta espaçamento após título principal

    // --- Texto Principal ---
    doc.setFontSize(12);
    doc.setFont(undefined, "normal");

    const dataDefesa = banca.data_defesa ? parseISO(banca.data_defesa) : null;
    const dia = dataDefesa ? format(dataDefesa, "dd") : "__";
    const mes = dataDefesa
      ? format(dataDefesa, "MMMM", { locale: ptBR })
      : "__";
    const ano = dataDefesa ? format(dataDefesa, "yyyy") : "__";
    const hora = dataDefesa ? format(dataDefesa, "HH:mm") : "__";
    const local = banca.local_defesa || "[Local não definido]";
    const nomeAluno =
      banca.orientacao?.aluno?.dadosUsuario?.nome || "[Nome Aluno]";
    const tituloProjeto =
      banca.orientacao?.ideiaTcc?.titulo || "[Título Projeto]";
    const curso = banca.orientacao?.aluno?.cursoInfo?.nome || "[Nome Curso]"; // Assumindo que você tem o nome do curso

    const textLines = doc.splitTextToSize(
      `No dia ${dia} do mês de ${mes} do ano de ${ano}, às ${hora}, no(a) ${local}, em sessão pública de defesa do Trabalho de Conclusão de Curso de ${curso} do discente ${nomeAluno}, tendo como título "${tituloProjeto}", compareceram como banca examinadora:`,
      contentWidth
    );
    doc.text(textLines, margin, currentY, { align: "justify" });
    currentY +=
      (textLines.length * doc.getLineHeight()) / doc.internal.scaleFactor + 10;

    // --- Membros da Banca ---
    doc.setFont(undefined, "bold");
    doc.text("Banca Examinadora:", margin, currentY);
    currentY += 7;
    doc.setFont(undefined, "normal");
    bancaExaminadora.forEach((nome, index) => {
      const role = index === 0 ? " (Presidente da Banca)" : "";
      doc.text(`${nome}${role}`, margin + 10, currentY); // Adiciona indentação
      currentY += 6;
    });
    currentY += 5; // Espaço extra após a lista

    // --- Resultado ---
    const textoResultado = `Após a apresentação e as observações dos referidos professores, ficou definido que o trabalho foi considerado:`;
    doc.text(textoResultado, margin, currentY, { align: "justify" });
    currentY += 7;

    const opcoesAprovacao = [
      { value: "aprovado", text: "aprovado" },
      { value: "aprovado_com_ressalvas", text: "aprovado com ressalvas" },
      { value: "reprovado", text: "reprovado" },
    ];

    opcoesAprovacao.forEach((opt) => {
      const marcador = conceitoAprovacao === opt.value ? "[X]" : "[ ]";
      doc.text(`${marcador} ${opt.text}`, margin + 10, currentY);
      currentY += 6;
    });
    currentY += 5;

    const opcoesConceitoFinal = ["A", "B", "C", "D"];
    doc.text(`Com conceito final:`, margin, currentY);
    currentY += 7;

    opcoesConceitoFinal.forEach((opt) => {
      const marcador = conceitoFinal === opt ? "[X]" : "[ ]";
      doc.text(`${marcador} ${opt}`, margin + 10, currentY);
      currentY += 6;
    });
    currentY += 10;

    // --- Texto Final ---
    const textoFinal = `Nada mais havendo, eu, presidente da banca, lavrei a presente ata que segue assinada por mim e demais membros.`;
    doc.text(textoFinal, margin, currentY, { align: "justify" });
    currentY += 15;

    // --- Assinaturas (Simuladas) ---
    // Posiciona as assinaturas mais abaixo
    currentY = Math.max(currentY + 20, doc.internal.pageSize.getHeight() - 70); // Ajusta Y se necessário

    doc.text("___________________________", margin, currentY);
    doc.text(orientador, margin, currentY + 5);
    doc.text("(Presidente da Banca)", margin, currentY + 10);

    // Salva o PDF
    const filename = `Ata_Defesa_${nomeAluno.replace(/\s+/g, "_")}.pdf`;
    doc.save(filename);
    toast.info("Download da Ata iniciado.");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gerar Ata de Defesa</DialogTitle>
          <DialogDescription>
            Defina o conceito da defesa para a banca de{" "}
            {banca.orientacao?.aluno?.dadosUsuario?.nome || "Aluno"}.
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
              disabled={isSaving || isGenerating}
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
              disabled={isSaving || isGenerating}
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
            disabled={isSaving || isGenerating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGenerateAndSave}
            disabled={
              isSaving || isGenerating || !conceitoAprovacao || !conceitoFinal
            }
          >
            {(isSaving || isGenerating) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isSaving
              ? "Salvando..."
              : isGenerating
              ? "Gerando PDF..."
              : "Salvar Conceitos e Gerar Ata"}
            {!isSaving && !isGenerating && (
              <DownloadIcon className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AtaDefesaModal;
