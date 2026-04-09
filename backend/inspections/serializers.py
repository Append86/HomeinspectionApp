from rest_framework import serializers
from .models import Inspection, InspectionItem, Photo

class PhotoSerializer(serializers.ModelSerializer):
    # This force-calculates the full URL including the DigitalOcean domain
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Photo
        fields = ['id', 'item', 'image', 'caption', 'uploaded_at']

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url  # Django-storages will handle the DO link here
        return None

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
        