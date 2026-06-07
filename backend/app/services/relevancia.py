"""
Relevância score formula:
- palavras encontradas no campo `objeto` valem peso 2
- nos campos `orgao` e `modalidade` valem peso 1
- score = min((sum_pesos_encontrados / sum_pesos_total) * 100, 100) arredondado para int
"""
from typing import List


def calcular_relevancia_score(
    objeto: str,
    orgao: str,
    modalidade: str,
    palavras_chave: List[str],
) -> int:
    if not palavras_chave:
        return 0

    # peso por campo
    campos = [
        (objeto.lower(), 2),
        (orgao.lower(), 1),
        (modalidade.lower(), 1),
    ]
    sum_pesos_total = len(palavras_chave) * sum(peso for _, peso in campos)

    if sum_pesos_total == 0:
        return 0

    sum_pesos_encontrados = 0
    for palavra in palavras_chave:
        termo = palavra.lower().strip()
        if not termo:
            continue
        for texto, peso in campos:
            if termo in texto:
                sum_pesos_encontrados += peso

    score = min((sum_pesos_encontrados / sum_pesos_total) * 100, 100)
    return round(score)
