"""Documentos endpoints."""
import uuid
from datetime import date, datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.auth import get_current_user, require_analista
from app.models.documento import Documento, TipoDocumentoEnum, StatusDocumentoEnum
from app.schemas.documento import DocumentoOut, DocumentoStatusResponse, RenovacaoResponse

router = APIRouter(prefix="/api/documentos", tags=["documentos"])


@router.get("", response_model=list[DocumentoOut])
async def listar_documentos(
    status_filter: Optional[StatusDocumentoEnum] = Query(None, alias="status"),
    tipo: Optional[TipoDocumentoEnum] = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = select(Documento).order_by(Documento.data_vencimento.asc())
    if status_filter:
        query = query.where(Documento.status == status_filter)
    if tipo:
        query = query.where(Documento.tipo == tipo)
    result = await db.execute(query)
    docs = result.scalars().all()
    return [DocumentoOut.model_validate(d) for d in docs]


@router.post("", response_model=DocumentoOut, status_code=status.HTTP_201_CREATED)
async def criar_documento(
    tipo: TipoDocumentoEnum = Form(...),
    descricao: str = Form(...),
    data_emissao: Optional[date] = Form(None),
    data_vencimento: Optional[date] = Form(None),
    dias_alerta: int = Form(30),
    auto_renovavel: bool = Form(False),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_analista()),
):
    from app.storage import storage_client
    from app.services.documento_service import processar_ocr, extrair_datas_ocr

    content = await file.read()
    mimetype = file.content_type or "application/octet-stream"

    # OCR
    ocr_result = await processar_ocr(content, mimetype)

    # Auto-fill dates if OCR confidence high enough
    datas_ocr = {}
    if ocr_result["auto_fill"] and ocr_result["texto"]:
        datas_ocr = await extrair_datas_ocr(ocr_result["texto"])

    if ocr_result["auto_fill"]:
        data_emissao = data_emissao or datas_ocr.get("emissao")
        data_vencimento = data_vencimento or datas_ocr.get("vencimento")

    # Upload to storage
    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "bin"
    s3_key = f"documentos/{uuid.uuid4()}.{ext}"
    storage_client.upload(s3_key, content, mimetype)

    # Determine initial status
    hoje = date.today()
    doc_status = StatusDocumentoEnum.valido
    if data_vencimento:
        dias = (data_vencimento - hoje).days
        if dias < 0:
            doc_status = StatusDocumentoEnum.vencido
        elif dias <= dias_alerta:
            doc_status = StatusDocumentoEnum.a_vencer

    doc = Documento(
        tipo=tipo,
        descricao=descricao,
        status=doc_status,
        s3_key=s3_key,
        nome_arquivo=file.filename,
        data_emissao=data_emissao,
        data_vencimento=data_vencimento,
        dias_alerta=dias_alerta,
        auto_renovavel=auto_renovavel,
        ocr_confianca=ocr_result["confianca"],
        ocr_texto=ocr_result["texto"] if ocr_result["auto_fill"] else None,
        ocr_snippet=ocr_result["snippet"] if not ocr_result["auto_fill"] else None,
        ocr_confirmado=ocr_result["auto_fill"],
        historico_versoes=[],
        created_by=current_user.id,
    )
    db.add(doc)
    await db.flush()
    await db.refresh(doc)
    return DocumentoOut.model_validate(doc)


@router.put("/{documento_id}", response_model=DocumentoOut)
async def atualizar_documento(
    documento_id: uuid.UUID,
    tipo: Optional[TipoDocumentoEnum] = Form(None),
    descricao: Optional[str] = Form(None),
    data_emissao: Optional[date] = Form(None),
    data_vencimento: Optional[date] = Form(None),
    dias_alerta: Optional[int] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_analista()),
):
    from app.storage import storage_client
    from app.services.documento_service import processar_ocr, extrair_datas_ocr

    result = await db.execute(select(Documento).where(Documento.id == documento_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")

    # Preserve version history
    historico = list(doc.historico_versoes or [])
    historico.append({
        "versao": doc.versao,
        "s3_key": doc.s3_key,
        "nome_arquivo": doc.nome_arquivo,
        "data_vencimento": doc.data_vencimento.isoformat() if doc.data_vencimento else None,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })

    if file:
        content = await file.read()
        mimetype = file.content_type or "application/octet-stream"
        ocr_result = await processar_ocr(content, mimetype)

        ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "bin"
        s3_key = f"documentos/{uuid.uuid4()}.{ext}"
        storage_client.upload(s3_key, content, mimetype)

        doc.s3_key = s3_key
        doc.nome_arquivo = file.filename
        doc.ocr_confianca = ocr_result["confianca"]
        doc.ocr_texto = ocr_result["texto"] if ocr_result["auto_fill"] else None
        doc.ocr_snippet = ocr_result["snippet"] if not ocr_result["auto_fill"] else None
        doc.ocr_confirmado = ocr_result["auto_fill"]
        doc.versao = doc.versao + 1

    doc.historico_versoes = historico

    if tipo:
        doc.tipo = tipo
    if descricao:
        doc.descricao = descricao
    if data_emissao is not None:
        doc.data_emissao = data_emissao
    if data_vencimento is not None:
        doc.data_vencimento = data_vencimento
        hoje = date.today()
        dias = (data_vencimento - hoje).days
        if dias < 0:
            doc.status = StatusDocumentoEnum.vencido
        elif dias <= (dias_alerta or doc.dias_alerta):
            doc.status = StatusDocumentoEnum.a_vencer
        else:
            doc.status = StatusDocumentoEnum.valido
        doc.alerta_enviado = False  # Reset alert on new version
    if dias_alerta is not None:
        doc.dias_alerta = dias_alerta

    await db.flush()
    await db.refresh(doc)
    return DocumentoOut.model_validate(doc)


@router.get("/status", response_model=DocumentoStatusResponse)
async def status_documentos(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(Documento))
    docs = result.scalars().all()

    return DocumentoStatusResponse(
        total=len(docs),
        validos=sum(1 for d in docs if d.status == StatusDocumentoEnum.valido),
        a_vencer=sum(1 for d in docs if d.status == StatusDocumentoEnum.a_vencer),
        vencidos=sum(1 for d in docs if d.status == StatusDocumentoEnum.vencido),
        em_renovacao=sum(1 for d in docs if d.status == StatusDocumentoEnum.em_renovacao),
        detalhes=[DocumentoOut.model_validate(d) for d in docs],
    )


@router.post("/{documento_id}/renovar", response_model=RenovacaoResponse)
async def renovar_documento(
    documento_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_analista()),
):
    result = await db.execute(select(Documento).where(Documento.id == documento_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")

    from app.workers.tasks import task_renovar_documento
    task = task_renovar_documento.delay(str(documento_id))

    return RenovacaoResponse(
        documento_id=documento_id,
        task_id=task.id,
        message="Renovação iniciada",
    )
