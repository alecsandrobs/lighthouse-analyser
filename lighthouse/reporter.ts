import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';
import ReportGenerator from 'lighthouse/report/generator/report-generator';

export class Reporter {

    static extractSize(size: string): string {
        // Regex para capturar o número no formato correto
        const match = size.match(/([\d,.]+)/);
        return match ? match[1].replace(',', '.') : 'N/A'; // Substitui vírgulas por pontos
    }
    
    static async generateReport(folderName: string): Promise<void> {
        const REPORTS_DIR = `./reports/${folderName}`
        const REPORTS_RESULTS_DIR_JSON = REPORTS_DIR + '/json'; // Pasta com os JSONs
        const REPORTS_RESULTS_DIR_HTML = REPORTS_DIR + '/html'; // Pasta com os HTMLs
        const OUTPUT_INDEX = REPORTS_DIR + '/index.html'; // Caminho do arquivo index.html

        if (!fs.existsSync(REPORTS_RESULTS_DIR_HTML)) fs.mkdirSync(REPORTS_RESULTS_DIR_HTML);
        const files = fs.readdirSync(REPORTS_RESULTS_DIR_JSON).filter(file => file.endsWith('.json')); // Filtrar apenas os JSONs
        const summaries = [];

        for (const file of files) {
            const jsonPath = path.join(REPORTS_RESULTS_DIR_JSON, file);
            const htmlPath = path.join(REPORTS_RESULTS_DIR_HTML, file.replace('.json', '.html'));
            const rawData = fs.readFileSync(jsonPath, 'utf-8');
            const jsonData = JSON.parse(rawData);
            await this.generateHTMLReport(jsonData, htmlPath);

            // Coletar os dados para o resumo
            const performance = Math.round((jsonData.categories.performance.score || 0) * 100);
            const accessibility = Math.round((jsonData.categories.accessibility.score || 0) * 100);
            const bestPractices = Math.round((jsonData.categories['best-practices'].score || 0) * 100);
            const seo = Math.round((jsonData.categories.seo.score || 0) * 100);
            const pageSize = ((jsonData.audits['total-byte-weight'].numericValue / 1024) / 1000 || 0).toFixed(3);
            const loadTime = (jsonData.audits['interactive'].numericValue / 1000 || 0).toFixed(1);

            summaries.push({
                fileName: path.basename(htmlPath), // Nome do arquivo HTML
                performance,
                accessibility,
                bestPractices,
                seo,
                pageSize,
                loadTime,
            });
        }

        // Gerar o index.html
        const htmlContent = this.generateIndexHTML(summaries);
        await writeFile(OUTPUT_INDEX, htmlContent);

        console.log(`✅ Relatório principal gerado em: ${OUTPUT_INDEX}`);
    }

    // Função para transformar JSON em HTML
    static async generateHTMLReport(jsonData: any, outputPath: string): Promise<void> {
        const htmlContent = ReportGenerator.generateReport(jsonData, 'html'); // Corrigido: usa o ReportGenerator
        await writeFile(outputPath, htmlContent); // Salva o HTML na pasta
        console.log(`✅ HTML gerado: ${outputPath}`);
    }

    // Função para criar o index.html
    static generateIndexHTML(summaries: any[]) {
        return `
        <!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Performance Report</title>
            <link rel="stylesheet" href="../../lighthouse/style.css">
            </head>
            <body>
            <header>
                Relatório Lighthouse
            </header>
            <main>
                <table>
                <thead>
                    <tr>
                    <th>Página</th>
                    <th>Performance</th>
                    <th>Acessibilidade</th>
                    <th>Melhores práticas</th>
                    <th>SEO</th>
                    <th>Tamanho (KiB)</th>
                    <th>Tempo (segundos)</th>
                    </tr>
                </thead>
                <tbody>
                    ${summaries.map(summary => `
                    <tr>
                    <td><a href="html/${summary.fileName}">${summary.fileName}</a></td>
                    <td class="numeric ${this.getScoreClass(summary.performance)}">${summary.performance}</td>
                    <td class="numeric ${this.getScoreClass(summary.accessibility)}">${summary.accessibility}</td>
                    <td class="numeric ${this.getScoreClass(summary.bestPractices)}">${summary.bestPractices}</td>
                    <td class="numeric ${this.getScoreClass(summary.seo)}">${summary.seo}</td>
                    <td class="numeric">${summary.pageSize}</td>
                    <td class="numeric">${summary.loadTime}</td>
                    </tr>
                `).join('')}
                </tbody>
                </table>
            </main>
            <footer>
                © 2025 by Alecsandro - Powered by Lighthouse
            </footer>
            </body>
            </html>
        `;
    }

    // Classificar os scores
    static getScoreClass(score: number) {
        if (score >= 90) return 'good';
        if (score >= 50) return 'average';
        return 'poor';
    }

}
