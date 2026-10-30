# Gera um PDF fictício no mesmo desenho da fatura do Ourocard (BB), para testar a importação sem usar uma fatura real.
# Uso: python design/exemplos/gerar-bb-pdf.py  ->  design/exemplos/BB_2026-11_ficticio.pdf (fatura aberta, "Lançamentos Futuros")
#                                              e design/exemplos/BB_2026-11_fechada_ficticia.pdf (fatura fechada, com total e vencimento)
import os

DIR = 283  # a coluna da direita começa 283 pontos depois da da esquerda
def d(pedacos): return [(x + DIR, t) for x, t in pedacos]

PAGINAS = [
    [
        (716, [(20, '> Cartão')]), (697, [(31, 'OUROCARD FACIL VISA')]),
        (638, [(20, 'Atenção')]),
        (618, [(31, '• As transações efetuadas em moeda estrangeira foram convertidas pela cotação do Real na data da')]),
        (569, [(20, 'Lançamentos Futuros')]),
        (522, [(26, 'Data'), (54, 'Transações'), (189, 'País'), (214, 'Moeda'), (256, 'Valor'), (309, 'Data'), (337, 'Transações'), (472, 'País'), (497, 'Moeda'), (539, 'Valor')]),
        (502, [(53, 'Pagamentos/Créditos'), (336, 'Compras Diversas')]),
        (479, [(24, '13/10'), (53, 'PGTO DEBITO CONTA 1234'), (220, 'R$'), (257, '-1.250,00')] + d([(24, '05/10'), (53, 'COMPER 86'), (121, 'CAMPO'), (220, 'R$'), (269, '74,19')])),
        (467, [(53, '000000001 100')] + d([(53, 'GRANDE')])),
        (457, d([(24, '06/07'), (53, 'MAGALU*Magalu PARC 04/08'), (220, 'R$'), (266, '153,10')])),
        (445, d([(53, 'FRANCA')])),
        (435, [(53, 'Compras Diversas')]),
        (412, [(24, '02/10'), (53, 'DROGASIL 1234'), (121, 'CAMPO'), (220, 'R$'), (269, '62,40')] + d([(24, '07/10'), (53, 'DL'), (81, '*UberRides Sao Paulo'), (220, 'R$'), (273, '17,93')])),
        (400, [(53, 'GRANDE')]),
        (390, [(24, '30/09'), (53, 'CENTAURO PARC 01/03 SAO'), (220, 'R$'), (266, '100,00')]),
        (379, [(53, 'PAULO')]),
        (368, [(24, '04/10'), (53, 'PAO DE ACUCAR'), (220, 'R$'), (269, '98,37')]),
        (357, [(53, 'CAMPO GRANDE')]),
        (325, [(53, 'Restaurantes')]),
        (302, [(24, '05/10'), (53, 'IFD*iFood'), (112, 'OSASCO'), (220, 'R$'), (269, '38,90')]),
        (63, [(20, 'Banco do Brasil S.A. - exemplo fictício para testes')]),
    ],
    [
        (816, [(26, 'Data'), (54, 'Transações'), (189, 'País'), (214, 'Moeda'), (256, 'Valor')]),
        (796, [(53, 'Compras Diversas')]),
        (773, [(24, '08/10'), (53, 'RENNER'), (220, 'R$'), (269, '79,90')]),
        (761, [(53, 'CAMPO GRANDE')]),
        (751, [(24, '09/10'), (53, 'DL*UberRides'), (119, 'Sao Paulo'), (220, 'R$'), (269, '16,40')]),
        (740, [(24, '11/10'), (53, 'NETFLIX.COM'), (220, 'R$'), (269, '44,90')]),
        (63, [(20, 'Banco do Brasil S.A. - exemplo fictício para testes')]),
    ],
    [
        (813, [(20, 'Lançamentos em processamento')]),
        (766, [(26, 'Data'), (54, 'Descrição'), (256, 'Valor')]),
        (723, [(24, '27/10'), (53, 'HOTEL EXEMPLO'), (266, '461,42')]),
    ],
]

