/** Dados de demonstração para o emulador (só CI). Nunca correr contra produção. */
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { DEFAULT_RULES, SEED_MEMBERS } from "../../src/lib/default-rules";
import { slugify } from "../../src/lib/format";
import { computeResult } from "../../src/lib/voting";

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error("Este script só corre contra o emulador.");
  process.exit(1);
}

const db = getFirestore(initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID }), process.env.FIREBASE_DATABASE_ID!);
const now = Date.now();
const iso = (days: number, hour = 20) => {
  const d = new Date(now + days * 86400000);
  d.setUTCHours(hour - 1, 0, 0, 0);
  return d.toISOString();
};
const img = (name: string) => ({ path: `demo/${name}`, url: `/demo/${name}`, width: null, height: null });

async function main() {
  const ids = SEED_MEMBERS.map((m) => slugify(m.name));
  const batch = db.batch();
  SEED_MEMBERS.forEach((m, i) =>
    batch.set(db.collection("members").doc(ids[i]), {
      ...m,
      active: true,
      rodadas: i === 3 ? [{ id: "r1", motivo: "Faltou ao jantar de setembro", data: "2026-09-20", paga: false }] : [],
      createdAt: new Date().toISOString(),
    }),
  );
  batch.set(db.collection("config").doc("regulamento"), DEFAULT_RULES);
  batch.set(db.collection("config").doc("admins"), { emails: ["bruno.justa@sogrape.pt"] });

  const books = [
    { id: "pachinko", title: "Pachinko", author: "Min Jin Lee", year: 2017, pages: 496, status: "proximo", proposedBy: ids[13], dinnerAt: iso(41), dinnerPlace: "Casa do Bernardo, Vila Nova de Gaia", cover: img("cover-pachinko.jpg") },
    { id: "the-silent-patient", title: "The Silent Patient", author: "Alex Michaelides", year: 2019, pages: 336, status: "lido", proposedBy: ids[4], dinnerAt: iso(-1), readAt: iso(-1), dinnerPlace: "Casa da Sofia Rocha", cover: img("cover-silent.jpg"), photos: [img("photo-1.jpg"), img("photo-2.jpg"), img("photo-3.jpg")], attendees: ids.slice(0, 11) },
    { id: "normal-people", title: "Normal People", author: "Sally Rooney", year: 2018, pages: 288, status: "lido", proposedBy: ids[0], dinnerAt: iso(-90), readAt: iso(-90), dinnerPlace: "Taberna do Largo, Porto", cover: img("cover-normal.jpg"), photos: [img("photo-4.jpg")], attendees: ids.slice(2, 14) },
    { id: "convenience-store-woman", title: "Convenience Store Woman", author: "Sayaka Murata", year: 2016, pages: 176, status: "lido", proposedBy: ids[9], dinnerAt: iso(-180), readAt: iso(-180), dinnerPlace: "Quinta da Aveleda", cover: img("cover-convenience.jpg"), photos: [], attendees: ids.slice(0, 9) },
    { id: "1q84", title: "1Q84", author: "Haruki Murakami", status: "votacao", proposedBy: ids[1], cover: img("cover-iq84.jpg"), pages: 928 },
    { id: "the-blind-assassin", title: "The Blind Assassin", author: "Margaret Atwood", status: "votacao", proposedBy: ids[2], cover: img("cover-blind.jpg"), pages: 521 },
    { id: "klara", title: "Klara and the Sun", author: "Kazuo Ishiguro", status: "votacao", proposedBy: ids[6], cover: img("cover-klara.jpg"), pages: 303 },
    { id: "cegueira", title: "Ensaio sobre a Cegueira", author: "José Saramago", status: "votacao", proposedBy: ids[7], cover: img("cover-cegueira.jpg"), pages: 310 },
  ];
  for (const b of books) {
    const { id, ...rest } = b;
    batch.set(db.collection("books").doc(id), {
      synopsis: "Uma saga familiar que atravessa gerações, entre a Coreia e o Japão, sobre pertença, sacrifício e a teimosia de sobreviver.",
      isbn: "",
      year: null,
      photos: [],
      attendees: [],
      readAt: null,
      dinnerAt: null,
      dinnerPlace: "",
      createdAt: iso(-200),
      updatedAt: iso(-1),
      ...rest,
    });
  }

  const ratings: Record<string, number[]> = {
    "the-silent-patient": [3, 2.5, 2.75, 3.5, 1.75, 2, 3.25, 2.5, 3, 2.25, 3],
    "normal-people": [4, 3.5, 4.25, 3, 4.5, 3.75],
    "convenience-store-woman": [4.5, 4.75, 4, 5, 3.75],
  };
  const texts = [
    "O twist salva o livro, mas só ao terceiro copo é que percebi porquê.",
    "Li em dois dias. Não sei se por ser bom ou por ser curto.",
    "Personagens irritantes, discussão excelente. Missão cumprida.",
    "",
  ];
  for (const [bookId, rs] of Object.entries(ratings)) {
    rs.forEach((rating, i) =>
      batch.set(db.collection("reviews").doc(`${bookId}_${ids[i]}`), {
        bookId,
        memberId: ids[i],
        rating,
        text: texts[i % texts.length],
        source: i % 3 === 0 ? "admin" : "membro",
        createdAt: iso(-1),
        updatedAt: iso(-1),
      }),
    );
  }

  const wines = [
    ["Herdade do Peso Trinca Bolotas", "wine-peso.png", "the-silent-patient"],
    ["LAN Verdejo", "wine-lan.png", "the-silent-patient"],
    ["Gazela Vinho Verde", "wine-gazela.png", "the-silent-patient"],
    ["Mateus Rosé", "wine-mateus.png", "normal-people"],
    ["Barca Velha", "wine-barca.png", "normal-people"],
  ];
  wines.forEach(([name, file, bookId], i) =>
    batch.set(db.collection("wines").doc(`w${i}`), { name, image: img(file), bookId, createdAt: iso(-i) }),
  );

  // Votação aberta
  const pollBooks = ["1q84", "the-blind-assassin", "klara", "cegueira"];
  batch.set(db.collection("polls").doc("votacao-2027"), {
    title: "Votação do 1.º trimestre",
    status: "aberta",
    bookIds: pollBooks,
    k: 15,
    closesAt: iso(9, 23),
    voterIds: ids.slice(0, 6),
    result: null,
    promotedBookId: null,
    createdAt: iso(-3),
    openedAt: iso(-3),
    closedAt: null,
  });
  ids.slice(0, 6).forEach((m, i) =>
    batch.set(db.collection("ballots").doc(`votacao-2027_${m}`), {
      pollId: "votacao-2027",
      memberId: m,
      ranking: i % 2 ? [...pollBooks].reverse() : pollBooks,
      createdAt: iso(-2),
    }),
  );

  // Votação fechada com empate resolvido por moeda
  const closedBooks = ["pachinko", "normal-people", "convenience-store-woman"];
  const ballots = [
    ["pachinko", "normal-people", "convenience-store-woman"],
    ["normal-people", "pachinko", "convenience-store-woman"],
    ["convenience-store-woman", "pachinko", "normal-people"],
    ["pachinko", "convenience-store-woman", "normal-people"],
    ["normal-people", "convenience-store-woman", "pachinko"],
  ];
  const result = computeResult(closedBooks, ballots, 15);
  batch.set(db.collection("polls").doc("votacao-outono"), {
    title: "Votação de outono",
    status: "fechada",
    bookIds: closedBooks,
    k: 15,
    closesAt: iso(-20),
    voterIds: ids.slice(0, 5),
    result: result.winnerId
      ? result
      : { ...result, winnerId: result.tiedIds[0], method: "moeda", coin: { cara: result.tiedIds[0], coroa: result.tiedIds[1], outcome: "cara" } },
    promotedBookId: "pachinko",
    createdAt: iso(-30),
    openedAt: iso(-30),
    closedAt: iso(-20),
  });

  await batch.commit();
  console.log("Dados de demonstração carregados.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
