# Plano de Software — Sistema de Aluguéis (Tijucas Imobiliária)

Com a autenticação já pronta, o restante do projeto pode ser dividido em módulos. A estratégia é desenvolver primeiro o **núcleo** (imóveis, clientes, contratos e geração de pagamentos) e depois as funcionalidades de apoio (pagamentos online, notificações e relatórios).

> **Como este documento está organizado:** primeiro a stack real e as convenções; depois as Etapas 1–10 (banco → API → fluxos → automações → segurança); por fim, a preparação da integração do front, testes/deploy e o roadmap.

---

## Visão geral & stack real

Este repositório (`sistema-alugueis`) é **somente o front-end**. Ele consome uma API externa via `VITE_BACKEND_URL` (hoje `http://localhost:3000`). O back-end é um projeto separado.

### Front-end (o que já existe)

- **React 19** + **Vite 8**
- **MUI 9** (`@mui/material`, `@mui/icons-material`) como biblioteca de componentes
- **styled-components** nos arquivos `styles.js` (obs.: `@emotion` também está presente por ser o motor do MUI — ver "Dívidas técnicas")
- **react-router-dom 7** para rotas
- **axios** para HTTP (`src/services/api.js`)
- Estado via **React Context**: `AuthContext` (sessão) e `ModalContext` (feedback `showModal({ title, message, type })`)
- **Ainda não há**: biblioteca de estado de servidor (react-query/zustand), biblioteca de formulários (react-hook-form/formik) nem testes

### Back-end (a construir)

- **Node.js + Express**
- **JWT** (autenticação — já implementada)
- **Nodemailer** (e-mails de verificação e notificações)
- **PostgreSQL** via **Supabase**

---

## Convenções (padrões do projeto)

Para acabar com a mistura de nomes que existe hoje (`fullName` no Register, `nome`/`telefone` no back, `rent_price` nas telas), adotamos um contrato único:

| Camada | Padrão | Exemplo |
|---|---|---|
| Banco (PostgreSQL) | `snake_case` em **inglês** | `full_name`, `rent_price`, `due_day` |
| JSON da API | `camelCase` em **inglês** | `fullName`, `rentPrice`, `dueDay` |
| Rótulos exibidos na tela | **Português** | "Nome completo", "Valor do aluguel" |

**Regras gerais**

- **Enums** guardados em valores canônicos em inglês, traduzidos só na exibição:
  - `role`: `ADMIN` | `CORRETOR` | `CLIENTE`
  - `property.status`: `AVAILABLE` | `RENTED` | `INACTIVE`
  - `lease.status`: `ACTIVE` | `ENDED` | `CANCELED`
  - `payment.status`: `PENDING` | `PAID` | `OVERDUE` | `CANCELED`
  - `payment.method`: `PIX` | `BOLETO` | `CASH` | `TRANSFER`
  - `person_type`: `PF` | `PJ`
- **Dinheiro**: `NUMERIC(12,2)` (nunca `float`). No front, formatar com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- **Datas**: `DATE`/`TIMESTAMPTZ`; trafegar em ISO 8601 (`YYYY-MM-DD`).
- **Auditoria de linha**: toda tabela tem `created_at` e `updated_at`.
- **Soft-delete**: tabelas com valor legal/financeiro (`properties`, `leases`, `payments`) usam `deleted_at` em vez de exclusão física.

### Mapeamento PT → EN (o back-end atual ainda responde em português)

O `AuthContext` já traduz o `userData` do login. Padronizar a API para inglês; enquanto isso não acontece, esta é a tabela de-para:

| Back-end atual (PT) | Contrato canônico (EN) |
|---|---|
| `nome` | `name` |
| `telefone` | `phone` |
| `perfil` | `role` |
| `cep` | `zipCode` |
| `uf` | `state` |
| `cidade` | `city` |
| `bairro` | `neighborhood` |
| `rua` | `street` |
| `numero` | `number` |
| `complemento` | `complement` |

---

# Etapa 1 — Modelagem do Banco de Dados

## users

Existem **três perfis** (`ADMIN`, `CORRETOR`, `CLIENTE`), distinguidos pela coluna `role` (o back-end já envia isso em `userData.perfil`). A tela de cadastro já coleta pessoa física/jurídica, documento, RG e nascimento — o modelo precisa refletir isso.

