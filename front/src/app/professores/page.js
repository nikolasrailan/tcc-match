// front/src/app/professores/page.js
"use client";

import React, { useState, useEffect } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { getProfessores } from "@/api/apiService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfessoresPage() {
  useAuthRedirect();
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfessores = async () => {
      setLoading(true);
      const data = await getProfessores();
      if (data) {
        setProfessores(data);
      }
      setLoading(false);
    };

    fetchProfessores();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Professores Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Especialização</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {professores.map((prof) => (
                  <TableRow key={prof.usuario.email}>
                    <TableCell className="font-medium">
                      {prof.usuario.nome}
                    </TableCell>
                    <TableCell>{prof.especializacao}</TableCell>
                    <TableCell>{prof.usuario.email}</TableCell>
                    <TableCell>
                      {prof.disponibilidade ? (
                        <Badge variant="green-400">Disponível</Badge>
                      ) : (
                        <Badge variant="destructive">Indisponível</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
