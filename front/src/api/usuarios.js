export async function getUsuarios() {
  try {
    const response = await fetch("http://localhost:8000/usuarios");
    if (!response.ok) {
      throw new Error("Erro ao buscar usuários");
    }
    return await response.json();
  } catch (error) {
    console.error("Erro na requisição de usuários:", error);
    return [];
  }
}
