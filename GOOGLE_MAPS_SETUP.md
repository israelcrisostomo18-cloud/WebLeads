# Google Maps / Places no WebLeads

Este projeto já está preparado para usar Google Places como fonte premium de busca de empresas, sem remover o fallback gratuito OpenStreetMap.

## APIs usadas pelo WebLeads

- **Places API New**: usada no backend pela rota de busca para pesquisar empresas por nicho, cidade e raio.
- **Geocoding API**: recomendada caso você queira migrar a geocodificação de cidades para Google no futuro. Hoje o projeto usa Nominatim/OpenStreetMap para cidade.
- **Maps JavaScript API**: só será necessária se o mapa visual for migrado para Google Maps no frontend. Hoje o mapa visual usa Leaflet/OpenStreetMap.

## Variáveis de ambiente

Use chaves separadas para frontend e backend.

```env
GOOGLE_MAPS_SERVER_API_KEY=
GOOGLE_PLACES_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

Prioridade no backend:

1. `GOOGLE_MAPS_SERVER_API_KEY`
2. `GOOGLE_PLACES_API_KEY`

Não coloque chave real no código. Configure na Vercel em **Project Settings > Environment Variables**.

## Passo a passo no Google Cloud

1. Crie ou selecione um projeto no Google Cloud Console.
2. Ative o billing do projeto.
3. Ative a **Places API New**.
4. Se for usar Google para geocoding, ative também a **Geocoding API**.
5. Se for trocar o mapa visual para Google, ative também a **Maps JavaScript API**.
6. Crie uma API key para o backend.
7. Restrinja a key do backend por API, permitindo apenas **Places API** e, se necessário, **Geocoding API**.
8. Adicione `GOOGLE_MAPS_SERVER_API_KEY` na Vercel em Production, Preview e Development.
9. Faça redeploy na Vercel.
10. No WebLeads, selecione a fonte **Google Places** e faça uma busca por cidade, nicho e raio.

## Chave frontend

Se futuramente o mapa visual usar Google Maps JavaScript API:

1. Crie uma segunda chave.
2. Configure `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
3. Restrinja por HTTP referrer:
   - `https://webleads-delta.vercel.app/*`
   - URLs de preview da Vercel, se for testar previews.
   - `http://localhost:3000/*` apenas para desenvolvimento.
4. Restrinja por API permitindo somente **Maps JavaScript API**.

## Controle de custo

O WebLeads usa Places Text Search com `X-Goog-FieldMask`, pedindo apenas campos necessários:

- nome
- endereço
- telefone
- website
- coordenadas
- avaliação
- total de avaliações
- URL do Google Maps
- tipos/categoria

O sistema não faz busca automática em loop. A busca acontece quando o usuário clica no botão de buscar. O cache já existente evita repetir a mesma consulta quando Supabase está configurado; o frontend também mantém cache local para buscas por cidade com uma fonte/nicho/raio.

## Erros comuns

- **Billing não ativo**: “Google Maps ainda não está configurado. Verifique a chave de API e o billing no Google Cloud.”
- **Places API não habilitada**: “API do Google Places não está habilitada para este projeto.”
- **Chave inválida**: “Google Places não aceitou a chave de API.”
- **Domínio/API não autorizado**: “Essa chave de API não está autorizada para este domínio ou para esta API.”
- **Cota excedida**: “Cota do Google Places excedida.”

## Status atual

- Busca gratuita com OpenStreetMap: pronta e funcionando.
- Busca premium com Google Places: código pronto, depende da API key e billing.
- Mapa visual: continua em Leaflet/OpenStreetMap.
- Places Details em massa: não implementado de propósito para evitar custo alto.
