"use client";
import { Button, Typography, Box, Paper, Container } from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  return (
    <main>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, mt: 5, textAlign: "center" }}>
          <Typography variant="h2" component="h1" gutterBottom>
            Bem-vindo ao TCC Match
          </Typography>
          <Typography variant="h5" color="text.secondary" paragraph>
            A plataforma para conectar alunos e professores para o trabalho de
            conclusão de curso.
          </Typography>
          <Box
            sx={{ mt: 4, display: "flex", justifyContent: "center", gap: 2 }}
          >
            {token ? (
              <Typography>Você já está logado. Navegue pelo menu.</Typography>
            ) : (
              <>
                <Button
                  component={Link}
                  href="/login"
                  variant="contained"
                  size="large"
                >
                  Entrar / Registrar
                </Button>
              </>
            )}
          </Box>
        </Paper>
      </Container>
    </main>
  );
}
