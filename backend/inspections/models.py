from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Professional Details
    inspector_name = models.CharField(max_length=255, blank=True)
    inspector_license_number = models.CharField(max_length=100, blank=True)
    license_expiration_date = models.DateField(null=True, blank=True)
    
    # Company Details
    company_name = models.CharField(max_length=200, blank=True)
    company_address = models.CharField(max_length=500, blank=True)
    company_phone = models.CharField(max_length=20, blank=True) # Added
    company_email = models.EmailField(blank=True)             # Added
    
    # Branding
    company_logo = models.ImageField(upload_to='logos/', blank=True, null=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"
    
# Automatically create a profile when a user is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
    
class Inspection(models.Model):

    # Link every inspection to a specific user
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='inspections', default=1)
    # (Keep your existing Property & Client Info fields here)
    property_address = models.CharField(max_length=500)
    client_name = models.CharField(max_length=200)
    client_email = models.EmailField(blank=True, null=True)
    date_of_inspection = models.DateField(null=True, blank=True)
    inspection_time = models.TimeField(null=True, blank=True)
    inspection_company = models.CharField(max_length=200, default="Your Company Name")
    inspection_company_address = models.CharField(max_length=500, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    company_email = models.EmailField(blank=True)
    inspector_name = models.CharField(max_length=200)
    inspector_license_number = models.CharField(max_length=100, blank=True)
    license_expiration_date = models.DateField(null=True, blank=True)
    signed_agreement = models.BooleanField(default=False)
    weather_conditions = models.CharField(max_length=200, blank=True)
    in_attendance = models.CharField(max_length=200, blank=True)
    occupancy = models.CharField(max_length=100, blank=True)
    building_type = models.CharField(max_length=100, blank=True)
    year_built = models.IntegerField(null=True, blank=True)
    
    STATUS_CHOICES = [
        ('active', 'In Progress'),
        ('final', 'Complete'),
    ]
    inspection_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.property_address} - {self.client_name}"

class InspectionItem(models.Model):
    # Status is for physical findings (Toilet, Roof, etc.)
    # We add 'blank=True, null=True' so it can be empty for questions
    STATUS_CHOICES = [
        ('NI', 'Not Inspected'),
        ('NDO', 'No Defects Observed'),
        ('MON', 'Monitor'),
        ('EOSL', 'Near End of Service Life'),
        ('MINOR', 'Minor Defect'),
        ('SIG', 'Significantly Deficient'),
        ('COS', 'Cosmetic Defect'),
        ('NOTE', 'See Notes'),
        ('YES', 'Yes'),
        ('NO', 'No'),
        ('NA', 'N/A'),
    ]

    ANSWER_CHOICES = [
        ('YES', 'Yes'),
        ('NO', 'No'),
        ('NA', 'N/A'),
    ]

    # This helps the frontend know which UI to show
    FIELD_TYPE_CHOICES = [
        ('FINDING', 'Physical Item (Uses Status)'),
        ('QUESTION', 'Disclosure/Information (Uses Yes/No/NA)'),
    ]

    inspection = models.ForeignKey(Inspection, related_name='items', on_delete=models.CASCADE)
    category = models.CharField(max_length=100)
    sub_category = models.CharField(max_length=255)
    
    # Logic Choice
    field_type = models.CharField(max_length=10, choices=FIELD_TYPE_CHOICES, default='FINDING')
    
    # These are now optional depending on field_type
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, blank=True, null=True)
    answer = models.CharField(max_length=10, choices=ANSWER_CHOICES, blank=True, null=True)
    
    item_name = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=200, blank=True)
    note = models.TextField(blank=True)

    def __str__(self):
        return f"{self.sub_category[:40]}..."

class Photo(models.Model):
    item = models.ForeignKey(InspectionItem, related_name='photos', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='inspections/%Y/%m/%d/')
    # NEW FIELD:
    caption = models.CharField(max_length=255, blank=True, null=True) 
    uploaded_at = models.DateTimeField(auto_now_add=True)


