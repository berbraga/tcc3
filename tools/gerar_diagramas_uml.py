from __future__ import annotations

from pathlib import Path
from math import atan2, cos, sin, pi
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(r"C:\Users\berna\Documentos\TCC3")
OUT = ROOT / "diagramas_uml"
OUT.mkdir(exist_ok=True)

INK = "#172033"
BLUE = "#DCEAF7"
BLUE2 = "#EEF5FB"
ACCENT = "#2F5D8A"
GRAY = "#F2F4F7"
MID = "#667085"
WHITE = "#FFFFFF"
GREEN = "#E8F5E9"
RED = "#FDECEC"

FONT_REG = Path(r"C:\Windows\Fonts\arial.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\arialbd.ttf")
FONT_ITALIC = Path(r"C:\Windows\Fonts\ariali.ttf")


def font(size: int, bold: bool = False, italic: bool = False):
    path = FONT_BOLD if bold else FONT_ITALIC if italic else FONT_REG
    return ImageFont.truetype(str(path), size)


def canvas(w=2200, h=1500):
    im = Image.new("RGB", (w, h), WHITE)
    return im, ImageDraw.Draw(im)


def text_center(draw, xy, value, size=34, bold=False, fill=INK):
    f = font(size, bold=bold)
    box = draw.multiline_textbbox((0, 0), value, font=f, align="center", spacing=5)
    x = xy[0] - (box[2] - box[0]) / 2
    y = xy[1] - (box[3] - box[1]) / 2
    draw.multiline_text((x, y), value, font=f, fill=fill, align="center", spacing=5)


def wrap(draw, text: str, width: int, f) -> str:
    words = text.split()
    lines, current = [], ""
    for word in words:
        trial = word if not current else f"{current} {word}"
        if draw.textlength(trial, font=f) <= width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return "\n".join(lines)


def rounded(draw, box, label, *, fill=BLUE2, outline=INK, radius=24, size=32, bold=False, width=3):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)
    text_center(draw, ((box[0] + box[2]) / 2, (box[1] + box[3]) / 2), label, size=size, bold=bold)


def line(draw, points, *, fill=INK, width=4, dash=None):
    if not dash:
        draw.line(points, fill=fill, width=width, joint="curve")
        return
    for a, b in zip(points, points[1:]):
        x1, y1 = a
        x2, y2 = b
        dist = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5
        if dist == 0:
            continue
        ux, uy = (x2 - x1) / dist, (y2 - y1) / dist
        pos = 0.0
        while pos < dist:
            end = min(pos + dash[0], dist)
            draw.line((x1 + ux * pos, y1 + uy * pos, x1 + ux * end, y1 + uy * end), fill=fill, width=width)
            pos += dash[0] + dash[1]


def arrow_head(draw, start, end, *, fill=INK, width=4, size=22, open_head=False):
    ang = atan2(end[1] - start[1], end[0] - start[0])
    p1 = (end[0] - size * cos(ang - pi / 6), end[1] - size * sin(ang - pi / 6))
    p2 = (end[0] - size * cos(ang + pi / 6), end[1] - size * sin(ang + pi / 6))
    if open_head:
        draw.line((p1, end, p2), fill=fill, width=width)
    else:
        draw.polygon((end, p1, p2), fill=fill)


def arrow(draw, points, *, fill=INK, width=4, dash=None, open_head=False, size=22):
    line(draw, points, fill=fill, width=width, dash=dash)
    arrow_head(draw, points[-2], points[-1], fill=fill, width=width, size=size, open_head=open_head)


def actor(draw, x, y, name, size=30):
    draw.ellipse((x - 24, y - 75, x + 24, y - 27), outline=INK, width=4)
    draw.line((x, y - 27, x, y + 48), fill=INK, width=4)
    draw.line((x - 45, y, x + 45, y), fill=INK, width=4)
    draw.line((x, y + 48, x - 38, y + 95), fill=INK, width=4)
    draw.line((x, y + 48, x + 38, y + 95), fill=INK, width=4)
    text_center(draw, (x, y + 135), name, size=size, bold=True)


def hollow_triangle(draw, tip, base_a, base_b):
    draw.polygon((tip, base_a, base_b), fill=WHITE, outline=INK)
    draw.line((tip, base_a, base_b, tip), fill=INK, width=4)


def use_case_diagram():
    im, d = canvas(2600, 1800)
    d.rectangle((500, 70, 2100, 1680), outline=INK, width=4)
    d.text((540, 92), "«system» EduITSM", font=font(42, bold=True), fill=INK)
    actor(d, 240, 535, "Usuário")
    actor(d, 2360, 535, "Usuário")
    actor(d, 105, 1245, "Aluno")
    actor(d, 360, 1245, "Professor")
    # Generalização de atores: a ponta triangular aponta para o ator geral.
    line(d, [(105, 1140), (205, 720)], width=4)
    hollow_triangle(d, (220, 690), (190, 735), (230, 745))
    line(d, [(360, 1140), (275, 720)], width=4)
    hollow_triangle(d, (260, 690), (250, 745), (290, 735))

    left_cases = [
        (850, 210, "UC01\nAutenticar-se"),
        (850, 420, "UC02\nManter organização"),
        (850, 630, "UC03\nRegistrar análise\nde ambiente"),
        (850, 840, "UC04\nDefinir estratégia\nde serviço (4 Ps)"),
        (850, 1050, "UC05\nManter objetivos\nestratégicos"),
        (850, 1260, "UC06\nManter portfólio\nde serviços"),
        (850, 1470, "UC07\nRegistrar custos\ne orçamento"),
    ]
    right_cases = [
        (1650, 210, "UC08\nRegistrar demanda\ne capacidade"),
        (1650, 420, "UC09\nVincular serviço a\nobjetivo estratégico"),
        (1650, 630, "UC10\nDefinir indicadores\nde desempenho"),
        (1650, 840, "UC11\nGerar dados\noperacionais simulados"),
        (1650, 1050, "UC12\nConsultar painel\nde indicadores"),
        (1650, 1260, "UC13\nExportar relatório\nda estratégia"),
        (1650, 1470, "UC14\nAcompanhar ambientes\ndos alunos"),
    ]
    for x, y, label in left_cases + right_cases:
        d.ellipse((x - 235, y - 77, x + 235, y + 77), fill=BLUE2, outline=INK, width=3)
        text_center(d, (x, y), label, size=29)
    # O mesmo ator é repetido nas duas margens para evitar cruzamentos.
    for x, y, _ in left_cases:
        line(d, [(285, 535), (615, y)], width=3)
    for x, y, _ in right_cases[:-1]:
        line(d, [(2315, 535), (1885, y)], width=3)
    line(d, [(405, 1245), (470, 1245), (470, 1560), (1650, 1560), (1650, 1547)], width=4)
    d.text((585, 1615), "Associações sem seta representam participação. O ator Usuário aparece nas duas margens apenas para reduzir cruzamentos.", font=font(25, italic=True), fill=MID)
    im.save(OUT / "im02_casos_de_uso_uml.png", quality=95)


