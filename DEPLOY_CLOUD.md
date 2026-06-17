# Deploy em Nuvem + Domínio — Produção na Mão

## 1. Registrar o domínio producaonamao.com.br

1. Acesse **registro.br** (https://registro.br)
2. Faça login ou crie uma conta gratuita
3. Pesquise `producaonamao.com.br`
4. Pague ~R$ 40/ano (Boleto ou PIX)
5. Aguarde ativação (instantânea a 24h)

---

## 2. Criar repositório no GitHub

```bash
cd "C:\Users\Paulo Jacob\OneDrive\Documentos\CONSULTORIA KINTARU\producao-na-mao"
git init
git add .
git commit -m "feat: primeiro commit - Producao na Mao SaaS"
```

Depois:
1. Acesse github.com → New repository
2. Nome: `producao-na-mao` (privado)
3. Execute:
```bash
git remote add origin https://github.com/SEU_USUARIO/producao-na-mao.git
git branch -M main
git push -u origin main
```

---

## 3. Deploy do Backend no Railway

1. Acesse **railway.app** → New Project → Deploy from GitHub
2. Selecione o repositório `producao-na-mao`
3. Defina o **Root Directory** como `backend`
4. Adicione as variáveis de ambiente:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | (Railway gera automaticamente ao adicionar PostgreSQL) |
| `SECRET_KEY` | (copie do .env) |
| `ENCRYPTION_KEY` | (copie do .env) |
| `ANTHROPIC_API_KEY` | (sua chave em console.anthropic.com) |
| `ASAAS_API_KEY` | (sua chave Asaas) |
| `ASAAS_SANDBOX` | `false` (em produção) |
| `ASAAS_WEBHOOK_TOKEN` | (gere no painel Asaas) |
| `ENVIRONMENT` | `production` |
| `ALLOWED_ORIGINS` | `https://producaonamao.com.br,https://www.producaonamao.com.br` |

5. Adicione PostgreSQL: New Service → Database → PostgreSQL
6. Railway conecta automaticamente o `DATABASE_URL`

**Domínio do backend:**
- Railway → Settings → Domains → Custom Domain
- Adicione: `api.producaonamao.com.br`
- Railway mostra o CNAME → adicione no Registro.br

---

## 4. Deploy do Frontend no Vercel

1. Acesse **vercel.com** → New Project → Import from GitHub
2. Selecione `producao-na-mao`
3. Defina **Root Directory** como `frontend`
4. Adicione variável de ambiente:

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.producaonamao.com.br/api/v1` |

5. Clique em Deploy

**Domínio do frontend:**
- Vercel → Project → Settings → Domains
- Adicione: `producaonamao.com.br` e `www.producaonamao.com.br`
- Vercel mostra os registros DNS → adicione no Registro.br

---

## 5. Configurar DNS no Registro.br

| Tipo | Nome | Valor | TTL |
|---|---|---|---|
| A | @ | (IP do Vercel — Vercel fornece) | 3600 |
| CNAME | www | cname.vercel-dns.com | 3600 |
| CNAME | api | (domínio Railway) | 3600 |

---

## 6. Configurar Asaas para produção

1. Crie conta em **asaas.com** (gratuita para começar)
2. Complete o cadastro da empresa (CNPJ obrigatório)
3. Vá em: Configurações → Integrações → API
4. Gere a chave de API de **produção** (não sandbox)
5. Vá em: Configurações → Webhook:
   - URL: `https://api.producaonamao.com.br/api/v1/webhooks/asaas`
   - Eventos: PAYMENT_CONFIRMED, PAYMENT_RECEIVED, PAYMENT_OVERDUE, SUBSCRIPTION_DELETED
   - Copie o **Token de autenticação** → cole em `ASAAS_WEBHOOK_TOKEN`

---

## 7. Checklist final antes de lançar

- [ ] Domínio propagando (teste em https://dnschecker.org)
- [ ] Backend respondendo em `https://api.producaonamao.com.br/health`
- [ ] Frontend abrindo em `https://producaonamao.com.br`
- [ ] Cadastro de novo restaurante funcionando
- [ ] Asaas sandbox testado (crie uma assinatura de teste)
- [ ] Asaas_SANDBOX=false no Railway (produção)
- [ ] SSL automático ativo (Vercel e Railway geram automaticamente)
- [ ] Termos de uso e política de privacidade publicados (exigência LGPD)

---

## Custo mensal estimado

| Serviço | Custo |
|---|---|
| Registro.br (.com.br) | R$ 40/ano ≈ R$ 3,33/mês |
| Railway (Backend + PostgreSQL) | ~USD 5-20/mês ≈ R$ 25-100/mês |
| Vercel (Frontend) | **Gratuito** |
| Asaas | **Gratuito** (cobra % por transação) |
| Anthropic (IA) | Pago por uso — ~R$ 0,01 por conversa |
| **Total** | **~R$ 30-105/mês** |

A partir do **3º cliente pagante no plano Básico** (R$ 99 × 3 = R$ 297), o sistema se paga.
