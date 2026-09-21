"""Fonte vigente das figuras 2–10; revisão semântica UML e esquema Prisma.

Os desenhos são gerados deterministicamente a partir de elementos e relações,
não por retoques nas imagens. O modelo de dados contém todas as 15 FKs do Prisma.
"""
from pathlib import Path
from math import atan2, cos, sin, pi
from io import BytesIO
import os
from PIL import Image, ImageDraw
from gerar_diagramas_uml import font, line, arrow, text_center, rounded, actor, hollow_triangle

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'diagramas_uml'
INK, WHITE, FILL, GRAY = '#172033', '#FFFFFF', '#F4F7FA', '#E8EDF2'


def canvas(w, h):
    image = Image.new('RGB', (w, h), WHITE)
    return image, ImageDraw.Draw(image)


def save(im, filename):
    buffer=BytesIO()
    im.save(buffer,format='PNG',dpi=(300,300))
    dest=OUT/filename
    if dest.exists() and dest.read_bytes()==buffer.getvalue():return
    temp=OUT/(filename+'.tmp')
    temp.write_bytes(buffer.getvalue())
    os.replace(temp,dest)


def label(d, xy, value, size=30, bold=False):
    f = font(size, bold=bold)
    b = d.multiline_textbbox((0, 0), value, font=f, spacing=6, align='center')
    w, h = b[2]-b[0], b[3]-b[1]
    x, y = xy[0]-w/2, xy[1]-h/2
    d.rectangle((x-5, y-5, x+w+5, y+h+8), fill=WHITE)
    d.multiline_text((x, y), value, font=f, fill=INK, spacing=6, align='center')


def diamond(d, cx, cy, rx=34, ry=30):
    pts=[(cx,cy-ry),(cx+rx,cy),(cx,cy+ry),(cx-rx,cy)]
    d.polygon(pts, fill=WHITE)
    line(d, pts+[pts[0]], width=3)


def use_cases():
    im,d=canvas(1800,1890)
    d.rectangle((355,35,1450,1770),outline=INK,width=3)
    text_center(d,(900,80),'EduITSM — escopo funcional previsto',size=34,bold=True)
    actor(d,135,165,'Usuário',size=30)
    actor(d,130,905,'Usuário',size=30)
    actor(d,1635,320,'Professor',size=30)
    # Usuário é o papel de operação do ambiente próprio (aluno ou professor).
    # Professor é o papel adicional de acompanhamento somente leitura de alunos.
    cases=[
      (900,195,'UC01  Autenticar-se'),
      (650,410,'UC02  Manter\norganização'),(1180,410,'UC08  Registrar demanda\ne capacidade'),
      (650,655,'UC03  Registrar análise\nde ambiente'),(1180,655,'UC09  Vincular serviço\na objetivo estratégico'),
      (650,900,'UC04  Definir estratégia\nde serviço (4 Ps)'),(1180,900,'UC10  Definir indicadores\nde desempenho'),
      (650,1145,'UC05  Manter objetivos\nestratégicos'),(1180,1145,'UC11  Gerar dados\noperacionais simulados'),
      (650,1390,'UC06  Manter portfólio\nde serviços'),(1180,1390,'UC12  Consultar painel\nde indicadores'),
      (650,1635,'UC07  Registrar custos\ne orçamento'),(1180,1635,'UC13  Exportar relatório\nda estratégia'),
    ]
    # Repetição explícita do mesmo ator Aluno à direita, para reduzir cruzamentos.
    actor(d,1635,1030,'Usuário',size=30)
    for x,y,t in cases:
        d.ellipse((x-235,y-76,x+235,y+76),fill=FILL,outline=INK,width=3)
        text_center(d,(x,y),t,size=29)
    line(d,[(180,165),(665,195)],width=3)
    line(d,[(1590,320),(1490,320),(1490,195),(1135,195)],width=3)
    for x,y,_ in cases[1:]:
        line(d,[(175,905),(415,y)] if x==650 else [(1590,1030),(1415,y)],width=2)
    # UC14 ocupa uma fronteira repetida do mesmo sistema, não uma segunda aplicação.
    d.rectangle((1510,505,1780,755),outline=INK,width=3)
    text_center(d,(1645,530),'EduITSM',size=27,bold=True)
    d.ellipse((1525,565,1765,735),fill=FILL,outline=INK,width=3)
    text_center(d,(1645,650),'UC14\nAcompanhar\nalunos',size=29)
    line(d,[(1635,460),(1635,565)],width=3)
    text_center(d,(900,1810),'Usuário: aluno ou professor no ambiente próprio; ator e fronteira repetidos.',size=28)
    text_center(d,(900,1850),'UC14: professor consulta os ambientes dos alunos em modo somente leitura.',size=28)
    save(im,'im02_casos_de_uso_uml.png')