```sql
users
-----
id
name
email
password           -- hash (bcrypt/argon2), nunca texto puro
phone
person_type        -- PF | PJ
document            -- CPF (PF) ou CNPJ (PJ)
rg                  -- opcional, só PF
birth_date          -- só PF
role               -- ADMIN | CORRETOR | CLIENTE
email_verified_at  -- fluxo de verificação por código já existe
-- endereço
zip_code
state
city
neighborhood
street
number
complement
created_at
updated_at
deleted_at
```

> **Fluxo de verificação por e-mail (já implementado):** no cadastro o back-end cria a conta e envia um código; o usuário confirma em `/verify-code`. Enquanto `email_verified_at` for nulo, a conta é considerada não verificada.

## owners (proprietários / locadores)

O negócio tem **três partes**: a **imobiliária/corretor** (quem administra), o **proprietário/locador** (dono do imóvel) e o **cliente/inquilino** (quem aluga). A tela de Imóveis já referencia `owner_id`, então o proprietário precisa existir no modelo.

**Recomendação:** modelar o proprietário como uma tabela `owners` própria (nem todo proprietário terá login no sistema; muitas vezes é só um cadastro para vincular ao imóvel e repassar valores). Se no futuro os proprietários também acessarem o sistema, promover para `users` com um `role = OWNER`.

```sql
owners
------
id
name
email
phone
person_type        -- PF | PJ
document
bank_details        -- dados para repasse (jsonb) — opcional
created_at
updated_at
deleted_at
```

## properties (imóveis)

```sql
properties
----------
id
owner_id           -- FK -> owners  (proprietário/locador)
broker_id          -- FK -> users (CORRETOR/ADMIN responsável)
title
description
property_type       -- APARTMENT | HOUSE | COMMERCIAL | LAND ...
address (street)
number
complement
neighborhood (district)
city
state
zip_code
bedrooms
bathrooms
area_m2
rent_price          -- NUMERIC(12,2)
status             -- AVAILABLE | RENTED | INACTIVE
created_at
updated_at
deleted_at
```

## leases (contratos de aluguel)

É a tabela mais importante. Além do básico, contratos de locação no Brasil têm caução, fiador, índice de reajuste e multa/juros por atraso.

```sql
leases
------
id
property_id
client_id           -- FK -> users (CLIENTE / inquilino)
broker_id           -- FK -> users (CORRETOR/ADMIN)
start_date
end_date
monthly_rent        -- NUMERIC(12,2)
due_day             -- dia do vencimento (1..31)
deposit             -- caução (NUMERIC)
guarantor_name       -- fiador (opcional)
guarantor_document
readjustment_index   -- IGPM | IPCA | NONE
readjustment_date    -- próximo reajuste
late_fee_percent      -- multa por atraso (ex.: 2%)
interest_percent      -- juros de mora ao mês (ex.: 1%)
contract_document_id  -- FK -> documents (PDF do contrato)
status             -- ACTIVE | ENDED | CANCELED
created_at
updated_at
deleted_at
```

## payments (pagamentos)

```sql
payments
--------
id
lease_id
reference_month     -- competência (DATE, ex.: 2026-01-01)
due_date
payment_date        -- preenchido ao pagar
amount             -- valor base (NUMERIC)
late_fee            -- multa aplicada (NUMERIC)
interest            -- juros aplicados (NUMERIC)
paid_amount         -- total efetivamente pago
status             -- PENDING | PAID | OVERDUE | CANCELED
payment_method      -- PIX | BOLETO | CASH | TRANSFER
receipt_url         -- comprovante (Supabase Storage)
gateway_external_id -- id da cobrança no gateway (se houver)
created_at
updated_at
```

## documents

```sql
documents
---------
id
lease_id
name
url                -- Supabase Storage
type               -- CONTRACT | INSPECTION | RECEIPT | OTHER
mime_type
size
uploaded_by         -- FK -> users
created_at
```

## notifications

```sql
notifications
-------------
id
user_id
type               -- DUE_SOON | OVERDUE | PAYMENT_CONFIRMED | LEASE_ENDING ...
title
message
read_at            -- nulo enquanto não lida
created_at
```

---

# Etapa 2 — Perfis e permissões

