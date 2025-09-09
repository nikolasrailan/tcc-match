"use client";
import React, { useState } from "react";
import useAuth from "@/hooks/useAuth";
import {
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Box,
  Tabs,
  Tab,
  Alert,
} from "@mui/material";

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AuthForm() {
  const [tabValue, setTabValue] = useState(0);
  const { login } = useAuth();
  const [loginData, setLoginData] = useState({ email: "", senha: "" });
  const [registerData, setRegisterData] = useState({
    nome: "",
    email: "",
    senha: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError("");
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.id]: e.target.value });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.id]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const success = await login(loginData.email, loginData.senha);
    if (!success) {
      setError("Credenciais inválidas. Verifique seu e-mail e senha.");
    }
    setLoading(false);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const apiUrl = process.env.NEXT_PUBLIC_URL_API;
    try {
      const res = await fetch(`${apiUrl}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Usuário registrado com sucesso! Fazendo login...");
        await login(registerData.email, registerData.senha);
      } else {
        if (data.errors && Array.isArray(data.errors)) {
          setError(data.errors.map((err) => err.msg).join("\n"));
        } else {
          setError(data.message || "Erro ao criar usuário.");
        }
      }
    } catch (error) {
      setError("Erro na conexão com o servidor.");
    }
    setLoading(false);
  };

  return (
    <Card sx={{ maxWidth: 450, margin: "auto", mt: 5 }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
          <Tab label="Entrar" id="auth-tab-0" />
          <Tab label="Registrar" id="auth-tab-1" />
        </Tabs>
      </Box>
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h5" sx={{ mb: 2 }} align="center">
            Login
          </Typography>
          <Box
            component="form"
            onSubmit={handleLoginSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <TextField
              id="email"
              label="Email"
              type="email"
              variant="outlined"
              fullWidth
              value={loginData.email}
              onChange={handleLoginChange}
              required
            />
            <TextField
              id="senha"
              label="Senha"
              type="password"
              variant="outlined"
              fullWidth
              value={loginData.senha}
              onChange={handleLoginChange}
              required
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h5" sx={{ mb: 2 }} align="center">
            Crie sua Conta
          </Typography>
          <Box
            component="form"
            onSubmit={handleRegisterSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <TextField
              id="nome"
              label="Nome Completo"
              variant="outlined"
              fullWidth
              value={registerData.nome}
              onChange={handleRegisterChange}
              required
            />
            <TextField
              id="email"
              label="Email"
              type="email"
              variant="outlined"
              fullWidth
              value={registerData.email}
              onChange={handleRegisterChange}
              required
            />
            <TextField
              id="senha"
              label="Senha"
              type="password"
              variant="outlined"
              fullWidth
              value={registerData.senha}
              onChange={handleRegisterChange}
              required
            />
            <Button
              type="submit"
              variant="contained"
              color="secondary"
              size="large"
              disabled={loading}
            >
              {loading ? "Registrando..." : "Criar Conta"}
            </Button>
          </Box>
        </TabPanel>
      </CardContent>
    </Card>
  );
}