def activity():
    im,d=canvas(1800,1670)
    d.ellipse((878,25,922,69),fill=INK)
    arrow(d,[(900,69),(900,112)],open_head=True)
    diamond(d,900,145)
    arrow(d,[(900,175),(900,220)],open_head=True)
    actions=[
      (560,220,1240,350,'Analisar ambiente\nSWOT interno e externo'),
      (560,430,1240,560,'Definir direção estratégica\n4 Ps e objetivos'),
      (560,640,1240,770,'Desenhar e alinhar serviços\nportfólio, custos, capacidade e vínculos'),
      (560,850,1240,980,'Simular a operação\ngerar registros operacionais'),
      (560,1060,1240,1190,'Medir e avaliar\ncalcular indicadores e comparar metas')]
    for b in actions: rounded(d,b[:4],b[4],fill=FILL,size=32)
    for a,b in zip(actions,actions[1:]): arrow(d,[(900,a[3]),(900,b[1])],open_head=True)
    arrow(d,[(900,1190),(900,1250)],open_head=True)
    diamond(d,900,1310,90,60)
    label(d,(900,1410),'Metas atingidas?',size=30,bold=True)
    rounded(d,(50,1250,590,1380),'Revisar análise\ne decisões estratégicas',fill=FILL,size=31)
    rounded(d,(1210,1250,1750,1380),'Registrar melhorias\ne consolidar aprendizado',fill=FILL,size=31)
    arrow(d,[(810,1310),(590,1310)],open_head=True)
    arrow(d,[(990,1310),(1210,1310)],open_head=True)
    label(d,(700,1270),'[não]',bold=True)
    label(d,(1100,1270),'[sim]',bold=True)
    # Três alternativas convergem por merge; a primeira ação tem UMA entrada.
    arrow(d,[(320,1250),(320,145),(866,145)],open_head=True)
    arrow(d,[(1480,1250),(1480,145),(934,145)],open_head=True)
    text_center(d,(900,1540),'Losango superior: intercalação de alternativas (merge), sem sincronização.',size=29)
    text_center(d,(900,1595),'Ciclo de revisão contínua: não há nó final neste recorte do processo.',size=29)
    save(im,'im03_atividade_uml.png')


B={
 'usr':(40,60,420,310),'org':(600,50,1050,340),
 'ana':(1260,40,1770,330),'est':(1260,390,1770,720),
 'obj':(60,560,520,880),'srv':(650,550,1110,880),
 'cus':(1260,780,1770,1070),'dem':(1260,1140,1770,1440),
 'vin':(60,1050,520,1310),'ind':(650,1080,1110,1430),
 'cen':(60,1650,560,1990),'reg':(690,1660,1130,2050),
 'med':(1260,1630,1770,1920),
}

# Cada tupla: classe todo/origem, classe destino, rota, multiplicidades, composição.
RELS=[
 ('usr','org',[(420,180),(600,180)],'1','0..1',False),
 ('org','ana',[(1050,125),(1260,125)],'1','0..*',True),
 ('org','est',[(1050,280),(1180,280),(1180,520),(1260,520)],'1','0..*',True),
 ('org','obj',[(720,340),(720,450),(290,450),(290,560)],'1','0..*',True),
 ('org','srv',[(870,340),(870,550)],'1','0..*',True),
 ('org','cen',[(600,280),(555,280),(555,410),(20,410),(20,1510),(300,1510),(300,1650)],'1','0..*',True),
 ('srv','cus',[(1110,660),(1150,660),(1150,925),(1260,925)],'1','0..*',True),
 ('srv','dem',[(1110,790),(1170,790),(1170,1280),(1260,1280)],'1','0..*',True),
 ('srv','ind',[(850,880),(850,1080)],'1','0..*',True),
 ('srv','reg',[(1110,855),(1190,855),(1190,1825),(1130,1825)],'1','0..*',False),
 ('ind','med',[(1110,1360),(1220,1360),(1220,1780),(1260,1780)],'1','0..*',True),
 ('cen','reg',[(560,1810),(690,1810)],'1','0..*',True),
 ('obj','ind',[(520,690),(610,690),(610,1330),(650,1330)],'0..1','0..*',False),
]


