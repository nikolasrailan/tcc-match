"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function IdeiaTccForm({
  onSubmit,
  initialData = null,
  onCancel = null,
  allAreas = [],
}) {
  const [formData, setFormData] = useState({
    titulo: initialData?.titulo || "",
    descricao: initialData?.descricao || "",
    areasDeInteresse:
      initialData?.areasDeInteresse?.map((a) => a.id_area) || [],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAreaChange = (areaId) => {
    setFormData((prev) => {
      const newAreas = prev.areasDeInteresse.includes(areaId)
        ? prev.areasDeInteresse.filter((id) => id !== areaId)
        : [...prev.areasDeInteresse, areaId];
      return { ...prev, areasDeInteresse: newAreas };
    });
  };

  const handleSelect = (event) => {
    event.preventDefault();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const selectedAreaNames = formData.areasDeInteresse
    .map((id) => allAreas.find((area) => area.id_area === id)?.nome)
    .filter(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData ? "Editar Ideia" : "Cadastrar Nova Ideia"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título da Ideia</Label>
            <Input
              id="titulo"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              required
              maxLength={45}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              required
              maxLength={255}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Áreas de Interesse</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal h-auto min-h-9" // Ajuste de altura
                >
                  {selectedAreaNames.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedAreaNames.map((name) => (
                        <Badge key={name} variant="secondary">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span>Selecione as áreas</span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                <DropdownMenuLabel>Áreas disponíveis</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allAreas.map((area) => (
                  <DropdownMenuCheckboxItem
                    key={area.id_area}
                    checked={formData.areasDeInteresse.includes(area.id_area)}
                    onCheckedChange={() => handleAreaChange(area.id_area)}
                    onSelect={handleSelect} // Adicionado para prevenir fechamento
                  >
                    {area.nome}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {onCancel && (
            <Button variant="ghost" type="button" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit">
            {initialData ? "Salvar Alterações" : "Salvar Ideia"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
