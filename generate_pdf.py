import markdown
from xhtml2pdf import pisa

with open('documentation.md', 'r') as f:
    md_text = f.read()

# Convert markdown to html
html = markdown.markdown(md_text, extensions=['fenced_code'])

# Add some basic CSS for fonts and page breaks
full_html = f"""
<html>
<head>
<style>
    @page {{
        size: a4 portrait;
        margin: 2cm;
    }}
    body {{
        font-family: Helvetica, Arial, sans-serif;
        font-size: 12pt;
        line-height: 1.6;
    }}
    h1 {{
        font-size: 24pt;
        color: #2c3e50;
        border-bottom: 2px solid #34495e;
        padding-bottom: 5px;
    }}
    h2 {{
        font-size: 18pt;
        color: #2980b9;
        margin-top: 20px;
    }}
    h3 {{
        font-size: 14pt;
        color: #16a085;
    }}
    p {{
        margin-bottom: 10px;
        text-align: justify;
    }}
    pre {{
        background-color: #f8f9fa;
        padding: 10px;
        border: 1px solid #e9ecef;
        border-radius: 4px;
        font-size: 10pt;
        font-family: monospace;
    }}
    code {{
        background-color: #f8f9fa;
        font-family: monospace;
        font-size: 10pt;
    }}
    ul {{
        margin-bottom: 15px;
    }}
    li {{
        margin-bottom: 5px;
    }}
</style>
</head>
<body>
{html}
</body>
</html>
"""

# Write to pdf
with open('ScholarRAG_Documentation.pdf', 'w+b') as f:
    pisa_status = pisa.CreatePDF(full_html, dest=f)

if pisa_status.err:
    print("Error creating PDF")
else:
    print("PDF created successfully as ScholarRAG_Documentation.pdf")
