from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Inspection, InspectionItem, Photo
from .serializers import InspectionSerializer, InspectionItemSerializer, PhotoSerializer
from .utils import render_to_pdf
from django.http import HttpResponse
from django.template.loader import render_to_string
from weasyprint import HTML
from collections import defaultdict

class InspectionViewSet(viewsets.ModelViewSet):
    serializer_class = InspectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users only see inspections they own AND we exclude the master template
        return Inspection.objects.filter(
            user=self.request.user
        ).exclude(
            property_address="TEMPLATE MASTER"
        )

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
    
    @action(detail=True, methods=['get'])
    def download_report(self, request, pk=None):
    
        inspection = self.get_object()
        
        # 1. Fetch all items
        items = inspection.items.all().order_by('category')

        # --- NEW CODE START ---
        # 2. FILTERING: Create a list of "Actionable" items for the Executive Summary
        # This looks at the status of each item and grabs everything except "No Defects" or "Not Inspected"
        summary_items = [
            item for item in items 
            if item.status not in ['NI', 'NDO', 'NA', 'YES', 'NO']
        ]
        # --- NEW CODE END ---

        # 3. GROUPING: Organizes items by category for the main findings section
        report_data = defaultdict(list)
        for item in items:
            report_data[item.category].append(item)

        # 4. CONTEXT: Now passing 'summary_items' so the template can print that table
        context = {
            'inspection': inspection,
            'report_data': dict(report_data),
            'summary_items': summary_items, # <--- Add this line
        }

        try:
            # 5. WEASYPRINT RENDERING
            html_string = render_to_string('report_template.html', context)
            
            html = HTML(string=html_string, base_url=request.build_absolute_uri())
            pdf_file = html.write_pdf()

            response = HttpResponse(pdf_file, content_type='application/pdf')
            filename = f"Report_{inspection.property_address.replace(' ', '_')}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response

        except Exception as e:
            print(f"PDF Error: {e}")
            return Response({"error": "Failed to generate PDF"}, status=500)
        
    


class InspectionItemViewSet(viewsets.ModelViewSet):
    serializer_class = InspectionItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return InspectionItem.objects.filter(inspection__user=self.request.user)
    
class PhotoViewSet(viewsets.ModelViewSet):
    serializer_class = PhotoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return photos belonging to the current user's inspections
        return Photo.objects.filter(item__inspection__user=self.request.user)