Três perfis via `role`. `ADMIN` e `CORRETOR` compartilham a operação; `ADMIN` ainda gerencia usuários. `CLIENTE` só enxerga o que é seu.

| Ação | ADMIN | CORRETOR | CLIENTE |
|---|:---:|:---:|:---:|
| Gerenciar usuários/corretores | ✅ | ❌ | ❌ |
| CRUD de imóveis | ✅ | ✅ | ❌ |
| CRUD de proprietários | ✅ | ✅ | ❌ |
| Cadastrar/ver clientes | ✅ | ✅ | ❌ |
| CRUD de contratos | ✅ | ✅ | ❌ |
| Ver todos os pagamentos | ✅ | ✅ | ❌ |
| Ver **seus** contratos/pagamentos | ✅ | ✅ | ✅ |
| Pagar aluguel | ❌ | ❌ | ✅ |
| Baixar comprovante | ✅ | ✅ | ✅ (seus) |
| Editar dados pessoais próprios | ✅ | ✅ | ✅ |

---

# Etapa 3 — Estrutura da API

**Convenções da API**: JSON em camelCase; erros no formato `{ "message": "..." }` (o front já lê `error.response?.data?.message` no `ModalContext`); listas com paginação (`?page=&pageSize=`) e filtros (`?status=&search=`); status codes REST (200/201/400/401/403/404/422).

## Autenticação (já implementada — documentada aqui como contrato)

```
POST /login
  body: { email, password }
  200 -> { userData, token }

PUT  /register/save-account
  body: { fullName, email, phone, document, personType, password,
          rg?, dataNascimento? }   -- rg/dataNascimento só quando personType = PF
  200 -> { user: { id, email } }

POST /register/verify-code          body: { code, userId, email }  -> { token }
POST /register/resend-verify-code   body: { email, userId }
POST /forgot-password/send-code     body: { email }
POST /reset-password                body: { email, code, newPassword }
```

> **Ajustes recomendados no contrato de auth:** parar de enviar `confirmPassword` ao back-end (validar só no front) e padronizar o `userData` do `/login` para inglês (ver tabela PT→EN).

## Usuários (somente ADMIN em listagem)

```
GET    /users            -- ADMIN
GET    /users/:id
PUT    /users/:id
DELETE /users/:id        -- soft-delete
```

## Proprietários

```
GET    /owners
POST   /owners
PUT    /owners/:id
DELETE /owners/:id
```

## Imóveis

```
GET    /properties          -- filtros: status, city, search; paginado
GET    /properties/:id
POST   /properties
PUT    /properties/:id
DELETE /properties/:id      -- soft-delete
```

## Contratos

```
GET    /leases
GET    /leases/:id
POST   /leases              -- dispara geração automática das parcelas (Etapa 5)
PUT    /leases/:id
DELETE /leases/:id          -- soft-delete
```

## Pagamentos

```
GET    /payments            -- filtros: leaseId, status, month
GET    /payments/:id
POST   /payments
PUT    /payments/:id
```

## Área do cliente

```
GET  /my-leases
GET  /my-payments
POST /pay/:paymentId        -- inicia/registra pagamento; retorna comprovante/URL do gateway
```

---

# Etapa 4 — Fluxo principal

## O corretor

```text
Login → Cadastrar proprietário → Cadastrar imóvel → Cadastrar cliente
      → Criar contrato → (sistema gera automaticamente os pagamentos)
```

## O cliente

```text
Cadastro → Verificação por e-mail → Login → Visualiza contratos
        → Visualiza aluguel do mês → Efetua pagamento → Recebe comprovante
```

---

# Etapa 5 — Geração automática dos pagamentos

Ao **criar um contrato**, o sistema gera uma parcela `PENDING` por mês, do início ao fim, no `due_day` escolhido.

```text
Início: 01/01/2026   Fim: 31/12/2026   Vencimento: dia 10
→ gera 10/01, 10/02, 10/03, ... , 10/12   (todas PENDING)
```

**Cuidados de implementação**

- Gerar **dentro de uma transação** junto com a criação do contrato (tudo ou nada).
- **Idempotência**: não duplicar parcelas se a criação for reprocessada.
- **Edição do contrato** (mudança de datas/valor): regenerar apenas as parcelas **futuras que ainda estão `PENDING`**, preservando as já pagas.
- **Proração** do 1º/último mês quando o contrato não começa no dia 1 (opcional para o MVP).

