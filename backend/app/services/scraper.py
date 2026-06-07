"""Portal scrapers (ComprasNet, BEC, etc.) with retry logic."""
import asyncio
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.models.edital import Edital, FiltroConfig, StatusEditalEnum, ModalidadeEnum
from app.models.parametros import AdaptadorPortal
from app.services.relevancia import calcular_relevancia_score
from app.database import AsyncSessionLocal

logger = logging.getLogger(__name__)

# Track consecutive failures per portal
_falhas_consecutivas: Dict[str, int] = {}


async def _alerta_admin_falhas(portal: str, falhas: int) -> None:
    from app.services.notificacao import notificar_admin
    await notificar_admin(
        f"Scraper falhou {falhas} vezes consecutivas: {portal}",
        f"O scraper do portal '{portal}' falhou {falhas} vezes consecutivas. Verifique a conectividade e as credenciais.",
    )


async def _alerta_admin_sem_resultados(portal: str) -> None:
    from app.services.notificacao import notificar_admin
    await notificar_admin(
        f"Scraper sem resultados por 2h: {portal}",
        f"O scraper do portal '{portal}' não encontrou nenhum edital nas últimas 2 horas.",
    )


async def upsert_edital(db: AsyncSession, dados: Dict[str, Any], filtro: Optional[FiltroConfig]) -> Optional[Edital]:
    """Insere ou atualiza edital, descartando se data_abertura já passou."""
    data_abertura = dados.get("data_abertura")
    if data_abertura and isinstance(data_abertura, datetime):
        if data_abertura.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            logger.debug(f"Edital {dados.get('numero')} descartado: data_abertura no passado")
            return None

    # Check upsert
    result = await db.execute(
        select(Edital).where(
            Edital.numero == dados["numero"],
            Edital.portal_origem == dados["portal_origem"],
        )
    )
    edital = result.scalar_one_or_none()

    palavras_chave = filtro.palavras_chave if filtro else []
    score = calcular_relevancia_score(
        objeto=dados.get("objeto", ""),
        orgao=dados.get("orgao", ""),
        modalidade=dados.get("modalidade", ""),
        palavras_chave=palavras_chave,
    )

    if edital is None:
        edital = Edital(
            numero=dados["numero"],
            portal_origem=dados["portal_origem"],
            orgao=dados.get("orgao", ""),
            objeto=dados.get("objeto", ""),
            modalidade=dados.get("modalidade", ModalidadeEnum.pregao),
            status=StatusEditalEnum.novo,
            uf=dados.get("uf"),
            municipio=dados.get("municipio"),
            valor_estimado=dados.get("valor_estimado"),
            data_abertura=dados.get("data_abertura"),
            data_publicacao=dados.get("data_publicacao"),
            url_edital=dados.get("url_edital"),
            url_portal=dados.get("url_portal"),
            relevancia_score=score,
            notificado=False,
            historico_status=[],
            arquivos_s3=[],
        )
        db.add(edital)
    else:
        # Update fields that might change
        edital.orgao = dados.get("orgao", edital.orgao)
        edital.objeto = dados.get("objeto", edital.objeto)
        edital.valor_estimado = dados.get("valor_estimado", edital.valor_estimado)
        edital.data_abertura = dados.get("data_abertura", edital.data_abertura)
        edital.relevancia_score = score

    await db.flush()
    return edital


async def scrape_comprasnet(db: AsyncSession) -> List[Dict[str, Any]]:
    """Scraper para ComprasNet."""
    from playwright.async_api import async_playwright

    resultados = []
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()

            await page.goto(settings.comprasnet_url, timeout=30000)
            # Navigate to public search for editais (Pregão Eletrônico)
            await page.goto(
                f"{settings.comprasnet_url}/seguro/sistema/site/visualiza_edital.asp",
                timeout=30000,
            )

            # Wait for table
            try:
                await page.wait_for_selector("table.td", timeout=10000)
                rows = await page.query_selector_all("table.td tr")
                for row in rows[1:]:  # skip header
                    cols = await row.query_selector_all("td")
                    if len(cols) >= 5:
                        numero = (await cols[0].text_content() or "").strip()
                        orgao = (await cols[1].text_content() or "").strip()
                        objeto = (await cols[2].text_content() or "").strip()
                        data_str = (await cols[3].text_content() or "").strip()

                        if numero and orgao:
                            resultados.append({
                                "numero": numero,
                                "portal_origem": "comprasnet",
                                "orgao": orgao,
                                "objeto": objeto,
                                "modalidade": ModalidadeEnum.pregao,
                                "data_abertura": _parse_data_br(data_str),
                                "url_portal": settings.comprasnet_url,
                            })
            except Exception:
                pass  # No results found or page structure changed

            await browser.close()
    except Exception as e:
        logger.error(f"Erro no scraper ComprasNet: {e}")
        raise

    return resultados


