import { describe, expect, it } from 'vitest';
import { paraBanco } from './repositorio';

describe('paraBanco (o que vai para o Supabase)', () => {
  it('não manda a coluna que o banco calcula sozinho, senão ele recusa a gravação', () => {
    const compra = { id: 'c1', descricao: 'iPad', descricaoNormalizada: 'ipad', pagador: 'p1' };
    expect(paraBanco(compra)).toEqual({ id: 'c1', descricao: 'iPad', pagador: 'p1' });
  });
  it('troca o nome dos campos para o jeito do banco e deixa de fora o que não tem valor', () => {
    expect(paraBanco({ valorTotal: 100, compraOrigem: undefined, escopo: null })).toEqual({ valor_total: 100, escopo: null });
  });
});
