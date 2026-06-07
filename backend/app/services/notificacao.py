"""Email via aiosmtplib, WhatsApp via httpx to Z-API."""
import logging
from typing import Optional, List

import aiosmtplib
import httpx
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

from app.config import settings

logger = logging.getLogger(__name__)


async def enviar_email(
    destinatarios: List[str],
    assunto: str,
    corpo_html: str,
    corpo_texto: Optional[str] = None,
    anexos: Optional[List[dict]] = None,  # [{"filename": str, "content": bytes, "mimetype": str}]
) -> bool:
    """Envia email via aiosmtplib."""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = assunto
        msg["From"] = settings.smtp_from
        msg["To"] = ", ".join(destinatarios)

        if corpo_texto:
            msg.attach(MIMEText(corpo_texto, "plain", "utf-8"))
        msg.attach(MIMEText(corpo_html, "html", "utf-8"))

        if anexos:
            for anexo in anexos:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(anexo["content"])
                encoders.encode_base64(part)
                part.add_header(
                    "Content-Disposition",
                    f'attachment; filename="{anexo["filename"]}"',
                )
                msg.attach(part)

        await aiosmtplib.send(
            msg,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user,
            password=settings.smtp_password,
            use_tls=False,
            start_tls=settings.smtp_tls,
        )
        logger.info(f"Email enviado para {destinatarios}: {assunto}")
        return True
    except Exception as e:
        logger.error(f"Erro ao enviar email para {destinatarios}: {e}")
        return False


async def enviar_whatsapp(
    telefone: str,
    mensagem: str,
    pdf_content: Optional[bytes] = None,
    pdf_filename: Optional[str] = None,
) -> bool:
    """Envia mensagem WhatsApp via Z-API."""
    if not settings.zapi_instance or not settings.zapi_token:
        logger.warning("Z-API não configurado, skipping WhatsApp")
        return False

    base_url = f"{settings.zapi_base_url}/{settings.zapi_instance}/token/{settings.zapi_token}"
    headers = {"Content-Type": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            if pdf_content and pdf_filename:
                import base64
                pdf_b64 = base64.b64encode(pdf_content).decode()
                payload = {
                    "phone": telefone,
                    "document": pdf_b64,
                    "fileName": pdf_filename,
                    "caption": mensagem,
                }
                url = f"{base_url}/send-document/base64"
            else:
                payload = {"phone": telefone, "message": mensagem}
                url = f"{base_url}/send-text"

            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            logger.info(f"WhatsApp enviado para {telefone}")
            return True
    except Exception as e:
        logger.error(f"Erro ao enviar WhatsApp para {telefone}: {e}")
        return False


async def notificar_admin(assunto: str, mensagem: str) -> None:
    """Notifica o admin por email."""
    if settings.admin_email:
        await enviar_email(
            [settings.admin_email],
            f"[ALERTA SISTEMA] {assunto}",
            f"<p>{mensagem}</p>",
            mensagem,
        )
