from django.template.loader import get_template
from weasyprint import HTML
from django.conf import settings
from io import BytesIO

def render_to_pdf(template_src, context_dict={}):
    """
    Renders a Django template into a PDF using WeasyPrint.
    """
    template = get_template(template_src)
    html_string = template.render(context_dict)
    
    result = BytesIO()
    
    # WeasyPrint handles the conversion
    # base_url allows it to resolve relative paths if needed
    html = HTML(string=html_string, base_url=settings.MEDIA_URL)
    html.write_pdf(target=result)
    
    return result.getvalue()