def activity_diagram():
    im, d = canvas(2200, 1600)
    cx = 1100
    d.ellipse((cx - 22, 55, cx + 22, 99), fill=INK)
    arrow(d, [(cx, 99), (cx, 150)])
    boxes = [
        (760, 150, 1440, 260, "Analisar ambiente\nSWOT interno e externo"),
        (760, 345, 1440, 455, "Definir direção estratégica\n4 Ps e objetivos"),
        (760, 540, 1440, 650, "Desenhar serviços\nportfólio, custos e capacidade"),
        (760, 735, 1440, 845, "Operar serviços\ngerar registros simulados"),
        (760, 930, 1440, 1040, "Medir e avaliar\ncalcular e interpretar indicadores"),
    ]
    for b in boxes:
        rounded(d, b[:4], b[4], fill=BLUE2, size=33)
    for a, b in zip(boxes, boxes[1:]):
        arrow(d, [(cx, a[3]), (cx, b[1])])
    # decisão UML e guardas
    diamond = [(cx, 1115), (cx + 190, 1210), (cx, 1305), (cx - 190, 1210)]
    d.polygon(diamond, fill=GRAY, outline=INK)
    d.line(diamond + [diamond[0]], fill=INK, width=4)
    text_center(d, (cx, 1210), "Metas\natingidas?", size=31, bold=True)
    arrow(d, [(cx, 1040), (cx, 1115)])
    rounded(d, (1455, 1155, 2050, 1265), "Registrar melhoria\ne consolidar aprendizado", fill=GREEN, size=30)
    d.text((1305, 1160), "[sim]", font=font(29, bold=True), fill=INK)
    arrow(d, [(1290, 1210), (1455, 1210)])
    rounded(d, (120, 1155, 690, 1265), "Revisar análise e\nredefinir a rota", fill=RED, size=30)
    d.text((735, 1160), "[não]", font=font(29, bold=True), fill=INK)
    arrow(d, [(910, 1210), (690, 1210)])
    # laços de retorno ao primeiro passo
    arrow(d, [(1750, 1155), (1750, 205), (1440, 205)], open_head=False)
    arrow(d, [(405, 1155), (405, 205), (760, 205)], open_head=False)
    d.text((820, 1435), "O ciclo não possui nó final: a estratégia é continuamente revisada.", font=font(29, italic=True), fill=MID)
    im.save(OUT / "im03_atividade_uml.png", quality=95)


def class_box(d, box, name, attrs, stereotype=None, fill=BLUE2):
    x1, y1, x2, y2 = box
    d.rectangle(box, fill=fill, outline=INK, width=3)
    title_y = y1 + 16
    if stereotype:
        text_center(d, ((x1 + x2) / 2, title_y + 15), f"«{stereotype}»", size=23, fill=MID)
        title_y += 42
    text_center(d, ((x1 + x2) / 2, title_y + 20), name, size=29, bold=True)
    sep = title_y + 48
    d.line((x1, sep, x2, sep), fill=INK, width=2)
    f = font(22)
    y = sep + 12
    for attr in attrs:
        d.text((x1 + 14, y), attr, font=f, fill=INK)
        y += 29


def mult(d, xy, value, anchor="mm"):
    d.text(xy, value, font=font(22, bold=True), fill=INK, anchor=anchor)


def class_diagram():
    im, d = canvas(2800, 1900)
    boxes = {
        "Usuario": (80, 100, 520, 335),
        "Organizacao": (720, 85, 1200, 365),
        "AnaliseAmbiente": (1390, 70, 1850, 360),
        "EstrategiaServico": (2070, 70, 2680, 385),
        "Objetivo": (120, 650, 650, 970),
        "Servico": (820, 620, 1320, 970),
        "Custo": (1510, 570, 1950, 850),
        "Demanda": (2190, 570, 2700, 880),
        "Vinculo": (80, 1170, 650, 1485),
        "Indicador": (1150, 1120, 1700, 1480),
        "Medicao": (1930, 1120, 2390, 1410),
        "Cenario": (190, 1580, 790, 1850),
        "Registro": (1110, 1570, 1740, 1865),
    }
    class_box(d, boxes["Usuario"], "Usuario", ["- id: UUID", "- nome: String", "- email: String", "- senhaHash: String", "- perfil: PerfilUsuario"])
    class_box(d, boxes["Organizacao"], "Organizacao", ["- id: UUID", "- nome: String", "- setor: String [0..1]", "- descricao: Text [0..1]"], stereotype="aggregate root", fill=BLUE)
    class_box(d, boxes["AnaliseAmbiente"], "AnaliseAmbiente", ["- id: UUID", "- tipo: TipoAmbiente", "- categoria: CategoriaSwot", "- impacto: NivelImpacto [0..1]"])
    class_box(d, boxes["EstrategiaServico"], "EstrategiaServico", ["- id: UUID", "- perspectiva: Text [0..1]", "- posicao: Text [0..1]", "- plano: Text [0..1]", "- padrao: Text [0..1]", "- versao: Integer"])
    class_box(d, boxes["Objetivo"], "ObjetivoEstrategico", ["- id: UUID", "- codigo: String", "- descricao: Text", "- prazo: Date [0..1]", "- status: StatusObjetivo"])
    class_box(d, boxes["Servico"], "Servico", ["- id: UUID", "- nome: String", "- publicoAlvo: String [0..1]", "- status: StatusServico"])
    class_box(d, boxes["Custo"], "CustoServico", ["- id: UUID", "- tipo: TipoCusto", "- valorPrevisto: Decimal", "- valorRealizado: Decimal [0..1]", "- periodo: String"])
    class_box(d, boxes["Demanda"], "DemandaCapacidade", ["- id: UUID", "- periodo: String", "- demandaPrevista: Integer", "- capacidadeInstalada: Integer", "- unidade: String"])
    class_box(d, boxes["Vinculo"], "VinculoEstrategico", ["- id: UUID", "- justificativaValor: Text", "- contribuicao: Decimal"], stereotype="association class", fill=GREEN)
    class_box(d, boxes["Indicador"], "Indicador", ["- id: UUID", "- nome: String", "- tipo: TipoIndicador", "- unidade: String", "- meta: Decimal", "- sentido: SentidoMeta"])
    class_box(d, boxes["Medicao"], "Medicao", ["- id: UUID", "- periodoRef: Date", "- valor: Decimal", "- origem: OrigemMedicao"])
    class_box(d, boxes["Cenario"], "CenarioSimulacao", ["- id: UUID", "- semente: Integer", "- periodoInicio: Date", "- periodoFim: Date", "- volumeRegistros: Integer", "- perfil: PerfilCenario"])
    class_box(d, boxes["Registro"], "RegistroOperacional", ["- id: UUID", "- dataAbertura: DateTime", "- dataFechamento: DateTime [0..1]", "- tempoAtendimentoMin: Integer [0..1]", "- slaCumprido: Boolean", "- notaSatisfacao: Integer [0..1]"])

    # Composição = losango preenchido no todo.
    def composition(a, b, a_mult, b_mult, points):
        line(d, points, width=3)
        x, y = points[0]
        if len(points) > 1:
            nx, ny = points[1]
            ang = atan2(ny-y, nx-x)
            s = 24
            diamond = [(x, y), (x+s*cos(ang-pi/4), y+s*sin(ang-pi/4)), (x+2*s*cos(ang), y+2*s*sin(ang)), (x+s*cos(ang+pi/4), y+s*sin(ang+pi/4))]
            d.polygon(diamond, fill=INK)
        mult(d, (points[0][0] + 38, points[0][1] - 18), a_mult)
        mult(d, (points[-1][0] - 38, points[-1][1] - 18), b_mult)

    composition("Usuario", "Organizacao", "1", "0..1", [(520, 220), (720, 220)])
    composition("Organizacao", "Analise", "1", "0..*", [(1200, 145), (1390, 145)])
    composition("Organizacao", "Estrategia", "1", "0..*", [(1200, 285), (1950, 285), (1950, 220), (2070, 220)])
    composition("Organizacao", "Objetivo", "1", "0..*", [(840, 365), (840, 500), (385, 500), (385, 650)])
    composition("Organizacao", "Servico", "1", "0..*", [(1010, 365), (1010, 620)])
    composition("Servico", "Custo", "1", "0..*", [(1320, 700), (1510, 700)])
    composition("Servico", "Demanda", "1", "0..*", [(1320, 825), (2050, 825), (2050, 720), (2190, 720)])
    composition("Servico", "Indicador", "1", "0..*", [(1090, 970), (1090, 1040), (1425, 1040), (1425, 1120)])
    composition("Indicador", "Medicao", "1", "0..*", [(1700, 1285), (1930, 1285)])
    composition("Organizacao", "Cenario", "1", "0..*", [(720, 330), (680, 330), (680, 430), (30, 430), (30, 1710), (190, 1710)])
    composition("Cenario", "Registro", "1", "0..*", [(790, 1710), (1110, 1710)])
    composition("Servico", "Registro", "1", "0..*", [(1250, 970), (1800, 970), (1800, 1720), (1740, 1720)])
    # Associação opcional objetivo-indicador.
    line(d, [(650, 810), (780, 810), (780, 1340), (1150, 1340)], width=3)
    mult(d, (690, 788), "0..1")
    mult(d, (1105, 1318), "0..*")
    # Associação muitos-para-muitos e classe associativa.
    line(d, [(650, 920), (820, 920)], width=4)
    mult(d, (690, 895), "0..*")
    mult(d, (780, 895), "0..*")
    line(d, [(735, 920), (680, 920), (680, 1325), (650, 1325)], width=3, dash=(14, 10))
    d.text((690, 1010), "alinhamento", font=font(22, italic=True), fill=MID)
    d.text((1840, 1770), "Losango preenchido: composição | Linha tracejada: classe associativa", font=font(24, italic=True), fill=MID)
    im.save(OUT / "im04_classes_uml.png", quality=95)


