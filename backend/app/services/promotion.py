"""
Sugestões de promoção baseadas em gastronomia brasileira e análise de cardápio.
Usa o Claude para gerar sugestões contextualizadas.
"""
from __future__ import annotations
import json
from app.config import settings


SYSTEM_PROMPT = """Você é um consultor especialista em gastronomia brasileira e gestão de restaurantes fast food.
Analise o cardápio e sugira promoções estratégicas baseadas em:
- Combinações clássicas da culinária brasileira (x-burguer + guaraná, pastel + caldo de cana, etc.)
- Estratégia de curva ABC: promova itens B/C junto com itens A para aumentar ticket médio
- Horários estratégicos (almoço executivo, happy hour, lanche da tarde)
- Sazonalidade (Junina, Copa, Carnaval, etc.)

Responda SEMPRE em JSON válido com a estrutura solicitada. Seja objetivo e prático.
"""


async def generate_promotion_suggestions(
    products_summary: list[dict],
    tenant_name: str,
) -> list[dict]:
    """Gera sugestões de promoção via Claude."""
    if not settings.anthropic_api_key:
        return _fallback_suggestions(products_summary)

    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

        user_msg = f"""
Restaurante: {tenant_name}

Cardápio (resumo):
{json.dumps(products_summary, ensure_ascii=False, indent=2)}

Gere 5 sugestões de promoção. Retorne um array JSON:
[
  {{
    "title": "Nome da promoção",
    "type": "combo|desconto_curva_c|brinde|oferta_horario|kit_especial",
    "description": "Descrição em 2-3 frases, incluindo o valor/benefício para o cliente",
    "products": ["Nome Produto A", "Nome Produto B"],
    "estimated_margin": "descrição breve do impacto na margem"
  }}
]
"""
        message = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1500,
            messages=[{"role": "user", "content": user_msg}],
            system=SYSTEM_PROMPT,
        )
        text = message.content[0].text.strip()
        # Extrai JSON mesmo se houver texto extra
        start = text.find("[")
        end = text.rfind("]") + 1
        return json.loads(text[start:end])
    except Exception:
        return _fallback_suggestions(products_summary)


def _fallback_suggestions(products: list[dict]) -> list[dict]:
    """Sugestões fixas quando a IA não está disponível."""
    curve_c = [p["name"] for p in products if p.get("abc_curve") == "C"][:2]
    curve_a = [p["name"] for p in products if p.get("abc_curve") == "A"][:1]

    return [
        {
            "title": "Combo do Dia",
            "type": "combo",
            "description": "Combine os itens mais pedidos com uma bebida e economize. Ideal para aumentar o ticket médio no almoço.",
            "products": curve_a + ["Bebida"],
            "estimated_margin": "Mantém margem do item A, agrega receita da bebida",
        },
        {
            "title": "Leve 2 Pague 1,5 — Itens em Destaque",
            "type": "desconto_curva_c",
            "description": "Reduza o estoque dos itens menos vendidos sem comprometer a margem dos campeões.",
            "products": curve_c,
            "estimated_margin": "Redução de 25% na margem desses itens, mas gira o estoque",
        },
        {
            "title": "Happy Hour 17h–19h",
            "type": "oferta_horario",
            "description": "Salgados e bebidas com 20% de desconto no fim de tarde para aumentar o movimento no horário de baixo fluxo.",
            "products": [],
            "estimated_margin": "Desconto compensa com volume adicional",
        },
    ]
