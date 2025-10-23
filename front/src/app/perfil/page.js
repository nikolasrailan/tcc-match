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
import { Badge } from "@/components/ui/badge"; // Importa o Badge do shadcn
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Importa DropdownMenu do shadcn
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Mantém o Select do shadcn para Disponibilidade
import { TextField, Box } from "@mui/material"; // Remove Button as MuiButton import
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
    // ... existing fetchInitialData code ...
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
              ? "1" // Usar string "1" para disponível
              : "0", // Usar string "0" para indisponível
            areasDeInteresse:
              parsedUser.dadosProfessor?.areasDeInteresse?.map(
                (a) => a.id_area
              ) || [],
            limite_orientacoes:
              parsedUser.dadosProfessor?.limite_orientacoes || 5,
          };
          setFormData(initialFormData);

          // Busca áreas apenas se for professor ou para o form de sugestão
          const areasData = await getAreasInteresse();
          if (areasData) {
            setAllAreas(areasData);
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

  const handleSelectChange = (value, name) => {
    // Para o select de disponibilidade
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAreaChange = (areaId) => {
    // Para o DropdownMenuCheckboxItem
    setFormData((prev) => {
      const newAreas = prev.areasDeInteresse.includes(areaId)
        ? prev.areasDeInteresse.filter((id) => id !== areaId)
        : [...prev.areasDeInteresse, areaId];
      return { ...prev, areasDeInteresse: newAreas };
    });
  };

  // Função para prevenir o fechamento do dropdown ao selecionar um item
  const handleSelect = (event) => {
    event.preventDefault();
  };

  const handleSubmit = async (e) => {
    // ... existing handleSubmit code ...
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
      // Não incluímos id_curso aqui pois ele é apenas exibido e não editável neste form
    }

    if (user.dadosProfessor) {
      dataToUpdate.disponibilidade = formData.disponibilidade === "1" ? 1 : 0; // Converte string para 0 ou 1
      dataToUpdate.areasDeInteresse = formData.areasDeInteresse;
      dataToUpdate.limite_orientacoes = parseInt(
        formData.limite_orientacoes,
        10
      ); // Garante que é número
    }

    try {
      const result = await updateUsuario(user.id_usuario, dataToUpdate);
      if (result && result.user) {
        toast.success("Usuario atualizado com sucesso!");
        localStorage.setItem("user", JSON.stringify(result.user)); // Atualiza localStorage
        setUser(result.user); // Atualiza estado local
        // Recarrega os dados do formulário a partir do usuário atualizado
        setFormData({
          nome: result.user.nome || "",
          email: result.user.email || "",
          matricula: result.user.dadosAluno?.matricula || "",
          curso: result.user.dadosAluno?.cursoInfo?.nome || "",
          disponibilidade: result.user.dadosProfessor?.disponibilidade
            ? "1"
            : "0",
          areasDeInteresse:
            result.user.dadosProfessor?.areasDeInteresse?.map(
              (a) => a.id_area
            ) || [],
          limite_orientacoes:
            result.user.dadosProfessor?.limite_orientacoes || 5,
        });
      } else {
        throw new Error(
          result.message || "Ocorreu um erro ao atualizar o perfil."
        );
      }
    } catch (err) {
      setError(err.message || "Ocorreu um erro ao atualizar o perfil.");
      toast.error(err.message || "Erro ao atualizar usuario.");
    } finally {
      setLoading(false);
    }
  };

  const handleSugestaoSubmit = async (e) => {
    // Prevent default form submission if called via button click
    if (e) e.preventDefault();

    // ... rest of the existing handleSugestaoSubmit code ...
    if (!novaSugestao.trim()) {
      setError("O nome da área não pode ser vazio.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await sugerirAreaInteresse({ nome: novaSugestao });
      toast.success("Sugestão enviada para aprovação do administrador!");
      setIsSuggestingArea(false);
      setNovaSugestao("");
    } catch (err) {
      setError(err.message || "Erro ao enviar sugestão.");
      toast.error(err.message || "Erro ao enviar sugestão.");
    } finally {
      setLoading(false);
    }
  };

  // Nomes das áreas selecionadas para exibição no botão
  const selectedAreaNames =
    formData.areasDeInteresse
      ?.map((id) => allAreas.find((area) => area.id_area === id)?.nome)
      .filter(Boolean) || [];

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
          {" "}
          {/* Outer form */}
          <CardContent className="space-y-4">
            {/* Campos comuns */}
            {/* ... Nome, Email ... */}
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
            {/* ... Matricula, Curso ... */}
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
                    disabled // Curso não é editável aqui
                  />
                </div>
              </>
            )}
            {/* Campos Professor */}
            {user.dadosProfessor && (
              <>
                <div className="space-y-2">
                  <Label>Áreas de Interesse</Label>
                  {/* ... DropdownMenu ... */}
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
                          checked={formData.areasDeInteresse?.includes(
                            area.id_area
                          )}
                          onCheckedChange={() => handleAreaChange(area.id_area)}
                          onSelect={handleSelect} // Adicionado para prevenir fechamento
                        >
                          {area.nome}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {/* Link para sugerir área */}
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
                      ? "Cancelar Sugestão"
                      : "Não encontrou uma área? Sugira uma nova."}
                  </span>

                  {/* Formulário de sugestão - Alterado component para "div" */}
                  {isSuggestingArea && (
                    <Box
                      component="div" // MUDANÇA: Alterado de "form" para "div"
                      // removido onSubmit daqui
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
                      {/* MUDANÇA: Alterado type para "button" e adicionado onClick */}
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        disabled={loading}
                        onClick={handleSugestaoSubmit} // Aciona a submissão no clique
                      >
                        Enviar
                      </Button>
                    </Box>
                  )}
                </div>
                {/* ... Disponibilidade, Limite Orientandos ... */}
                {/* Select de Disponibilidade (usando shadcn Select) */}
                <div className="space-y-2">
                  <Label>Disponibilidade</Label>
                  <Select
                    name="disponibilidade"
                    value={formData.disponibilidade}
                    onValueChange={(value) =>
                      handleSelectChange(value, "disponibilidade")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Disponível</SelectItem>
                      <SelectItem value="0">Indisponível</SelectItem>
                    </SelectContent>
                  </Select>
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
                    min="0" // Adiciona um mínimo
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
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </CardFooter>
        </form>{" "}
        {/* Fim Outer form */}
      </Card>
    </div>
  );
}
