const { Op, Sequelize } = require("sequelize");
const {
  Orientacao,
  Professor,
  AreaInteresse,
  IdeiaTcc,
  Banca,
  Aluno,
  Usuario,
  sequelize,
} = require("../models");
const PDFDocument = require("pdfkit"); // Certifique-se de que pdfkit está instalado

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

const bancaController = {
  async gerarBancas(req, res) {
    const t = await sequelize.transaction();
    try {
      // 1. Buscar todas as orientações finalizadas que ainda não têm banca
      const orientacoesFinalizadas = await Orientacao.findAll({
        where: {
          status: "finalizado",
          // Verifica se não existe uma banca associada
          "$banca.id_banca$": { [Op.is]: null },
        },
        include: [
          {
            model: IdeiaTcc,
            as: "ideiaTcc",
            required: true,
            include: [
              {
                model: AreaInteresse,
                as: "areasDeInteresse",
                attributes: ["id_area"], // Apenas IDs das áreas da ideia
                through: { attributes: [] },
              },
            ],
          },
          {
            model: Banca, // Inclui a associação com Banca para o filtro WHERE
            as: "banca",
            attributes: [], // Não precisa trazer dados da banca aqui
            required: false, // LEFT JOIN para permitir o filtro IS NULL
          },
        ],
        transaction: t, // Adiciona a transação
      });

      if (orientacoesFinalizadas.length === 0) {
        await t.rollback(); // Desfaz a transação se não há nada a fazer
        return res.status(200).json({
          message: "Nenhuma orientação finalizada sem banca encontrada.",
        });
      }

      // 2. Buscar todos os professores com suas áreas de interesse
      const todosProfessores = await Professor.findAll({
        include: [
          {
            model: AreaInteresse,
            as: "areasDeInteresse",
            attributes: ["id_area"], // Apenas IDs das áreas do professor
            through: { attributes: [] },
          },
        ],
        transaction: t, // Adiciona a transação
      });

      const bancasCriadas = [];
      const alertas = []; // Mudado de 'erros' para 'alertas'

      // 3. Iterar sobre cada orientação finalizada
      for (const orientacao of orientacoesFinalizadas) {
        const idOrientador = orientacao.id_professor;
        const areasIdeiaSet = new Set(
          orientacao.ideiaTcc.areasDeInteresse.map((a) => a.id_area)
        );

        // 4. Filtrar professores elegíveis
        let professoresElegiveis = todosProfessores.filter((prof) => {
          // Não pode ser o orientador
          if (prof.id_professor === idOrientador) return false;

          // Verifica se há pelo menos uma área de interesse em comum
          const areasProfSet = new Set(
            prof.areasDeInteresse.map((a) => a.id_area)
          );
          const intersection = new Set(
            [...areasIdeiaSet].filter((x) => areasProfSet.has(x))
          );
          return intersection.size > 0;
        });

        // 5. Sortear 3 professores (se houver suficientes)
        shuffleArray(professoresElegiveis); // Embaralha para aleatoriedade
        const avaliadoresSelecionados = professoresElegiveis.slice(0, 3);

        // 6. Criar a entrada na tabela Banca
        try {
          const novaBanca = await Banca.create(
            {
              id_orientacao: orientacao.id_orientacao,
              id_avaliador1: avaliadoresSelecionados[0]?.id_professor || null,
              id_avaliador2: avaliadoresSelecionados[1]?.id_professor || null,
              id_avaliador3: avaliadoresSelecionados[2]?.id_professor || null,
              // data_defesa e local_defesa podem ser definidos depois
            },
            { transaction: t }
          ); // Adiciona a transação
          bancasCriadas.push(novaBanca.id_banca); // Guarda ID da banca criada

          // Adiciona alerta se não encontrou 3 professores
          if (avaliadoresSelecionados.length < 3) {
            alertas.push(
              `Orientação ID ${orientacao.id_orientacao}: Encontrados apenas ${avaliadoresSelecionados.length} avaliadores compatíveis.`
            );
          }
        } catch (error) {
          // Verifica se o erro é de violação de chave única (banca já existe)
          if (error.name === "SequelizeUniqueConstraintError") {
            // Não é um erro crítico, apenas informa que já existe
            console.warn(
              `Banca para Orientação ID ${orientacao.id_orientacao} já existe.`
            );
          } else {
            // Outros erros durante a criação da banca
            alertas.push(
              `Erro ao criar banca para Orientação ID ${orientacao.id_orientacao}: ${error.message}`
            );
            console.error(
              `Erro ao criar banca para Orientação ID ${orientacao.id_orientacao}:`,
              error
            );
          }
          // Continua para a próxima orientação mesmo se uma falhar ou já existir
        }
      }

      await t.commit(); // Confirma a transação

      // Se houveram erros não críticos (alertas), retorna 201 com mensagem e alertas
      // Mesmo que bancasCriadas.length seja 0, mas houve alertas (ex: todas já existiam), ainda é sucesso parcial
      if (alertas.length > 0) {
        res.status(201).json({
          message: `Processo finalizado. ${bancasCriadas.length} novas bancas criadas.`,
          bancasCriadasIds: bancasCriadas,
          alertas: alertas,
        });
      } else {
        // Se não houveram alertas e nenhuma banca foi criada (improvável se chegou aqui, mas por segurança)
        if (bancasCriadas.length === 0 && orientacoesFinalizadas.length > 0) {
          res.status(200).json({
            message:
              "Nenhuma nova banca precisou ser criada (possivelmente já existiam).",
          });
        } else {
          // Sucesso completo
          res.status(201).json({
            message: `Processo finalizado. ${bancasCriadas.length} bancas criadas com sucesso.`,
            bancasCriadasIds: bancasCriadas,
          });
        }
      }
    } catch (error) {
      await t.rollback(); // Desfaz a transação em caso de erro geral
      console.error("Erro GERAL ao gerar bancas:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro interno ao gerar as bancas." });
    }
  },

  // Função para listar as bancas geradas (para o admin visualizar)
  async listarBancas(req, res) {
    try {
      const bancas = await Banca.findAll({
        include: [
          {
            model: Orientacao,
            as: "orientacao",
            attributes: ["id_orientacao", "id_professor"], // Inclui id_professor para saber o orientador
            include: [
              {
                model: Aluno,
                as: "aluno",
                include: {
                  model: Usuario,
                  as: "dadosUsuario",
                  attributes: ["nome"],
                },
              },
              {
                model: Professor, // Orientador
                as: "professor",
                include: {
                  model: Usuario,
                  as: "usuario",
                  attributes: ["nome"],
                },
              },
              { model: IdeiaTcc, as: "ideiaTcc", attributes: ["titulo"] },
            ],
          },
          {
            model: Professor,
            as: "avaliador1",
            include: { model: Usuario, as: "usuario", attributes: ["nome"] },
          },
          {
            model: Professor,
            as: "avaliador2",
            include: { model: Usuario, as: "usuario", attributes: ["nome"] },
          },
          {
            model: Professor,
            as: "avaliador3",
            include: { model: Usuario, as: "usuario", attributes: ["nome"] },
          },
        ],
        order: [["createdAt", "DESC"]],
      });
      res.status(200).json(bancas);
    } catch (error) {
      console.error("Erro ao listar bancas:", error);
      res.status(500).json({ error: "Ocorreu um erro ao listar as bancas." });
    }
  },

  // Função para atualizar data e local da defesa (pelo Admin)
  async atualizarDetalhesBanca(req, res) {
    const t = await sequelize.transaction(); // Inicia transação
    try {
      const { id_banca } = req.params;
      const { data_defesa, local_defesa } = req.body;

      const banca = await Banca.findByPk(id_banca, { transaction: t });
      if (!banca) {
        await t.rollback();
        return res.status(404).json({ error: "Banca não encontrada." });
      }

      const dadosAtualizar = {};

      // Atualiza data_defesa se fornecida
      if (data_defesa !== undefined) {
        if (data_defesa === null) {
          dadosAtualizar.data_defesa = null; // Permite definir como nulo
        } else {
          const novaDataDefesa = new Date(data_defesa);
          if (isNaN(novaDataDefesa.getTime())) {
            await t.rollback();
            return res
              .status(400)
              .json({ error: "Formato de data/hora inválido." });
          }
          // --- Verificação de Conflito ---
          const dataInicioNova = novaDataDefesa;
          const dataFimNova = new Date(
            dataInicioNova.getTime() + 30 * 60 * 1000
          ); // Fim da nova = início + 30 min (buffer)
          const dataInicioBufferAntes = new Date(
            dataInicioNova.getTime() - 30 * 60 * 1000
          );

          const conflito = await Banca.findOne({
            where: {
              id_banca: { [Op.ne]: id_banca }, // Exclui a própria banca
              data_defesa: {
                [Op.ne]: null,
                [Op.between]: [dataInicioBufferAntes, dataFimNova],
              },
            },
            transaction: t,
          });

          if (conflito) {
            await t.rollback();
            const conflitoHora = conflito.data_defesa.toLocaleTimeString(
              "pt-BR",
              { hour: "2-digit", minute: "2-digit" }
            );
            return res.status(409).json({
              error: `Conflito de horário. Já existe uma banca às ${conflitoHora}. O intervalo mínimo é de 30 minutos.`,
            });
          }
          // --- Fim Verificação de Conflito ---
          dadosAtualizar.data_defesa = novaDataDefesa;
        }
      }

      if (local_defesa !== undefined) {
        dadosAtualizar.local_defesa = local_defesa || null;
      }

      if (Object.keys(dadosAtualizar).length > 0) {
        await banca.update(dadosAtualizar, { transaction: t });
      } else {
        // Se não houver dados para atualizar, apenas rollback (ou commit se não houver erro)
        await t.commit(); // Commit mesmo sem alterações para finalizar a transação
        // Retorna a banca original sem modificações
        const bancaOriginal = await Banca.findByPk(id_banca, {
          include: [
            // Inclui as associações necessárias para retornar os dados completos
            {
              model: Orientacao,
              as: "orientacao",
              attributes: ["id_orientacao", "id_professor"],
              include: [
                {
                  model: Aluno,
                  as: "aluno",
                  include: {
                    model: Usuario,
                    as: "dadosUsuario",
                    attributes: ["nome"],
                  },
                },
                {
                  model: Professor,
                  as: "professor",
                  include: {
                    model: Usuario,
                    as: "usuario",
                    attributes: ["nome"],
                  },
                },
                { model: IdeiaTcc, as: "ideiaTcc", attributes: ["titulo"] },
              ],
            },
            {
              model: Professor,
              as: "avaliador1",
              include: { model: Usuario, as: "usuario", attributes: ["nome"] },
            },
            {
              model: Professor,
              as: "avaliador2",
              include: { model: Usuario, as: "usuario", attributes: ["nome"] },
            },
            {
              model: Professor,
              as: "avaliador3",
              include: { model: Usuario, as: "usuario", attributes: ["nome"] },
            },
          ],
        });
        return res.status(200).json(bancaOriginal);
      }

      await t.commit(); // Confirma a transação

      // Busca a banca atualizada com todas as associações para retornar ao frontend
      const bancaAtualizada = await Banca.findByPk(id_banca, {
        include: [
          {
            model: Orientacao,
            as: "orientacao",
            attributes: ["id_orientacao", "id_professor"],
            include: [
              {
                model: Aluno,
                as: "aluno",
                include: {
                  model: Usuario,
                  as: "dadosUsuario",
                  attributes: ["nome"],
                },
              },
              {
                model: Professor,
                as: "professor",
                include: {
                  model: Usuario,
                  as: "usuario",
                  attributes: ["nome"],
                },
              },
              { model: IdeiaTcc, as: "ideiaTcc", attributes: ["titulo"] },
            ],
          },
          {
            model: Professor,
            as: "avaliador1",
            include: { model: Usuario, as: "usuario", attributes: ["nome"] },
          },
          {
            model: Professor,
            as: "avaliador2",
            include: { model: Usuario, as: "usuario", attributes: ["nome"] },
          },
          {
            model: Professor,
            as: "avaliador3",
            include: { model: Usuario, as: "usuario", attributes: ["nome"] },
          },
        ],
      });

      res.status(200).json(bancaAtualizada);
    } catch (error) {
      await t.rollback(); // Desfaz a transação em caso de erro
      console.error("Erro ao atualizar detalhes da banca:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro ao atualizar os detalhes da banca." });
    }
  },

  // Nova função para salvar o conceito da ata
  async gerarAtaPdf(req, res) {
    try {
      const { id_banca } = req.params;

      // Busca a banca com todos os dados necessários
      const banca = await Banca.findByPk(id_banca, {
        include: [
          {
            model: Orientacao,
            as: "orientacao",
            include: [
              {
                model: Aluno,
                as: "aluno",
                include: [
                  { model: Usuario, as: "dadosUsuario", attributes: ["nome"] },
                  { model: Curso, as: "cursoInfo", attributes: ["nome"] }, // Inclui Curso
                ],
              },
              {
                model: Professor, // Orientador (Presidente)
                as: "professor",
                include: {
                  model: Usuario,
                  as: "usuario",
                  attributes: ["nome"],
                },
              },
              { model: IdeiaTcc, as: "ideiaTcc", attributes: ["titulo"] },
            ],
          },
          {
            model: Professor,
            as: "avaliador1",
            include: { model: Usuario, as: "usuario", attributes: ["nome"] },
          },
          {
            model: Professor,
            as: "avaliador2",
            include: { model: Usuario, as: "usuario", attributes: ["nome"] },
          },
          {
            model: Professor,
            as: "avaliador3",
            include: { model: Usuario, as: "usuario", attributes: ["nome"] },
          },
        ],
      });

      if (!banca) {
        return res.status(404).json({ error: "Banca não encontrada." });
      }

      // Verifica se os dados essenciais para a ata existem
      if (
        !banca.data_defesa ||
        !banca.local_defesa ||
        !banca.conceito_aprovacao ||
        !banca.conceito_final
      ) {
        return res
          .status(400)
          .json({
            error:
              "Dados incompletos para gerar a ata (Data, Local ou Conceitos).",
          });
      }

      // Extrai dados para o PDF
      const nomeAluno =
        banca.orientacao?.aluno?.dadosUsuario?.nome || "[Nome Aluno]";
      const tituloProjeto =
        banca.orientacao?.ideiaTcc?.titulo || "[Título Projeto]";
      const curso = banca.orientacao?.aluno?.cursoInfo?.nome || "[Nome Curso]";
      const dataDefesa = banca.data_defesa
        ? parseISO(banca.data_defesa.toISOString())
        : null; // Parse ISO string
      const dia =
        dataDefesa && isValid(dataDefesa) ? format(dataDefesa, "dd") : "__";
      const mes =
        dataDefesa && isValid(dataDefesa)
          ? format(dataDefesa, "MMMM", { locale: ptBR })
          : "__";
      const ano =
        dataDefesa && isValid(dataDefesa) ? format(dataDefesa, "yyyy") : "__";
      const hora =
        dataDefesa && isValid(dataDefesa) ? format(dataDefesa, "HH:mm") : "__";
      const local = banca.local_defesa || "[Local não definido]";

      const orientador =
        banca.orientacao?.professor?.usuario?.nome || "[Orientador]";
      const avaliador1 = banca.avaliador1?.usuario?.nome || null;
      const avaliador2 = banca.avaliador2?.usuario?.nome || null;
      const avaliador3 = banca.avaliador3?.usuario?.nome || null;
      const bancaExaminadoraNomes = [
        orientador,
        avaliador1,
        avaliador2,
        avaliador3,
      ].filter(Boolean);

      const conceitoAprovacao = banca.conceito_aprovacao;
      const conceitoFinal = banca.conceito_final;

      // Cria o documento PDF
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 72, right: 72 },
      });

      // Configura headers para download
      const filename = `Ata_Defesa_${nomeAluno.replace(/\s+/g, "_")}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      doc.pipe(res);

      // --- Conteúdo do PDF ---
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("ATA DE DEFESA DO TRABALHO DE CONCLUSÃO DE CURSO", {
          align: "center",
        });
      doc.moveDown(2);

      doc.fontSize(11).font("Helvetica");
      const textoPrincipal = `No dia ${dia} do mês de ${mes} do ano de ${ano}, às ${hora}, no(a) ${local}, em sessão pública de defesa do Trabalho de Conclusão de Curso de ${curso} do discente ${nomeAluno}, tendo como título "${tituloProjeto}", compareceram como banca examinadora:`;
      doc.text(textoPrincipal, { align: "justify", lineGap: 4 });
      doc.moveDown(1);

      // Membros da Banca
      doc
        .font("Helvetica-Bold")
        .text("Banca Examinadora:", { continued: false }); // Garante nova linha
      doc.moveDown(0.5);
      doc.font("Helvetica");
      bancaExaminadoraNomes.forEach((nome, index) => {
        const role = index === 0 ? " (Presidente da Banca)" : "";
        doc.list([`${nome}${role}`], { bulletRadius: 0, textIndent: 10 }); // Usa list para indentação
      });
      doc.moveDown(1);

      // Resultado
      doc.text(
        "Após a apresentação e as observações dos referidos professores, ficou definido que o trabalho foi considerado:",
        { align: "justify", lineGap: 4 }
      );
      doc.moveDown(0.5);

      const opcoesAprovacaoMap = {
        aprovado: "aprovado",
        aprovado_com_ressalvas: "aprovado com ressalvas",
        reprovado: "reprovado",
      };
      for (const [key, value] of Object.entries(opcoesAprovacaoMap)) {
        const marcador = conceitoAprovacao === key ? "[X]" : "[ ]";
        doc.text(`${marcador} ${value}`, { indent: 10 });
      }
      doc.moveDown(0.5);

      doc.text("Com conceito final:", { lineGap: 4 });
      doc.moveDown(0.5);
      const conceitosFinais = ["A", "B", "C", "D"];
      // Exibe lado a lado
      let conceitoText = conceitosFinais
        .map((cf) => {
          const marcador = conceitoFinal === cf ? "[X]" : "[ ]";
          return `${marcador} ${cf}`;
        })
        .join("      "); // Adiciona espaço entre as opções
      doc.text(conceitoText, { indent: 10 });

      doc.moveDown(1.5);

      // Texto Final
      doc.text(
        "Nada mais havendo, eu, presidente da banca, lavrei a presente ata que segue assinada por mim e demais membros.",
        { align: "justify", lineGap: 4 }
      );
      doc.moveDown(3);

      // Assinaturas (simuladas)
      const signatureY = doc.y; // Pega a posição atual
      const signatureWidth = 200;
      const pageWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const startX = doc.page.margins.left; // Começa na margem esquerda

      doc.text("___________________________", startX, signatureY, {
        width: signatureWidth,
        align: "center",
      });
      doc.text(orientador, startX, signatureY + 15, {
        width: signatureWidth,
        align: "center",
      });
      doc.text("(Presidente da Banca)", startX, signatureY + 30, {
        width: signatureWidth,
        align: "center",
      });

      // --- Finaliza o PDF ---
      doc.end();
    } catch (error) {
      console.error("Erro ao gerar PDF da ata:", error);
      res.status(500).json({ error: "Erro ao gerar o documento PDF da ata." });
    }
  },
};

module.exports = bancaController;
