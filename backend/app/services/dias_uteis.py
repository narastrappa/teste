"""Cálculo de dias úteis excluindo sábados, domingos e feriados da tabela feriados_nacionais."""
from datetime import date, timedelta
from typing import Optional, Set

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.parametros import FeriadoNacional


async def buscar_feriados(
    db: AsyncSession,
    data_inicio: date,
    data_fim: date,
    uf: Optional[str] = None,
) -> Set[date]:
    """Busca feriados nacionais e do estado especificado no intervalo."""
    query = select(FeriadoNacional).where(
        FeriadoNacional.data >= data_inicio,
        FeriadoNacional.data <= data_fim,
    )
    result = await db.execute(query)
    feriados = result.scalars().all()

    datas = set()
    for f in feriados:
        if f.uf is None:  # nacional
            datas.add(f.data)
        elif uf and f.uf == uf:
            datas.add(f.data)
    return datas


async def calcular_dias_uteis(
    db: AsyncSession,
    data_inicio: date,
    data_fim: date,
    uf: Optional[str] = None,
) -> int:
    """Conta dias úteis entre data_inicio e data_fim (inclusive)."""
    if data_fim < data_inicio:
        return 0

    feriados = await buscar_feriados(db, data_inicio, data_fim, uf)

    count = 0
    current = data_inicio
    while current <= data_fim:
        if current.weekday() < 5 and current not in feriados:  # Mon-Fri
            count += 1
        current += timedelta(days=1)
    return count


async def adicionar_dias_uteis(
    db: AsyncSession,
    data_base: date,
    dias: int,
    uf: Optional[str] = None,
) -> date:
    """Retorna a data após N dias úteis a partir de data_base."""
    # Estimate range to fetch holidays
    data_fim_estimada = data_base + timedelta(days=dias * 2 + 10)
    feriados = await buscar_feriados(db, data_base, data_fim_estimada, uf)

    count = 0
    current = data_base
    while count < dias:
        current += timedelta(days=1)
        if current.weekday() < 5 and current not in feriados:
            count += 1
    return current


async def subtrair_dias_uteis(
    db: AsyncSession,
    data_base: date,
    dias: int,
    uf: Optional[str] = None,
) -> date:
    """Retorna a data N dias úteis antes de data_base."""
    data_inicio_estimada = data_base - timedelta(days=dias * 2 + 10)
    feriados = await buscar_feriados(db, data_inicio_estimada, data_base, uf)

    count = 0
    current = data_base
    while count < dias:
        current -= timedelta(days=1)
        if current.weekday() < 5 and current not in feriados:
            count += 1
    return current
