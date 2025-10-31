const {
  Orientacao,
  Aluno,
  Professor,
  IdeiaTcc,
  Usuario,
  Curso, // Adiciona Curso para pegar o nome
  sequelize, // Adiciona sequelize aqui
} = require("../models");
const { Op, Sequelize } = require("sequelize");
const PDFDocument = require("pdfkit"); // Importa pdfkit

const orientacaoController = {
  // ... (getOrientacao, updateOrientacao, etc. - Sem alterações) ...
  async getOrientacao(req, res) {
    try {
      const idUsuario = req.user.id;
      const role = req.user.role;
      let where = {};

      if (role === "aluno") {
        const aluno = await Aluno.findOne({ where: { id_usuario: idUsuario } });
        if (aluno) {
          where.id_aluno = aluno.id_aluno;
        } else {
          return res.status(200).json([]);
        }
      } else if (role === "professor") {
        const professor = await Professor.findOne({
          where: { id_usuario: idUsuario },
        });
        if (professor) {
          where.id_professor = professor.id_professor;
        } else {
          return res.status(200).json([]);
        }
      } else {
        // Se não for aluno nem professor (ex: admin sem perfil associado), retorna vazio
        return res.status(200).json([]);
      }

      const orientacoes = await Orientacao.findAll({
        where,
        include: [
          {
            model: Aluno,
            as: "aluno",
            include: [
              {
                model: Usuario,
                as: "dadosUsuario",
                attributes: ["id_usuario", "nome", "email"], // Inclui id_usuario se necessário
              },
              {
                model: Curso, // Inclui curso do aluno
                as: "cursoInfo",
                attributes: ["nome"],
              },
            ],
            attributes: ["id_aluno", "matricula"], // Inclui matrícula
          },
          {
            model: Professor,
            as: "professor",
            include: {
              model: Usuario,
              as: "usuario",
              attributes: ["id_usuario", "nome", "email"], // Inclui id_usuario se necessário
            },
          },
          {
            model: IdeiaTcc,
            as: "ideiaTcc",
            attributes: ["titulo"], // Inclui título da ideia
          },
        ],
        order: [
          Sequelize.literal(
            "CASE `Orientacao`.`status` WHEN 'em desenvolvimento' THEN 1 WHEN 'pausado' THEN 2 WHEN 'finalizado' THEN 3 WHEN 'encerrado' THEN 4 ELSE 5 END"
          ),
          ["data_inicio", "DESC"],
        ],
      });

      res.status(200).json(orientacoes);
    } catch (error) {
      console.error("Erro ao buscar orientação:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro ao buscar a orientação." });
    }
  },

  async updateOrientacao(req, res) {
    try {
      const { id } = req.params;
      const { url_projeto, url_artigo, observacoes, status } = req.body; // Status é mantido aqui para pausar/retomar
      const idUsuario = req.user.id;

      const orientacao = await Orientacao.findByPk(id);

      if (!orientacao) {
        return res.status(404).json({ error: "Orientação não encontrada." });
      }

      // Verifica permissão (aluno ou professor da orientação)
      const aluno = await Aluno.findOne({ where: { id_usuario: idUsuario } });
      const professor = await Professor.findOne({
        where: { id_usuario: idUsuario },
      });

      const isAluno = aluno && aluno.id_aluno === orientacao.id_aluno;
      const isProfessor =
        professor && professor.id_professor === orientacao.id_professor;

      if (!isAluno && !isProfessor) {
        return res.status(403).json({
          error: "Você não tem permissão para editar esta orientação.",
        });
      }

      // Status permitidos para atualização geral (pausar/retomar)
      const allowedStatusUpdates = ["em desenvolvimento", "pausado"];
      if (
        status &&
        (!allowedStatusUpdates.includes(status) ||
          (isAluno && status === "finalizado")) // Aluno não pode finalizar
      ) {
        return res.status(400).json({
          error: `Atualização de status inválida ou não permitida para seu perfil. Use as rotas específicas se necessário.`,
        });
      }

      // Não permitir edição se já foi encerrada, cancelada ou finalizada
      if (
        ["cancelado", "encerrado", "finalizado"].includes(orientacao.status)
      ) {
        return res
          .status(400)
          .json({ error: "Não é possível editar uma orientação finalizada." });
      }

      // Não permitir edição se houver solicitação de cancelamento pendente
      if (orientacao.solicitacao_cancelamento !== "nenhuma") {
        return res.status(400).json({
          error:
            "Não é possível editar enquanto houver uma solicitação de cancelamento pendente.",
        });
      }
      // Não permitir edição se houver solicitação de finalização pendente
      if (orientacao.solicitacao_finalizacao !== "nenhuma") {
        return res.status(400).json({
          error:
            "Não é possível editar enquanto houver uma solicitação de finalização pendente.",
        });
      }

      const toUpdate = {};
      // Aluno e Professor podem atualizar URL e Observações
      if (url_projeto !== undefined) toUpdate.url_projeto = url_projeto;
      if (url_artigo !== undefined) toUpdate.url_artigo = url_artigo;
      if (observacoes !== undefined) toUpdate.observacoes = observacoes;

      // Apenas Professor pode mudar o status para pausado/desenvolvimento via PATCH geral
      if (isProfessor && status !== undefined) {
        toUpdate.status = status;
        // Se finalizar, seta a data_fim (movido para rota específica /finalizar)
        // if (status === "finalizado") {
        //   toUpdate.data_fim = new Date();
        // }
      }

      await orientacao.update(toUpdate);

      res.status(200).json(orientacao);
    } catch (error) {
      console.error("Erro ao atualizar orientação:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro ao atualizar a orientação." });
    }
  },

  async solicitarCancelamento(req, res) {
    try {
      const { id } = req.params;
      const idUsuario = req.user.id;

      const aluno = await Aluno.findOne({ where: { id_usuario: idUsuario } });
      if (!aluno) {
        return res
          .status(403)
          .json({ error: "Apenas alunos podem solicitar cancelamento." });
      }

      const orientacao = await Orientacao.findOne({
        where: { id_orientacao: id, id_aluno: aluno.id_aluno },
      });
      if (!orientacao) {
        return res.status(404).json({
          error: "Orientação não encontrada ou não pertence a este aluno.",
        });
      }

      if (
        orientacao.solicitacao_cancelamento !== "nenhuma" ||
        orientacao.solicitacao_finalizacao !== "nenhuma" || // Verifica se há solicitação de finalização também
        ["cancelado", "encerrado", "finalizado"].includes(orientacao.status)
      ) {
        return res.status(400).json({
          error: "Não é possível solicitar cancelamento nesta orientação.",
        });
      }

      await orientacao.update({ solicitacao_cancelamento: "aluno" });

      res
        .status(200)
        .json({ message: "Solicitação de cancelamento enviada ao professor." });
    } catch (error) {
      console.error("Erro ao solicitar cancelamento:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro ao solicitar o cancelamento." });
    }
  },

  async confirmarCancelamento(req, res) {
    // Confirma cancelamento solicitado pelo ALUNO
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { feedback_cancelamento } = req.body;
      const idUsuario = req.user.id;

      const professor = await Professor.findOne({
        where: { id_usuario: idUsuario },
      });
      if (!professor) {
        await t.rollback();
        return res
          .status(403)
          .json({ error: "Apenas professores podem confirmar cancelamento." });
      }

      const orientacao = await Orientacao.findOne({
        where: { id_orientacao: id, id_professor: professor.id_professor },
      });
      if (!orientacao) {
        await t.rollback();
        return res.status(404).json({
          error: "Orientação não encontrada ou não pertence a este professor.",
        });
      }

      if (orientacao.solicitacao_cancelamento !== "aluno") {
        await t.rollback();
        return res.status(400).json({
          error:
            "Não há solicitação de cancelamento pendente do aluno para esta orientação.",
        });
      }
      if (
        ["cancelado", "encerrado", "finalizado"].includes(orientacao.status)
      ) {
        await t.rollback();
        return res.status(400).json({
          error: "Esta orientação já foi finalizada ou encerrada.",
        });
      }

      // Encontra a ideia associada para reverter o status
      const ideia = await IdeiaTcc.findByPk(orientacao.id_ideia_tcc);
      if (!ideia) {
        await t.rollback();
        return res
          .status(404)
          .json({ error: "Ideia de TCC associada não encontrada." });
      }

      await orientacao.update(
        {
          status: "encerrado",
          data_fim: new Date(),
          feedback_cancelamento: feedback_cancelamento || null,
          solicitacao_cancelamento: "nenhuma", // Limpa a solicitação
        },
        { transaction: t }
      );

      // Volta o status da IdeiaTcc para 0 (Pendente/Disponível)
      await ideia.update({ status: 0 }, { transaction: t });

      await t.commit();

      res.status(200).json({ message: "Orientação encerrada com sucesso." });
    } catch (error) {
      await t.rollback();
      console.error("Erro ao confirmar cancelamento:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro ao confirmar o cancelamento." });
    }
  },

  //  função para cancelamento direto pelo professor
  async cancelarOrientacaoProfessor(req, res) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { feedback_cancelamento } = req.body;
      const idUsuario = req.user.id;

      const professor = await Professor.findOne({
        where: { id_usuario: idUsuario },
      });
      if (!professor) {
        await t.rollback();
        return res
          .status(403)
          .json({ error: "Apenas professores podem cancelar orientações." });
      }

      const orientacao = await Orientacao.findOne({
        where: { id_orientacao: id, id_professor: professor.id_professor },
      });
      if (!orientacao) {
        await t.rollback();
        return res.status(404).json({
          error: "Orientação não encontrada ou não pertence a este professor.",
        });
      }

      // Verifica se a orientação já não está encerrada/finalizada ou com solicitações
      if (
        ["cancelado", "encerrado", "finalizado"].includes(orientacao.status) ||
        orientacao.solicitacao_cancelamento !== "nenhuma" ||
        orientacao.solicitacao_finalizacao !== "nenhuma"
      ) {
        await t.rollback();
        return res.status(400).json({
          error:
            "Esta orientação já foi finalizada, encerrada ou possui solicitações pendentes.",
        });
      }

      // Encontra a ideia associada para reverter o status
      const ideia = await IdeiaTcc.findByPk(orientacao.id_ideia_tcc);
      if (!ideia) {
        await t.rollback();
        return res
          .status(404)
          .json({ error: "Ideia de TCC associada não encontrada." });
      }

      await orientacao.update(
        {
          status: "encerrado",
          data_fim: new Date(),
          feedback_cancelamento: feedback_cancelamento || null,
          solicitacao_cancelamento: "nenhuma", // Garante que fique limpo
        },
        { transaction: t }
      );

      // Volta o status da IdeiaTcc para 0 (Pendente/Disponível)
      await ideia.update({ status: 0 }, { transaction: t });

      await t.commit();

      res
        .status(200)
        .json({ message: "Orientação encerrada com sucesso pelo professor." });
    } catch (error) {
      await t.rollback();
      console.error("Erro ao cancelar orientação pelo professor:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro ao encerrar a orientação." });
    }
  },

  // *** FUNÇÃO PARA FINALIZAR ORIENTAÇÃO (Direto pelo Professor)***
  async finalizarOrientacao(req, res) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params; // id_orientacao
      const idUsuario = req.user.id;

      // Verifica se é professor
      const professor = await Professor.findOne({
        where: { id_usuario: idUsuario },
      });
      if (!professor) {
        await t.rollback();
        return res
          .status(403)
          .json({ error: "Apenas professores podem finalizar orientações." });
      }

      const orientacao = await Orientacao.findOne({
        where: { id_orientacao: id, id_professor: professor.id_professor },
        transaction: t,
      });
      if (!orientacao) {
        await t.rollback();
        return res.status(404).json({
          error: "Orientação não encontrada ou não pertence a este professor.",
        });
      }

      // Verifica se o status permite finalização e se não há solicitações pendentes
      if (
        !["em desenvolvimento", "pausado"].includes(orientacao.status) ||
        orientacao.solicitacao_cancelamento !== "nenhuma" ||
        orientacao.solicitacao_finalizacao !== "nenhuma" // Garante que o aluno não solicitou
      ) {
        await t.rollback();
        return res.status(400).json({
          error:
            "Orientação não pode ser finalizada neste estado ou possui solicitações pendentes.",
        });
      }

      // Atualiza o status e data_fim
      await orientacao.update(
        {
          status: "finalizado",
          data_fim: new Date(),
        },
        { transaction: t }
      );

      await t.commit();

      res.status(200).json({ message: "Orientação finalizada com sucesso." });
    } catch (error) {
      await t.rollback();
      console.error("Erro ao finalizar orientação:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro ao finalizar a orientação." });
    }
  },

  async solicitarFinalizacao(req, res) {
    try {
      const { id } = req.params;
      const idUsuario = req.user.id;

      const aluno = await Aluno.findOne({ where: { id_usuario: idUsuario } });
      if (!aluno) {
        return res
          .status(403)
          .json({ error: "Apenas alunos podem solicitar finalização." });
      }

      const orientacao = await Orientacao.findOne({
        where: { id_orientacao: id, id_aluno: aluno.id_aluno },
      });
      if (!orientacao) {
        return res.status(404).json({
          error: "Orientação não encontrada ou não pertence a este aluno.",
        });
      }

      // Verifica se já não está finalizada/encerrada ou se já tem solicitação pendente
      if (
        orientacao.solicitacao_finalizacao !== "nenhuma" ||
        orientacao.solicitacao_cancelamento !== "nenhuma" ||
        !["em desenvolvimento", "pausado"].includes(orientacao.status)
      ) {
        return res.status(400).json({
          error: "Não é possível solicitar finalização nesta orientação.",
        });
      }

      await orientacao.update({ solicitacao_finalizacao: "aluno" });

      res
        .status(200)
        .json({ message: "Solicitação de finalização enviada ao professor." });
    } catch (error) {
      console.error("Erro ao solicitar finalização:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro ao solicitar a finalização." });
    }
  },

  async confirmarFinalizacao(req, res) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { feedback_cancelamento } = req.body; // Reutiliza campo de feedback
      const idUsuario = req.user.id;

      const professor = await Professor.findOne({
        where: { id_usuario: idUsuario },
      });
      if (!professor) {
        await t.rollback();
        return res
          .status(403)
          .json({ error: "Apenas professores podem confirmar finalização." });
      }

      const orientacao = await Orientacao.findOne({
        where: { id_orientacao: id, id_professor: professor.id_professor },
        transaction: t,
      });
      if (!orientacao) {
        await t.rollback();
        return res.status(404).json({
          error: "Orientação não encontrada ou não pertence a este professor.",
        });
      }

      if (orientacao.solicitacao_finalizacao !== "aluno") {
        await t.rollback();
        return res.status(400).json({
          error:
            "Não há solicitação de finalização pendente do aluno para esta orientação.",
        });
      }

      // Atualiza status, data_fim e feedback
      await orientacao.update(
        {
          status: "finalizado",
          data_fim: new Date(),
          feedback_cancelamento: feedback_cancelamento || null, // Salva o feedback
          solicitacao_finalizacao: "nenhuma", // Limpa a solicitação
        },
        { transaction: t }
      );

      await t.commit();

      res.status(200).json({ message: "Orientação finalizada com sucesso." });
    } catch (error) {
      await t.rollback();
      console.error("Erro ao confirmar finalização:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro ao confirmar a finalização." });
    }
  },

  // Função para gerar o PDF de Ciência - Ajuste de espaçamento
  async gerarCienciaPdf(req, res) {
    try {
      const { id } = req.params; // id_orientacao
      const idUsuario = req.user.id; // ID do usuário logado (vem do token JWT)

      const orientacao = await Orientacao.findByPk(id, {
        include: [
          {
            model: Aluno,
            as: "aluno",
            include: [
              {
                model: Usuario,
                as: "dadosUsuario",
                attributes: ["nome", "id_usuario"],
              }, // Inclui id_usuario
              { model: Curso, as: "cursoInfo", attributes: ["nome"] },
            ],
            attributes: ["matricula", "id_aluno"], // Inclui id_aluno
          },
          {
            model: Professor,
            as: "professor",
            include: {
              model: Usuario,
              as: "usuario",
              attributes: ["nome", "id_usuario"],
            }, // Inclui id_usuario
          },
          { model: IdeiaTcc, as: "ideiaTcc", attributes: ["titulo"] },
        ],
      });

      if (!orientacao) {
        return res.status(404).json({ error: "Orientação não encontrada." });
      }

      // Verifica permissão (apenas aluno ou professor da orientação)
      const isAluno = orientacao.aluno?.dadosUsuario?.id_usuario === idUsuario;
      const isProfessor =
        orientacao.professor?.usuario?.id_usuario === idUsuario;

      if (!isAluno && !isProfessor) {
        console.warn(
          `Tentativa de acesso negado ao PDF. UserID: ${idUsuario}, AlunoID: ${orientacao.aluno?.dadosUsuario?.id_usuario}, ProfessorID: ${orientacao.professor?.usuario?.id_usuario}`
        );
        return res
          .status(403)
          .json({ error: "Acesso negado para gerar este documento." });
      }

      if (
        !["em desenvolvimento", "pausado", "finalizado", "encerrado"].includes(
          orientacao.status
        )
      ) {
        return res.status(400).json({
          error:
            "Documento disponível apenas para orientações iniciadas ou finalizadas/encerradas.",
        });
      }

      const nomeProfessor =
        orientacao.professor?.usuario?.nome || "[Nome Professor]";
      const nomeAluno = orientacao.aluno?.dadosUsuario?.nome || "[Nome Aluno]";
      const matriculaAluno = orientacao.aluno?.matricula || "[Matrícula]";
      const nomeCurso = orientacao.aluno?.cursoInfo?.nome || "[Nome Curso]";
      const tituloTcc = orientacao.ideiaTcc?.titulo || "[Título TCC]";
      const dataAtual = new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 72, bottom: 72, left: 72, right: 72 },
      });

      // Configura headers para download
      const filename = `ciencia_orientacao_${nomeAluno.replace(
        /\s+/g,
        "_"
      )}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      doc.pipe(res);

      // --- Conteúdo do PDF ---
      doc.fontSize(16).text("Termo de Ciência de Orientação de TCC", {
        align: "center",
      });
      doc.moveDown(4); // Espaço reduzido após o título

      // Texto principal centralizado
      doc
        .fontSize(12)
        .lineGap(6) // Espaço entre linhas reduzido
        .text(
          `Eu, ${nomeProfessor}, professor(a) do curso de ${nomeCurso}, declaro estar ciente e de acordo em orientar o(a) aluno(a) ${nomeAluno}, matrícula ${matriculaAluno}, no desenvolvimento do Trabalho de Conclusão de Curso intitulado "${tituloTcc}".`,
          { align: "center", indent: 20, paragraphGap: 10 }
        );
      doc.moveDown(4); // Espaço reduzido antes da data

      // Data alinhada à direita
      doc.text(`Paranaguá, ${dataAtual}.`, { align: "right" });

      // Calcula Y para assinaturas mais abaixo, mas garantindo que caiba na página
      const pageHeight = doc.page.height;
      const bottomMargin = doc.page.margins.bottom;
      // Define a posição Y desejada (ex: 120 pontos acima da margem inferior)
      let signatureY = pageHeight - bottomMargin - 120;
      // Garante que a posição Y não seja menor que a posição atual + algum espaço
      signatureY = Math.max(doc.y + 80, signatureY); // Garante pelo menos 80 pontos de espaço

      const signatureWidth = 200;
      const spaceBetween = 50;
      const totalWidth = signatureWidth * 2 + spaceBetween;
      const startX = (doc.page.width - totalWidth) / 2;

      // Guarda a posição Y atual antes de desenhar as assinaturas
      const currentYBeforeSignatures = doc.y;

      // --- Assinaturas Lado a Lado na Posição Calculada ---

      // Bloco Professor (Esquerda)
      const professorX = startX;
      doc.text("___________________________", professorX, signatureY, {
        width: signatureWidth,
        align: "center",
      });
      // Calcula a altura da linha de assinatura para posicionar o texto abaixo dela
      const lineHeight = doc.heightOfString("___________________________", {
        width: signatureWidth,
        align: "center",
      });
      const professorRoleY =
        signatureY + lineHeight + doc.currentLineHeight() * 0.5; // Y para "Assinatura do..."
      doc.text("Assinatura do(a) Professor(a)", professorX, professorRoleY, {
        width: signatureWidth,
        align: "center",
      });
      const professorNameY =
        professorRoleY +
        doc.heightOfString("Assinatura do(a) Professor(a)", {
          width: signatureWidth,
          align: "center",
        }); // Y para o nome
      doc.text(nomeProfessor, professorX, professorNameY, {
        width: signatureWidth,
        align: "center",
      });

      // Bloco Aluno (Direita) - Usa as mesmas posições Y calculadas
      const alunoX = startX + signatureWidth + spaceBetween;
      doc.text("___________________________", alunoX, signatureY, {
        width: signatureWidth,
        align: "center",
      });
      const alunoRoleY =
        signatureY + lineHeight + doc.currentLineHeight() * 0.5;
      doc.text("Assinatura do(a) Aluno(a)", alunoX, alunoRoleY, {
        width: signatureWidth,
        align: "center",
      });
      const alunoNameY =
        alunoRoleY +
        doc.heightOfString("Assinatura do(a) Aluno(a)", {
          width: signatureWidth,
          align: "center",
        });
      doc.text(nomeAluno, alunoX, alunoNameY, {
        width: signatureWidth,
        align: "center",
      });

      // --- Finaliza o PDF ---
      doc.end();
    } catch (error) {
      console.error("Erro ao gerar PDF de ciência:", error);
      res.status(500).json({ error: "Erro ao gerar o documento PDF." });
    }
  },
};

module.exports = orientacaoController;
