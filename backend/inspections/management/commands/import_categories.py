import csv
from django.core.management.base import BaseCommand
from inspections.models import Inspection, InspectionItem

class Command(BaseCommand):
    help = 'Imports categories from CSV into a clean template inspection with legal distinction'

    def handle(self, *args, **kwargs):
        # 1. Clear out the old template data to avoid duplicates/messy fields
        self.stdout.write("Cleaning up old template data...")
        Inspection.objects.filter(property_address="TEMPLATE MASTER").delete()

        # 2. Create a fresh "TEMPLATE MASTER"
        template_inspection = Inspection.objects.create(
            property_address="TEMPLATE MASTER",
            client_name="SYSTEM",
            inspector_name="SYSTEM",
            inspection_status='active'
        )

        file_path = 'Category_Map.csv'
        
        try:
            with open(file_path, mode='r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                count = 0
                for row in reader:
                    sub_cat = row['Sub_Category'].strip()
                    
                    # LOGIC: Identify if this row is a "Question/Disclosure" vs a "Physical Item"
                    # We check for ending punctuation or starting keywords from your specific sheet
                    is_question = any(sub_cat.endswith(x) for x in [':', '?']) or \
                                  any(sub_cat.startswith(x) for x in [
                                      'Describe', 'Methods', 'Visible', 
                                      'Observe', 'Absence', 'Location of','Any',
                                        'Condition of', 'Type of', 'Evidence of'
                                  ])

                    # 3. Create the item
                    InspectionItem.objects.create(
                        inspection=template_inspection,
                        category=row['Category'],
                        sub_category=sub_cat,
                        field_type='QUESTION' if is_question else 'FINDING',
                        # Legally critical: If it's a question, status stays NULL/Blank
                        status=None if is_question else 'NI', 
                        answer=None, # Toggles start unselected
                        item_name='',
                        location=''
                    )
                    count += 1
                
                self.stdout.write(self.style.SUCCESS(
                    f'Successfully imported {count} items. '
                    f'Legal Check: Categories are split into Findings and Questions.'
                ))
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'File not found at {file_path}. Make sure it is in the backend/ folder.'))