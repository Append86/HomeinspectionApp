from rest_framework import viewsets
from .models import Inspection
from .serializers import InspectionSerializer

class InspectionViewSet(viewsets.ModelViewSet):
    queryset = Inspection.objects.all()
    serializer_class = InspectionSerializer
