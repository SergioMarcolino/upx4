import { Request, Response } from 'express';
import { ReportService } from '../services/reportService';
import PDFDocument from 'pdfkit'; 
import { format, parseISO } from 'date-fns'; 
import { ptBR } from 'date-fns/locale';
import { SaleItem } from '../entities/SaleItem'; 

const reportService = new ReportService();

function generateTableRow(
  doc: PDFKit.PDFDocument,
  y: number, // Posição Y da linha
  c1: string, // Coluna 1 (NF/Data)
  c2: string, // Coluna 2 (Produto)
  c3: string, // Coluna 3 (Qtd)
  c4: string, // Coluna 4 (Vlr. Un.)
  c5: string  // Coluna 5 (Vlr. Total)
) {
  doc.fontSize(8).font('Helvetica');
  doc
    .text(c1, 50, y, { width: 90, lineBreak: false, ellipsis: true }) // Coluna 1 (Data/NF)
    .text(c2, 150, y, { width: 140, lineBreak: false, ellipsis: true }) // Coluna 2 (Produto)
    .text(c3, 300, y, { width: 40, align: 'right' }) // Coluna 3 (Qtd)
    .text(c4, 350, y, { width: 90, align: 'right' }) // Coluna 4 (Vlr. Un.)
    .text(c5, 450, y, { width: 90, align: 'right' }); // Coluna 5 (Vlr. Total)
  
  // Desenha linha horizontal abaixo do texto
  doc.moveTo(50, y + 15).lineTo(550, y + 15).lineWidth(0.5).strokeOpacity(0.5).strokeColor('#ccc').stroke();
}

// --- Função Helper para checar quebra de página ---
function checkPageBreak(doc: PDFKit.PDFDocument, yPosition: number, pageTopMargin: number = 50): number {
    const pageHeight = doc.page.height;
    const bottomMargin = 50; // Margem inferior
    if (yPosition > pageHeight - bottomMargin) {
        doc.addPage(); // Adiciona nova página
        return pageTopMargin; // Retorna a posição Y inicial (topo)
    }
    return yPosition;
}

