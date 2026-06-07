"""Documento service: OCR, verificação de vencimentos."""
import io
import logging
from datetime import date, datetime, timezone, timedelta
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.documento import Documento, StatusDocumentoEnum

logger = logging.getLogger(__name__)

OCR_CONFIANCA_MINIMA = 0.80


async def processar_ocr(file_content: bytes, mimetype: str) -> dict:
    """Processa OCR em documento PDF/imagem."""
    try:
        import pytesseract
        from PIL import Image

        if mimetype == "application/pdf":
            # Convert PDF pages to images
            try:
                from pdf2image import convert_from_bytes
                images = convert_from_bytes(file_content, dpi=200)
                textos = []
                confiancas = []
                for img in images[:5]:  # max 5 pages
                    data = pytesseract.image_to_data(img, lang="por", output_type=pytesseract.Output.DICT)
                    words = [w for w, c in zip(data["text"], data["conf"]) if w.strip() and int(c) > 0]
                    confs = [int(c) for c in data["conf"] if int(c) > 0]
                    textos.append(" ".join(words))
                    if confs:
                        confiancas.append(sum(confs) / len(confs) / 100)

                texto_completo = "\n".join(textos)
                confianca = sum(confiancas) / len(confiancas) if confiancas else 0.0
            except ImportError:
                # pdf2image not available, try direct text extraction
                import pdfplumber
                with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                    textos = [p.extract_text() or "" for p in pdf.pages[:5]]
                texto_completo = "\n".join(textos)
                confianca = 0.90 if texto_completo.strip() else 0.0
        else:
            img = Image.open(io.BytesIO(file_content))
            data = pytesseract.image_to_data(img, lang="por", output_type=pytesseract.Output.DICT)
            words = [w for w, c in zip(data["text"], data["conf"]) if w.strip() and int(c) > 0]
            confs = [int(c) for c in data["conf"] if int(c) > 0]
            texto_completo = " ".join(words)
            confianca = sum(confs) / len(confs) / 100 if confs else 0.0

        # Extract snippet (first 500 chars)
        snippet = texto_completo[:500] if texto_completo else ""

        return {
            "texto": texto_completo,
            "confianca": confianca,
            "snippet": snippet,
            "auto_fill": confianca >= OCR_CONFIANCA_MINIMA,
        }
    except Exception as e:
        logger.error(f"Erro no OCR: {e}")
        return {
            "texto": "",
            "confianca": 0.0,
            "snippet": "",
            "auto_fill": False,
        }


async def extrair_datas_ocr(texto: str) -> dict:
    """Tenta extrair datas de emissão e vencimento do texto OCR."""
    import re
    from datetime import datetime

    patterns = [
        r"val[iao]d[ao]\s+at[eé]?\s*:?\s*(\d{2}/\d{2}/\d{4})",
        r"venc[ei]\w*\s*:?\s*(\d{2}/\d{2}/\d{4})",
        r"expira[cç][aã]o\s*:?\s*(\d{2}/\d{2}/\d{4})",
        r"data\s+de\s+venc\w*\s*:?\s*(\d{2}/\d{2}/\d{4})",
    ]

    emissao_patterns = [
        r"emiss[aã]o\s*:?\s*(\d{2}/\d{2}/\d{4})",
        r"emitid[ao]\s+em\s*:?\s*(\d{2}/\d{2}/\d{4})",
        r"data\s+de\s+emiss[aã]o\s*:?\s*(\d{2}/\d{2}/\d{4})",
    ]

    result = {}
    texto_lower = texto.lower()

    for pattern in patterns:
        match = re.search(pattern, texto_lower)
        if match:
            try:
                result["vencimento"] = datetime.strptime(match.group(1), "%d/%m/%Y").date()
                break
            except ValueError:
                pass

    for pattern in emissao_patterns:
        match = re.search(pattern, texto_lower)
        if match:
            try:
                result["emissao"] = datetime.strptime(match.group(1), "%d/%m/%Y").date()
                break
            except ValueError:
                pass

    return result


async def verificar_vencimentos(db: AsyncSession) -> int:
    """Verifica vencimentos de documentos e envia alertas. Retorna qtd de alertas enviados."""
    from app.services.notificacao import enviar_email
    from app.config import settings

    hoje = date.today()
    result = await db.execute(select(Documento))
    documentos = result.scalars().all()

    alertas_enviados = 0

    for doc in documentos:
        if not doc.data_vencimento:
            continue

        dias_para_vencer = (doc.data_vencimento - hoje).days

        # Update status
        old_status = doc.status
        if dias_para_vencer < 0:
            doc.status = StatusDocumentoEnum.vencido
        elif dias_para_vencer <= doc.dias_alerta:
            doc.status = StatusDocumentoEnum.a_vencer
        else:
            doc.status = StatusDocumentoEnum.valido

        # Primeiro alerta: quando entra no período de alerta
        if not doc.alerta_enviado and dias_para_vencer <= doc.dias_alerta and dias_para_vencer >= 0:
            await enviar_email(
                [settings.admin_email],
                f"Alerta: Documento '{doc.descricao}' vence em {dias_para_vencer} dias",
                f"""<p>O documento <strong>{doc.descricao}</strong> (tipo: {doc.tipo.value})
                vencerá em {dias_para_vencer} dias ({doc.data_vencimento.strftime('%d/%m/%Y')}).</p>
                <p>Providencie a renovação.</p>""",
            )
            doc.alerta_enviado = True
            alertas_enviados += 1

        # Segundo alerta: na metade do prazo
        metade_prazo = doc.dias_alerta // 2
        if doc.alerta_enviado and dias_para_vencer <= metade_prazo and dias_para_vencer >= 0:
            await enviar_email(
                [settings.admin_email],
                f"URGENTE: Documento '{doc.descricao}' vence em {dias_para_vencer} dias",
                f"""<p><strong>SEGUNDO ALERTA</strong></p>
                <p>O documento <strong>{doc.descricao}</strong> vencerá em apenas {dias_para_vencer} dias ({doc.data_vencimento.strftime('%d/%m/%Y')}).</p>
                <p>Ação imediata necessária.</p>""",
            )
            alertas_enviados += 1

    await db.flush()
    return alertas_enviados
