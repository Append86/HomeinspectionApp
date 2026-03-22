from rest_framework import viewsets, permissions
from .models import Inspection, InspectionItem
from .serializers import InspectionSerializer, InspectionItemSerializer

class InspectionViewSet(viewsets.ModelViewSet):
    serializer_class = InspectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users only see inspections they own
        return Inspection.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Automatically link the inspection to the logged-in user
        serializer.save(user=self.request.user)

class InspectionItemViewSet(viewsets.ModelViewSet):
    serializer_class = InspectionItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users only see items belonging to their own inspections
        return InspectionItem.objects.filter(inspection__user=self.request.user)