def box(d,rect,name,attrs,relational=False):
    x1,y1,x2,y2=rect
    d.rectangle(rect,fill=FILL,outline=INK,width=3)
    text_center(d,((x1+x2)/2,y1+36),name,size=31,bold=True)
    line(d,[(x1,y1+75),(x2,y1+75)],width=2)
    for i,a in enumerate(attrs):
        f=font(30)
        assert d.textlength(a,font=f) <= x2-x1-20,(name,a)
        d.text((x1+10,y1+86+40*i),a,font=f,fill=INK)
    assert y1+86+40*len(attrs)<y2+10,name


def endpoint_label(d,p,q,value,offset=24):
    x,y=p; tx,ty=q
    if tx==x:
        d.text((x+17,y+(35 if ty>y else -38)),value,font=font(25,bold=True),fill=INK)
    else:
        d.text((x+(offset if tx>x else -offset),y-28),value,font=font(25,bold=True),fill=INK,anchor='mb')


def bridges(d,routes):
    # Arcos em cruzamentos: as relações continuam independentes, sem junções.
    hs=[];vs=[]
    for i,pts in enumerate(routes):
        for a,b in zip(pts,pts[1:]):
            if a[1]==b[1]: hs.append((i,min(a[0],b[0]),max(a[0],b[0]),a[1]))
            if a[0]==b[0]: vs.append((i,a[0],min(a[1],b[1]),max(a[1],b[1])))
    for i,x1,x2,y in hs:
        for j,x,y1,y2 in vs:
            if i!=j and x1+12<x<x2-12 and y1+12<y<y2-12:
                d.rectangle((x-10,y-5,x+10,y+5),fill=WHITE)
                line(d,[(x,y-6),(x,y+6)],width=3)
                d.arc((x-10,y-10,x+10,y+10),180,360,fill=INK,width=3)


def classes():
    im,d=canvas(1800,2160)
    attrs={
      'usr':('Usuario',['nome: String','email: String','perfil: PerfilUsuario']),
      'org':('Organizacao',['nome: String','setor: String [0..1]','descricao: String [0..1]']),
      'ana':('AnaliseAmbiente',['tipo: TipoAmbiente','categoria: CategoriaSwot','descricao: String','impacto: NivelImpacto [0..1]']),
      'est':('EstrategiaServico',['perspectiva: String [0..1]','posicao: String [0..1]','plano: String [0..1]','padrao: String [0..1]','versao: Integer']),
      'obj':('ObjetivoEstrategico',['codigo: String','descricao: String','prazo: Date [0..1]','status: StatusObjetivo']),
      'srv':('Servico',['nome: String','descricao: String [0..1]','publicoAlvo: String [0..1]','status: StatusServico']),
      'cus':('CustoServico',['tipo: TipoCusto','valorPrevisto: Decimal','valorRealizado: Decimal [0..1]','periodo: String']),
      'dem':('DemandaCapacidade',['periodo: String','demandaPrevista: Integer','capacidadeInstalada: Integer','unidade: String']),
      'vin':('VinculoEstrategico',['justificativaValor: String','contribuicao: Decimal']),
      'ind':('Indicador',['nome: String','tipo: TipoIndicador','unidade: String','meta: Decimal','sentido: SentidoMeta']),
      'cen':('CenarioSimulacao',['semente: Integer','periodoInicio: Date','periodoFim: Date','volumeRegistros: Integer','perfil: PerfilCenario']),
      'reg':('RegistroOperacional',['dataAbertura: DateTime','dataFechamento: DateTime [0..1]','tempoAtendimentoMin: Integer [0..1]','slaCumprido: Boolean','notaSatisfacao: Integer [0..1]']),
      'med':('Medicao',['periodoRef: Date','valor: Decimal','origem: OrigemMedicao']),
    }
    # Campos extensos são quebrados como declarações UML, sem abreviar nomes.
    attrs['reg']=('RegistroOperacional',['dataAbertura: DateTime','dataFechamento:','  DateTime [0..1]','tempoAtendimentoMin:','  Integer [0..1]','slaCumprido: Boolean','notaSatisfacao: Integer [0..1]'])
    for k,(n,a) in attrs.items():box(d,B[k],n,a)
    routes=[]
    for a,b,pts,am,bm,comp in RELS:
        line(d,pts,width=3);routes.append(pts)
        if comp:
            x,y=pts[0]; nx,ny=pts[1];ang=atan2(ny-y,nx-x)
            ux,uy=cos(ang),sin(ang);px,py=-uy,ux
            poly=[(x,y),(x+ux*20+px*12,y+uy*20+py*12),(x+ux*40,y+uy*40),(x+ux*20-px*12,y+uy*20-py*12)]
            d.polygon(poly,fill=INK)
        endpoint_label(d,pts[0],pts[1],am,offset=48)
        endpoint_label(d,pts[-1],pts[-2],bm,offset=40)
    # Classe associativa UML: linha tracejada até a associação M:N.
    pts=[(520,820),(650,820)];line(d,pts,width=3)
    endpoint_label(d,pts[0],pts[1],'0..*',28);endpoint_label(d,pts[-1],pts[-2],'0..*',28)
    dashed=[(585,820),(565,820),(565,1180),(520,1180)]
    line(d,dashed,width=3,dash=(12,8));routes.extend([pts,dashed]);bridges(d,routes)
    text_center(d,(900,2100),'Losango preenchido: composição. Vínculo com Servico: associação simples.',size=28)
    text_center(d,(900,2140),'VinculoEstrategico: classe associativa. Atributos essenciais; identificadores omitidos.',size=27)
    save(im,'im04_classes_uml.png')


