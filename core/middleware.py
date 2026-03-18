from core.i18n import LANGUAGE_COOKIE, get_language_from_request


class LanguageCookieMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.cw_language = get_language_from_request(request)
        response = self.get_response(request)
        if request.COOKIES.get(LANGUAGE_COOKIE) != request.cw_language:
            response.set_cookie(
                LANGUAGE_COOKIE,
                request.cw_language,
                max_age=60 * 60 * 24 * 365,
                samesite='Lax',
            )
        return response
