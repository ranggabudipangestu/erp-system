from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session


engine = None
SessionLocal: sessionmaker[Session] | None = None


class Base(DeclarativeBase):
    pass


def init_engine_and_session(database_url: str) -> None:
    global engine, SessionLocal
    if engine is None:
        engine = create_engine(database_url, future=True)
        # Avoid expiring ORM instances on commit so returned entities
        # can be safely accessed after the session context closes.
        SessionLocal = sessionmaker(
            bind=engine,
            autocommit=False,
            autoflush=False,
            expire_on_commit=False,
            future=True,
        )


@contextmanager
def session_scope() -> Generator[Session, None, None]:
    if SessionLocal is None:
        raise RuntimeError("SessionLocal not initialized; call init_engine_and_session first")
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