def crow(d,p,q,m):
    x,y=p;ang=atan2(q[1]-y,q[0]-x); ux,uy=cos(ang),sin(ang);px,py=-uy,ux
    def bar(t):
        bx,by=x+ux*t,y+uy*t
        line(d,[(bx+px*10,by+py*10),(bx-px*10,by-py*10)],width=3)
    # Máximo junto à entidade, mínimo mais afastado (ordem pé de galinha).
    if '*' in m:
        for side in [-1,0,1]:line(d,[(x+ux*5+px*side*13,y+uy*5+py*side*13),(x+ux*26,y+uy*26)],width=3)
    else:bar(12)
    if m.startswith('0'):
        cx,cy=x+ux*42,y+uy*42;d.ellipse((cx-8,cy-8,cx+8,cy+8),fill=WHITE,outline=INK,width=3)
    else:bar(38)


def er():
    im,d=canvas(1800,2160)
    attrs={
      'usr':('usuario',['PK id','UK email','nome, senha_hash, perfil']),
      'org':('organizacao',['PK id','FK, UK usuario_id','nome, setor, descricao']),
      'ana':('analise_ambiente',['PK id','FK organizacao_id','tipo, categoria, descricao','impacto (opcional)']),
      'est':('estrategia_servico',['PK id','FK organizacao_id','perspectiva, posicao','plano, padrao, versao','UK (organizacao_id, versao)']),
      'obj':('objetivo_estrategico',['PK id','FK organizacao_id','codigo, descricao, prazo','status','UK (organizacao_id, codigo)']),
      'srv':('servico',['PK id','FK organizacao_id','nome, descricao','publico_alvo, status']),
      'cus':('custo_servico',['PK id','FK servico_id','tipo, valor_previsto','valor_realizado, periodo']),
      'dem':('demanda_capacidade',['PK id','FK servico_id','periodo, demanda_prevista','capacidade_instalada, unidade']),
      'vin':('vinculo_estrategico',['PK id; FK servico_id','FK objetivo_id','justificativa_valor, contribuicao','UK (servico_id, objetivo_id)']),
      'ind':('indicador',['PK id','FK servico_id','FK objetivo_id (opcional)','nome, tipo, unidade','meta, sentido']),
      'cen':('cenario_simulacao',['PK id','FK organizacao_id','semente, periodo_inicio','periodo_fim, volume_registros','perfil']),
      'reg':('registro_operacional',['PK id; FK servico_id','FK cenario_id','data_abertura','data_fechamento (opcional)','tempo_atendimento_min','sla_cumprido','nota_satisfacao (opcional)']),
      'med':('medicao',['PK id; FK indicador_id','periodo_ref, valor, origem','UK (indicador_id,','       periodo_ref)']),
    }
    for k,(n,a) in attrs.items():box(d,B[k],n,a,True)
    rels=[(a,b,p,am,bm) for a,b,p,am,bm,_ in RELS]
    rels += [('obj','vin',[(290,880),(290,1050)],'1','0..*'),
             ('srv','vin',[(650,750),(570,750),(570,1390),(290,1390),(290,1310)],'1','0..*')]
    assert len(rels)==15
    for a,b,p,am,bm in rels:
        line(d,p,width=3);crow(d,p[0],p[1],am);crow(d,p[-1],p[-2],bm)
    bridges(d,[r[2] for r in rels])
    text_center(d,(900,2100),'PK: chave primária | FK: chave estrangeira | UK: restrição de unicidade',size=28)
    text_center(d,(900,2140),'Modelo lógico relacional. Tipos e nulabilidade completos: esquema Prisma da Seção 4.4.17.',size=27)
    save(im,'im07_mer_conceitual.png')


