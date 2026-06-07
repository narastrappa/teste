"""MinIO/S3 client wrapper."""
import logging
from typing import Optional

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from app.config import settings

logger = logging.getLogger(__name__)


class StorageClient:
    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            self._client = boto3.client(
                "s3",
                endpoint_url=f"{'https' if settings.minio_secure else 'http'}://{settings.minio_endpoint}",
                aws_access_key_id=settings.minio_access_key,
                aws_secret_access_key=settings.minio_secret_key,
                region_name=settings.aws_region,
                config=Config(signature_version="s3v4"),
            )
            self._ensure_bucket()
        return self._client

    def _ensure_bucket(self) -> None:
        try:
            self._client.head_bucket(Bucket=settings.minio_bucket)
        except ClientError:
            try:
                self._client.create_bucket(Bucket=settings.minio_bucket)
                logger.info(f"Bucket '{settings.minio_bucket}' criado")
            except Exception as e:
                logger.error(f"Erro ao criar bucket: {e}")

    def upload(self, key: str, content: bytes, content_type: str = "application/octet-stream") -> str:
        import io
        client = self._get_client()
        client.put_object(
            Bucket=settings.minio_bucket,
            Key=key,
            Body=io.BytesIO(content),
            ContentType=content_type,
        )
        return key

    def download(self, key: str) -> bytes:
        client = self._get_client()
        response = client.get_object(Bucket=settings.minio_bucket, Key=key)
        return response["Body"].read()

    def delete(self, key: str) -> None:
        client = self._get_client()
        client.delete_object(Bucket=settings.minio_bucket, Key=key)

    def get_presigned_url(self, key: str, expiration: int = 3600) -> str:
        client = self._get_client()
        return client.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.minio_bucket, "Key": key},
            ExpiresIn=expiration,
        )

    def file_exists(self, key: str) -> bool:
        client = self._get_client()
        try:
            client.head_object(Bucket=settings.minio_bucket, Key=key)
            return True
        except ClientError:
            return False


storage_client = StorageClient()