FECHADA = [
    [
        (748, [(40, 'Olá, Fulana, esta é sua fatura de'), (399, 'OUROCARD FACIL VISA'), (522, 'Final 0000')]),
        (728, [(399, 'Resumo da fatura')]), (725, [(240, 'Vencimento')]),
        (703, [(240, '10/11/2026'), (399, 'Pagamentos/Créditos'), (514, 'R$ -1.250,00')]),
        (689, [(399, 'Compras nacionais'), (518, 'R$ 686,09')]),
        (647, [(399, 'Total'), (518, 'R$ 686,09')]),
        (13, [(26, 'Página 1/2 - exemplo fictício para testes')]),
    ],
    [
        (432, [(40, 'Fatura fechada em'), (155, '28/10/2026')]),
        (354, [(50, 'Lançamentos nesta fatura')]),
        (250, [(48, 'Data'), (82, 'Descrição'), (442, 'País'), (524, 'Valor')]),
        (234, [(82, 'SALDO FATURA ANTERIOR'), (446, 'BR'), (507, 'R$ 1.250,00')]),
        (218, [(82, 'Pagamentos/Créditos')]),
        (202, [(48, '13/10'), (82, 'PGTO DEBITO CONTA 1234 000000001 100'), (446, 'BR'), (504, 'R$ -1.250,00')]),
        (186, [(82, 'Restaurantes')]),
        (170, [(47, '05/10'), (82, 'IFD*iFood'), (139, 'OSASCO'), (446, 'BR'), (519, 'R$ 38,90')]),
        (154, [(82, 'Supermercados')]),
        (138, [(48, '04/10'), (82, 'PAO DE ACUCAR'), (175, 'CAMPO GRANDE'), (446, 'BR'), (518, 'R$ 98,37')]),
        (122, [(48, '05/10'), (82, 'COMPER 86'), (145, 'CAMPO GRANDE'), (446, 'BR'), (518, 'R$ 74,19')]),
        (106, [(48, '02/10'), (82, 'DROGASIL 1234 CAMPO GRANDE'), (446, 'BR'), (518, 'R$ 62,40')]),
        (90, [(82, 'Transporte')]),
        (74, [(48, '07/10'), (82, 'DL'), (108, '*UberRides Sao Paulo'), (446, 'BR'), (519, 'R$ 17,93')]),
        (58, [(48, '09/10'), (82, 'DL*UberRides'), (147, 'Sao Paulo'), (446, 'BR'), (519, 'R$ 16,40')]),
        (13, [(25, 'Página 2/2')]),
    ],
    [
        (766, [(82, 'Serviços')]),
        (750, [(48, '08/10'), (82, 'RENNER CAMPO GRANDE'), (446, 'BR'), (518, 'R$ 79,90')]),
        (734, [(48, '11/10'), (82, 'NETFLIX.COM'), (446, 'BR'), (518, 'R$ 44,90')]),
        (718, [(82, 'Compras parceladas')]),
        (702, [(47, '30/09'), (82, 'CENTAURO PARC 01/03 SAO PAULO'), (446, 'BR'), (514, 'R$ 100,00')]),
        (686, [(47, '06/07'), (82, 'MAGALU*Magalu PARC 04/08 FRANCA'), (446, 'BR'), (515, 'R$ 153,10')]),
        (638, [(48, 'Total da Fatura'), (496, 'R$ 686,09')]),
    ],
]

def texto_pdf(t):
    b = t.encode('cp1252')
    return b.replace(b'\\', b'\\\\').replace(b'(', b'\\(').replace(b')', b'\\)')

def gerar(PAGINAS, nome):
  objs = []
  def novo(conteudo):
      objs.append(conteudo); return len(objs)

  fonte = novo(b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  paginas_ref = []
  raiz_paginas = novo(b'')  # preenchido depois
  for linhas in PAGINAS:
      fluxo = b''
      for y, pedacos in linhas:
          for x, t in pedacos:
              fluxo += b'BT /F1 8 Tf 1 0 0 1 %d %d Tm (' % (x, y) + texto_pdf(t) + b') Tj ET\n'
      conteudo = novo(b'<< /Length %d >>\nstream\n' % len(fluxo) + fluxo + b'endstream')
      paginas_ref.append(novo(b'<< /Type /Page /Parent %d 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 %d 0 R >> >> /Contents %d 0 R >>' % (raiz_paginas, fonte, conteudo)))
  objs[raiz_paginas - 1] = b'<< /Type /Pages /Kids [' + b' '.join(b'%d 0 R' % p for p in paginas_ref) + b'] /Count %d >>' % len(paginas_ref)
  catalogo = novo(b'<< /Type /Catalog /Pages %d 0 R >>' % raiz_paginas)

  saida = b'%PDF-1.4\n'
  posicoes = []
  for i, o in enumerate(objs, 1):
      posicoes.append(len(saida))
      saida += b'%d 0 obj\n' % i + o + b'\nendobj\n'
  xref = len(saida)
  saida += b'xref\n0 %d\n0000000000 65535 f \n' % (len(objs) + 1) + b''.join(b'%010d 00000 n \n' % p for p in posicoes)
  saida += b'trailer\n<< /Size %d /Root %d 0 R >>\nstartxref\n%d\n%%%%EOF\n' % (len(objs) + 1, catalogo, xref)

  destino = os.path.join(os.path.dirname(os.path.abspath(__file__)), nome)
  with open(destino, 'wb') as f: f.write(saida)
  print('gerado:', destino)

gerar(PAGINAS, 'BB_2026-11_ficticio.pdf')
gerar(FECHADA, 'BB_2026-11_fechada_ficticia.pdf')
