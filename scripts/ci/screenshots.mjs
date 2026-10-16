// Screenshots da app (CI). Uso: node scripts/ci/screenshots.mjs http://localhost:3000 out/
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const base = process.argv[2] || "http://localhost:3000";
const out = process.argv[3] || "shots";
mkdirSync(out, { recursive: true });

const pages = [
  ["agora", "/"],
  ["estante", "/estante"],
  ["livro", "/estante/the-silent-patient"],
  ["clube", "/clube"],
  ["votar", "/votar/votacao-2027"],
  ["resultados-aberta", "/votar/votacao-2027/resultados"],
  ["resultados-fechada", "/votar/votacao-outono/resultados"],
  ["review", "/review/the-silent-patient"],
  ["gestao", "/gestao"],
  ["404", "/nao-existe"],
];

const viewports = [
  ["mobile", { width: 390, height: 844 }, 3],
  ["desktop", { width: 1440, height: 900 }, 1],
];

const browser = await chromium.launch();
const errors = [];
for (const scheme of ["light", "dark"]) {
  for (const [vname, viewport, scale] of viewports) {
    if (scheme === "dark" && vname === "desktop") continue;
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale === 3 ? 2 : 1, colorScheme: scheme, reducedMotion: "reduce", locale: "pt-PT", timezoneId: "Europe/Lisbon" });
    const page = await ctx.newPage();
    page.on("console", (m) => m.type() === "error" && errors.push(`${vname} ${page.url()}: ${m.text()}`));
    page.on("pageerror", (e) => errors.push(`${vname} ${page.url()}: ${e.message}`));
    for (const [name, path] of pages) {
      if (scheme === "dark" && !["agora", "livro", "votar"].includes(name)) continue;
      await page.goto(base + path, { waitUntil: "networkidle" });
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${out}/${vname}-${scheme}-${name}.png`, fullPage: true });
    }
    // Interação: votar
    if (scheme === "light") {
      await page.goto(base + "/votar/votacao-2027", { waitUntil: "networkidle" });
      const free = page.locator("label:not(.cursor-not-allowed)").filter({ hasText: /Sara/ }).first();
      await free.click();
      await page.getByRole("button", { name: /Continuar/ }).click();
      const adds = page.getByRole("button", { name: /Adicionar à ordem/ });
      await adds.first().click();
      await adds.first().click();
      await adds.first().click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${out}/${vname}-light-votar-ordem.png`, fullPage: true });
    }
    await ctx.close();
  }
}
await browser.close();
console.log(errors.length ? "ERROS DE CONSOLA:\n" + errors.join("\n") : "Sem erros de consola.");