// --- Controller Principal ---
export const getStockFinancialReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      res.status(400).json({ error: 'Data inválida', message: 'Ano e mês são obrigatórios (1-12).' });
      return;
    }

    // 1. Busca os dados
    const data = await reportService.getReportData(year, month);

    // 2. Configura a resposta HTTP para enviar um arquivo PDF
    const fileName = `Fluxa_Relatorio_Vendas_${data.period.replace('/', '-')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    // 'inline' tenta abrir no browser, 'attachment' força o download
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`); 

    // 3. Cria o Documento PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'portrait' });
    
    // 4. Conecta (pipe) o PDF diretamente na Resposta (stream)
    doc.pipe(res);

    // --- CONTEÚDO DO PDF ---

    // Cabeçalho
    // (Adicione seu logo aqui se tiver o path: doc.image('path/to/logo.png', ...))
    doc.fontSize(18).font('Helvetica-Bold').text('Fluxa ERP', { align: 'center' });
    doc.fontSize(14).font('Helvetica').text('Relatório Mensal de Vendas e Estoque', { align: 'center' });
    doc.fontSize(10).text(`Período de Referência: ${data.period}`, { align: 'center' });
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, { align: 'center' });
    doc.moveDown(2);

    let y = doc.y; // Posição Y atual

    // --- Resumo Financeiro (do Mês) ---
    doc.fontSize(12).font('Helvetica-Bold').text('Resumo Financeiro do Período');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(1).strokeColor('black').stroke();
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    const f = data.financials;
    doc.text(`Receita Bruta: ${f.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
    doc.text(`Custo dos Produtos Vendidos (CMV): ${f.totalCostOfGoods.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
    doc.font('Helvetica-Bold').text(`Lucro Bruto: ${f.grossProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
    doc.font('Helvetica').text(`Total de Vendas Realizadas: ${f.totalSalesCount} vendas`);
    y = doc.y + 20; // Atualiza Y e adiciona margem
    doc.moveDown(2);
    
    // --- Resumo de Estoque (Snapshot Atual) ---
    y = checkPageBreak(doc, y, 50); // Checa se precisa de nova página
    doc.y = y; // Define a posição Y
    doc.fontSize(12).font('Helvetica-Bold').text('Resumo de Estoque (Snapshot Atual)');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(1).strokeColor('black').stroke();
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    const s = data.stock;
    doc.text(`Valor Total do Estoque (a Custo): ${s.totalStockValueCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
    doc.text(`Produtos Ativos: ${s.activeProductCount} itens`);
    doc.font('Helvetica-Bold').fillColor('orange').text(`Produtos com Estoque Baixo (<= 10): ${s.lowStockCount} itens`);
    doc.font('Helvetica-Bold').fillColor('red').text(`Produtos Fora de Estoque (<= 0): ${s.outOfStockCount} itens`);
    doc.fillColor('black'); // Reseta a cor
    y = doc.y + 20;
    doc.moveDown(2);

    // --- Tabela de Vendas Detalhada ---
    y = checkPageBreak(doc, y, 50);
    doc.y = y;
    doc.fontSize(12).font('Helvetica-Bold').text('Itens Vendidos no Período');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(1).strokeColor('black').stroke();
    y = doc.y + 5; // Posição Y inicial da tabela
    doc.moveDown(0.5);

    // Cabeçalho da Tabela
    doc.fontSize(9).font('Helvetica-Bold');
    doc
      .text('NF / Data', 50, y, { width: 90 })
      .text('Produto', 150, y, { width: 140 })
      .text('Qtd', 300, y, { width: 40, align: 'right' })
      .text('Vlr. Unitário', 350, y, { width: 90, align: 'right' })
      .text('Vlr. Total', 450, y, { width: 90, align: 'right' });
    doc.moveTo(50, y + 15).lineTo(550, y + 15).lineWidth(0.5).strokeColor('black').stroke();
    y += 25; // Próxima linha

    // Itens da Tabela
    if (data.salesInPeriod.length === 0) {
        y = checkPageBreak(doc, y, 50);
        doc.fontSize(10).font('Helvetica').text('Nenhuma venda registrada neste período.', 50, y);
    } else {
        for (const sale of data.salesInPeriod) {
          y = checkPageBreak(doc, y, 50);
          
          // Info da Venda (NF)
          doc.fontSize(8).font('Helvetica-Bold');
          // Converte a data (que é Date do TypeORM) para string formatada
          const saleDate = format(sale.createdAt, 'dd/MM/yyyy HH:mm'); 
          doc.text(`Venda #${sale.id} | ${saleDate}`, 50, y);
          y += 15; // Espaço para os itens

          // Garante que 'items' não é nulo/undefined
          if (sale.items) { 
              for (const item of sale.items) {
                y = checkPageBreak(doc, y, 50);
                
                const itemTotal = item.pricePerUnit * item.quantitySold;
                
                // CORREÇÃO: Verifica se item.product existe (pode ser nulo se a relação falhou)
                const productTitle = (item.product && item.product.title) 
                                     ? item.product.title.substring(0, 30) 
                                     : `Produto ID ${item.productId} (Excluído)`;

                generateTableRow(
                  doc, y, '', // Coluna NF/Data fica em branco
                  productTitle, // Nome do produto
                  item.quantitySold.toString(), // Qtd
                  item.pricePerUnit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), // Vlr. Un.
                  itemTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) // Vlr. Total
                );
                y += 20; // Espaçamento da linha
              }
          }
          y += 5; // Espaço extra entre vendas
        }
    }

    // 5. Finaliza o PDF e encerra o stream
    doc.end();

  } catch (error: any) {
    console.error('Erro ao gerar relatório PDF:', error);
    // Se ocorrer um erro ANTES do doc.pipe(res) (ex: no getReportData), envia JSON
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erro interno do servidor', message: 'Não foi possível gerar o relatório.' });
    } else {
      // Se o erro ocorrer DEPOIS do pipe (ex: no meio da geração do PDF),
      // o stream já foi iniciado. O melhor a fazer é destruir o stream/resposta.
      res.end(); // Tenta fechar a conexão
    }
  }
};