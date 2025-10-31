const { Op, Sequelize } = require("sequelize");
const {
  Orientacao,
  Professor,
  AreaInteresse,
  IdeiaTcc,
  Banca,
  Aluno,
  Usuario,
  Curso,
  sequelize,
} = require("../models");
const PDFDocument = require("pdfkit");

const ExcelJS = require("exceljs");

// Importar dayjs e plugins
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const customParseFormat = require("dayjs/plugin/customParseFormat");
const localizedFormat = require("dayjs/plugin/localizedFormat");
require("dayjs/locale/pt-br");

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);
dayjs.locale("pt-br"); // Define o locale globalmente
dayjs.tz.setDefault("America/Sao_Paulo"); // Define o fuso horário padrão

// ... (função shuffleArray existente) ...
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

  async listarBancas(req, res) {
    try {
      const bancas = await Banca.findAll({
        include: [
          {
            model: Orientacao,
            as: "orientacao",
            attributes: ["id_orientacao"], // Apenas ID da orientação
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
              }, // Orientador
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
        // Se a data for null, define como null (para limpar)
        if (data_defesa === null) {
          dadosAtualizar.data_defesa = null;
        } else {
          const novaDataDefesa = dayjs.tz(data_defesa, "America/Sao_Paulo"); // Interpreta a data no fuso
          if (!novaDataDefesa.isValid()) {
            await t.rollback();
            return res
              .status(400)
              .json({ error: "Formato de data/hora inválido." });
          }

          // --- Verificação de Conflito ---
          const dataInicioNova = novaDataDefesa.toDate();
          // Buffer de 30 minutos (início + 30)
          const dataFimNova = dayjs(dataInicioNova).add(30, "minutes").toDate();
          // Buffer de 30 minutos (início - 30)
          const dataInicioBufferAntes = dayjs(dataInicioNova)
            .subtract(30, "minutes")
            .toDate();

          const conflito = await Banca.findOne({
            where: {
              id_banca: { [Op.ne]: id_banca }, // Exclui a própria banca
              data_defesa: {
                [Op.ne]: null, // Considera apenas bancas com data definida
                // Verifica se alguma banca existente começa DENTRO do intervalo de buffer da nova
                [Op.between]: [dataInicioBufferAntes, dataFimNova],
              },
            },
            transaction: t,
          });

          if (conflito) {
            await t.rollback();
            const conflitoHora = dayjs.tz(conflito.data_defesa).format("HH:mm");
            return res.status(409).json({
              error: `Conflito de horário. Já existe uma banca às ${conflitoHora}. O intervalo mínimo é de 30 minutos.`,
            });
          }
          // --- Fim Verificação de Conflito ---

          dadosAtualizar.data_defesa = novaDataDefesa.toDate(); // Salva como objeto Date
        }
      }

      if (local_defesa !== undefined) {
        dadosAtualizar.local_defesa = local_defesa || null;
      }

      if (Object.keys(dadosAtualizar).length > 0) {
        await banca.update(dadosAtualizar, { transaction: t });
      } else {
        // Se nada foi enviado, não é um erro, apenas não há o que fazer.
        await t.rollback();
        return res.status(200).json({ message: "Nenhum dado para atualizar." });
      }

      await t.commit();

      const bancaAtualizada = await Banca.findByPk(id_banca, {
        include: [
          {
            model: Orientacao,
            as: "orientacao",
            attributes: ["id_orientacao"],
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
      await t.rollback();
      console.error("Erro ao atualizar detalhes da banca:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro ao atualizar os detalhes da banca." });
    }
  },

  async salvarConceitoAta(req, res) {
    const t = await sequelize.transaction();
    try {
      const { id_banca } = req.params;
      const { conceito_aprovacao, conceito_final } = req.body;

      if (!conceito_aprovacao || !conceito_final) {
        await t.rollback();
        return res.status(400).json({ error: "Conceitos são obrigatórios." });
      }

      const banca = await Banca.findByPk(id_banca, { transaction: t });
      if (!banca) {
        await t.rollback();
        return res.status(404).json({ error: "Banca não encontrada." });
      }

      await banca.update(
        {
          conceito_aprovacao,
          conceito_final,
        },
        { transaction: t }
      );

      await t.commit();
      res.status(200).json(banca); // Retorna a banca atualizada
    } catch (error) {
      await t.rollback();
      console.error("Erro ao salvar conceito da ata:", error);
      res.status(500).json({ error: "Erro ao salvar conceito da ata." });
    }
  },

  // Função para gerar o PDF da Ata - AJUSTADA PARA RASCUNHO
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

      // Verifica se os dados essenciais (data e local) existem
      if (!banca.data_defesa || !banca.local_defesa) {
        return res.status(400).json({
          error:
            "Dados incompletos para gerar a ata (Data e/ou Local)." +
            " Defina-os antes de baixar.", // Mensagem mais clara
        });
      }

      // Extrai dados para o PDF
      const nomeAluno =
        banca.orientacao?.aluno?.dadosUsuario?.nome || "[Nome Aluno]";
      const tituloProjeto =
        banca.orientacao?.ideiaTcc?.titulo || "[Título Projeto]";
      const curso = banca.orientacao?.aluno?.cursoInfo?.nome || "[Nome Curso]";

      // Usa dayjs para formatar corretamente com fuso horário
      const dataDefesa = dayjs.tz(banca.data_defesa);
      const dia = dataDefesa.format("DD");
      const mes = dataDefesa.format("MMMM");
      const ano = dataDefesa.format("YYYY");
      const hora = dataDefesa.format("HH:mm");

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

      // Usa os conceitos do banco de dados ou placeholders se forem null (para o rascunho)
      const conceitoAprovacao = banca.conceito_aprovacao || null;
      const conceitoFinal = banca.conceito_final || null;
      const isRascunho = !banca.conceito_aprovacao || !banca.conceito_final;

      // Cria o documento PDF
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 72, right: 72 },
      });

      // Configura headers para download
      const filename = `Ata_Defesa_${nomeAluno.replace(/\s+/g, "_")}${
        isRascunho ? "_Rascunho" : ""
      }.pdf`; // Adiciona "_Rascunho" ao nome do arquivo se necessário
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

      // Resultado - Condicionalmente exibe os conceitos ou um placeholder
      doc.text(
        "Após a apresentação e as observações dos referidos professores, ficou definido que o trabalho foi considerado:",
        { align: "justify", lineGap: 4 }
      );
      doc.moveDown(0.5);

      // Mapa de opções
      const opcoesAprovacaoMap = {
        aprovado: "aprovado",
        aprovado_com_ressalvas: "aprovado com ressalvas",
        reprovado: "reprovado",
      };
      const conceitosFinais = ["A", "B", "C", "D"];

      // Se for Rascunho (conceitos não salvos), mostra opções vazias [ ]
      if (isRascunho) {
        doc.font("Helvetica"); // Garante a fonte normal
        doc.fillColor("black"); // Garante a cor normal

        // Mostra opções de aprovação vazias
        for (const [key, value] of Object.entries(opcoesAprovacaoMap)) {
          doc.text(`[  ] ${value}`, { indent: 10 });
        }
        doc.moveDown(0.5);

        doc.text("Com conceito final:", { lineGap: 4 });
        doc.moveDown(0.5);

        // Mostra conceitos finais vazias
        let conceitoText = conceitosFinais
          .map((cf) => `[ ] ${cf}`)
          .join("      "); // Adiciona espaço entre as opções
        doc.text(conceitoText, { indent: 10 });
      } else {
        // Se NÃO for rascunho (conceitos salvos), mostra opções marcadas [X]
        doc.font("Helvetica");
        doc.fillColor("black");

        // Mostra opções de aprovação marcadas
        for (const [key, value] of Object.entries(opcoesAprovacaoMap)) {
          const marcador = conceitoAprovacao === key ? "[X]" : "[ ]";
          doc.text(`${marcador} ${value}`, { indent: 10 });
        }
        doc.moveDown(0.5);

        doc.text("Com conceito final:", { lineGap: 4 });
        doc.moveDown(0.5);

        // Mostra conceitos finais marcados
        let conceitoText = conceitosFinais
          .map((cf) => {
            const marcador = conceitoFinal === cf ? "[X]" : "[  ]";
            return `${marcador} ${cf}`;
          })
          .join("      ");
        doc.text(conceitoText, { indent: 10 });
      }

      doc.moveDown(1.5);

      // Texto Final
      doc.text(
        "Nada mais havendo, eu, presidente da banca, lavrei a presente ata que segue assinada por mim e demais membros.",
        { align: "justify", lineGap: 4 }
      );
      doc.moveDown(3); // Aumenta o espaço antes das assinaturas

      // --- Assinaturas ---
      const assinaturaYInicial = doc.y; // Pega a posição Y atual
      const assinaturaLargura = 180; // Largura de cada bloco de assinatura
      const espacoEntreAssinaturas = 40; // Espaço horizontal entre assinaturas
      const espacoVerticalAssinaturas = 70; // Aumentado de 50 para 70
      const margemEsquerda = doc.page.margins.left;

      // Lista de membros válidos da banca (nome e função)
      const membrosBanca = [
        { nome: orientador, funcao: "(Presidente da Banca)" },
        avaliador1 ? { nome: avaliador1, funcao: "(Avaliador)" } : null,
        avaliador2 ? { nome: avaliador2, funcao: "(Avaliador)" } : null,
        avaliador3 ? { nome: avaliador3, funcao: "(Avaliador)" } : null,
      ].filter(Boolean); // Remove os nulos

      // Calcula posições e desenha assinaturas (tentativa de 2 por linha)
      let currentY = assinaturaYInicial;
      for (let i = 0; i < membrosBanca.length; i++) {
        const membro = membrosBanca[i];
        let currentX;

        // Define a posição X e Y
        if (i % 2 === 0) {
          // Primeira coluna
          currentX = margemEsquerda;
          // Se não for a primeira linha, desce
          if (i > 0) {
            currentY += espacoVerticalAssinaturas; // Usa o espaço vertical maior
          }
        } else {
          // Segunda coluna
          // Ajusta X para a segunda coluna
          currentX =
            margemEsquerda + assinaturaLargura + espacoEntreAssinaturas;
        }

        // Garante que haja espaço suficiente na página, senão adiciona nova página
        // (Considera aproximadamente 3 linhas de texto + margem -> ~55 pontos)
        if (currentY + 55 > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          currentY = doc.page.margins.top; // Começa no topo da nova página
          // Recalcula X para a primeira coluna na nova página
          if (i % 2 === 0) {
            currentX = margemEsquerda;
          } else {
            currentX =
              margemEsquerda + assinaturaLargura + espacoEntreAssinaturas;
          }
        }

        // Desenha a linha, nome e função com mais espaço vertical
        doc.text("___________________________", currentX, currentY, {
          width: assinaturaLargura,
          align: "center",
        });
        doc.text(membro.nome, currentX, currentY + 18, {
          // Aumentado de 15 para 18
          width: assinaturaLargura,
          align: "center",
        });
        doc.text(membro.funcao, currentX, currentY + 36, {
          // Aumentado de 30 para 36
          width: assinaturaLargura,
          align: "center",
        });
      }

      // --- Finaliza o PDF ---
      doc.end();
    } catch (error) {
      console.error("Erro ao gerar PDF da ata:", error);
      // Retorna a mensagem de erro específica vinda do controller
      res.status(500).json({ error: "Erro ao gerar o documento PDF da ata." });
    }
  },

  // MODIFICADO: exportarCalendarioBancas
  exportarCalendarioBancas: async (req, res) => {
    try {
      const bancas = await Banca.findAll({
        include: [
          {
            model: Orientacao,
            as: "orientacao",
            required: true,
            // Adiciona url_projeto
            attributes: ["id_orientacao", "url_projeto"],
            include: [
              {
                model: Aluno,
                as: "aluno",
                attributes: ["id_aluno"],
                include: {
                  model: Usuario,
                  as: "dadosUsuario",
                  attributes: ["nome"],
                },
              },
              {
                model: Professor,
                as: "professor",
                attributes: ["id_professor"],
                include: {
                  model: Usuario,
                  as: "usuario",
                  attributes: ["nome"],
                },
              },
              {
                model: IdeiaTcc,
                as: "ideiaTcc",
                attributes: ["titulo"],
              },
            ],
          },
          {
            model: Professor,
            as: "avaliador1",
            attributes: ["id_professor"],
            include: { model: Usuario, as: "usuario", attributes: ["nome"] },
          },
          {
            model: Professor,
            as: "avaliador2",
            attributes: ["id_professor"],
            include: { model: Usuario, as: "usuario", attributes: ["nome"] },
          },
          {
            model: Professor,
            as: "avaliador3",
            attributes: ["id_professor"],
            include: { model: Usuario, as: "usuario", attributes: ["nome"] },
          },
        ],
        where: {
          data_defesa: { [Op.ne]: null }, // Apenas bancas com data definida
        },
        order: [
          ["data_defesa", "ASC"], // Ordenar por data_defesa
        ],
      });

      if (bancas.length === 0) {
        return res
          .status(404)
          .json({ error: "Nenhuma banca com data definida encontrada." });
      }

      // 1. Agrupar bancas por Data e Hora
      const calendario = new Map(); // Map<string (data), Map<string (hora), Banca[]>>
      const horariosSet = new Set();
      const diasSet = new Set();

      bancas.forEach((banca) => {
        // Pula se não tiver dados de orientação (embora o 'required: true' deva garantir)
        if (!banca.data_defesa || !banca.orientacao) return;

        const dataDefesa = dayjs.tz(banca.data_defesa); // Usa dayjs com timezone
        const diaString = dataDefesa.format("YYYY-MM-DD");
        const horaString = dataDefesa.format("HH:mm");

        diasSet.add(diaString);
        horariosSet.add(horaString);

        if (!calendario.has(diaString)) {
          calendario.set(diaString, new Map());
        }
        if (!calendario.get(diaString).has(horaString)) {
          calendario.get(diaString).set(horaString, []);
        }
        // Adiciona a banca ao slot de data/hora
        calendario.get(diaString).get(horaString).push(banca);
      });

      // Ordena os dias e horários
      const diasOrdenados = Array.from(diasSet).sort();
      const horariosOrdenados = Array.from(horariosSet).sort();

      // 2. Criar o Workbook e Worksheet
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "TCC Match";
      workbook.created = new Date();
      const worksheet = workbook.addWorksheet("Calendário de Bancas");

      // 3. Criar Cabeçalho (Dias da Semana)
      const colunas = [{ header: "Horário", key: "hora", width: 12 }];

      // Adiciona colunas para cada dia
      diasOrdenados.forEach((diaString) => {
        // Formata o cabeçalho do dia (ex: "Segunda - 10/02")
        const diaFormatado = dayjs(diaString).format("dddd - DD/MM");
        colunas.push({ header: diaFormatado, key: diaString, width: 55 }); // Largura maior
      });

      worksheet.columns = colunas;

      // Estilizar o cabeçalho
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
      headerRow.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
      headerRow.height = 40; // Altura maior para o cabeçalho
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4F46E5" }, // Azul/Roxo
        };
      });

      // 4. Adicionar Linhas (Horários e Bancas)
      horariosOrdenados.forEach((horaString) => {
        const rowData = { hora: horaString };

        // *** REMOVIDO: hyperlinksParaAdicionar ***

        diasOrdenados.forEach((diaString) => {
          const bancasDoSlot = calendario.get(diaString)?.get(horaString);

          if (bancasDoSlot && bancasDoSlot.length > 0) {
            const cellRichText = [];

            // *** REMOVIDO: primeiroLinkValido ***

            // Itera sobre todas as bancas naquele slot (caso haja mais de uma)
            bancasDoSlot.forEach((banca, index) => {
              if (index > 0) {
                // Adiciona um separador visual se houver mais de uma banca no mesmo slot
                cellRichText.push({
                  text: "\n\n— — — — — — — —\n\n",
                  font: { color: { argb: "FF888888" } },
                });
              }

              // Extrai os dados da banca
              const orientador =
                banca.orientacao.professor?.usuario?.nome || "N/A";
              const aluno = banca.orientacao.aluno?.dadosUsuario?.nome || "N/A";
              const avaliador1 = banca.avaliador1?.usuario?.nome || "N/A";
              const avaliador2 = banca.avaliador2?.usuario?.nome || "N/A";
              const avaliador3 = banca.avaliador3?.usuario?.nome || "N/A";
              const titulo = banca.orientacao.ideiaTcc?.titulo || "Sem Título";
              const url_projeto = banca.orientacao.url_projeto;

              // Adiciona os textos formatados ao richText
              cellRichText.push(
                {
                  text: `ORIENTADOR(A): ${orientador}\n`,
                  font: { bold: true, size: 10 },
                },
                { text: `Discente: ${aluno}\n`, font: { size: 10 } },
                { text: `BANCA: ${avaliador1}\n`, font: { size: 10 } },
                { text: `BANCA 2: ${avaliador2}\n`, font: { size: 10 } },
                { text: `BANCA 3: ${avaliador3}\n\n`, font: { size: 10 } },
                { text: "Título: ", font: { bold: true, size: 10 } },
                { text: `${titulo}\n`, font: { size: 10 } } // Título como texto normal
              );

              // **CORREÇÃO: Adiciona a URL como texto plano**
              if (
                url_projeto &&
                (url_projeto.startsWith("http://") ||
                  url_projeto.startsWith("https://"))
              ) {
                cellRichText.push(
                  { text: "\nLink Projeto: ", font: { bold: true, size: 10 } },
                  {
                    text: url_projeto,
                    // Adiciona estilo azul e sublinhado para parecer um link
                    font: {
                      color: { argb: "FF0000FF" }, // Azul
                      underline: true,
                      size: 10,
                    },
                  }
                );
              }
            });

            rowData[diaString] = { richText: cellRichText };

            // *** REMOVIDO: Bloco if (primeiroLinkValido) ***
          } else {
            rowData[diaString] = ""; // Vazio se não houver banca
          }
        });

        const row = worksheet.addRow(rowData);

        // *** REMOVIDO: hyperlinksParaAdicionar.forEach ***

        // Estilizar a linha de dados
        row.alignment = {
          vertical: "top",
          horizontal: "left",
          wrapText: true,
        };
        row.getCell("hora").alignment = {
          vertical: "middle",
          horizontal: "center",
        };
        row.getCell("hora").font = { bold: true, size: 11 };

        // Estima a altura da linha
        let maxLines = 1;
        diasOrdenados.forEach((diaString) => {
          const cellValue = row.getCell(diaString).value;
          if (cellValue && cellValue.richText) {
            // Estima o número de linhas baseado em newlines e no N de bancas
            const bancasCount =
              (
                cellValue.richText.filter((rt) => rt.text.includes("— — —")) ||
                []
              ).length + 1;
            // Ajuste na contagem de linhas: conta \n e adiciona linhas estimadas
            const newLines = cellValue.richText.reduce(
              (acc, rt) => acc + (rt.text.split("\n").length - 1),
              0
            );
            // Aumenta a estimativa por banca para 7 (6 linhas de dados + 1 para o link)
            const totalLines = newLines + bancasCount * 7;
            if (totalLines > maxLines) maxLines = totalLines;
          }
        });
        row.height = Math.max(70, maxLines * 12); // Altura mínima de 70, ou 12 por linha estimada
      });

      // 5. Configurar resposta e enviar
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=" + "calendario_bancas.xlsx"
      );

      // Escrever o workbook na resposta
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Erro ao gerar Excel de bancas:", error);
      res.status(500).json({ message: "Erro interno ao gerar arquivo Excel." });
    }
  },
};

module.exports = bancaController;
