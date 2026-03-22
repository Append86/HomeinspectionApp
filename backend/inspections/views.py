from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Inspection, InspectionItem
from .serializers import InspectionSerializer, InspectionItemSerializer

class InspectionViewSet(viewsets.ModelViewSet):
    serializer_class = InspectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users only see inspections they own
        return Inspection.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def create_from_template(self, request):
        # 1. Find the global template
        template = Inspection.objects.filter(property_address="TEMPLATE MASTER").first()
        
        if not template:
            return Response({"error": "Template Master not found"}, status=status.HTTP_404_NOT_FOUND)

        # 2. Create a new inspection for this specific user
        new_inspection = Inspection.objects.create(
            user=request.user,
            property_address=request.data.get('property_address', 'New Inspection'),
            client_name=request.data.get('client_name', 'New Client'),
            inspection_status='active'
        )

        # 3. Clone all items from the master to this new inspection
        items_to_create = [
            InspectionItem(
                inspection=new_inspection,
                category=item.category,
                sub_category=item.sub_category,
                field_type=item.field_type,
                status="Not Inspected"
            ) for item in template.items.all()
        ]
        InspectionItem.objects.bulk_create(items_to_create)

        serializer = self.get_serializer(new_inspection)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class InspectionItemViewSet(viewsets.ModelViewSet):
    serializer_class = InspectionItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return InspectionItem.objects.filter(inspection__user=self.request.user)