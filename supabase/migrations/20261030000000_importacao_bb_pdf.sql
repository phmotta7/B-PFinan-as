-- Importação da fatura do BB em PDF: novo formato aceito na tabela de importações.
alter table public.importacao drop constraint importacao_formato_check;
alter table public.importacao add constraint importacao_formato_check check (formato in ('nubank_csv', 'csv_generico', 'bb_pdf', 'ofx'));
