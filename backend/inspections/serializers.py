from rest_framework import serializers
from .models import Inspection, InspectionItem, Photo

class PhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Photo
        fields = ['id', 'image', 'caption']

class InspectionItemSerializer(serializers.ModelSerializer):
    photos = PhotoSerializer(many=True, read_only=True)
    # Ensure inspection is included as a primary key field so the API can link it
    inspection = serializers.PrimaryKeyRelatedField(queryset=Inspection.objects.all())

    class Meta:
        model = InspectionItem
        fields = [
            'id', 'inspection', 'category', 'sub_category', 'field_type', 
            'status', 'answer', 'item_name', 'location', 'note', 'photos'
        ]

class InspectionSerializer(serializers.ModelSerializer):
    items = InspectionItemSerializer(many=True, read_only=True)

    class Meta:
        model = Inspection
        fields = '__all__'
        