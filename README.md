# Santo Terço Book Club

App do clube de leitura Santo Terço (Sogrape): o próximo livro com countdown até ao jantar, a estante dos livros lidos com média do clube, os vinhos bebidos, o regulamento e as votações do Art. 4.º.

- **Parte pública** sem login (`/`, `/estante`, `/vinhos`, `/clube`, `/votar/[id]`, `/review/[id]`), marcada como `noindex`.
- **Gestão** em `/gestao`, com login Google restrito a contas `@sogrape.pt` que estejam na lista de admins.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS 4, Firebase (Firestore numa base de dados própria, Storage e Auth), Vercel.

## Segurança, em resumo

- O browser **nunca** fala com o Firestore. Toda a leitura e escrita passa pelo servidor Next.js (Admin SDK), por isso `firestore.rules` fecha todo o acesso direto.
- Votos e reviews públicos passam por server actions que validam: votação aberta, membro ativo, um boletim por membro, ordenação válida (1 a k livros da votação). Os boletins nunca são devolvidos a ninguém, nem à Gestão.
- Ações da Gestão exigem um ID token Firebase válido, email verificado `@sogrape.pt` e presença na lista de admins (`config/admins` ou `ADMIN_BOOTSTRAP_EMAILS`).
- Imagens são comprimidas no browser e gravadas pelo servidor em `santo-terco-bookclub-prod/` no bucket, com URL de download por token. Não é preciso mexer nas regras do Storage do projeto.

## Modelo de dados (base `santo-terco-bookclub-prod`)

| Coleção | Documento | Notas |
| --- | --- | --- |
| `members` | `{name, founder, active, rodadas[]}` | rodadas do Art. 2.3, atribuídas à mão |
| `books` | `{title, author, status, proposedBy, dinnerAt, dinnerPlace, readAt, attendees[], photos[], cover}` | `status`: fila, votacao, proximo, lido. `dinnerAt` é também a data limite de leitura |
| `reviews` | id `${bookId}_${memberId}` | rating 0,25 a 5 em passos de 0,25 |
| `wines` | `{name, image, bookId}` | só aparecem na app se estiverem ligados a um jantar |
| `polls` | `{title, status, bookIds, k, closesAt, voterIds, result}` | `result` guarda S(b), primeiros lugares e desempate |
| `ballots` | id `${pollId}_${memberId}` | nunca expostos |
| `config/regulamento` | `{articles[], updatedAt}` | editável na Gestão |
| `config/admins` | `{emails[]}` | |

## Configuração (uma vez)

1. **Firebase** (projeto `sogrape-ai-studio`, base `santo-terco-bookclub-prod` já criada):
   - Authentication: ativar o fornecedor **Google** (se ainda não estiver) e, em *Settings > Authorized domains*, acrescentar o domínio do Vercel (por exemplo `santo-terco.vercel.app`).
   - Project settings > General: copiar a configuração da app Web (apiKey, appId).
   - Project settings > Service accounts: gerar uma chave. Codificar em base64: `base64 -i chave.json | tr -d '\n'`.
   - Recomendado: usar uma service account dedicada em vez da chave de admin geral, com os papéis *Cloud Datastore User* (com condição IAM `resource.name.startsWith("projects/sogrape-ai-studio/databases/santo-terco-bookclub-prod")`), *Storage Object Admin* limitado ao bucket e *Firebase Authentication Viewer* (para validar tokens). Assim a chave no Vercel não dá acesso aos dados do AI Studio.
2. **Regras do Firestore** só desta base:
   ```bash
   npx firebase-tools deploy --only firestore --project sogrape-ai-studio
   ```
   O `firebase.json` aponta apenas para a base `santo-terco-bookclub-prod`; as regras da base do AI Studio não são tocadas.
3. **Vercel**: importar o repo e definir as variáveis do `.env.example`.
4. **Seed** (16 membros do Anexo I, regulamento 2026, admin inicial):
   ```bash
   cp .env.example .env.local   # preencher
   npm install
   npm run seed
   ```

## Desenvolvimento

```bash
npm install
npm run dev
```

## Fluxo do clube

1. **Propostas**: o admin junta os livros na fila (aba Livros, com pesquisa Google Books / Open Library) ou diretamente ao preparar a votação.
2. **Votação**: aba Votações, escolher os livros e a data de fecho, abrir, copiar o link e partilhar no grupo. Cada membro escolhe o seu nome e ordena até k livros.
3. **Fecho**: automático na data ou manual. Se houver empate depois dos primeiros lugares, o Comité decide ou lança-se a moeda (registada no servidor e reproduzida na página de resultados).
4. **Próximo livro**: promover o vencedor com a data e o local do jantar. A página inicial mostra o terço com a capa e o countdown.
5. **Jantar**: marcar como lido, registar presenças, fotos e vinhos, e partilhar o link das reviews.
