"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { updateUsuario, getAreasInteresse } from "@/api/apiService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select as MuiSelect,
} from "@mui/material";

export default function PerfilPage() {
  useAuthRedirect();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [allAreas, setAllAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchInitialData = useCallback(async () => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          const initialFormData = {
            nome: parsedUser.nome || "",
            email: parsedUser.email || "",
            matricula: parsedUser.dadosAluno?.matricula || "",
            curso: parsedUser.dadosAluno?.cursoInfo?.nome || "",
            disponibilidade: parsedUser.dadosProfessor?.disponibilidade
              ? "disponivel"
              : "indisponivel",
            areasDeInteresse:
              parsedUser.dadosProfessor?.areasDeInteresse?.map(
                (a) => a.id_area
              ) || [],
          };
          setFormData(initialFormData);

          if (parsedUser.dadosProfessor) {
            const areasData = await getAreasInteresse();
            if (areasData) {
              setAllAreas(areasData);
            }
          }
        } catch (e) {
          console.error("Falha ao carregar dados do perfil", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!user) {
      setError("Usuário não encontrado.");
      setLoading(false);
      return;
    }

    const dataToUpdate = {
      nome: formData.nome,
      email: formData.email,
    };

    if (user.dadosAluno) {
      dataToUpdate.matricula = formData.matricula;
    }

    if (user.dadosProfessor) {
      dataToUpdate.disponibilidade =
        formData.disponibilidade === "disponivel" ? 1 : 0;
      dataToUpdate.areasDeInteresse = formData.areasDeInteresse;
    }

    const result = await updateUsuario(user.id_usuario, dataToUpdate);
    setLoading(false);

    if (result && result.user) {
      setSuccess("Perfil atualizado com sucesso!");
      localStorage.setItem("user", JSON.stringify(result.user));
      setUser(result.user);
    } else {
      setError("Ocorreu um erro ao atualizar o perfil.");
    }
  };

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Meu Perfil</CardTitle>
          <CardDescription>Atualize suas informações.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Campos comuns */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                name="nome"
                value={formData.nome || ""}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email || ""}
                onChange={handleChange}
              />
            </div>
            {/* Campos Aluno */}
            {user.dadosAluno && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="matricula">Matrícula</Label>
                  <Input
                    id="matricula"
                    name="matricula"
                    value={formData.matricula || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="curso">Curso</Label>
                  <Input
                    id="curso"
                    name="curso"
                    value={formData.curso || ""}
                    disabled
                  />
                </div>
              </>
            )}
            {/* Campos Professor */}
            {user.dadosProfessor && (
              <>
                <div className="space-y-2">
                  <Label>Áreas de Interesse</Label>
                  <FormControl fullWidth>
                    <Select
                      multiple
                      value={formData.areasDeInteresse || []}
                      onChange={(e) =>
                        handleSelectChange("areasDeInteresse", e.target.value)
                      }
                      input={<OutlinedInput label="Áreas" />}
                      renderValue={(selected) => (
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                          {selected.map((value) => {
                            const area = allAreas.find(
                              (a) => a.id_area === value
                            );
                            return (
                              <Chip key={value} label={area ? area.nome : ""} />
                            );
                          })}
                        </Box>
                      )}
                    >
                      {allAreas.map((area) => (
                        <MenuItem key={area.id_area} value={area.id_area}>
                          {area.nome}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
                <div className="space-y-2">
                  <Label>Disponibilidade</Label>
                  <MuiSelect
                    name="disponibilidade"
                    value={formData.disponibilidade}
                    onChange={(e) =>
                      handleSelectChange("disponibilidade", e.target.value)
                    }
                    fullWidth
                  >
                    <MenuItem value="disponivel">Disponível</MenuItem>
                    <MenuItem value="indisponivel">Indisponível</MenuItem>
                  </MuiSelect>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {success && <p className="text-green-500 text-sm">{success}</p>}
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
