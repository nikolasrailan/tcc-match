"use client";
import React, { useState, useEffect } from "react";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const TopicoForm = ({ onSubmit, initialData, onClose }) => {
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        titulo: initialData.titulo || "",
        descricao: initialData.descricao || "",
      });
    } else {
      setFormData({
        titulo: "",
        descricao: "",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>
          {initialData ? "Editar Tópico" : "Novo Tópico"}
        </DialogTitle>
        <DialogDescription>
          {initialData
            ? "Edite as informações do tópico."
            : "Preencha os dados para criar um novo tópico."}
        </DialogDescription>
      </DialogHeader>
      <div className="py-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="titulo">Título</Label>
          <Input
            id="titulo"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea
            id="descricao"
            name="descricao"
            value={formData.descricao}
            onChange={handleChange}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          {initialData ? "Salvar Alterações" : "Criar Tópico"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default TopicoForm;