async def scrape_bec(db: AsyncSession) -> List[Dict[str, Any]]:
    """Scraper para BEC SP."""
    from playwright.async_api import async_playwright

    resultados = []
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()

            await page.goto(f"{settings.bec_url}/BECDL/default.aspx", timeout=30000)

            try:
                await page.wait_for_selector("#gvOC", timeout=10000)
                rows = await page.query_selector_all("#gvOC tr")
                for row in rows[1:]:
                    cols = await row.query_selector_all("td")
                    if len(cols) >= 4:
                        numero = (await cols[0].text_content() or "").strip()
                        orgao = (await cols[1].text_content() or "").strip()
                        objeto = (await cols[2].text_content() or "").strip()
                        data_str = (await cols[3].text_content() or "").strip()

                        if numero:
                            resultados.append({
                                "numero": numero,
                                "portal_origem": "bec",
                                "orgao": orgao,
                                "objeto": objeto,
                                "modalidade": ModalidadeEnum.pregao,
                                "uf": "SP",
                                "data_abertura": _parse_data_br(data_str),
                                "url_portal": settings.bec_url,
                            })
            except Exception:
                pass

            await browser.close()
    except Exception as e:
        logger.error(f"Erro no scraper BEC: {e}")
        raise

    return resultados


def _parse_data_br(data_str: str) -> Optional[datetime]:
    """Converte data no formato DD/MM/YYYY HH:MM."""
    from datetime import datetime
    for fmt in ("%d/%m/%Y %H:%M", "%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(data_str.strip(), fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


SCRAPERS = {
    "comprasnet": scrape_comprasnet,
    "bec": scrape_bec,
}


async def run_scraper(portal: str) -> Dict[str, Any]:
    """Executa o scraper para um portal com retry logic."""
    global _falhas_consecutivas

    if portal not in SCRAPERS:
        return {"portal": portal, "status": "erro", "message": f"Portal '{portal}' não suportado"}

    scraper_fn = SCRAPERS[portal]

    async with AsyncSessionLocal() as db:
        # Get active filtro config
        result = await db.execute(select(FiltroConfig).where(FiltroConfig.ativo == True).limit(1))
        filtro = result.scalar_one_or_none()

        start_time = datetime.now(timezone.utc)
        try:
            resultados = await scraper_fn(db)
            _falhas_consecutivas[portal] = 0

            inserted = 0
            updated = 0
            for dado in resultados:
                edital = await upsert_edital(db, dado, filtro)
                if edital:
                    inserted += 1

            await db.commit()

            elapsed = (datetime.now(timezone.utc) - start_time).total_seconds()
            if elapsed > 7200 and inserted == 0:
                await _alerta_admin_sem_resultados(portal)

            return {
                "portal": portal,
                "status": "ok",
                "editais_processados": inserted,
                "elapsed_seconds": elapsed,
            }

        except Exception as e:
            await db.rollback()
            _falhas_consecutivas[portal] = _falhas_consecutivas.get(portal, 0) + 1
            falhas = _falhas_consecutivas[portal]
            logger.error(f"Scraper {portal} falhou ({falhas}x): {e}")

            if falhas >= settings.scraper_max_falhas_consecutivas:
                await _alerta_admin_falhas(portal, falhas)

            return {
                "portal": portal,
                "status": "erro",
                "falhas_consecutivas": falhas,
                "message": str(e),
            }
