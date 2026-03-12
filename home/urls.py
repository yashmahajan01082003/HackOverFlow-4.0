"""
URL configuration for virtualOs project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

from . import views

urlpatterns = [
    path('', views.index , name='index'),
    path('openDesktopD/<str:fName>', views.openDesktopD , name='openDesktopD'),
    path('openParti', views.openParti, name='openParti'),
    path('BSIcons/<str:fName>', views.BSIcons, name='BSIcons'),
    path('openPartiSpec/<str:fName>', views.openPartiSpec, name='openPartiSpec'),
    path('openPartiSpec2/<str:fName0>/<str:fName1>/', views.openPartiSpec2, name='openPartiSpec2'),
    path('newD', views.newD, name='newD'),
    path('newD2/<str:fName0>/', views.newD2, name='newD2'),
    path('activateVM', views.activateVM, name='activateVM'),
    path('activateRM', views.activateRM, name='activateRM'),
    path('execHand', views.execHand, name='execHand'),
    path('execHandTab', views.execHandTab, name='execHandTab'),
    ] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
