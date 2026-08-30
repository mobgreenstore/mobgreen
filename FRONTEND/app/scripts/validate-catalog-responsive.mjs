import puppeteer from "puppeteer-core";

const baseUrl = process.argv[2] ?? "http://localhost:3001/";
const routes = [
  "/",
  "/cart",
  "/checkout",
  "/order-success?reference=MG-2026-CHECK",
];
const widths = [360, 390, 430, 768, 1440];
const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"],
});

let failed = false;

try {
  for (const route of routes) {
    for (const width of widths) {
      const page = await browser.newPage();
      await page.setViewport({
        width,
        height: 1000,
        deviceScaleFactor: 1,
        isMobile: width < 768,
        hasTouch: width < 768,
      });
      await page.goto(new URL(route, baseUrl).toString(), {
        waitUntil: "networkidle0",
      });

      const measurement = await page.evaluate(() => {
        const root = document.documentElement;
        const offenders = Array.from(document.querySelectorAll("*"))
          .map((element) => ({
            element,
            rect: element.getBoundingClientRect(),
          }))
          .filter(
            ({ rect }) => rect.right > root.clientWidth + 1 || rect.left < -1,
          )
          .slice(0, 8)
          .map(({ element }) => {
            const className =
              typeof element.className === "string" ? element.className : "";
            return `${element.tagName.toLowerCase()}.${className}`;
          });

        return {
          innerWidth: window.innerWidth,
          clientWidth: root.clientWidth,
          scrollWidth: root.scrollWidth,
          overflow: root.scrollWidth > root.clientWidth,
          offenders,
        };
      });

      console.log(
        JSON.stringify({
          route,
          requestedWidth: width,
          ...measurement,
        }),
      );
      if (measurement.innerWidth !== width || measurement.overflow) {
        failed = true;
      }
      await page.close();
    }
  }
} finally {
  await browser.close();
}

if (failed) process.exitCode = 1;
