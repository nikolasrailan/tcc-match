// Função genérica para realizar chamadas à API
async function fetchApi(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_URL_API}${endpoint}`,
      {
        // Usar variável de ambiente
        ...options,
        headers,
      }
    );

    const contentType = response.headers.get("content-type");
    if (!response.ok) {
      let errorData = { message: response.statusText || "Erro na requisição" };
      if (contentType && contentType.includes("application/json")) {
        try {
          const body = await response.json();
          // Prioriza a mensagem de erro específica do backend, se houver
          errorData.message = body.error || body.message || errorData.message;
          // Se for um array de erros (validação), junta as mensagens
          if (body.errors && Array.isArray(body.errors)) {
            errorData.message = body.errors
              .map((err) => err.msg || err.message)
              .join("\n");
          }
        } catch (e) {
          // Ignore if response body is not valid JSON
          errorData.message = `Erro ${response.status}: ${response.statusText}`;
        }
      }
      throw new Error(errorData.message);
    }

    // Handle No Content response
    if (response.status === 204) {
      return { success: true };
    }

    // Handle potential non-JSON success responses (like plain text)
    if (
      response.status === 200 &&
      (!contentType || !contentType.includes("application/json"))
    ) {
      try {
        const textResponse = await response.text();
        // Return text if it exists, otherwise assume success
        if (textResponse) {
          return { message: textResponse }; // Or potentially parse if expected format
        }
        return { success: true }; // Consider success if empty 200 response
      } catch (e) {
        // Fallback if reading text fails
        return { success: true };
      }
    }

    // Default: assume JSON response
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    // Fallback for unexpected content types with success status
    return { success: true, status: response.status };
  } catch (error) {
    console.error(`Erro na chamada da API para ${endpoint}:`, error.message);
    throw error; // Re-throw the error to be caught by the calling function
  }
}

// --- Funções de Reunião ---
export const getReunioes = (id_orientacao) =>
  fetchApi(`/reunioes/orientacao/${id_orientacao}`);
export const getReunioesProfessor = () => fetchApi("/reunioes/professor"); // Nova função
export const criarReuniao = (id_orientacao, data) =>
  fetchApi(`/reunioes/orientacao/${id_orientacao}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
