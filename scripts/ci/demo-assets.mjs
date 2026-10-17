// Gera imagens de demonstração (capas, fotos e garrafas) para os screenshots de CI.
import { mkdirSync } from "node:fs";
import sharp from "sharp";

const out = "public/demo";
mkdirSync(out, { recursive: true });

const covers = [
  ["pachinko", "PACHINKO", "Min Jin Lee", "#1f3a5f", "#c8553d"],
  ["silent", "The Silent Patient", "Alex Michaelides", "#2b2d42", "#8d99ae"],
  ["normal", "Normal People", "Sally Rooney", "#6a9fd8", "#f1e9da"],
  ["convenience", "Convenience Store Woman", "Sayaka Murata", "#f7a8c4", "#2d6a4f"],
  ["iq84", "1Q84", "Haruki Murakami", "#0b0b0b", "#e63946"],
  ["blind", "The Blind Assassin", "Margaret Atwood", "#e9d8a6", "#9b2226"],
  ["klara", "Klara and the Sun", "Kazuo Ishiguro", "#ffb703", "#023047"],
  ["cegueira", "Ensaio sobre a Cegueira", "José Saramago", "#f8f9fa", "#212529"],
];

for (const [id, title, author, bg, fg] of covers) {
  const words = title.split(" ");
  const lines = [];
  for (const w of words) {
    const last = lines[lines.length - 1];
    if (last && (last + " " + w).length <= 12) lines[lines.length - 1] = last + " " + w;
    else lines.push(w);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900">
    <rect width="600" height="900" fill="${bg}"/>
    <circle cx="460" cy="680" r="260" fill="${fg}" opacity="0.35"/>
    <rect x="40" y="40" width="520" height="820" fill="none" stroke="${fg}" stroke-width="4" opacity="0.6"/>
    ${lines.map((l, i) => `<text x="70" y="${190 + i * 84}" font-family="DejaVu Serif, serif" font-size="72" font-weight="bold" fill="${fg}">${l}</text>`).join("")}
    <text x="70" y="800" font-family="DejaVu Sans, sans-serif" font-size="34" fill="${fg}">${author}</text>
  </svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toFile(`${out}/cover-${id}.jpg`);
}

const photoColors = [
  ["#3d2c2e", "#d4a373", "#faedcd"],
  ["#283618", "#bc6c25", "#fefae0"],
  ["#14213d", "#fca311", "#e5e5e5"],
  ["#432818", "#99582a", "#ffe6a7"],
];
photoColors.forEach(async ([a, b, c], i) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200">
    <defs><radialGradient id="g" cx="40%" cy="45%" r="70%"><stop offset="0" stop-color="${c}"/><stop offset=".45" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></radialGradient></defs>
    <rect width="1600" height="1200" fill="url(#g)"/>
    <ellipse cx="800" cy="900" rx="700" ry="160" fill="${a}" opacity=".6"/>
    ${[300, 620, 940, 1260].map((x) => `<rect x="${x}" y="560" width="46" height="300" rx="20" fill="${a}" opacity=".8"/><circle cx="${x + 23}" cy="520" r="70" fill="${c}" opacity=".55"/>`).join("")}
  </svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 80 }).toFile(`${out}/photo-${i + 1}.jpg`);
});

const wines = [
  ["peso", "#3a0f1a", "#e9d8a6"],
  ["lan", "#c9b458", "#ffffff"],
  ["gazela", "#9bbf6b", "#f1faee"],
  ["mateus", "#e8a0a8", "#fdf0d5"],
  ["barca", "#1b0b10", "#d4af37"],
];
for (const [id, glass, label] of wines) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="900">
    <path d="M125 20 h50 v210 c0 40 80 80 80 170 v440 c0 25 -15 40 -40 40 h-130 c-25 0 -40 -15 -40 -40 v-440 c0 -90 80 -130 80 -170 z" fill="${glass}"/>
    <rect x="120" y="20" width="60" height="70" rx="6" fill="#2b2b2b"/>
    <rect x="58" y="480" width="184" height="230" rx="8" fill="${label}"/>
    <rect x="80" y="540" width="140" height="14" fill="${glass}" opacity=".7"/>
    <rect x="95" y="575" width="110" height="10" fill="${glass}" opacity=".5"/>
    <path d="M90 300 c10 -40 30 -60 40 -70 v560 h-30 z" fill="#ffffff" opacity=".12"/>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`${out}/wine-${id}.png`);
}

const tones = ["#e2477f", "#3a6ea5", "#2d6a4f", "#c8553d", "#6d597a", "#e9c46a"];
for (let i = 0; i < 6; i++) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="${tones[i]}"/><circle cx="200" cy="160" r="80" fill="#fff" opacity=".85"/><ellipse cx="200" cy="380" rx="150" ry="120" fill="#fff" opacity=".85"/></svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toFile(`${out}/avatar-${i}.jpg`);
}

console.log("Imagens de demonstração geradas em", out);
