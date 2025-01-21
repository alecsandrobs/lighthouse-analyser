import lighthouse from "lighthouse";
import urlsContent from "../resources/urls.json";
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { launch } from "chrome-launcher";

export class LightHouseWrapper {
  private folderName = new Date().toISOString();
  private reportsDirectory = join(process.cwd(), 'reports');
  private reportFolder = join(this.reportsDirectory, this.folderName);
  private chrome: any;
  private options = {
    logLevel: "info",
    output: "html",
    formFactor: 'desktop',
    screenEmulation: {width: 1920, height: 1080, mobile: false, disabled: false}
  }

  async analysePage(): Promise<void> {
    let urls = await this.getUrls();
    for(const url of urls){
      await this.setup();
      let runnerResult = await lighthouse(url["url"], { port: this.chrome.port, ...this.options });
      await this.generateReport(runnerResult, url["pageName"].trim())
      await this.teardown();
    }
  }

  async setup(): Promise<void> {
    await this.createReportDirectory();
    this.chrome = await launch({ chromeFlags: ["--headless", "--no-sandbox"] });
  }

  async getUrls(): Promise<{}[]> {
    return urlsContent;
  }

  async createReportDirectory(): Promise<void> {
    try {
      if (!existsSync(this.reportsDirectory)) mkdirSync(this.reportsDirectory);
      if (!existsSync(`${this.reportFolder}`)) mkdirSync(`${this.reportFolder}`);
    } catch (err) {
      console.error(err);
    }
  }

  async generateReport(result: any, name: string): Promise<void> {
    let reportHtml = await result.report;
    writeFileSync(`${this.reportFolder}/${name}.html`, reportHtml);
  }

  async teardown(): Promise<void> {
    await this.chrome.kill();
  }

}

new LightHouseWrapper().analysePage()