---

# Etapa 6 — Dashboard

Cada métrica corresponde a uma query real (não mais mock — hoje a Home usa dados fixos).

## Corretor / Admin

- Total de imóveis · Imóveis alugados · Imóveis disponíveis
- Aluguéis vencidos (`OVERDUE`) · Aluguéis pagos no mês
- Valor recebido no mês · Valor pendente

## Cliente

- Próximo aluguel (valor + vencimento) · Histórico de pagamentos
- Contrato vigente · Comprovantes

---

# Etapa 7 — Upload de documentos

O corretor anexa contrato (PDF), vistoria e outros documentos ao contrato/lease.

- Armazenar em **Supabase Storage**; salvar a URL em `documents`.
- Servir via **URL assinada** (acesso controlado, não público).
- Validar **mime_type** e **tamanho** no upload.

(Estrutura da tabela `documents` na Etapa 1.)

---

# Etapa 8 — Notificações (com o motor descrito)

As notificações e a transição `PENDING → OVERDUE` **não acontecem sozinhas** — exigem um **job agendado**.

**Mecanismo**: um agendador (`node-cron` no back Express, ou **pg_cron / Edge Functions** no Supabase) roda diariamente e:

1. Marca como `OVERDUE` toda parcela `PENDING` com `due_date` no passado.
2. Envia e-mails via **Nodemailer**:
   - Cliente: "aluguel vence em 5 dias", "aluguel venceu", "pagamento confirmado"
   - Corretor: "cliente pagou", "contrato encerrando"
3. Grava cada evento em `notifications` (para exibir um sino/inbox no front).

---

# Etapa 9 — Relatórios

Para o corretor (queries agregadas):

- Pagamentos por mês · Inadimplência · Imóveis ocupados × livres · Contratos ativos

Exportação em **PDF/Excel** fica para a v2.0.

---

# Etapa 10 — Controle de acesso

Duas camadas complementares:

**1. Middleware no Express**

```
authenticate            -- valida o JWT e injeta req.user
authorize(...roles)     -- ex.: authorize('ADMIN','CORRETOR')
```

**2. Row-Level Security (RLS) no Supabase** — camada idiomática do PostgreSQL/Supabase que garante, no próprio banco, que um `CLIENTE` só leia as linhas dele (mesmo que um bug passe pelo middleware). Definir policies por `role` para `leases`, `payments` e `documents`.

**Token**: definir expiração do JWT e estratégia de renovação (refresh token ou re-login). No front, tratar `401` deslogando o usuário.

---

# Estruturas de pastas

## Back-end (arquitetura em camadas)

```
src/
├── controllers   (auth, user, owner, property, lease, payment)
├── services      (regras de negócio: leaseService gera as parcelas, etc.)
├── repositories  (acesso ao banco)
├── middlewares   (auth.js, role.js)
├── jobs          (cron: overdue + notificações)   ← novo
├── routes
├── database      (migrations, conexão)
├── utils
└── app.js
```

## Front-end (o que falta estruturar)

```
src/
├── services      (api.js + um service por recurso: propertyService, leaseService, ...)
├── contexts      (AuthContext, ModalContext)  ← já existem
├── routes        (AppRoutes + ProtectedRoute por perfil)  ← guard por role a criar
├── pages         (Home, Clients, Properties, Leases, auth...)  ← hoje com mock
└── components    (Layout, AuthLayout, ...)
```

---

# Segurança & LGPD

O sistema coleta **CPF, RG, data de nascimento, endereço e telefone** — dados pessoais sensíveis sob a **LGPD**.

- **Senhas**: sempre com hash (bcrypt/argon2); **nunca** trafegar/gravar em texto puro. Remover `confirmPassword` do payload enviado ao back-end.
- **Transporte**: HTTPS em produção; segredos apenas em variáveis de ambiente (nunca no repositório).
- **Auth**: rate-limit nos endpoints de login/registro/reset; expiração de JWT.
- **Acesso**: RLS no Supabase para isolar dados por usuário/perfil.
- **LGPD**: coletar só o necessário (minimização); permitir exclusão/anonimização (soft-delete + limpeza de PII); registrar consentimento; manter trilha de auditoria (quem alterou o quê).

