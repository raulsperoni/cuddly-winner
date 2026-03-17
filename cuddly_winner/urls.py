from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('allauth.urls')),
    path('health/', lambda r: HttpResponse('ok')),
    path('api/v1/', include('core.api.urls')),
    path('', include('core.urls')),
]