def seq_base(names,h):
    im,d=canvas(1800,h)
    xs=[120+1500*i/(len(names)-1) for i in range(len(names))]
    for i,(x,n) in enumerate(zip(xs,names)):
        if i==0:
            actor(d,x,115,'Aluno',size=29)
            start=295
        else:
            d.rectangle((x-155,65,x+155,235),fill=FILL,outline=INK,width=3)
            text_center(d,(x,145),n,size=29)
            start=235
        line(d,[(x,start),(x,h-145)],dash=(12,10),width=2)
    return im,d,xs


def act(d,x,a,b):d.rectangle((x-9,a,x+9,b),fill=WHITE,outline=INK,width=2)


def msg(d,xs,a,b,y,t,ret=False):
    x1,x2=xs[a],xs[b]
    arrow(d,[(x1,y),(x2,y)],dash=(12,8) if ret else None,open_head=ret,width=3,size=18)
    label(d,((x1+x2)/2,y-29),t,size=30)


def self_msg(d,x,y,t):
    arrow(d,[(x+9,y),(x+120,y),(x+120,y+55),(x+18,y+55)],width=3,size=18)
    act(d,x+9,y+55,y+95)
    label(d,(x+170,y-42),t,size=29)


def fragment(d,rect,kind,guard):
    x1,y1,x2,y2=rect
    d.rectangle(rect,outline=INK,width=3)
    d.polygon([(x1,y1),(x1+100,y1),(x1+100,y1+30),(x1+75,y1+55),(x1,y1+55)],fill=GRAY,outline=INK)
    d.text((x1+15,y1+8),kind,font=font(29,bold=True),fill=INK)
    label(d,(x1+360,y1+80),guard,size=29,bold=True)


def seq09():
    im,d,x=seq_base(['Aluno','tela :\nInterfaceWeb','servico :\nVinculoService','repo :\nVinculoRepository'],2250)
    act(d,x[1],325,2030);act(d,x[2],445,1970)
    for a,b in [(560,640),(930,1010),(1370,1450)]:act(d,x[3],a,b)
    msg(d,x,0,1,325,'submeter dados do vínculo')
    msg(d,x,1,2,445,'criarVinculo(usuarioId, dados)')
    msg(d,x,2,3,560,'buscarEntidades(usuarioId, ids)')
    msg(d,x,3,2,640,'organização, serviço e objetivo',True)
    self_msg(d,x[2],765,'validar pertencimento e justificativa')
    msg(d,x,2,3,930,'somarContribuicoes(objetivoId)')
    msg(d,x,3,2,1010,'somaAtual',True)
    fragment(d,(50,1100,1750,2070),'alt','[somaAtual + contribuicao <= 100]')
    msg(d,x,2,3,1370,'salvarVinculo(dados)')
    msg(d,x,3,2,1450,'vínculo persistido',True)
    msg(d,x,2,1,1530,'resultado de sucesso (HTTP 201)',True)
    msg(d,x,1,0,1610,'confirmação e cobertura atualizada',True)
    line(d,[(50,1680),(1750,1680)],dash=(12,8),width=2)
    label(d,(640,1740),'[somaAtual + contribuicao > 100]',size=29,bold=True)
    msg(d,x,2,1,1900,'erro RN06 e saldo (HTTP 422)',True)
    msg(d,x,1,0,2010,'mensagem com contribuição disponível',True)
    text_center(d,(900,2150),'Projeto da Fase 3. Pré-condição: sessão válida; erros de acesso não detalhados.',size=27)
    text_center(d,(900,2195),'Soma e gravação na mesma transação, serializada por objetivo; SQL omitido.',size=27)
    save(im,'im05_sequencia_uc09_uml.png')


