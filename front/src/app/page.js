"use client";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Button } from "@mui/material";

export default function Home() {
  useAuthRedirect();

  return (
    <main>
      <h1>Home</h1>
      <Button variant="contained">Teste</Button>
    </main>
  );
}
