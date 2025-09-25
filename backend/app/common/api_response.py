from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse


def _generate_trace_id(trace_id: Optional[str] = None) -> str:
    return trace_id or uuid4().hex


def _success_payload(
    result: Any,
    metadata: Optional[Dict[str, Any]] = None,
    trace_id: Optional[str] = None,
) -> Dict[str, Any]:
    return {
        "success": True,
        "traceId": _generate_trace_id(trace_id),
        "error": {},
        "metadata": metadata or {},
        "result": result,
    }


def _error_payload(
    code: str,
    message: str,
    *,
    errors: Optional[List[Any]] = None,
    metadata: Optional[Dict[str, Any]] = None,
    result: Optional[Any] = None,
    trace_id: Optional[str] = None,
) -> Dict[str, Any]:
    return {
        "success": False,
        "traceId": _generate_trace_id(trace_id),
        "error": {
            "code": code,
            "message": message,
            "errors": errors or [],
        },
        "metadata": metadata or {},
        "result": result if result is not None else {},
    }


def success_response(
    result: Any,
    *,
    metadata: Optional[Dict[str, Any]] = None,
    trace_id: Optional[str] = None,
    status_code: int = 200,
) -> JSONResponse:
    payload = _success_payload(result, metadata=metadata, trace_id=trace_id)
    return JSONResponse(status_code=status_code, content=jsonable_encoder(payload))


def error_response(
    code: str,
    message: str,
    *,
    errors: Optional[List[Any]] = None,
    metadata: Optional[Dict[str, Any]] = None,
    result: Optional[Any] = None,
    trace_id: Optional[str] = None,
    status_code: int = 400,
) -> JSONResponse:
    payload = _error_payload(
        code,
        message,
        errors=errors,
        metadata=metadata,
        result=result,
        trace_id=trace_id,
    )
    return JSONResponse(status_code=status_code, content=jsonable_encoder(payload))