def sequence_base(title: str, lifelines: list[tuple[str, str]], h=1700):
    im, d = canvas(2500, h)
    xs = [170 + i * (2160 // (len(lifelines)-1)) for i in range(len(lifelines))]
    for x, (st, name) in zip(xs, lifelines):
        rounded(d, (x-145, 65, x+145, 175), f"«{st}»\n{name}", fill=BLUE2, size=26)
        line(d, [(x, 175), (x, h-100)], fill=MID, width=3, dash=(12, 10))
    return im, d, xs


def seq_msg(d, xs, src, dst, y, label, *, ret=False, color=INK):
    x1, x2 = xs[src], xs[dst]
    offset = 12 if x2 > x1 else -12
    arrow(d, [(x1 + offset, y), (x2 - offset, y)], fill=color, width=3, dash=(12, 8) if ret else None, open_head=True if ret else False, size=18)
    f = font(23, italic=ret)
    tw = d.textlength(label, font=f)
    d.rectangle(((x1+x2)/2-tw/2-8, y-34, (x1+x2)/2+tw/2+8, y-5), fill=WHITE)
    d.text(((x1+x2)/2, y-32), label, font=f, fill=color, anchor="ma")


def activation(d, x, y1, y2):
    d.rectangle((x-10, y1, x+10, y2), fill=WHITE, outline=INK, width=2)


def sequence_uc09():
    im, d, xs = sequence_base("UC09", [("actor", "Aluno"), ("boundary", "TelaVinculo"), ("control", "VinculoController"), ("service", "VinculoService"), ("repository", "VinculoRepository"), ("database", "PostgreSQL")], h=1800)
    activation(d, xs[1], 260, 1580); activation(d, xs[2], 390, 1500); activation(d, xs[3], 520, 1410); activation(d, xs[4], 730, 1320); activation(d, xs[5], 850, 1230)
    seq_msg(d, xs, 0, 1, 300, "selecionar serviço e objetivo")
    seq_msg(d, xs, 0, 1, 365, "informar justificativa e contribuição")
    seq_msg(d, xs, 1, 2, 430, "POST /vinculos {dados, JWT}")
    seq_msg(d, xs, 2, 3, 560, "criarVinculo(usuarioId, dados)")
    seq_msg(d, xs, 3, 4, 655, "obterOrganizacaoDoUsuario(usuarioId)")
    seq_msg(d, xs, 4, 5, 760, "SELECT organização, serviço e objetivo")
    seq_msg(d, xs, 5, 4, 835, "dados da mesma organização", ret=True)
    seq_msg(d, xs, 3, 4, 910, "somarContribuicoes(objetivoId)")
    seq_msg(d, xs, 4, 5, 975, "SELECT SUM(contribuicao)")
    # fragmento alt UML
    d.rectangle((600, 1040, 2410, 1485), outline=INK, width=3)
    d.polygon(((600,1040),(950,1040),(900,1090),(600,1090)), fill=GRAY, outline=INK)
    d.text((620, 1050), "alt", font=font(25, bold=True), fill=INK)
    d.text((630, 1110), "[soma + contribuição ≤ 100%]", font=font(24, bold=True), fill=INK)
    seq_msg(d, xs, 3, 4, 1175, "salvar(vínculo)")
    seq_msg(d, xs, 4, 5, 1235, "INSERT vinculo_estrategico")
    seq_msg(d, xs, 5, 4, 1295, "vínculo persistido", ret=True)
    d.line((600, 1345, 2410, 1345), fill=INK, width=2)
    d.text((630, 1360), "[soma + contribuição > 100%]", font=font(24, bold=True), fill=INK)
    seq_msg(d, xs, 3, 2, 1425, "erro RN06: contribuição disponível", ret=True, color="#9B1C1C")
    seq_msg(d, xs, 2, 1, 1525, "201 Criado ou 422 Regra de negócio", ret=True)
    seq_msg(d, xs, 1, 0, 1610, "exibir cobertura ou mensagem de validação", ret=True)
    im.save(OUT / "im05_sequencia_uc09_uml.png", quality=95)


def sequence_uc11():
    im, d, xs = sequence_base("UC11", [("actor", "Aluno"), ("boundary", "TelaCenario"), ("control", "CenarioController"), ("service", "MotorSimulacao"), ("repository", "RegistroRepository"), ("database", "PostgreSQL")], h=1850)
    activation(d, xs[1], 260, 1660); activation(d, xs[2], 380, 1570); activation(d, xs[3], 500, 1490); activation(d, xs[4], 810, 1370); activation(d, xs[5], 920, 1290)
    seq_msg(d, xs, 0, 1, 300, "definir período, volume, perfil e semente")
    seq_msg(d, xs, 1, 2, 420, "POST /cenarios {parâmetros, JWT}")
    seq_msg(d, xs, 2, 3, 545, "gerar(usuarioId, parâmetros)")
    seq_msg(d, xs, 3, 4, 650, "validar organização e serviços ativos")
    seq_msg(d, xs, 4, 5, 720, "SELECT organização e serviços")
    seq_msg(d, xs, 5, 4, 785, "serviços autorizados", ret=True)
    d.rectangle((760, 845, 2410, 1215), outline=INK, width=3)
    d.polygon(((760,845),(1060,845),(1010,895),(760,895)), fill=GRAY, outline=INK)
    d.text((780, 854), "loop", font=font(25, bold=True), fill=INK)
    d.text((790, 910), "[i = 1 .. volumeRegistros]", font=font(24, bold=True), fill=INK)
    seq_msg(d, xs, 3, 3, 990, "sortear dados com PRNG(semente)")
    seq_msg(d, xs, 3, 4, 1090, "adicionar registro ao lote")
    seq_msg(d, xs, 3, 4, 1270, "salvarCenarioERegistros(transação)")
    seq_msg(d, xs, 4, 5, 1340, "BEGIN; INSERT cenário + lote; COMMIT")
    seq_msg(d, xs, 5, 4, 1410, "identificadores persistidos", ret=True)
    seq_msg(d, xs, 4, 3, 1480, "cenário e quantidade gerada", ret=True)
    seq_msg(d, xs, 3, 2, 1545, "resultado reprodutível", ret=True)
    seq_msg(d, xs, 2, 1, 1610, "201 Criado", ret=True)
    seq_msg(d, xs, 1, 0, 1690, "exibir resumo da geração", ret=True)
    im.save(OUT / "im06_sequencia_uc11_uml.png", quality=95)


def entity_box(d, box, name, attrs, fill=BLUE2):
    x1,y1,x2,y2=box
    d.rectangle(box, fill=fill, outline=INK, width=3)
    d.rectangle((x1,y1,x2,y1+48), fill=BLUE, outline=INK, width=3)
    text_center(d, ((x1+x2)/2,y1+24), name, size=25, bold=True)
    y=y1+58
    for attr in attrs:
        d.text((x1+12,y), attr, font=font(19), fill=INK)
        y += 25


def crow_marker(d, point, toward, *, minimum=0, maximum="many"):
    x,y=point; tx,ty=toward
    ang=atan2(ty-y,tx-x)
    ux,uy=cos(ang),sin(ang); px,py=-uy,ux
    if minimum == 0:
        cx,cy=x+ux*18,y+uy*18
        d.ellipse((cx-8,cy-8,cx+8,cy+8), fill=WHITE, outline=INK, width=3)
        base=38
    else:
        base=20
        d.line((x+ux*18+px*10,y+uy*18+py*10,x+ux*18-px*10,y+uy*18-py*10),fill=INK,width=3)
    if maximum == "one":
        bx,by=x+ux*(base+12),y+uy*(base+12)
        d.line((bx+px*10,by+py*10,bx-px*10,by-py*10),fill=INK,width=3)
    else:
        tipx,tipy=x+ux*(base+8),y+uy*(base+8)
        rootx,rooty=x+ux*(base+32),y+uy*(base+32)
        d.line((tipx+px*15,tipy+py*15,rootx,rooty,tipx-px*15,tipy-py*15),fill=INK,width=3)


def er_rel(d, points, left=(1,"one"), right=(0,"many"), label=None):
    line(d, points, width=3)
    crow_marker(d, points[0], points[1], minimum=left[0], maximum=left[1])
    crow_marker(d, points[-1], points[-2], minimum=right[0], maximum=right[1])
    if label:
        mx=(points[0][0]+points[-1][0])/2; my=(points[0][1]+points[-1][1])/2
        d.rectangle((mx-90,my-19,mx+90,my+19),fill=WHITE)
        text_center(d,(mx,my),label,size=19,fill=MID)


def er_diagram():
    im,d=canvas(2800,1900)
    b={
      "usuario":(60,80,430,280), "org":(620,70,1070,295), "analise":(1270,60,1735,285), "estrat":(1960,55,2690,310),
      "obj":(110,575,600,825), "serv":(820,555,1280,830), "custo":(1480,500,1900,740), "demanda":(2180,500,2700,765),
      "vinc":(230,1030,760,1295), "indic":(1000,1015,1500,1310), "med":(1780,1020,2200,1265),
      "cenario":(220,1510,780,1795), "registro":(1080,1490,1710,1810)
    }
    entity_box(d,b["usuario"],"usuario",["PK id: UUID","UK email","nome, senha_hash, perfil"])
    entity_box(d,b["org"],"organizacao",["PK id: UUID","FK/UK usuario_id","nome, setor, descricao"] ,fill=BLUE)
    entity_box(d,b["analise"],"analise_ambiente",["PK id: UUID","FK organizacao_id","tipo, categoria, impacto"])
    entity_box(d,b["estrat"],"estrategia_servico",["PK id: UUID","FK organizacao_id","perspectiva, posicao, plano, padrao","UK organizacao_id + versao"])
    entity_box(d,b["obj"],"objetivo_estrategico",["PK id: UUID","FK organizacao_id","codigo, descricao, prazo, status","UK organizacao_id + codigo"])
    entity_box(d,b["serv"],"servico",["PK id: UUID","FK organizacao_id","nome, publico_alvo, status"])
    entity_box(d,b["custo"],"custo_servico",["PK id: UUID","FK servico_id","tipo, valores, periodo"])
    entity_box(d,b["demanda"],"demanda_capacidade",["PK id: UUID","FK servico_id","periodo, demanda, capacidade, unidade"])
    entity_box(d,b["vinc"],"vinculo_estrategico",["PK id: UUID","FK servico_id","FK objetivo_id","justificativa_valor, contribuicao","UK servico_id + objetivo_id"],fill=GREEN)
    entity_box(d,b["indic"],"indicador",["PK id: UUID","FK servico_id","FK objetivo_id [opcional]","nome, tipo, unidade, meta, sentido"])
    entity_box(d,b["med"],"medicao",["PK id: UUID","FK indicador_id","periodo_ref, valor, origem","UK indicador_id + periodo_ref"])
    entity_box(d,b["cenario"],"cenario_simulacao",["PK id: UUID","FK organizacao_id","semente, período, volume, perfil"])
    entity_box(d,b["registro"],"registro_operacional",["PK id: UUID","FK servico_id","FK cenario_id","datas, tempo, SLA, satisfação"])
    er_rel(d,[(430,180),(620,180)],left=(1,"one"),right=(0,"one"),label="possui")
    er_rel(d,[(1070,130),(1270,130)],left=(1,"one"),right=(0,"many"))
    er_rel(d,[(1070,245),(1860,245),(1860,170),(1960,170)],left=(1,"one"),right=(0,"many"))
    er_rel(d,[(760,295),(760,430),(355,430),(355,575)],left=(1,"one"),right=(0,"many"))
    er_rel(d,[(920,295),(920,555)],left=(1,"one"),right=(0,"many"))
    er_rel(d,[(1280,625),(1480,625)],left=(1,"one"),right=(0,"many"))
    er_rel(d,[(1280,755),(2050,755),(2050,630),(2180,630)],left=(1,"one"),right=(0,"many"))
    er_rel(d,[(600,760),(700,760),(700,1120),(760,1120)],left=(1,"one"),right=(0,"many"))
    er_rel(d,[(1000,760),(1000,980),(495,980),(495,1030)],left=(1,"one"),right=(0,"many"))
    er_rel(d,[(1080,830),(1080,1015)],left=(1,"one"),right=(0,"many"))
    er_rel(d,[(600,690),(680,690),(680,1390),(1250,1390),(1250,1310)],left=(0,"one"),right=(0,"many"),label="orienta")
    er_rel(d,[(1500,1145),(1780,1145)],left=(1,"one"),right=(0,"many"))
    er_rel(d,[(620,295),(30,295),(30,1650),(220,1650)],left=(1,"one"),right=(0,"many"))
    er_rel(d,[(780,1650),(1080,1650)],left=(1,"one"),right=(0,"many"))
    er_rel(d,[(1280,800),(1380,800),(1380,1490)],left=(1,"one"),right=(0,"many"))
    d.text((1870,1740), "Legenda: PK chave primária | FK chave estrangeira | UK restrição de unicidade", font=font(23, italic=True), fill=MID)
    im.save(OUT / "im07_mer_conceitual.png", quality=95)


def component_box(d, box, stereo, name, lines_):
    x1,y1,x2,y2=box
    d.rectangle(box,fill=BLUE2,outline=INK,width=3)
    d.text((x1+18,y1+15),f"«{stereo}»",font=font(25,italic=True),fill=MID)
    d.text(((x1+x2)/2,y1+62),name,font=font(32,bold=True),fill=INK,anchor="ma")
    y=y1+110
    for value in lines_:
        d.text((x1+25,y),f"• {value}",font=font(24),fill=INK); y+=42
    # símbolo UML de componente
    d.rectangle((x2-72,y1+18,x2-25,y1+58),outline=INK,width=3)
    d.rectangle((x2-87,y1+24,x2-66,y1+36),fill=WHITE,outline=INK,width=2)
    d.rectangle((x2-87,y1+42,x2-66,y1+54),fill=WHITE,outline=INK,width=2)


def component_diagram():
    im,d=canvas(2400,1600)
    component_box(d,(80,130,650,480),"component","Aplicação Web",["React + TypeScript","roteamento e sessão","cliente REST"])
    component_box(d,(910,110,1510,510),"component","API REST",["rotas Express","autenticação JWT","validação Zod"])
    component_box(d,(1750,110,2320,510),"component","Contratos",["tipos compartilhados","schemas Zod","erros padronizados"])
    component_box(d,(780,690,1450,1110),"component","Serviços de domínio",["organização e autenticação","estratégia e portfólio","simulação e indicadores"])
    component_box(d,(80,800,580,1140),"component","Repositórios",["interfaces de persistência","isolamento por organização","transações"])
    component_box(d,(1730,760,2320,1115),"component","Prisma ORM",["mapeamento relacional","migrações versionadas","cliente PostgreSQL"])
    rounded(d,(770,1320,1510,1480),"«database» PostgreSQL",fill=GRAY,size=36,bold=True)
    arrow(d,[(650,300),(910,300)],dash=(15,10),open_head=True); d.text((690,250),"HTTP/JSON",font=font(25),fill=MID)
    arrow(d,[(1510,260),(1750,260)],dash=(15,10),open_head=True); d.text((1580,210),"usa",font=font(25),fill=MID)
    arrow(d,[(1210,510),(1210,690)],dash=(15,10),open_head=True); d.text((1235,580),"delega",font=font(25),fill=MID)
    arrow(d,[(780,900),(580,900)],dash=(15,10),open_head=True); d.text((620,850),"depende",font=font(25),fill=MID)
    arrow(d,[(580,1030),(1730,960)],dash=(15,10),open_head=True)
    arrow(d,[(2025,1115),(1510,1370)],dash=(15,10),open_head=True); d.text((1790,1230),"SQL tipado",font=font(25),fill=MID)
    d.text((90,1480),"UML 2.x: dependências tracejadas indicam uso entre componentes; regras de negócio permanecem nos serviços de domínio.",font=font(24,italic=True),fill=MID)
    im.save(OUT/"im08_componentes_uml.png",quality=95)


def node3d(d, box, stereo, name, artifacts):
    x1,y1,x2,y2=box; depth=28
    d.polygon(((x1,y1),(x1+depth,y1-depth),(x2+depth,y1-depth),(x2,y1)),fill=GRAY,outline=INK)
    d.polygon(((x2,y1),(x2+depth,y1-depth),(x2+depth,y2-depth),(x2,y2)),fill="#E5E7EB",outline=INK)
    d.rectangle(box,fill=WHITE,outline=INK,width=4)
    text_center(d,((x1+x2)/2,y1+42),f"«{stereo}»\n{name}",size=29,bold=True)
    y=y1+120
    for a in artifacts:
        rounded(d,(x1+45,y,x2-45,y+85),f"«artifact» {a}",fill=BLUE2,size=25)
        y+=110


def deployment_diagram():
    im,d=canvas(2400,1500)
    node3d(d,(90,210,690,760),"device","Computador do usuário",["Navegador","Aplicação Web"])
    node3d(d,(900,150,1550,840),"node","Servidor de aplicação",["Node.js 22","API REST EduITSM","Motor de simulação"])
    node3d(d,(1790,270,2310,720),"node","Servidor de dados",["PostgreSQL 16","Esquema EduITSM"])
    arrow(d,[(690,480),(900,480)],open_head=True,width=4)
    text_center(d,(795,420),"HTTPS/TLS\nporta 443",size=27,bold=True)
    arrow(d,[(1550,500),(1790,500)],open_head=True,width=4)
    text_center(d,(1670,435),"PostgreSQL/TLS\nporta 5432",size=27,bold=True)
    d.rectangle((690,1030,1700,1350),fill=GRAY,outline=INK,width=3)
    d.text((720,1055),"«executionEnvironment» Desenvolvimento local",font=font(29,bold=True),fill=INK)
    rounded(d,(760,1130,1110,1250),"Docker Compose",fill=WHITE,size=27)
    rounded(d,(1250,1130,1600,1250),"PostgreSQL",fill=WHITE,size=27)
    arrow(d,[(1110,1190),(1250,1190)],open_head=True,width=3)
    d.text((720,1390),"O bloco inferior representa a configuração atual; os três nós superiores representam a implantação de produção prevista.",font=font(24,italic=True),fill=MID)
    im.save(OUT/"im09_implantacao_uml.png",quality=95)


def state_diagram():
    im,d=canvas(2400,1550)
    d.ellipse((80,115,125,160),fill=INK)
    states={
      "login":(190,80,520,195,"T01 Login"), "painel":(750,80,1150,195,"T02 Painel inicial"),
      "amb":(190,390,590,515,"T03 Análise\nde ambiente"), "estr":(750,390,1150,515,"T04 Estratégia\n4 Ps"), "obj":(1330,390,1730,515,"T05 Objetivos\nestratégicos"),
      "portfolio":(190,735,590,860,"T06 Portfólio\nde serviços"), "serv":(750,735,1150,860,"T07 Cadastro\nde serviço"), "cust":(1330,680,1730,805,"T08 Custos e\norçamento"), "dem":(1900,680,2300,805,"T09 Demanda e\ncapacidade"),
      "vinc":(1330,920,1730,1045,"T10 Vínculo\nestratégico"), "ind":(1900,920,2300,1045,"T11 Indicadores\ndo serviço"),
      "cen":(190,1180,590,1305,"T12 Cenário\nde simulação"), "panelind":(750,1180,1150,1305,"T13 Painel de\nindicadores"), "rel":(1330,1180,1730,1305,"T14 Relatório\nda estratégia"), "prof":(1900,1180,2300,1305,"T15 Acompanhamento\ndos alunos")
    }
    for b in states.values(): rounded(d,b[:4],b[4],fill=BLUE2,size=28)
    arrow(d,[(125,138),(190,138)])
    arrow(d,[(520,138),(750,138)]); d.text((575,95),"[autenticado]",font=font(22),fill=MID)
    arrow(d,[(950,195),(950,390)])
    arrow(d,[(590,452),(750,452)])
    arrow(d,[(1150,452),(1330,452)])
    arrow(d,[(1530,515),(1530,620),(390,620),(390,735)])
    arrow(d,[(590,798),(750,798)])
    arrow(d,[(1150,798),(1330,742)])
    arrow(d,[(1730,742),(1900,742)])
    arrow(d,[(2100,805),(2100,920)])
    arrow(d,[(1900,982),(1730,982)])
    arrow(d,[(1530,1045),(1530,1105),(390,1105),(390,1180)])
    arrow(d,[(590,1242),(750,1242)])
    arrow(d,[(1150,1242),(1330,1242)])
    arrow(d,[(1730,1242),(1900,1242)]); d.text((1760,1195),"[Professor]",font=font(22),fill=MID)
    # retorno para revisão estratégica
    arrow(d,[(950,1305),(950,1435),(80,1435),(80,452),(190,452)],open_head=False)
    d.text((145,1395),"[meta não atingida] revisar estratégia",font=font(23,bold=True),fill=INK)
    # logout para estado final UML
    d.ellipse((2190,80,2260,150),outline=INK,width=4); d.ellipse((2204,94,2246,136),fill=INK)
    arrow(d,[(1150,138),(2190,115)]); d.text((1600,75),"sair",font=font(22),fill=MID)
    d.text((70,1490),"Diagrama de máquina de estados UML: estados representam telas; rótulos entre colchetes representam guardas de transição.",font=font(24,italic=True),fill=MID)
    im.save(OUT/"im10_estados_navegacao_uml.png",quality=95)


def class_box_big(d, box, name, attrs, stereotype=None, fill=BLUE2):
    x1, y1, x2, y2 = box
    d.rectangle(box, fill=fill, outline=INK, width=3)
    title_y = y1 + 12
    if stereotype:
        text_center(d, ((x1 + x2) / 2, title_y + 14), f"«{stereotype}»", size=25, fill=MID)
        title_y += 40
    text_center(d, ((x1 + x2) / 2, title_y + 19), name, size=32, bold=True)
    sep = title_y + 46
    d.line((x1, sep, x2, sep), fill=INK, width=2)
    y = sep + 10
    for attr in attrs:
        d.text((x1 + 12, y), attr, font=font(26), fill=INK)
        y += 34


def class_diagram_portrait():
    im, d = canvas(1800, 2100)
    b = {
        "usr": (40, 60, 420, 310), "org": (600, 50, 1050, 340),
        "ana": (1190, 40, 1740, 315), "est": (1190, 370, 1740, 680),
        "obj": (60, 560, 520, 880), "srv": (650, 550, 1110, 880),
        "cus": (1260, 740, 1740, 1030), "dem": (1260, 1080, 1740, 1370),
        "vin": (60, 1040, 520, 1300), "ind": (650, 1080, 1110, 1410),
        "cen": (60, 1630, 560, 1970), "reg": (670, 1600, 1210, 1980),
        "med": (1280, 1510, 1740, 1780),
    }
    class_box_big(d,b["usr"],"Usuario",["- id: UUID","- nome: String","- email: String","- senhaHash: String","- perfil: PerfilUsuario"])
    class_box_big(d,b["org"],"Organizacao",["- id: UUID","- nome: String","- setor: String [0..1]","- descricao: Text [0..1]"],"aggregate root",BLUE)
    class_box_big(d,b["ana"],"AnaliseAmbiente",["- id: UUID","- tipo: TipoAmbiente","- categoria: CategoriaSwot","- impacto: NivelImpacto [0..1]"])
    class_box_big(d,b["est"],"EstrategiaServico",["- id: UUID","- perspectiva: Text [0..1]","- posicao: Text [0..1]","- plano: Text [0..1]","- padrao: Text [0..1]","- versao: Integer"])
    class_box_big(d,b["obj"],"ObjetivoEstrategico",["- id: UUID","- codigo: String","- descricao: Text","- prazo: Date [0..1]","- status: StatusObjetivo"])
    class_box_big(d,b["srv"],"Servico",["- id: UUID","- nome: String","- publicoAlvo: String [0..1]","- status: StatusServico"])
    class_box_big(d,b["cus"],"CustoServico",["- id: UUID","- tipo: TipoCusto","- valorPrevisto: Decimal","- valorRealizado: Decimal [0..1]","- periodo: String"])
    class_box_big(d,b["dem"],"DemandaCapacidade",["- id: UUID","- periodo: String","- demandaPrevista: Integer","- capacidadeInstalada: Integer","- unidade: String"])
    class_box_big(d,b["vin"],"VinculoEstrategico",["- id: UUID","- justificativaValor: Text","- contribuicao: Decimal"],"association class",GREEN)
    class_box_big(d,b["ind"],"Indicador",["- id: UUID","- nome: String","- tipo: TipoIndicador","- unidade: String","- meta: Decimal","- sentido: SentidoMeta"])
    class_box_big(d,b["cen"],"CenarioSimulacao",["- id: UUID","- semente: Integer","- periodoInicio: Date","- periodoFim: Date","- volumeRegistros: Integer","- perfil: PerfilCenario"])
    class_box_big(d,b["reg"],"RegistroOperacional",["- id: UUID","- dataAbertura: DateTime","- dataFechamento: DateTime [0..1]","- tempoAtendimentoMin: Integer [0..1]","- slaCumprido: Boolean","- notaSatisfacao: Integer [0..1]"])
    class_box_big(d,b["med"],"Medicao",["- id: UUID","- periodoRef: Date","- valor: Decimal","- origem: OrigemMedicao"])

    def comp(points, am, bm):
        line(d,points,width=3)
        x,y=points[0]; nx,ny=points[1]; ang=atan2(ny-y,nx-x); s=22
        diamond=[(x,y),(x+s*cos(ang-pi/4),y+s*sin(ang-pi/4)),(x+2*s*cos(ang),y+2*s*sin(ang)),(x+s*cos(ang+pi/4),y+s*sin(ang+pi/4))]
        d.polygon(diamond,fill=INK)
        mult(d,(points[0][0]+32,points[0][1]-16),am)
        mult(d,(points[-1][0]-32,points[-1][1]-16),bm)

    comp([(420,180),(600,180)],"1","0..1")
    comp([(1050,125),(1190,125)],"1","0..*")
    comp([(1050,280),(1135,280),(1135,520),(1190,520)],"1","0..*")
    comp([(720,340),(720,450),(290,450),(290,560)],"1","0..*")
    comp([(870,340),(870,550)],"1","0..*")
    comp([(600,280),(560,280),(560,440),(20,440),(20,1480),(300,1480),(300,1630)],"1","0..*")
    comp([(1110,670),(1190,670),(1190,885),(1260,885)],"1","0..*")
    comp([(1110,820),(1170,820),(1170,1225),(1260,1225)],"1","0..*")
    comp([(850,880),(850,1080)],"1","0..*")
    comp([(1040,880),(1160,880),(1160,1810),(1210,1810)],"1","0..*")
    comp([(1110,1270),(1200,1270),(1200,1640),(1280,1640)],"1","0..*")
    comp([(560,1800),(670,1800)],"1","0..*")
    # associação muitos-para-muitos e classe associativa
    line(d,[(520,820),(650,820)],width=4); mult(d,(555,795),"0..*"); mult(d,(615,795),"0..*")
    line(d,[(585,820),(560,820),(560,1170),(520,1170)],width=3,dash=(14,10))
    d.text((535,970),"alinhamento",font=font(24,italic=True),fill=MID)
    # objetivo opcional do indicador
    line(d,[(520,700),(590,700),(590,1290),(650,1290)],width=3)
    mult(d,(550,674),"0..1"); mult(d,(620,1265),"0..*")
    d.text((920,2040),"Losango preenchido: composição | Linha tracejada: classe associativa",font=font(25,italic=True),fill=MID)
    im.save(OUT/"im04_classes_uml.png",quality=95)


def sequence_base_portrait(lifelines, h=2200):
    im,d=canvas(1800,h)
    xs=[140,515,890,1265,1640]
    for x,(st,name) in zip(xs,lifelines):
        rounded(d,(x-125,55,x+125,175),f"«{st}»\n{name}",fill=BLUE2,size=25)
        line(d,[(x,175),(x,h-90)],fill=MID,width=3,dash=(12,10))
    return im,d,xs


def seq_msg_big(d,xs,src,dst,y,label,ret=False,color=INK):
    x1,x2=xs[src],xs[dst]
    arrow(d,[(x1+10 if x2>x1 else x1-10,y),(x2-10 if x2>x1 else x2+10,y)],fill=color,width=3,dash=(12,8) if ret else None,open_head=ret,size=18)
    f=font(25,italic=ret); tw=d.textlength(label,font=f)
    d.rectangle(((x1+x2)/2-tw/2-6,y-34,(x1+x2)/2+tw/2+6,y-4),fill=WHITE)
    d.text(((x1+x2)/2,y-32),label,font=f,fill=color,anchor="ma")


def sequence_uc09_portrait():
    im,d,xs=sequence_base_portrait([("actor","Aluno"),("boundary","TelaVinculo"),("control","VinculoService"),("repository","VinculoRepository"),("database","PostgreSQL")])
    activation(d,xs[1],250,1940); activation(d,xs[2],430,1810); activation(d,xs[3],650,1690); activation(d,xs[4],770,1540)
    seq_msg_big(d,xs,0,1,285,"selecionar serviço e objetivo")
    seq_msg_big(d,xs,0,1,355,"informar justificativa e contribuição")
    seq_msg_big(d,xs,1,2,465,"criarVinculo(usuarioId, dados)")
    seq_msg_big(d,xs,2,3,600,"obter organização e entidades")
    seq_msg_big(d,xs,3,4,705,"SELECT organização, serviço e objetivo")
    seq_msg_big(d,xs,4,3,805,"dados autorizados",ret=True)
    seq_msg_big(d,xs,2,3,905,"somar contribuições do objetivo")
    seq_msg_big(d,xs,3,4,985,"SELECT SUM(contribuicao)")
    d.rectangle((420,1050,1760,1660),outline=INK,width=3)
    d.polygon(((420,1050),(690,1050),(650,1100),(420,1100)),fill=GRAY,outline=INK)
    d.text((438,1058),"alt",font=font(27,bold=True),fill=INK)
    d.text((445,1120),"[total ≤ 100%]",font=font(25,bold=True),fill=INK)
    seq_msg_big(d,xs,2,3,1210,"salvar(vínculo)")
    seq_msg_big(d,xs,3,4,1300,"INSERT vinculo_estrategico")
    seq_msg_big(d,xs,4,3,1390,"vínculo persistido",ret=True)
    d.line((420,1460,1760,1460),fill=INK,width=2)
    d.text((445,1480),"[total > 100%]",font=font(25,bold=True),fill=INK)
    seq_msg_big(d,xs,2,1,1560,"422 + contribuição disponível",ret=True,color="#9B1C1C")
    seq_msg_big(d,xs,2,1,1760,"201 Criado ou 422",ret=True)
    seq_msg_big(d,xs,1,0,1880,"exibir cobertura ou validação",ret=True)
    im.save(OUT/"im05_sequencia_uc09_uml.png",quality=95)


def sequence_uc11_portrait():
    im,d,xs=sequence_base_portrait([("actor","Aluno"),("boundary","TelaCenario"),("control","MotorSimulacao"),("repository","RegistroRepository"),("database","PostgreSQL")])
    activation(d,xs[1],270,1930); activation(d,xs[2],450,1800); activation(d,xs[3],670,1680); activation(d,xs[4],790,1550)
    seq_msg_big(d,xs,0,1,305,"informar período, volume, perfil e semente")
    seq_msg_big(d,xs,1,2,485,"gerar(usuarioId, parâmetros)")
    seq_msg_big(d,xs,2,3,610,"validar organização e serviços")
    seq_msg_big(d,xs,3,4,715,"SELECT organização e serviços ativos")
    seq_msg_big(d,xs,4,3,820,"serviços autorizados",ret=True)
    d.rectangle((420,900,1760,1390),outline=INK,width=3)
    d.polygon(((420,900),(710,900),(670,950),(420,950)),fill=GRAY,outline=INK)
    d.text((438,908),"loop",font=font(27,bold=True),fill=INK)
    d.text((445,970),"[i = 1 .. volumeRegistros]",font=font(25,bold=True),fill=INK)
    seq_msg_big(d,xs,2,2,1090,"sortear dados com PRNG(semente)")
    seq_msg_big(d,xs,2,3,1210,"adicionar registro ao lote")
    seq_msg_big(d,xs,2,3,1470,"salvar cenário e lote (transação)")
    seq_msg_big(d,xs,3,4,1560,"BEGIN; INSERT cenário + lote; COMMIT")
    seq_msg_big(d,xs,4,3,1650,"identificadores persistidos",ret=True)
    seq_msg_big(d,xs,3,2,1740,"cenário e quantidade gerada",ret=True)
    seq_msg_big(d,xs,2,1,1830,"resultado reprodutível",ret=True)
    seq_msg_big(d,xs,1,0,1930,"exibir resumo da geração",ret=True)
    im.save(OUT/"im06_sequencia_uc11_uml.png",quality=95)


def entity_box_big(d,box,name,attrs,fill=BLUE2):
    x1,y1,x2,y2=box
    d.rectangle(box,fill=fill,outline=INK,width=3)
    d.rectangle((x1,y1,x2,y1+52),fill=BLUE,outline=INK,width=3)
    text_center(d,((x1+x2)/2,y1+26),name,size=29,bold=True)
    y=y1+64
    for attr in attrs:
        d.text((x1+12,y),attr,font=font(24),fill=INK); y+=31


def er_diagram_portrait():
    im,d=canvas(1800,2200)
    b={
      "usr":(40,60,420,270),"org":(600,50,1050,290),"ana":(1190,40,1740,270),"est":(1190,330,1740,590),
      "obj":(60,540,520,800),"srv":(650,530,1110,790),"cus":(1260,690,1740,920),"dem":(1260,990,1740,1220),
      "vin":(60,960,520,1230),"ind":(650,1010,1110,1290),"cen":(60,1580,560,1840),"reg":(670,1540,1210,1840),"med":(1280,1430,1740,1660)
    }
    entity_box_big(d,b["usr"],"usuario",["PK id: UUID","UK email","nome, senha_hash, perfil"])
    entity_box_big(d,b["org"],"organizacao",["PK id: UUID","FK/UK usuario_id","nome, setor, descricao"],BLUE)
    entity_box_big(d,b["ana"],"analise_ambiente",["PK id: UUID","FK organizacao_id","tipo, categoria, impacto"])
    entity_box_big(d,b["est"],"estrategia_servico",["PK id: UUID","FK organizacao_id","perspectiva, posicao, plano, padrao","UK organizacao_id + versao"])
    entity_box_big(d,b["obj"],"objetivo_estrategico",["PK id: UUID","FK organizacao_id","codigo, descricao, prazo, status","UK organizacao_id + codigo"])
    entity_box_big(d,b["srv"],"servico",["PK id: UUID","FK organizacao_id","nome, publico_alvo, status"])
    entity_box_big(d,b["cus"],"custo_servico",["PK id: UUID","FK servico_id","tipo, valores, periodo"])
    entity_box_big(d,b["dem"],"demanda_capacidade",["PK id: UUID","FK servico_id","periodo, demanda, capacidade, unidade"])
    entity_box_big(d,b["vin"],"vinculo_estrategico",["PK id: UUID","FK servico_id","FK objetivo_id","justificativa_valor, contribuicao","UK servico_id + objetivo_id"],GREEN)
    entity_box_big(d,b["ind"],"indicador",["PK id: UUID","FK servico_id","FK objetivo_id [opcional]","nome, tipo, unidade, meta, sentido"])
    entity_box_big(d,b["cen"],"cenario_simulacao",["PK id: UUID","FK organizacao_id","semente, período, volume, perfil"])
    entity_box_big(d,b["reg"],"registro_operacional",["PK id: UUID","FK servico_id","FK cenario_id","datas, tempo, SLA, satisfação"])
    entity_box_big(d,b["med"],"medicao",["PK id: UUID","FK indicador_id","periodo_ref, valor, origem","UK indicador_id + periodo_ref"])
    er_rel(d,[(420,160),(600,160)],left=(1,"one"),right=(0,"one"))
    er_rel(d,[(1050,110),(1190,110)],left=(1,"one"),right=(0,"many"))
    er_rel(d,[(1050,240),(1135,240),(1135,460),(1190,460)],left=(1,"one"),right=(0,"many"))
    er_rel(d,[(700,290),(700,430),(290,430),(290,540)],left=(1,"one"),right=(0,"many"))
    er_rel(d,[(870,290),(870,530)],left=(1,"one"),right=(0,"many"))
    er_rel(d,[(600,250),(560,250),(560,410),(20,410),(20,1450),(300,1450),(300,1580)],left=(1,"one"),right=(0,"many"))
    er_rel(d,[(1110,650),(1180,650),(1180,810),(1260,810)],left=(1,"one"),right=(0,"many"))
    er_rel(d,[(1110,740),(1160,740),(1160,1100),(1260,1100)],left=(1,"one"),right=(0,"many"))
    er_rel(d,[(520,740),(590,740),(590,1050),(520,1050)],left=(1,"one"),right=(0,"many"))
    er_rel(d,[(1010,790),(1160,790),(1160,1700),(1210,1700)],left=(1,"one"),right=(0,"many"))
    er_rel(d,[(850,790),(850,1010)],left=(1,"one"),right=(0,"many"))
    er_rel(d,[(520,650),(610,650),(610,1190),(650,1190)],left=(0,"one"),right=(0,"many"))
    er_rel(d,[(1110,1190),(1200,1190),(1200,1540),(1280,1540)],left=(1,"one"),right=(0,"many"))
    er_rel(d,[(560,1710),(670,1710)],left=(1,"one"),right=(0,"many"))
    d.text((700,2090),"PK: chave primária | FK: chave estrangeira | UK: restrição de unicidade",font=font(25,italic=True),fill=MID)
    im.save(OUT/"im07_mer_conceitual.png",quality=95)


def main():
    use_case_diagram()
    activity_diagram()
    class_diagram()
    sequence_uc09()
    sequence_uc11()
    er_diagram()
    component_diagram()
    deployment_diagram()
    state_diagram()
    # Versões verticais substituem os modelos densos para garantir leitura em página A4.
    class_diagram_portrait()
    sequence_uc09_portrait()
    sequence_uc11_portrait()
    er_diagram_portrait()
    for p in sorted(OUT.glob("*.png")):
        print(p)


if __name__ == "__main__":
    main()
