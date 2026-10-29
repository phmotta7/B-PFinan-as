// Registros guardados (espelham as tabelas do Supabase, em camelCase). Dinheiro em centavos.
import type { Centavos } from '@/dominio/dinheiro';
import type { Mes } from '@/dominio/ciclo';
import type { TipoLinha } from '@/dominio/leitores';
import type { MapaDeColunas } from '@/dominio/leitores';

export type Escopo = 'pessoal' | 'casal';

export type Pessoa = { id: string; nome: string; tipo: 'usuario' | 'participante'; cor: string; telefoneWhatsapp?: string | null; chavePix?: string | null };
export type Categoria = { id: string; nome: string; tipo: 'despesa' | 'receita'; ordem: number; ativa: boolean };
export type Cartao = { id: string; apelido: string; banco: 'nubank' | 'bb' | 'outro'; titular: string; diaFechamento: number; diaVencimento: number; ativo: boolean; mapaCsv?: MapaDeColunas | null };
export type Fatura = { id: string; cartao: string; mes: Mes; dataFechamento: string; dataVencimento: string; status: 'aberta' | 'fechada' | 'importada' | 'encerrada' };
export type Pendencia = { tipo: 'duplicidade'; manual: string } | { tipo: 'ambigua'; candidatos: string[] };
export type Compra = {
  id: string; cartao: string; data: string; descricao: string; valorTotal: Centavos; parcelas: number;
  tipo: TipoLinha | 'multa'; compraOrigem?: string | null; pagador?: string | null; escopo?: Escopo | null; categoria?: string | null;
  observacao?: string | null; origem: 'manual' | 'importacao'; conciliada: boolean; pendencia?: Pendencia | null;
};
export type ParcelaCartao = { id: string; compra: string; fatura: string; numero: number; valor: Centavos; status: 'prevista' | 'confirmada'; linhaImportada?: string | null };
export type Importacao = { id: string; formato: 'nubank_csv' | 'csv_generico'; cartao: string; fatura: string; arquivoNome: string; total: Centavos; linhasNovas: number; linhasRepetidas: number; linhasIgnoradas: number; criadoEm: string };
export type LinhaImportada = { id: string; importacao: string; cartao: string; dados: Record<string, unknown>; digital: string; situacao: 'nova' | 'conciliada' | 'duplicada' | 'ignorada' };
export type Divida = { id: string; nome: string; tipo: 'emprestimo' | 'parcelamento_externo' | 'outro'; titular: string; responsavel: string; escopo?: Escopo | null; valorParcela: Centavos; parcelaAtual: number; mesParcelaAtual: Mes; totalParcelas: number; diaVencimento: number; situacao: 'ativa' | 'quitada' };
export type Fechamento = { id: string; devedor: string; credor: string; mes: Mes; enviadoEm?: string | null };
export type PagamentoFechamento = { id: string; fechamento: string; valor: Centavos; data: string; observacao?: string | null };
export type UsuarioAutorizado = { id: string; email: string; pessoa?: string | null };

export type Tabelas = {
  pessoa: Pessoa; categoria: Categoria; cartao: Cartao; fatura: Fatura; compra: Compra; parcela_cartao: ParcelaCartao;
  importacao: Importacao; linha_importada: LinhaImportada; divida: Divida; fechamento: Fechamento; pagamento_fechamento: PagamentoFechamento;
  usuario_autorizado: UsuarioAutorizado;
};
export type Tabela = keyof Tabelas;
/** Ordem segura para inserir (quem é referenciado vem antes). Apagar usa a ordem inversa. */
export const ORDEM_TABELAS: Tabela[] = ['pessoa', 'usuario_autorizado', 'categoria', 'cartao', 'fatura', 'importacao', 'linha_importada', 'compra', 'parcela_cartao', 'divida', 'fechamento', 'pagamento_fechamento'];

export type Retrato = { [T in Tabela]: Tabelas[T][] };
export const retratoVazio = (): Retrato => Object.fromEntries(ORDEM_TABELAS.map(t => [t, []])) as unknown as Retrato;

/** Mudança a aplicar no banco: o mesmo pacote serve para o modo demonstração e para o Supabase. */
export type Mudanca = {
  inserir: { [T in Tabela]?: Tabelas[T][] };
  atualizar: { [T in Tabela]?: Tabelas[T][] };
  apagar: { [T in Tabela]?: string[] };
};
export const mudancaVazia = (): Mudanca => ({ inserir: {}, atualizar: {}, apagar: {} });
