"use client";
import React from "react";
import { Button } from "@/components/ui/button";

const truncate = (str, n) => {
  return str.length > n ? str.substr(0, n - 1) + "..." : str;
};

const OrientacaoTabs = ({ orientacoes, selectedIndex, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2 border-b pb-2">
      {orientacoes.map((orientacao, index) => (
        <Button
          key={orientacao.id_orientacao}
          variant={selectedIndex === index ? "secondary" : "ghost"}
          onClick={() => onSelect(index)}
          className="h-auto"
        >
          <div className="flex flex-col items-start p-1 text-left">
            <span className="font-medium">
              {orientacao.aluno.dadosUsuario.nome}
            </span>
            <span className="text-xs text-muted-foreground">
              {truncate(orientacao.ideiaTcc.titulo, 25)}
            </span>
          </div>
        </Button>
      ))}
    </div>
  );
};

export default OrientacaoTabs;