def seq11():
    im,d,x=seq_base(['Aluno','tela :\nInterfaceWeb','app :\nCenarioService','motor :\nMotorSimulacao','repo :\nCenarioRepository'],2280)
    act(d,x[1],330,2050);act(d,x[2],450,1970)
    act(d,x[4],570,650);act(d,x[3],790,870);act(d,x[3],1120,1220);act(d,x[4],1540,1660)
    msg(d,x,0,1,330,'submeter parâmetros')
    msg(d,x,1,2,450,'gerarCenario(usuarioId, p)')
    msg(d,x,2,4,570,'buscar organização e serviços autorizados')
    msg(d,x,4,2,650,'dados para validação',True)
    msg(d,x,2,3,790,'inicializar(p.semente)')
    msg(d,x,3,2,870,'gerador inicializado',True)
    fragment(d,(760,930,1610,1445),'loop','[para cada registro solicitado]')
    msg(d,x,2,3,1120,'gerarRegistro(p, serviços)')
    msg(d,x,3,2,1220,'registro operacional',True)
    self_msg(d,x[2],1315,'adicionar ao lote em memória')
    msg(d,x,2,4,1540,'salvarCenarioELote(p, lote)')
    msg(d,x,4,2,1660,'cenário e quantidade persistida',True)
    msg(d,x,2,1,1840,'resultado (HTTP 201)',True)
    msg(d,x,1,0,1990,'resumo da geração',True)
    text_center(d,(900,2160),'Projeto da Fase 4: parâmetros e autorização válidos; persistência em transação única.',size=27)
    text_center(d,(900,2210),'A semente é inicializada uma vez. O cálculo de indicadores pertence a outro caso de uso.',size=27)
    save(im,'im06_sequencia_uc11_uml.png')


def comp_box(d,b,name,lines):
    x1,y1,x2,y2=b;d.rectangle(b,fill=FILL,outline=INK,width=3)
    text_center(d,((x1+x2)/2,y1+32),'«component»',size=29)
    text_center(d,((x1+x2)/2,y1+88),name,size=34,bold=True)
    for i,t in enumerate(lines):text_center(d,((x1+x2)/2,y1+160+i*46),t,size=30)


def dep(d,pts,t,pos):
    arrow(d,pts,dash=(12,8),open_head=True,width=3)
    label(d,pos,t,size=29)


def components():
    im,d=canvas(1800,1980)
    comp_box(d,(55,70,625,380),'Aplicação Web',['React e TypeScript','interface, sessão e cliente REST'])
    comp_box(d,(1180,70,1750,380),'Contratos compartilhados',['packages/shared','tipos e schemas Zod'])
    comp_box(d,(55,590,625,900),'API HTTP',['rotas Express','autenticação e validação'])
    comp_box(d,(1180,590,1750,1080),'Serviços de domínio',['Fase 1: AuthService','e OrganizacaoService','Planejados: estratégia, portfólio,','cenários e indicadores'])
    comp_box(d,(55,1240,625,1550),'Adaptadores de persistência',['repositórios Prisma','transações e consultas'])
    d.rectangle((1180,1290,1750,1530),fill=WHITE,outline=INK,width=3)
    text_center(d,(1465,1340),'«interface»',size=29)
    text_center(d,(1465,1395),'Contratos de repositório',size=33,bold=True)
    text_center(d,(1465,1460),'AuthRepository, OrganizacaoRepository',size=28)
    comp_box(d,(55,1700,625,1940),'Prisma Client',['acesso ao PostgreSQL'])
    dep(d,[(340,380),(340,590)],'HTTP/JSON',(470,485))
    dep(d,[(625,180),(1180,180)],'usa tipos',(900,140))
    dep(d,[(625,660),(890,660),(890,300),(1180,300)],'valida contratos',(885,450))
    dep(d,[(625,815),(1180,815)],'invoca',(900,775))
    dep(d,[(1465,1080),(1465,1290)],'depende de',(1590,1180))
    # Realização da interface pelo adaptador: seta triangular vazada, tracejada.
    line(d,[(625,1420),(1140,1420)],dash=(12,8),width=3)
    hollow_triangle(d,(1180,1420),(1138,1400),(1138,1440))
    label(d,(900,1370),'realiza',size=29)
    dep(d,[(340,1550),(340,1700)],'usa',(460,1620))
    text_center(d,(1230,1715),'Dependência: seta tracejada aberta.',size=30)
    text_center(d,(1230,1770),'Realização: triângulo vazado.',size=30)
    text_center(d,(1230,1850),'Motor de simulação e cálculo de indicadores',size=28)
    text_center(d,(1230,1895),'são responsabilidades separadas no projeto.',size=28)
    save(im,'im08_componentes_uml.png')


