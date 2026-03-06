import uuid
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.exceptions import ApiError
from app.core.response import ApiResponse, ErrorResponse, ErrorDetail

def register_exception_handlers(app: FastAPI):
    @app.exception_handler(ApiError)
    async def api_error_handler(request: Request, exc: ApiError):
        trace_id = _get_trace_id(request)
        error_details = [ErrorDetail(field=e.get("field", ""), message=e.get("message", "")) for e in exc.errors]
        
        envelope = ApiResponse(
             traceId=trace_id,
             error=ErrorResponse(
                 code=exc.code,
                 message=exc.message,
                 errors=error_details
             )
        )
        return JSONResponse(status_code=exc.status_code, content=envelope.model_dump())

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        trace_id = _get_trace_id(request)
        
        errors = []
        for err in exc.errors():
            field = ".".join([str(loc) for loc in err["loc"] if loc != "body"])
            message = err["msg"]
            errors.append(ErrorDetail(field=field, message=message))
            
        envelope = ApiResponse(
             traceId=trace_id,
             error=ErrorResponse(
                 code="INVALID_BODY",
                 message="Request validation failed",
                 errors=errors
             )
        )
        return JSONResponse(status_code=400, content=envelope.model_dump())

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        trace_id = _get_trace_id(request)
        envelope = ApiResponse(
             traceId=trace_id,
             error=ErrorResponse(
                 code="HTTP_ERROR",
                 message=str(exc.detail),
                 errors=[]
             )
        )
        return JSONResponse(status_code=exc.status_code, content=envelope.model_dump())

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        trace_id = _get_trace_id(request)
        envelope = ApiResponse(
             traceId=trace_id,
             error=ErrorResponse(
                 code="INTERNAL_SERVER_ERROR",
                 message="An unexpected error occurred",
                 errors=[]
             )
        )
        return JSONResponse(status_code=500, content=envelope.model_dump())

def _get_trace_id(request: Request) -> str:
    # We can try to get Request-Id from headers, otherwise generate a new UUID
    header_request_id = request.headers.get("Request-Id")
    if header_request_id:
        return header_request_id
    
    # Check if we already attach traceId to state in a middleware
    if hasattr(request.state, "trace_id"):
        return request.state.trace_id
        
    return str(uuid.uuid4())
