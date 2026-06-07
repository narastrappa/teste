"""Comprovante service: geração de PDF holerite + dispatch."""
import io
import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.folha import Folha, ItemFolha, Funcionario, TipoComprovanteEnum
from app.models.comprovante import LogEnvioComprovante, StatusEnvioEnum, CanalEnvioEnum

logger = logging.getLogger(__name__)


def gerar_holerite_pdf(
    funcionario: Funcionario,
    item: ItemFolha,
    competencia: str,
) -> bytes:
    """Gera holerite em PDF usando reportlab."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import cm
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.enums import TA_CENTER, TA_LEFT

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=1*cm, bottomMargin=1*cm)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("title", parent=styles["Heading1"], alignment=TA_CENTER, fontSize=14)
    center_style = ParagraphStyle("center", parent=styles["Normal"], alignment=TA_CENTER)
    bold_style = ParagraphStyle("bold", parent=styles["Normal"], fontName="Helvetica-Bold")

    elements = []

    # Title
    elements.append(Paragraph("CONTRACHEQUE / HOLERITE", title_style))
    elements.append(Spacer(1, 0.3*cm))
    elements.append(Paragraph(f"Competência: {competencia}", center_style))
    elements.append(Spacer(1, 0.5*cm))

    # Employee info
    info_data = [
        ["Nome:", funcionario.nome, "CPF:", funcionario.cpf],
        ["Cargo:", funcionario.cargo or "-", "Depto:", funcionario.departamento or "-"],
        ["Banco:", funcionario.banco or "-", "Agência:", funcionario.agencia or "-"],
        ["Conta:", funcionario.conta or "-", "", ""],
    ]
    info_table = Table(info_data, colWidths=[3*cm, 7*cm, 3*cm, 5*cm])
    info_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightblue),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 0.5*cm))

    # Earnings and Deductions
    elements.append(Paragraph("PROVENTOS E DESCONTOS", bold_style))
    elements.append(Spacer(1, 0.2*cm))

    vencimentos = [
        ["DESCRIÇÃO", "VALOR"],
        ["Salário Base", f"R$ {item.salario_base:.2f}"],
    ]
    if item.horas_extras and item.horas_extras > 0:
        vencimentos.append(["Horas Extras", f"R$ {item.horas_extras:.2f}"])
    if item.vale_transporte and item.vale_transporte > 0:
        vencimentos.append(["Vale Transporte", f"R$ {item.vale_transporte:.2f}"])
    if item.vale_refeicao and item.vale_refeicao > 0:
        vencimentos.append(["Vale Refeição", f"R$ {item.vale_refeicao:.2f}"])
    if item.outras_verbas:
        for nome, valor in item.outras_verbas.items():
            vencimentos.append([nome, f"R$ {Decimal(str(valor)):.2f}"])

    vencimentos.append(["TOTAL BRUTO", f"R$ {item.valor_bruto:.2f}"])

    descontos = [
        ["DESCONTO", "VALOR"],
        ["INSS", f"R$ {item.inss_funcionario:.2f}"],
        ["IRRF", f"R$ {item.irrf:.2f}"],
    ]
    if item.outros_descontos:
        for nome, valor in item.outros_descontos.items():
            descontos.append([nome, f"R$ {Decimal(str(valor)):.2f}"])
    descontos.append(["TOTAL DESCONTOS", f"R$ {item.total_descontos:.2f}"])

    # Combine side by side
    max_rows = max(len(vencimentos), len(descontos))
    while len(vencimentos) < max_rows:
        vencimentos.append(["", ""])
    while len(descontos) < max_rows:
        descontos.append(["", ""])

    combined = [v + d for v, d in zip(vencimentos, descontos)]
    pay_table = Table(combined, colWidths=[6*cm, 3*cm, 6*cm, 3*cm])
    pay_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightblue),
        ("BACKGROUND", (0, -1), (-1, -1), colors.lightyellow),
    ]))
    elements.append(pay_table)
    elements.append(Spacer(1, 0.5*cm))

    # Net value
    net_data = [["VALOR LÍQUIDO A RECEBER:", f"R$ {item.valor_liquido:.2f}"]]
    net_table = Table(net_data, colWidths=[14*cm, 4*cm])
    net_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("GRID", (0, 0), (-1, -1), 1, colors.black),
        ("BACKGROUND", (0, 0), (-1, -1), colors.lightgreen),
    ]))
    elements.append(net_table)
    elements.append(Spacer(1, 1*cm))
    elements.append(Paragraph(
        f"Gerado em {datetime.now().strftime('%d/%m/%Y às %H:%M')}",
        center_style
    ))

    doc.build(elements)
    return buf.getvalue()


async def enviar_comprovante(
    db: AsyncSession,
    log: LogEnvioComprovante,
) -> bool:
    """Envia comprovante via email/whatsapp conforme preferência do funcionário."""
    from app.services.notificacao import enviar_email, enviar_whatsapp
    from app.storage import storage_client

    # Load related objects
    result = await db.execute(select(ItemFolha).where(ItemFolha.id == log.item_folha_id))
    item = result.scalar_one_or_none()

    result = await db.execute(select(Funcionario).where(Funcionario.id == log.funcionario_id))
    func = result.scalar_one_or_none()

    if not item or not func:
        log.status = StatusEnvioEnum.falhou
        log.erro_detalhe = "ItemFolha ou Funcionario não encontrado"
        return False

    result = await db.execute(select(Folha).where(Folha.id == item.folha_id))
    folha = result.scalar_one_or_none()

    # Get or generate PDF
    pdf_content: bytes
    if log.pdf_s3:
        try:
            pdf_content = storage_client.download(log.pdf_s3)
        except Exception:
            pdf_content = gerar_holerite_pdf(func, item, folha.competencia if folha else "N/A")
    else:
        pdf_content = gerar_holerite_pdf(func, item, folha.competencia if folha else "N/A")
        s3_key = f"holerites/{item.folha_id}/{func.id}.pdf"
        storage_client.upload(s3_key, pdf_content, "application/pdf")
        log.pdf_s3 = s3_key
        item.holerite_s3 = s3_key

    # Check canal
    pref = func.preferencia_comprovante
    tem_email = bool(func.email)
    tem_whatsapp = bool(func.telefone)

    if not tem_email and not tem_whatsapp:
        log.status = StatusEnvioEnum.sem_canal
        log.canal = None
        await db.flush()
        return False

    sucesso = False
    competencia = folha.competencia if folha else "N/A"
    filename = f"holerite_{competencia.replace('-', '_')}.pdf"

    if pref in (TipoComprovanteEnum.email, TipoComprovanteEnum.ambos) and tem_email:
        ok = await enviar_email(
            [func.email],
            f"Seu holerite de {competencia}",
            f"<p>Prezado(a) {func.nome},</p><p>Segue em anexo seu holerite referente à competência {competencia}.</p>",
            anexos=[{"filename": filename, "content": pdf_content, "mimetype": "application/pdf"}],
        )
        if ok:
            log.canal = CanalEnvioEnum.email
            sucesso = True

    if pref in (TipoComprovanteEnum.whatsapp, TipoComprovanteEnum.ambos) and tem_whatsapp:
        ok = await enviar_whatsapp(
            func.telefone,
            f"Olá {func.nome}, segue seu holerite de {competencia}.",
            pdf_content=pdf_content,
            pdf_filename=filename,
        )
        if ok:
            log.canal = CanalEnvioEnum.whatsapp
            sucesso = True

    if sucesso:
        log.status = StatusEnvioEnum.enviado
        log.enviado_em = datetime.now(timezone.utc)
    else:
        log.status = StatusEnvioEnum.falhou
        log.tentativas += 1

    await db.flush()
    return sucesso
