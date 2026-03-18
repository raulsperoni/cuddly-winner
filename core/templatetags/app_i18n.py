from django import template

from core.i18n import translate

register = template.Library()


@register.simple_tag(takes_context=True)
def app_t(context, key, **kwargs):
    request = context.get('request')
    language = getattr(request, 'cw_language', 'en') if request else 'en'
    return translate(language, key, **kwargs)
