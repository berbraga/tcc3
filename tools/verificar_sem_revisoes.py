from pathlib import Path
from zipfile import ZipFile
from lxml import etree
from PIL import Image, ImageChops

root = Path(r'C:\Users\berna\Documentos\TCC3')
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with ZipFile(root / 'TCC_3_BernardoBraga_final_sem_revisoes.docx') as z:
    remaining = 0
    for name in z.namelist():
        if name.startswith('word/') and name.endswith('.xml'):
            xml = etree.fromstring(z.read(name))
            remaining += len(xml.xpath('//w:ins|//w:del|//w:moveTo|//w:moveFrom|//w:rPrChange|//w:pPrChange|//w:trackRevisions', namespaces=ns))
            if name == 'word/document.xml':
                for p in xml.xpath('//w:p', namespaces=ns):
                    text = ''.join(p.xpath('.//w:t/text()', namespaces=ns))
                    if text.startswith('Na análise dos trabalhos correlatos'):
                        print(text)
    print('REVISION_ELEMENTS=', remaining)
    assert remaining == 0

pages = sorted((root / '.docx_qa_sem_revisoes').glob('page-*.png'))
print('PAGES=', len(pages))
changed = []
for page in pages:
    previous = root / '.docx_qa_uml_final4' / page.name
    if not previous.exists() or ImageChops.difference(Image.open(page).convert('RGB'), Image.open(previous).convert('RGB')).getbbox():
        changed.append(page.name)
print('CHANGED_PAGES=', changed)
