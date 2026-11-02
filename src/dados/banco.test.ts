// O código e o banco do Supabase andam juntos: cada campo de tipos.ts precisa existir como coluna nas migrações,
// e cada coluna obrigatória (sem valor padrão) precisa ser mandada pelo app. Foi assim que nasceu o "Não consegui salvar" de 30/10.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { AUDITORIA, CALCULADAS } from './repositorio';
import { ORDEM_TABELAS } from './tipos';

const PASTA = join(process.cwd(), 'supabase', 'migrations');
const TIPOS_SQL = 'uuid|text|int|bigint|date|timestamptz|boolean|jsonb|numeric';
const snake = (s: string) => s.replace(/[A-Z]/g, c => '_' + c.toLowerCase());

/** Colunas de cada tabela, somando todas as migrações em ordem. */
function colunasDoBanco() {
  const tabelas = new Map<string, Map<string, { obrigatoria: boolean }>>();
  for (const arq of readdirSync(PASTA).filter(f => f.endsWith('.sql')).sort()) {
    const sql = readFileSync(join(PASTA, arq), 'utf8').replace(/--.*$/gm, '');
    for (const m of sql.matchAll(/create table public\.(\w+) \(([\s\S]*?)\n\);/g)) {
      const cols = new Map<string, { obrigatoria: boolean }>();
      for (const pedaco of m[2].split(/,(?![^(]*\))/)) {
        const c = pedaco.trim().match(new RegExp(`^([a-z_]+)\\s+(${TIPOS_SQL})\\b(.*)$`, 's'));
        if (c) cols.set(c[1], { obrigatoria: /not null/.test(c[3]) && !/default|generated|primary key/.test(c[3]) });
      }
      tabelas.set(m[1], cols);
    }
    for (const m of sql.matchAll(new RegExp(`alter table public\\.(\\w+) add column (?:if not exists )?([a-z_]+) (${TIPOS_SQL})([^;]*);`, 'g')))
      tabelas.get(m[1])?.set(m[2], { obrigatoria: /not null/.test(m[4]) && !/default/.test(m[4]) });
  }
  return tabelas;
}

/** Campos de cada tipo em tipos.ts (Tabelas → Pessoa, Compra…). */
function camposDoApp() {
  const arq = ts.createSourceFile('tipos.ts', readFileSync(join(process.cwd(), 'src', 'dados', 'tipos.ts'), 'utf8'), ts.ScriptTarget.Latest);
  const tipos = new Map<string, ts.TypeNode>();
  arq.forEachChild(n => { if (ts.isTypeAliasDeclaration(n)) tipos.set(n.name.text, n.type); });
  const membros = (t?: ts.TypeNode) => t && ts.isTypeLiteralNode(t) ? t.members.filter(ts.isPropertySignature) : [];
  return new Map(membros(tipos.get('Tabelas')).map(m => {
    const ref = m.type && ts.isTypeReferenceNode(m.type) ? m.type.typeName.getText(arq) : '';
    return [m.name.getText(arq), membros(tipos.get(ref)).map(x => snake(x.name.getText(arq)))];
  }));
}

describe('código e banco do Supabase em sincronia', () => {
  const banco = colunasDoBanco(), app = camposDoApp();
  it('as migrações têm todas as tabelas que o app lê', () => {
    expect(ORDEM_TABELAS.filter(t => !banco.has(t))).toEqual([]);
  });
  for (const t of ORDEM_TABELAS) {
    it(`${t}: todo campo do app é coluna do banco, e o banco não exige coluna que o app não manda`, () => {
      const cols = banco.get(t)!, campos = app.get(t) ?? [];
      expect(campos.filter(c => !cols.has(c) || CALCULADAS.has(c))).toEqual([]);
      expect([...cols].filter(([c, x]) => x.obrigatoria && !AUDITORIA.has(c) && !campos.includes(c)).map(([c]) => c)).toEqual([]);
    });
  }
});
