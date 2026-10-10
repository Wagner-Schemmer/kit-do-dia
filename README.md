# ☀️ Kit do Dia

[![Live](https://img.shields.io/badge/demo-ao_vivo-4ade80?style=for-the-badge&logo=vercel&logoColor=white)](https://kit-do-dia.vercel.app)
![JS](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![PWA](https://img.shields.io/badge/PWA-instalável-5A0FC8?style=flat-square&logo=pwa&logoColor=white)

Pomodoro com ciclos, lista de tarefas, conversores e bloco de notas. Tudo salvo no navegador (`localStorage`).

## Ferramentas
1. **Pomodoro PRO** — tempos editáveis, troca automática foco ⇄ pausa, notificações, som WebAudio, foco do dia + sequência 🔥
2. **Tarefas** — prioridades 🔴🟡🟢, busca, filtros, limpar concluídas, tudo em `localStorage`
3. **Conversores** — moeda BRL→USD/EUR com **cotação online ao vivo** (fallback manual), temperatura, km→mi, kg→lb
4. **Notas** — auto-save com hora, contador de palavras, download `.txt`
5. **Extras** — saudação por horário, PWA instalável, toasts, 100% responsivo

## Rodar
Go Live no VSCode ou `python3 -m http.server` na pasta. Sem build, sem dependências.

## Estrutura
```
kit-do-dia/
├── index.html      # markup + seções (pomodoro, tarefas, conversores, notas)
├── styles.css      # tema claro PRO
├── script.js       # ciclos, prioridades, cotação online, auto-save
├── manifest.json   # PWA instalável
└── api/            # health check p/ monitoramento
```

## Personalizar
1. Tempos do pomodoro e ciclos em `script.js`
2. Moedas e unidades dos conversores em `script.js`
3. Deploy: conectar o repo na Vercel (zero config)
