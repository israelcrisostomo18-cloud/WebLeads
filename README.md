# WebLeads

WebLeads é uma plataforma de prospecção local para encontrar empresas por cidade, nicho e raio, visualizar leads em um mapa interno e gerar landing pages profissionais com IA.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- API Routes
- Leaflet + OpenStreetMap
- Overpass API
- Nominatim
- OpenAI API no backend
- Supabase preparado para cache, buscas e sites gerados
- Deploy preparado para Vercel

## Funcionalidades

- Home premium em `/`.
- Mapa de leads em `/mapa`.
- Busca por estado, cidade, nicho e raio.
- Busca manual por clique no mapa.
- Mapa interno com Leaflet/OpenStreetMap.
- Overpass API para encontrar negócios locais.
- Nominatim para localizar cidades.
- Filtro `Somente sem site`.
- Cards de leads com copiar, salvar, ver no mapa, WhatsApp e geração de landing.
- Painel `Meus Leads` com exportação CSV.
- Assistente IA interno para precificação, mensagens e estratégia.
- Rota segura `POST /api/generate-landing` para gerar landing pages com OpenAI.
- Preview/editor de landing dentro do WebLeads.
- Publicação em `/site/[slug]`.

## Variáveis de ambiente

Crie `.env.local` a partir de `.env.example`:

```bash
cp .env.example .env.local
```

Principais variáveis:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000

OPENAI_API_KEY=
OPENAI_LANDING_MODEL=gpt-4.1-mini

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

OVERPASS_API_URL=https://overpass-api.de/api/interpreter
```

`OPENAI_API_KEY` é usada apenas no servidor. Nunca use `NEXT_PUBLIC_OPENAI_API_KEY`.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra:

- Home: `http://localhost:3000`
- Mapa: `http://localhost:3000/mapa`

## Testar mapa

1. Acesse `/mapa`.
2. Escolha `AM`.
3. Escolha `Manaus`.
4. Escolha `barbearia`, `padaria` ou `salão de beleza`.
5. Teste raios `1`, `5`, `10`, `25` e `50 km`.
6. Clique em `Buscar`.

## Testar IA

Sem chave:

1. Clique em `Gerar landing page com IA`.
2. A API deve retornar: `Configuração da IA pendente. Adicione a OPENAI_API_KEY nas variáveis de ambiente.`

Com chave:

1. Configure `OPENAI_API_KEY` em `.env.local`.
2. Reinicie `npm run dev`.
3. Clique em `Gerar landing page com IA`.
4. Edite o preview e clique em `Salvar landing`.

## Subir para GitHub

```bash
git init
git add .
git commit -m "Initial WebLeads project"
git branch -M main
git remote add origin URL_DO_SEU_REPOSITORIO
git push -u origin main
```

Não envie `.env.local` para o GitHub.

## Publicar na Vercel

1. Suba o projeto para o GitHub.
2. Entre na Vercel.
3. Clique em `Add New Project`.
4. Importe o repositório.
5. Adicione as variáveis de ambiente:
   - `NEXT_PUBLIC_APP_URL`
   - `OPENAI_API_KEY`
   - `OPENAI_LANDING_MODEL`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OVERPASS_API_URL`
6. Clique em `Deploy`.

## Build

```bash
npm run build
```

## Segurança

- Não usa Google Maps API.
- Não faz scraping do Google Maps.
- Não expõe chave da OpenAI no frontend.
- Geração de IA retorna JSON estruturado.
- O WebLeads renderiza somente campos seguros.
- A experiência principal acontece dentro do WebLeads.

## Arquivos principais

- `src/app/page.tsx`: home premium.
- `src/app/mapa/page.tsx`: app do mapa de leads.
- `src/components/LeadMapApp.tsx`: mapa, busca, cards, salvos e assistente.
- `src/app/api/osm/search/route.ts`: busca Overpass/Nominatim/cache.
- `src/app/api/generate-landing/route.ts`: geração de landing com OpenAI.
- `src/app/api/generated-sites/route.ts`: salvamento de landing/site.
- `src/app/site/[slug]/page.tsx`: página pública.
- `src/lib/openstreetmap.ts`: Overpass e conversão de leads.
- `src/data/niches.ts`: nichos e filtros OSM.
- `supabase/schema.sql`: estrutura do banco.

## O que ainda pode melhorar

- Adicionar autenticação real por usuário.
- Criar dashboard financeiro de vendas.
- Criar envio real por WhatsApp API.
- Adicionar análise automática de concorrência.
- Criar testes automatizados end-to-end.
