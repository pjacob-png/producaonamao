"""
Consultor IA — chat inteligente que analisa POPs, fichas técnicas e orienta a equipe.
Powered by Claude (Anthropic).
"""
from __future__ import annotations
import json
from typing import AsyncIterator
from app.config import settings

CONSULTANT_SYSTEM = """Você é o "Chef Consultor" do sistema Produção na Mão, um assistente especializado em:
- Gastronomia brasileira e técnicas de preparo
- Gestão de custos (CMV, markup, precificação)
- Operações de cozinha industrial/fast food
- Higiene e segurança alimentar (ANVISA/ABERC)
- Treinamento de equipe

Contexto do restaurante será fornecido em cada sessão. Use-o para respostas precisas e personalizadas.
Seja direto, prático e use exemplos do dia a dia da cozinha brasileira.
Quando não souber algo com certeza, diga claramente e sugira onde buscar a informação correta.
Responda sempre em português brasileiro.
"""


async def chat_stream(
    messages: list[dict],
    context: dict,
) -> AsyncIterator[str]:
    """Stream de resposta do consultor IA."""
    if not settings.anthropic_api_key:
        yield "IA não configurada. Adicione ANTHROPIC_API_KEY no .env para ativar o consultor."
        return

    import anthropic
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    system_with_context = CONSULTANT_SYSTEM
    if context:
        system_with_context += f"\n\nContexto do restaurante:\n{json.dumps(context, ensure_ascii=False, indent=2)}"

    async with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system=system_with_context,
        messages=messages,
    ) as stream:
        async for text in stream.text_stream:
            yield text


async def build_restaurant_context(
    products: list[dict],
    categories: list[str],
    tenant_name: str,
) -> dict:
    """Monta o contexto do restaurante para injetar no system prompt do consultor."""
    return {
        "restaurante": tenant_name,
        "categorias": categories,
        "total_produtos": len(products),
        "produtos_curva_a": [p["name"] for p in products if p.get("abc_curve") == "A"],
        "produtos_curva_b": [p["name"] for p in products if p.get("abc_curve") == "B"],
        "produtos_curva_c": [p["name"] for p in products if p.get("abc_curve") == "C"],
        "produtos_amostra": products[:20],  # Limita para não exceder o contexto
    }
