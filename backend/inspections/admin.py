from django.contrib import admin
from .models import Inspection, InspectionItem, Photo

class PhotoInline(admin.TabularInline):
    model = Photo
    extra = 1

class InspectionItemInline(admin.StackedInline):
    model = InspectionItem
    extra = 0
    # We organize the fields so it's clear which ones to use
    fieldsets = (
        ('Categorization', {
            'fields': ('category', 'sub_category', 'field_type')
        }),
        ('Finding Details (Physical Items)', {
            'fields': ('item_name', 'location', 'status', 'note'),
            'description': 'Fill these out if field_type is FINDING'
        }),
        ('Disclosure Details (Questions)', {
            'fields': ('answer',),
            'description': 'Fill this out if field_type is QUESTION'
        }),
    )

@admin.register(Inspection)
class InspectionAdmin(admin.ModelAdmin):
    list_display = ('property_address', 'client_name', 'date_of_inspection', 'inspection_status')
    inlines = [InspectionItemInline]

@admin.register(InspectionItem)
class InspectionItemAdmin(admin.ModelAdmin):
    # Added 'field_type' and 'answer' to the main list view
    list_display = ('sub_category', 'field_type', 'status', 'answer', 'location', 'item_name')
    list_filter = ('category', 'field_type', 'status')
    search_fields = ('sub_category', 'item_name', 'location')
    inlines = [PhotoInline]