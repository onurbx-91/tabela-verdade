# Tabela Verdade

Aplicação web para estudar tabelas verdade de lógica proposicional.
Feita com HTML, CSS e JavaScript puro, sem dependências.

## Funcionalidades

- **Prática**: gera expressões aleatórias e você marca V ou F para cada linha. Mostra os acertos ao verificar.
- **Consulta**: digite uma expressão e veja a tabela completa, com uma coluna para cada subfórmula, e a classificação (tautologia, contradição ou contingência).
- **Placar**: acompanha seu aproveitamento. Os dados ficam salvos no navegador.

## Como usar

Abra o arquivo `index.html` no navegador. Não é preciso instalar nada.

### Sintaxe

| Símbolo | Atalho no teclado |
|---------|-------------------|
| ¬ (não) | `~` |
| ∧ (e)   | `&` |
| ∨ (ou)  | `\|` |
| → (se… então) | `->` |
| ↔ (se e somente se) | `<->` |

Precedência: ¬, depois ∧, depois ∨, depois →, depois ↔. Use parênteses para deixar explícita a ordem.

## Publicar no GitHub Pages (grátis)

1. Crie um repositório novo no GitHub, por exemplo `tabela-verdade`.
2. Envie os arquivos `index.html`, `style.css`, `script.js` e `README.md` para a raiz do repositório.
   Pelo navegador: "Add file" → "Upload files". Ou pelo terminal:
   ```bash
   git init
   git add .
   git commit -m "Primeira versão do app"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/tabela-verdade.git
   git push -u origin main
   ```
3. No repositório, vá em **Settings → Pages**, em "Build and deployment", escolha a branch `main` e a pasta `/ (root)`, e salve.
4. Em alguns minutos o app estará em `https://SEU-USUARIO.github.io/tabela-verdade/`.

## Estrutura

```
tabela-verdade/
├── index.html   # estrutura da página
├── style.css    # visual
├── script.js    # parser, tabela verdade, prática e placar
└── README.md
```
