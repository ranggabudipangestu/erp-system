class ApiError(Exception):
    """
    Custom exception for API errors that maps to the standardized ErrorResponse.
    """
    def __init__(self, code: str, message: str, status_code: int = 400, errors: list[dict] | None = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.errors = errors or []

class ResourceNotFoundError(ApiError):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(
            code="RESOURCE_NOT_FOUND",
            message=message,
            status_code=404,
        )

class UnauthorizedError(ApiError):
    def __init__(self, message: str = "Token invalid or missing"):
        super().__init__(
            code="UNAUTHORIZED",
            message=message,
            status_code=401,
        )

class ForbiddenError(ApiError):
    def __init__(self, message: str = "Forbidden operation"):
        super().__init__(
            code="FORBIDDEN",
            message=message,
            status_code=403,
        )

class InvalidBodyError(ApiError):
    def __init__(self, message: str = "Request body validation failed", errors: list[dict] | None = None):
        super().__init__(
            code="INVALID_BODY",
            message=message,
            status_code=400,
            errors=errors
        )