def node(d,b,kind,name):
    x1,y1,x2,y2=b;z=18
    d.polygon([(x1,y1),(x1+z,y1-z),(x2+z,y1-z),(x2,y1)],fill=GRAY,outline=INK)
    d.polygon([(x2,y1),(x2+z,y1-z),(x2+z,y2-z),(x2,y2)],fill=GRAY,outline=INK)
    d.rectangle(b,fill=WHITE,outline=INK,width=3)
    text_center(d,((x1+x2)/2,y1+30),'«'+kind+'»',size=29)
    text_center(d,((x1+x2)/2,y1+85),name,size=32,bold=True)


def artifact(d,b,t):
    d.rectangle(b,fill=FILL,outline=INK,width=3)
    text_center(d,((b[0]+b[2])/2,(b[1]+b[3])/2),'«artifact»\n'+t,size=30)


def deployment():
    im,d=canvas(1800,1850)
    text_center(d,(900,35),'Implantação de produção prevista',size=35,bold=True)
    node(d,(65,125,725,740),'device','Computador do usuário')
    node(d,(120,315,670,675),'executionEnvironment','Navegador')
    artifact(d,(175,490,610,610),'Aplicação Web\nHTML, CSS e JavaScript')
    node(d,(1070,125,1730,915),'node','Servidor de aplicação')
    node(d,(1125,315,1675,835),'executionEnvironment','Node.js')
    artifact(d,(1180,490,1615,680),'API EduITSM\nbuild JavaScript')
    text_center(d,(1400,760),'Módulos de domínio incluídos no build.',size=27)
    node(d,(1070,1170,1730,1770),'node','Servidor de dados')
    node(d,(1125,1360,1675,1705),'executionEnvironment','PostgreSQL 16')
    artifact(d,(1180,1530,1615,1665),'Esquema EduITSM')
    line(d,[(725,415),(1070,415)],width=3)
    label(d,(897,345),'HTTPS/TLS\nporta 443',size=31,bold=True)
    line(d,[(1400,915),(1400,1170)],width=3)
    label(d,(1530,1050),'PostgreSQL/TLS\nporta 5432',size=30,bold=True)
    d.rectangle((70,1050,800,1740),outline=INK,width=2)
    text_center(d,(435,1120),'Ambiente local já configurado',size=32,bold=True)
    for i,t in enumerate(['Web: Vite, porta 5173','API: Node.js, porta 3333','Banco: contêiner PostgreSQL 16','Docker Compose: porta 5432','HTTP local; TLS de produção planejado.']):
        text_center(d,(435,1240+i*85),t,size=30)
    text_center(d,(900,1820),'Linhas contínuas sem setas representam caminhos de comunicação entre nós.',size=28)
    save(im,'im09_implantacao_uml.png')


