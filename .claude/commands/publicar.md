---
description: Confere tudo, publica o app na Vercel e espera a publicação ficar pronta
---
Publique o B&P Finanças. Fale com o Pedro em português, sem jargão.

1. Se houver mudanças sem commit, mostre quais são e pergunte se é para fazer o commit antes (mensagem no estilo dos commits anteriores). Não publique nada sem o Pedro ter pedido para publicar nesta conversa.
2. Feche o servidor de teste do navegador se estiver aberto (o build usa a mesma pasta `.next`).
3. Rode `npm run publicar`. Ele confere tipos, testes, lint e regras do PLANEJAMENTO.md, monta o app como a Vercel faz e só então envia para `main`. Se parar em alguma etapa, mostre o erro e conserte; não pule a conferência.
4. Se o script avisar que regras do app mudaram sem mudar o PLANEJAMENTO.md, diga isso ao Pedro e registre lá as regras que mudaram (com a data).
5. Depois do envio, use as ferramentas da Vercel (equipe `pedro-private`, projeto `bpfinancas`) para achar a publicação do commit que acabou de subir. Consulte de novo até ela ficar pronta (READY) ou falhar. Se falhar, leia o registro do build e explique a causa.
6. No fim, diga em uma ou duas frases o que foi publicado e que já está em bpfinancas.vercel.app.
