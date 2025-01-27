import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';
import ReportGenerator from 'lighthouse/report/generator/report-generator';

const REPORTS_DIR = './reports/2025-01-23T11:26:32.100Z'
const REPORTS_RESULTS_DIR_JSON = REPORTS_DIR + '/json'; // Pasta com os JSONs
const REPORTS_RESULTS_DIR_HTML = REPORTS_DIR + '/html'; // Pasta com os HTMLs
const OUTPUT_INDEX = REPORTS_DIR + '/index.html'; // Caminho do arquivo index.html

async function generateReport() {
    if (!fs.existsSync(REPORTS_RESULTS_DIR_HTML)) fs.mkdirSync(REPORTS_RESULTS_DIR_HTML);
    const files = fs.readdirSync(REPORTS_RESULTS_DIR_JSON).filter(file => file.endsWith('.json')); // Filtrar apenas os JSONs
    const summaries = [];

    for (const file of files) {
        const jsonPath = path.join(REPORTS_RESULTS_DIR_JSON, file);
        const htmlPath = path.join(REPORTS_RESULTS_DIR_HTML, file.replace('.json', '.html'));
        const rawData = fs.readFileSync(jsonPath, 'utf-8');
        const jsonData = JSON.parse(rawData);
        await generateHTMLReport(jsonData, htmlPath);

        // Coletar os dados para o resumo
        const performance = Math.round((jsonData.categories.performance.score || 0) * 100);
        const accessibility = Math.round((jsonData.categories.accessibility.score || 0) * 100);
        const seo = Math.round((jsonData.categories.seo.score || 0) * 100);
        const pageSize = jsonData.audits['total-byte-weight'].displayValue || 'N/A';
        const loadTime = jsonData.audits['interactive'].displayValue || 'N/A';

        summaries.push({
        fileName: path.basename(htmlPath), // Nome do arquivo HTML
        performance,
        accessibility,
        seo,
        pageSize,
        loadTime,
        });
    }

    // Gerar o index.html
    const htmlContent = generateIndexHTML(summaries);
    await writeFile(OUTPUT_INDEX, htmlContent);

    console.log(`✅ Relatório principal gerado em: ${OUTPUT_INDEX}`);
    }

    // Função para transformar JSON em HTML
    async function generateHTMLReport(jsonData: any, outputPath: string) {
    const htmlContent = ReportGenerator.generateReport(jsonData, 'html'); // Corrigido: usa o ReportGenerator
    await writeFile(outputPath, htmlContent); // Salva o HTML na pasta
    console.log(`✅ HTML gerado: ${outputPath}`);
    }

    // Função para criar o index.html
    function generateIndexHTML(summaries: any[]) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório Lighthouse</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
        th { background-color: #f4f4f4; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .good { color: green; }
        .average { color: orange; }
        .poor { color: red; }
    </style>
    </head>
    <body>
    <h1>Relatório Lighthouse</h1>
    <table>
        <thead>
        <tr>
            <th>Página</th>
            <th>Performance</th>
            <th>Acessibilidade</th>
            <th>SEO</th>
            <th>Tamanho</th>
            <th>Tempo de Carregamento</th>
        </tr>
        </thead>
        <tbody>
        ${summaries.map(summary => `
            <tr>
            <td><a href="html/${summary.fileName}">${summary.fileName}</a></td>
            <td class="${getScoreClass(summary.performance)}">${summary.performance}</td>
            <td class="${getScoreClass(summary.accessibility)}">${summary.accessibility}</td>
            <td class="${getScoreClass(summary.seo)}">${summary.seo}</td>
            <td>${summary.pageSize}</td>
            <td>${summary.loadTime}</td>
            </tr>
        `).join('')}
        </tbody>
    </table>
    </body>
    </html>
    `;
    }

    // Classificar os scores
    function getScoreClass(score: number) {
    if (score >= 90) return 'good';
    if (score >= 50) return 'average';
    return 'poor';
    }

// Executar
generateReport().catch(err => console.error(err));
