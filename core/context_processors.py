from core.i18n import translate


def app_i18n(request):
    language = getattr(request, 'cw_language', 'en')

    def app_t(key, **kwargs):
        return translate(language, key, **kwargs)

    return {
        'current_language': language,
        'app_t': app_t,
    }