def states():
    im,d=canvas(1800,2220)
    text_center(d,(900,35),'Navegação prevista — percurso didático e acesso por perfil',size=32,bold=True)
    d.ellipse((80,140,120,180),fill=INK)
    rounded(d,(230,100,700,225),'T01 Login',size=34,fill=FILL)
    arrow(d,[(120,160),(230,160)],open_head=True)
    # Estado composto permite saída global por logout/expiração.
    rounded(d,(65,385,1740,2075),'',radius=35,fill=WHITE)
    text_center(d,(360,430),'Sessão autenticada',size=34,bold=True)
    line(d,[(65,475),(1740,475)],width=2)
    arrow(d,[(465,225),(465,385)],open_head=True)
    label(d,(805,300),'autenticar [credenciais válidas]',size=29)
    d.ellipse((120,540,160,580),fill=INK)
    rounded(d,(340,510,830,640),'T02 Painel inicial',size=34,fill=FILL)
    arrow(d,[(160,560),(340,560)],open_head=True)
    rounded(d,(1130,510,1660,675),'T15 Acompanhamento\ndos alunos (somente leitura)',size=30,fill=FILL)
    arrow(d,[(830,580),(1130,580)],open_head=True)
    label(d,(990,715),'abrirAlunos\n[perfil = PROFESSOR]',size=27)
    # Perímetro do percurso do aluno; estados compostos reduzem a densidade.
    steps=[
      ((320,835,870,1080),'Estratégia',['T03 Análise de ambiente','T04 Quatro Ps','T05 Objetivos estratégicos']),
      ((1080,835,1630,1080),'Portfólio',['T06 Lista de serviços','T07 Cadastro de serviço','T08 Custos e orçamento','T09 Demanda e capacidade']),
      ((1080,1215,1630,1390),'Alinhamento e indicadores',['T10 Vínculo estratégico','T11 Indicadores do serviço']),
      ((320,1215,870,1390),'T12 Cenário de simulação'),
      ((320,1640,870,1815),'T13 Painel de indicadores'),
      ((1080,1640,1630,1815),'T14 Relatório da estratégia'),
    ]
    for item in steps:
        rect,t=item[:2]
        if len(item)==2:
            rounded(d,rect,t,size=30,fill=FILL)
            continue
        x1,y1,x2,y2=rect
        rounded(d,rect,'',size=30,fill=FILL)
        text_center(d,((x1+x2)/2,y1+25),t,size=30,bold=True)
        line(d,[(x1,y1+50),(x2,y1+50)],width=2)
        for i,child in enumerate(item[2]):
            top=y1+60+i*44
            rounded(d,(x1+65,top,x2-20,top+38),child,size=26,fill=WHITE,radius=10,width=2)
        d.ellipse((x1+17,y1+72,x1+33,y1+88),fill=INK)
        arrow(d,[(x1+33,y1+80),(x1+65,y1+80)],open_head=True,width=2,size=12)
    arrow(d,[(585,640),(585,835)],open_head=True)
    label(d,(365,745),'abrirEstratégia\n[ambiente próprio]',size=28)
    arrow(d,[(870,925),(1080,925)],open_head=True);label(d,(975,1035),'abrirPortfólio',size=27)
    arrow(d,[(1355,1080),(1355,1215)],open_head=True);label(d,(1500,1145),'abrirVínculos',size=27)
    arrow(d,[(1080,1300),(870,1300)],open_head=True);label(d,(980,1440),'abrirSimulação',size=27)
    arrow(d,[(595,1390),(595,1640)],open_head=True);label(d,(775,1530),'abrirPainel',size=27)
    arrow(d,[(870,1725),(1080,1725)],open_head=True);label(d,(980,1845),'abrirRelatório',size=27)
    arrow(d,[(320,1725),(195,1725),(195,925),(320,925)],open_head=True)
    label(d,(455,1910),'revisarEstratégia\n[há metas não atingidas]',size=28)
    text_center(d,(940,2020),'Estados compostos mostram as telas; as transições internas foram omitidas neste recorte.',size=27)
    # Transição externa do composto para Login, válida em qualquer subestado.
    arrow(d,[(1740,440),(1775,440),(1775,160),(700,160)],open_head=True)
    label(d,(1240,115),'sair ou sessãoExpirada / limpar sessão',size=29)
    text_center(d,(900,2165),'Recorte de navegação: não impõe avanço automático nem impede o uso do menu.',size=28)
    save(im,'im10_estados_navegacao_uml.png')


def gerar():
    OUT.mkdir(exist_ok=True)
    for fn in [use_cases,activity,classes,seq09,seq11,er,components,deployment,states]:
        fn()
        print(fn.__name__+' OK')


if __name__=='__main__':gerar()
