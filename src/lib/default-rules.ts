import type { Rules } from "./types";

/** Texto do Regulamento 2026 (PDF original). Fica na BD após o seed e é editável na Gestão. */
export const DEFAULT_RULES: Rules = {
  updatedAt: "2026-08-01T12:00:00.000Z",
  articles: [
    {
      id: "art-1",
      title: "Artigo 1.º · Natureza e propósito",
      body: `O **Santo Terço** é um clube de leitura informal, de participação voluntária, criado para promover a partilha de leituras, ideias, conversas e bitaites entre colegas, num espírito de convívio, curiosidade intelectual e bom humor.

O clube não tem fins lucrativos, não persegue metas de produtividade e recusa expressamente transformar a leitura numa obrigação corporativa.`,
    },
    {
      id: "art-2",
      title: "Artigo 2.º · Periodicidade e compromisso",
      body: `1. O Santo Terço reúne, no mínimo, uma vez por trimestre, assegurando um mínimo de quatro leituras por ano.
2. Esta meta assegura o comprometimento de leitura e o envolvimento de todos os membros, mantendo-se ainda assim atingível, realista e flexível face às agendas ocupadas dos membros.
3. A ausência a uma sessão sem motivo invocado de força maior não implica expulsão direta, mas poderá implicar a disponibilização de espaço para sessão futura, o pagamento simbólico de uma rodada de vinho ou outra bebida socialmente aceitável, a definir pelo Comité de Founders.`,
    },
    {
      id: "art-3",
      title: "Artigo 3.º · Comité de Founders",
      body: `1. O Comité de Founders é composto pelos cinco magníficos fundadores que criaram este ilustre Clube de Leitura numa tarde solarenga de agosto de 2026, após inspiração divina do Santo Terço.
2. O Comité de Founders é o órgão supremo de orientação, mediação e decisão do clube.
3. Em caso de disputa na escolha de um livro, na definição do local da próxima sessão ou em quaisquer outros quóruns necessários, a decisão do Comité de Founders é soberana.
4. As decisões do Comité de Founders deverão ser tomadas com ponderação, bom senso e, sempre que possível, um copo na mão.`,
    },
    {
      id: "art-4",
      title: "Artigo 4.º · Seleção do próximo livro",
      body: `1. A regra de seleção do próximo livro segue os mais rigorosos critérios de participação democrática e seleção estatística, auditados pela competente equipa de Data.
2. Cada membro propõe o mesmo número de livros.
3. Cada membro ordena até $k = 15$ livros propostos, atribuindo a posição $r_i(b)$, em que 1 corresponde ao livro favorito.

**Definições**

- $M$ = número de membros ($i = 1 \\ldots M$)
- $L$ = conjunto de livros propostos
- $r_i(b)$ = posição que o membro $i$ atribui ao livro $b$
- $k$ = número de livros que cada membro ordena ($k = 15$)

**Pontuação**

Os pontos atribuídos pelo membro $i$ ao livro $b$ são:

$$p_i(b) = \\max(0,\\ k + 1 - r_i(b))$$

Assim, o 1.º lugar vale 15 pontos, o 2.º lugar 14 pontos, e assim sucessivamente até ao 15.º lugar, que vale 1 ponto.

A pontuação total de cada livro é:

$$S(b) = \\sum_{i=1}^{M} p_i(b)$$

O próximo livro é:

$$b^* = \\arg\\max_{b \\in L} S(b)$$

**Desempate**

1. Em caso de empate, ganha o livro com maior número de primeiros lugares.
2. Se persistir o empate, o Comité de Founders poderá intervir para escolher o livro com maior potencial de análise, reflexão e bitaites na próxima sessão.
3. Se o desacordo persistir, realizar-se-á um sorteio por moeda ao ar, com cara ou coroa.`,
    },
    {
      id: "art-5",
      title: "Artigo 5.º · Participação e boas práticas",
      body: `1. Todos os membros são encorajados a participar nas discussões, independentemente de terem terminado, começado, abandonado ou meramente folheado o livro em questão.
2. O clube valoriza opiniões divergentes, desde que expressas com respeito, humor e ausência de spoilers.
3. É proibido usar a sessão para transformar o clube num comité de projeto, reunião de alinhamento estratégico ou espaço de resolução de pendências profissionais, salvo por decisão unânime e sob forte protesto dos restantes membros.`,
    },
    {
      id: "art-6",
      title: "Artigo 6.º · Cláusula de preservação do espírito",
      body: `1. Nenhum membro poderá reivindicar a propriedade exclusiva do Santo Terço, do seu nome, do seu método de seleção ou da sua inspiração divina.
2. Qualquer alteração a este Regulamento deverá ser proposta por escrito, discutida em sessão e aprovada pelo Comité de Founders, preferencialmente acompanhada de petiscos.`,
    },
    {
      id: "art-7",
      title: "Artigo 7.º · Cláusula de resiliência",
      body: `1. Em caso de indisponibilidade temporária de um ou mais membros, o Santo Terço continuará a reunir-se, demonstrando a sua resiliência institucional e o seu compromisso com a leitura.
2. Se, excecionalmente, não for possível reunir presencialmente, a sessão poderá realizar-se por videochamada, desde que com câmara ligada e uma bebida adequada à ocasião.`,
    },
  ],
};

export const SEED_MEMBERS: { name: string; founder: boolean }[] = [
  { name: "Benedita Azevedo", founder: true },
  { name: "Bernardo Martinho", founder: true },
  { name: "Gonçalo Martins Barbosa", founder: true },
  { name: "Pedro Pinheiro", founder: true },
  { name: "Sofia Rocha", founder: true },
  { name: "Ângela Prego", founder: false },
  { name: "Bruno Justa", founder: false },
  { name: "Carla Costa", founder: false },
  { name: "Daniela Falcão", founder: false },
  { name: "Inês Carola", founder: false },
  { name: "Janine Alves", founder: false },
  { name: "Olena Shevchuk", founder: false },
  { name: "Rita Barracosa", founder: false },
  { name: "Sara Mendes", founder: false },
  { name: "Sara Pinto", founder: false },
  { name: "Tiago Costa", founder: false },
];
