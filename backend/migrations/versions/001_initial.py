"""Initial migration - create all tables.

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # usuarios
    op.create_table(
        "usuarios",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("nome", sa.String(200), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("senha_hash", sa.String(255), nullable=False),
        sa.Column(
            "perfil",
            sa.Enum("admin", "gestor", "analista_licitacao", "rh", "financeiro", "readonly", name="perfil_enum"),
            nullable=False,
            server_default="readonly",
        ),
        sa.Column("ativo", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_usuarios_email", "usuarios", ["email"])

    # editais
    op.create_table(
        "editais",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("numero", sa.String(100), nullable=False),
        sa.Column("portal_origem", sa.String(50), nullable=False),
        sa.Column("orgao", sa.String(500), nullable=False),
        sa.Column("objeto", sa.Text, nullable=False),
        sa.Column(
            "modalidade",
            sa.Enum("pregao", "concorrencia", "tomada_de_precos", "convite", "leilao", "dispensa", name="modalidade_enum"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum("novo", "em_analise", "proposta_enviada", "desclassificado", "vencedor", "perdedor", name="status_edital_enum"),
            nullable=False,
            server_default="novo",
        ),
        sa.Column("uf", sa.String(2), nullable=True),
        sa.Column("municipio", sa.String(200), nullable=True),
        sa.Column("valor_estimado", sa.Numeric(18, 2), nullable=True),
        sa.Column("data_abertura", sa.DateTime(timezone=True), nullable=True),
        sa.Column("data_publicacao", sa.DateTime(timezone=True), nullable=True),
        sa.Column("url_edital", sa.String(1000), nullable=True),
        sa.Column("url_portal", sa.String(1000), nullable=True),
        sa.Column("relevancia_score", sa.Integer, nullable=False, server_default="0"),
        sa.Column("notificado", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("historico_status", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("arquivos_s3", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("numero", "portal_origem", name="uq_edital_numero_portal"),
    )

    # filtro_configs
    op.create_table(
        "filtro_configs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("palavras_chave", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("palavras_excluir", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("valor_minimo", sa.Numeric(18, 2), nullable=True),
        sa.Column("valor_maximo", sa.Numeric(18, 2), nullable=True),
        sa.Column("modalidades", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("ufs", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("portais", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("ativo", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # templates
    op.create_table(
        "templates",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("nome", sa.String(200), nullable=False),
        sa.Column("descricao", sa.Text, nullable=True),
        sa.Column("conteudo", sa.Text, nullable=False),
        sa.Column("variaveis", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("tipo", sa.String(50), nullable=False),
        sa.Column("ativo", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # propostas
    op.create_table(
        "propostas",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("edital_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("editais.id"), nullable=False),
        sa.Column("template_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("templates.id"), nullable=True),
        sa.Column("versao", sa.Integer, nullable=False, server_default="1"),
        sa.Column(
            "status",
            sa.Enum("rascunho", "revisao_ia", "aprovada", "enviada", "habilitada", "desclassificada", "vencedora", "perdida", name="status_proposta_enum"),
            nullable=False,
            server_default="rascunho",
        ),
        sa.Column("valor_proposto", sa.Numeric(18, 2), nullable=True),
        sa.Column("descricao_tecnica", sa.Text, nullable=True),
        sa.Column("conteudo_docx_s3", sa.String(1000), nullable=True),
        sa.Column("pacote_s3", sa.String(1000), nullable=True),
        sa.Column("revisao_ia_score", sa.Float, nullable=True),
        sa.Column("revisao_ia_detalhes", postgresql.JSONB, nullable=True),
        sa.Column("revisao_ia_modelo", sa.String(100), nullable=True),
        sa.Column("enviada_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column("protocolo_envio", sa.String(200), nullable=True),
        sa.Column("imutavel", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("alerta_inexequibilidade", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # impugnacoes
    op.create_table(
        "impugnacoes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("edital_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("editais.id"), nullable=False),
        sa.Column(
            "status",
            sa.Enum("rascunho", "revisao_ia", "aprovada", "enviada", "respondida", "indeferida", name="status_impugnacao_enum"),
            nullable=False,
            server_default="rascunho",
        ),
        sa.Column("motivos", sa.Text, nullable=False),
        sa.Column("minuta_docx_s3", sa.String(1000), nullable=True),
        sa.Column("analise_ia", postgresql.JSONB, nullable=True),
        sa.Column("revisao_ia_modelo", sa.String(100), nullable=True),
        sa.Column("prazo_impugnacao", sa.Date, nullable=True),
        sa.Column("alerta_prazo_enviado", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("enviada_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resposta_orgao", sa.Text, nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # documentos
    op.create_table(
        "documentos",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "tipo",
            sa.Enum(
                "certidao_federal", "certidao_estadual", "certidao_municipal",
                "certidao_trabalhista", "certidao_fgts", "contrato_social",
                "balanco", "atestado_capacidade", "procuracao", "outros",
                name="tipo_documento_enum",
            ),
            nullable=False,
        ),
        sa.Column("descricao", sa.String(500), nullable=False),
        sa.Column(
            "status",
            sa.Enum("valido", "a_vencer", "vencido", "em_renovacao", name="status_documento_enum"),
            nullable=False,
            server_default="valido",
        ),
        sa.Column("s3_key", sa.String(1000), nullable=True),
        sa.Column("nome_arquivo", sa.String(500), nullable=True),
        sa.Column("versao", sa.Integer, nullable=False, server_default="1"),
        sa.Column("historico_versoes", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("data_emissao", sa.Date, nullable=True),
        sa.Column("data_vencimento", sa.Date, nullable=True),
        sa.Column("dias_alerta", sa.Integer, nullable=False, server_default="30"),
        sa.Column("alerta_enviado", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("ocr_confianca", sa.Float, nullable=True),
        sa.Column("ocr_texto", sa.Text, nullable=True),
        sa.Column("ocr_snippet", sa.Text, nullable=True),
        sa.Column("ocr_confirmado", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("auto_renovavel", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # funcionarios
    op.create_table(
        "funcionarios",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("nome", sa.String(200), nullable=False),
        sa.Column("cpf", sa.String(14), nullable=False, unique=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("telefone", sa.String(20), nullable=True),
        sa.Column("cargo", sa.String(200), nullable=True),
        sa.Column("departamento", sa.String(200), nullable=True),
        sa.Column("salario_base", sa.Numeric(18, 2), nullable=False),
        sa.Column("banco", sa.String(10), nullable=True),
        sa.Column("agencia", sa.String(10), nullable=True),
        sa.Column("conta", sa.String(20), nullable=True),
        sa.Column("tipo_conta", sa.String(20), nullable=True),
        sa.Column("pix_chave", sa.String(200), nullable=True),
        sa.Column(
            "preferencia_comprovante",
            sa.Enum("email", "whatsapp", "ambos", "nenhum", name="tipo_comprovante_enum"),
            nullable=False,
            server_default="email",
        ),
        sa.Column("ativo", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # folhas
    op.create_table(
        "folhas",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("competencia", sa.String(7), nullable=False),
        sa.Column("sufixo_revisao", sa.Integer, nullable=False, server_default="0"),
        sa.Column(
            "status",
            sa.Enum("rascunho", "calculada", "aprovada", "enviada_banco", "paga", name="status_folha_enum"),
            nullable=False,
            server_default="rascunho",
        ),
        sa.Column("total_bruto", sa.Numeric(18, 2), nullable=True),
        sa.Column("total_descontos", sa.Numeric(18, 2), nullable=True),
        sa.Column("total_liquido", sa.Numeric(18, 2), nullable=True),
        sa.Column("cnab_s3", sa.String(1000), nullable=True),
        sa.Column("aprovada_por", postgresql.UUID(as_uuid=True), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("aprovada_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column("enviada_banco_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column("paga_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("competencia", "sufixo_revisao", name="uq_folha_competencia_revisao"),
    )

    # itens_folha
    op.create_table(
        "itens_folha",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("folha_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("folhas.id"), nullable=False),
        sa.Column("funcionario_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("funcionarios.id"), nullable=False),
        sa.Column("salario_base", sa.Numeric(18, 2), nullable=False),
        sa.Column("outras_verbas", postgresql.JSONB, nullable=True),
        sa.Column("vale_transporte", sa.Numeric(18, 2), nullable=False, server_default="0"),
        sa.Column("vale_refeicao", sa.Numeric(18, 2), nullable=False, server_default="0"),
        sa.Column("horas_extras", sa.Numeric(18, 2), nullable=False, server_default="0"),
        sa.Column("adicionais", postgresql.JSONB, nullable=True),
        sa.Column("inss_funcionario", sa.Numeric(18, 2), nullable=False, server_default="0"),
        sa.Column("irrf", sa.Numeric(18, 2), nullable=False, server_default="0"),
        sa.Column("outros_descontos", postgresql.JSONB, nullable=True),
        sa.Column("valor_bruto", sa.Numeric(18, 2), nullable=False),
        sa.Column("total_descontos", sa.Numeric(18, 2), nullable=False),
        sa.Column("valor_liquido", sa.Numeric(18, 2), nullable=False),
        sa.Column("holerite_s3", sa.String(1000), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # log_envio_comprovantes
    op.create_table(
        "log_envio_comprovantes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("item_folha_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("itens_folha.id"), nullable=False),
        sa.Column("funcionario_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("funcionarios.id"), nullable=False),
        sa.Column("canal", sa.Enum("email", "whatsapp", name="canal_envio_enum"), nullable=True),
        sa.Column(
            "status",
            sa.Enum("pendente", "enviado", "falhou", "sem_canal", name="status_envio_enum"),
            nullable=False,
            server_default="pendente",
        ),
        sa.Column("pdf_s3", sa.String(1000), nullable=True),
        sa.Column("tentativas", sa.Integer, nullable=False, server_default="0"),
        sa.Column("erro_detalhe", sa.Text, nullable=True),
        sa.Column("enviado_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reenvio_manual", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # tabela_irrf
    op.create_table(
        "tabela_irrf",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("faixa_min", sa.Numeric(18, 2), nullable=False),
        sa.Column("faixa_max", sa.Numeric(18, 2), nullable=True),
        sa.Column("aliquota", sa.Numeric(5, 4), nullable=False),
        sa.Column("deducao", sa.Numeric(18, 2), nullable=False),
        sa.Column("vigencia_inicio", sa.Date, nullable=False),
        sa.Column("vigencia_fim", sa.Date, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # tabela_inss
    op.create_table(
        "tabela_inss",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("faixa_min", sa.Numeric(18, 2), nullable=False),
        sa.Column("faixa_max", sa.Numeric(18, 2), nullable=True),
        sa.Column("aliquota", sa.Numeric(5, 4), nullable=False),
        sa.Column("vigencia_inicio", sa.Date, nullable=False),
        sa.Column("vigencia_fim", sa.Date, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # feriados_nacionais
    op.create_table(
        "feriados_nacionais",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("data", sa.Date, nullable=False),
        sa.Column("descricao", sa.String(200), nullable=False),
        sa.Column("uf", sa.String(2), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_feriados_nacionais_data", "feriados_nacionais", ["data"])

    # adaptadores_portal
    op.create_table(
        "adaptadores_portal",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("portal", sa.String(50), nullable=False, unique=True),
        sa.Column("seletores", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("endpoint_base", sa.String(500), nullable=False),
        sa.Column("tipo_autenticacao", sa.String(50), nullable=False, server_default="none"),
        sa.Column("ativo", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("adaptadores_portal")
    op.drop_table("feriados_nacionais")
    op.drop_table("tabela_inss")
    op.drop_table("tabela_irrf")
    op.drop_table("log_envio_comprovantes")
    op.drop_table("itens_folha")
    op.drop_table("folhas")
    op.drop_table("funcionarios")
    op.drop_table("documentos")
    op.drop_table("impugnacoes")
    op.drop_table("propostas")
    op.drop_table("templates")
    op.drop_table("filtro_configs")
    op.drop_table("editais")
    op.drop_table("usuarios")

    # Drop enums
    for enum_name in [
        "perfil_enum", "modalidade_enum", "status_edital_enum",
        "status_proposta_enum", "status_impugnacao_enum",
        "tipo_documento_enum", "status_documento_enum",
        "tipo_comprovante_enum", "status_folha_enum",
        "canal_envio_enum", "status_envio_enum",
    ]:
        op.execute(f"DROP TYPE IF EXISTS {enum_name}")
