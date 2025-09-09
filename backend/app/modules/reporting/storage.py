import os
from abc import ABC, abstractmethod
from pathlib import Path
from typing import BinaryIO

from minio import Minio
from minio.error import S3Error


class StorageAdapter(ABC):
    """Abstract base class for storage adapters."""

    @abstractmethod
    def save(self, file_path: str, file_content: BinaryIO) -> str:
        """Save file content to storage and return the file path."""
        pass

    @abstractmethod
    def load(self, file_path: str) -> bytes:
        """Load file content from storage."""
        pass

    @abstractmethod
    def delete(self, file_path: str) -> bool:
        """Delete file from storage."""
        pass

    @abstractmethod
    def exists(self, file_path: str) -> bool:
        """Check if file exists in storage."""
        pass


class LocalStorage(StorageAdapter):
    """Local filesystem storage implementation."""

    def __init__(self, base_path: str = "storage/templates"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def save(self, file_path: str, file_content: BinaryIO) -> str:
        """Save file to local filesystem."""
        full_path = self.base_path / file_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(full_path, "wb") as f:
            f.write(file_content.read())
        
        return str(full_path.relative_to(self.base_path))

    def load(self, file_path: str) -> bytes:
        """Load file from local filesystem."""
        full_path = self.base_path / file_path
        
        print("LOADING FILE FROM", full_path)
        if not full_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        with open(full_path, "rb") as f:
            return f.read()

    def delete(self, file_path: str) -> bool:
        """Delete file from local filesystem."""
        full_path = self.base_path / file_path
        
        try:
            full_path.unlink()
            return True
        except FileNotFoundError:
            return False

    def exists(self, file_path: str) -> bool:
        """Check if file exists in local filesystem."""
        full_path = self.base_path / file_path
        return full_path.exists()


class MinIOStorage(StorageAdapter):
    """MinIO/S3 compatible storage implementation."""

    def __init__(
        self,
        endpoint: str,
        access_key: str,
        secret_key: str,
        bucket_name: str,
        secure: bool = True
    ):
        self.bucket_name = bucket_name
        self.client = Minio(
            endpoint,
            access_key=access_key,
            secret_key=secret_key,
            secure=secure
        )
        
        # Ensure bucket exists
        try:
            if not self.client.bucket_exists(bucket_name):
                self.client.make_bucket(bucket_name)
        except S3Error as e:
            raise RuntimeError(f"Failed to initialize MinIO bucket: {e}")

    def save(self, file_path: str, file_content: BinaryIO) -> str:
        """Save file to MinIO."""
        try:
            # Reset file pointer to beginning
            file_content.seek(0)
            
            # Get file size
            file_content.seek(0, 2)  # Seek to end
            file_size = file_content.tell()
            file_content.seek(0)  # Reset to beginning
            
            self.client.put_object(
                self.bucket_name,
                file_path,
                file_content,
                file_size
            )
            
            return file_path
        except S3Error as e:
            raise RuntimeError(f"Failed to save file to MinIO: {e}")

    def load(self, file_path: str) -> bytes:
        """Load file from MinIO."""
        try:
            response = self.client.get_object(self.bucket_name, file_path)
            content = response.read()
            response.close()
            response.release_conn()
            return content
        except S3Error as e:
            if e.code == "NoSuchKey":
                raise FileNotFoundError(f"File not found: {file_path}")
            raise RuntimeError(f"Failed to load file from MinIO: {e}")

    def delete(self, file_path: str) -> bool:
        """Delete file from MinIO."""
        try:
            self.client.remove_object(self.bucket_name, file_path)
            return True
        except S3Error as e:
            if e.code == "NoSuchKey":
                return False
            raise RuntimeError(f"Failed to delete file from MinIO: {e}")

    def exists(self, file_path: str) -> bool:
        """Check if file exists in MinIO."""
        try:
            self.client.stat_object(self.bucket_name, file_path)
            return True
        except S3Error as e:
            if e.code == "NoSuchKey":
                return False
            raise RuntimeError(f"Failed to check file existence in MinIO: {e}")


def get_storage_adapter() -> StorageAdapter:
    """Factory function to get the appropriate storage adapter based on environment."""
    
    # Check if MinIO credentials are available
    minio_endpoint = os.getenv("MINIO_ENDPOINT")
    minio_access_key = os.getenv("MINIO_ACCESS_KEY")
    minio_secret_key = os.getenv("MINIO_SECRET_KEY")
    minio_bucket = os.getenv("MINIO_BUCKET", "erp-templates")
    
    if minio_endpoint and minio_access_key and minio_secret_key:
        # Use MinIO storage
        # For development/internal Docker networks, disable SSL
        secure = (
            not minio_endpoint.startswith("localhost") and 
            not minio_endpoint.startswith("127.0.0.1") and
            not minio_endpoint.startswith("minio:")
        )
        return MinIOStorage(
            endpoint=minio_endpoint,
            access_key=minio_access_key,
            secret_key=minio_secret_key,
            bucket_name=minio_bucket,
            secure=secure
        )
    else:
        # Fallback to local storage for development
        return LocalStorage()