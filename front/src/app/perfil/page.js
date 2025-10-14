"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import {
  updateUsuario,
  getAreasInteresse,
  sugerirAreaInteresse,
} from "@/api/apiService";
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
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select as MuiSelect,
  Typography,
  TextField,
  Button as MuiButton,
} from "@mui/material";
import { Loader2 } from "lucide-react";

export default function PerfilPage() {
  useAuthRedirect();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [allAreas, setAllAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isSuggestingArea, setIsSuggestingArea] = useState(false);
  const [novaSugestao, setNovaSugestao] = useState("");

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
            limite_orientacoes:
              parsedUser.dadosProfessor?.limite_orientacoes || 5,
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
      dataToUpdate.limite_orientacoes = formData.limite_orientacoes;
    }

    try {
      const result = await updateUsuario(user.id_usuario, dataToUpdate);
      if (result && result.user) {
        setSuccess("Perfil atualizado com sucesso!");
        localStorage.setItem("user", JSON.stringify(result.user));
        setUser(result.user);
      } else {
        throw new Error("Ocorreu um erro ao atualizar o perfil.");
      }
    } catch (err) {
      setError(err.message || "Ocorreu um erro ao atualizar o perfil.");
    } finally {
      setLoading(false);
    }
  };

  const handleSugestaoSubmit = async (e) => {
    e.preventDefault();
    if (!novaSugestao.trim()) {
      setError("O nome da área não pode ser vazio.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await sugerirAreaInteresse({ nome: novaSugestao });
      setSuccess("Sugestão enviada para aprovação do administrador!");
      setIsSuggestingArea(false);
      setNovaSugestao("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
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
                  <Label className="mt-2">Editar Áreas de Interesse</Label>
                  <FormControl fullWidth>
                    <InputLabel id="areas-label">Áreas</InputLabel>
                    <MuiSelect
                      labelId="areas-label"
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
                    </MuiSelect>
                  </FormControl>
                  <span
                    onClick={() => setIsSuggestingArea(!isSuggestingArea)}
                    style={{
                      fontSize: "0.8rem",
                      textDecoration: "underline",
                      cursor: "pointer",
                      color: "gray",
                      marginTop: "4px",
                      display: "inline-block",
                    }}
                  >
                    {isSuggestingArea
                      ? "Cancelar"
                      : "Não encontrou uma área? Sugira uma nova."}
                  </span>

                  {isSuggestingArea && (
                    <Box
                      sx={{
                        pt: 1,
                        display: "flex",
                        gap: 1,
                        alignItems: "center",
                      }}
                    >
                      <TextField
                        id="sugestao-area"
                        label="Nova área de interesse"
                        variant="outlined"
                        size="small"
                        value={novaSugestao}
                        onChange={(e) => setNovaSugestao(e.target.value)}
                        required
                        fullWidth
                      />
                      <Button
                        onClick={handleSugestaoSubmit}
                        variant="contained"
                        size="small"
                        disabled={loading}
                      >
                        Enviar
                      </Button>
                    </Box>
                  )}
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
                <div className="space-y-2">
                  <Label htmlFor="limite_orientacoes">
                    Limite de Orientandos
                  </Label>
                  <Input
                    id="limite_orientacoes"
                    name="limite_orientacoes"
                    type="number"
                    value={formData.limite_orientacoes || ""}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {success && <p className="text-green-500 text-sm">{success}</p>}
            </div>
            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