---

# Preparação da integração do front-end

As telas (Home, Clients, Properties, Leases) **já existem, mas usam dados fictícios** e o token **não é enviado** nas requisições. Checklist para plugar assim que as rotas do back-end existirem:

1. **`AuthContext`**: ler `userData.perfil` (`ADMIN`/`CORRETOR`/`CLIENTE`) em vez do antigo `funcionario/isAdmin`; expor `role` no contexto.
2. **Interceptor no `api.js`** (hoje ausente):
   - *request*: anexar `Authorization: Bearer <token>` a partir do usuário salvo.
   - *response*: em `401`, chamar `signOut()` e redirecionar para `/login`.
3. **Rotas protegidas por perfil**: criar `ProtectedRoute`; `CLIENTE` → painel do cliente; `CORRETOR`/`ADMIN` → painel administrativo.
4. **Camada de services**: um módulo por recurso, no contrato camelCase canônico.
5. **Trocar os mocks** de Home/Clients/Properties/Leases por chamadas reais (recomendado **react-query/@tanstack** para cache, loading e revalidação).
6. **Reconciliar os nomes** dos campos das telas (`name`, `rent_price`, `start_date`, ...) para o camelCase canônico (`fullName`, `rentPrice`, `startDate`).

---

# Testes, ambientes e deploy

- **Testes**: front com **Vitest + Testing Library**; back com **Jest + Supertest**. Cobrir ao menos a geração de parcelas, permissões por perfil e o fluxo de pagamento.
- **Ambientes**: `dev` / `staging` / `prod`, cada um com seu `VITE_BACKEND_URL` e credenciais próprias. Versionar um `.env.example`.
- **Deploy**: front em **Vercel/Netlify**; back em **Render/Railway/Fly**; banco/arquivos no **Supabase**.

---

# Ordem de desenvolvimento recomendada

1. ✅ Autenticação (já pronta).
2. **Migrations** do banco (users, owners, properties, leases, payments, documents, notifications).
3. **Auth/JWT + RLS** no back (middlewares + policies) e **interceptor de token** no front.
4. **CRUD de proprietários e imóveis** (ADMIN/CORRETOR).
5. **CRUD de clientes** e associação com contratos.
6. **CRUD de contratos** com **geração automática das parcelas** (Etapa 5).
7. **Dashboards** (corretor e cliente) ligados às queries reais.
8. **Integração do front**: substituir os mocks pelas chamadas reais (recurso a recurso).
9. **Job de cron**: `OVERDUE` + notificações por e-mail (Nodemailer).
10. **Pagamento online** (gateway: Mercado Pago, Stripe ou **Asaas** — este último cobre PIX/boleto no Brasil), **upload de comprovantes** e **relatórios**.

Ao longo de tudo: **testes por camada** e revisão de segurança/LGPD.

## Funcionalidades futuras (v2.0)

- Agenda de visitas · Chat corretor↔cliente · Assinatura eletrônica de contratos
- Emissão automática de boleto/PIX · Painel financeiro com gráficos
- Busca avançada de imóveis/contratos · Auditoria (quem alterou o quê)
- Multi-tenant (várias imobiliárias) · Exportação PDF/Excel · Backup e monitoramento

---

# Dívidas técnicas já identificadas no código atual

Pequenos ajustes que valem a pena resolver durante a implementação:

- `AuthContext` ainda mapeia `funcionario → isAdmin`; migrar para `role`/`perfil` (3 valores). Há `console.log` de debug para remover.
- `src/services/api.js` não tem interceptor — nenhum request autenticado leva o token hoje.
- Register envia `confirmPassword` ao back-end (deveria validar só no front).
- `dotenv` está como dependência de runtime, desnecessário no Vite (ele já injeta `import.meta.env`).
- `@emotion` e `styled-components` coexistem; padronizar em uma única solução de estilo reduz o bundle.

---

Essa abordagem mantém a arquitetura em camadas (controllers → services → repositories) no back-end e prepara o front (services → contexts → rotas protegidas) para consumir a API assim que as rotas existirem. A stack — **React/Vite** no front e **Node.js + PostgreSQL/Supabase + JWT** no back — se encaixa exatamente no que já vem sendo desenvolvido.