export const atualizarReuniao = (id_reuniao, data) =>
  fetchApi(`/reunioes/${id_reuniao}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

// --- Funções de Tópicos ---
export const getTopicos = (id_orientacao) =>
  fetchApi(`/topicos/${id_orientacao}`);
export const viewTopico = (id_topico) =>
  fetchApi(`/topicos/${id_topico}/view`, { method: "GET" });
export const criarTopico = (id_orientacao, data) =>
  fetchApi(`/topicos/${id_orientacao}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
export const atualizarTopico = (id_topico, data) =>
  fetchApi(`/topicos/${id_topico}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deletarTopico = (id_topico) =>
  fetchApi(`/topicos/${id_topico}`, {
    method: "DELETE",
  });

// --- Funções de Orientação ---
export const getOrientacao = () => fetchApi("/orientacoes");
export const updateOrientacao = (id, data) =>
  fetchApi(`/orientacoes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

// Novas funções para cancelamento
export const solicitarCancelamentoOrientacao = (id) =>
  fetchApi(`/orientacoes/${id}/solicitar-cancelamento`, {
    method: "PATCH",
  });
export const confirmarCancelamentoOrientacao = (id, feedback = null) =>
  fetchApi(`/orientacoes/${id}/confirmar-cancelamento`, {
    method: "PATCH",
    body: JSON.stringify({ feedback_cancelamento: feedback }),
  });
// Função para cancelamento direto pelo professor
export const cancelarOrientacaoDiretoProfessor = (id, feedback = null) =>
  fetchApi(`/orientacoes/${id}/cancelar-direto`, {
    method: "PATCH",
    body: JSON.stringify({ feedback_cancelamento: feedback }),
  });

// --- Funções de Usuários ---
export const getUsuarios = () => fetchApi("/usuarios");

export const updateUsuario = (id, data) =>
  fetchApi(`/usuarios/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteUsuario = (id) =>
  fetchApi(`/usuarios/${id}`, {
    method: "DELETE",
  });

// --- Funções de Perfis (Aluno/Professor) ---
export const criarPerfil = (tipo, dados) =>
  fetchApi(tipo === "professor" ? "/professores" : "/alunos", {
    method: "POST",
    body: JSON.stringify(dados),
  });

export const deleteAlunoProfile = (id) =>
  fetchApi(`/alunos/${id}`, {
    method: "DELETE",
  });

export const deleteProfessorProfile = (id) =>
  fetchApi(`/professores/${id}`, {
    method: "DELETE",
  });

// --- Funções de Ideia de TCC ---
export const getMinhaIdeiaTcc = () => fetchApi("/ideias-tcc/minha-ideia");

export const getTodasIdeiasTcc = () => fetchApi("/ideias-tcc");

export const criarIdeiaTcc = (dados) =>
  fetchApi("/ideias-tcc", {
    method: "POST",
    body: JSON.stringify(dados),
  });

export const atualizarIdeiaTcc = (id, dados) =>
  fetchApi(`/ideias-tcc/${id}`, {
    method: "PATCH",
    body: JSON.stringify(dados),
  });

export const deletarIdeiaTcc = (id) =>
  fetchApi(`/ideias-tcc/${id}`, {
    method: "DELETE",
  });

// --- Funções de Professores Públicos ---
export const getProfessores = (apenasDisponiveis = false) => {
  const endpoint = apenasDisponiveis
    ? "/professores/public-list?disponivel=true"
    : "/professores/public-list";
  return fetchApi(endpoint);
};

// --- Professor Dashboard ---
export const getProfessorDashboard = () => fetchApi("/professores/dashboard");

// --- Função de Match ---
export const findProfessorMatch = (id_ideia_tcc) =>
  fetchApi(`/professores/match/${id_ideia_tcc}`);

// --- Funções de Solicitação ---
export const enviarSolicitacao = (dados) =>
  fetchApi("/solicitacoes", {
    method: "POST",
    body: JSON.stringify(dados),
  });

export const getMinhasSolicitacoes = () =>
  fetchApi("/solicitacoes/minhas-solicitacoes");

export const cancelarSolicitacao = (id) =>
  fetchApi(`/solicitacoes/${id}/cancelar`, {
    method: "PATCH",
  });

export const getSolicitacoesProfessor = () =>
  fetchApi("/solicitacoes/professor");

export const responderSolicitacao = (id, aceito) =>
  fetchApi(`/solicitacoes/${id}/responder`, {
    method: "PATCH",
    body: JSON.stringify({ aceito }),
  });

// --- Funções de Cursos ---
export const getCursos = () => fetchApi("/cursos");

export const criarCurso = (dados) =>
  fetchApi("/cursos", {
    method: "POST",
    body: JSON.stringify(dados),
  });

export const deletarCurso = (id) =>
  fetchApi(`/cursos/${id}`, {
    method: "DELETE",
  });

export const atualizarCurso = (id, dados) =>
  fetchApi(`/cursos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(dados),
  });

// --- Funções de Áreas de Interesse ---
export const getAreasInteresse = () => fetchApi("/areas-interesse");

export const criarAreaInteresse = (dados) =>
  fetchApi("/areas-interesse", {
    method: "POST",
    body: JSON.stringify(dados),
  });

export const sugerirAreaInteresse = (dados) =>
  fetchApi("/areas-interesse/sugerir", {
    method: "POST",
    body: JSON.stringify(dados),
  });

export const getAreasInteressePendentes = () =>
  fetchApi("/areas-interesse/pendentes");

export const aprovarAreaInteresse = (id) =>
  fetchApi(`/areas-interesse/${id}/aprovar`, {
    method: "PATCH",
  });

export const rejeitarAreaInteresse = (id) =>
  fetchApi(`/areas-interesse/${id}/rejeitar`, {
    method: "DELETE",
  });

export const atualizarAreaInteresse = (id, dados) =>
  fetchApi(`/areas-interesse/${id}`, {
    method: "PATCH",
    body: JSON.stringify(dados),
  });

export const deletarAreaInteresse = (id) =>
  fetchApi(`/areas-interesse/${id}`, {
    method: "DELETE",
  });
