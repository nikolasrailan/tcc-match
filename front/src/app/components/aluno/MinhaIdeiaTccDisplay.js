"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MinhaIdeiaTccDisplay({ ideiaTcc, onEdit, onDelete }) {
  const getStatusInfo = (status) => {
    switch (status) {
      case 0:
        return { text: "Pendente", variant: "secondary" };
      case 1:
        return { text: "Em avaliação", variant: "default" };
      case 2:
        return {
          text: "Aprovado",
          variant: "default",
          className: "bg-green-600",
        };
      case 3:
        return { text: "Cancelado", variant: "outline" };
      case 4:
        return { text: "Rejeitado", variant: "destructive" };
      default:
        return { text: "Desconhecido", variant: "outline" };
    }
  };

  const statusInfo = getStatusInfo(ideiaTcc.status);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>{ideiaTcc.titulo}</CardTitle>
        <div className="flex justify-between items-center pt-2">
          <span className="text-sm text-muted-foreground">
            {new Date(ideiaTcc.data_submissao).toLocaleDateString()}
          </span>
          <Badge variant={statusInfo.variant} className={statusInfo.className}>
            {statusInfo.text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <p className="text-sm text-muted-foreground">{ideiaTcc.descricao}</p>
        <div>
          <h4 className="text-xs font-semibold mb-2">Áreas de Interesse</h4>
          <div className="flex flex-wrap gap-1">
            {ideiaTcc.areasDeInteresse &&
            ideiaTcc.areasDeInteresse.length > 0 ? (
              ideiaTcc.areasDeInteresse.map((area) => (
                <Badge key={area.id_area} variant="secondary">
                  {area.nome}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma área selecionada.
              </p>
            )}
          </div>
        </div>
      </CardContent>
      {ideiaTcc.status === 0 && (
        <CardFooter className="justify-end">
          <Button size="sm" variant="ghost" onClick={onEdit}>
            Editar
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>
            Excluir
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
