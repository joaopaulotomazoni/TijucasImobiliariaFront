# Contexto da Inteligência Artificial (Projeto: Sistema de Aluguéis)

Este documento centraliza as regras, padrões e o contexto do projeto para qualquer IA que for interagir com esta base de código. 
As IAs que atuam neste projeto (usando a extensão do Gemini/Antigravity) descobrem e leem automaticamente este arquivo.

## 1. Stack Tecnológico
- **Core**: React (v19)
- **Build Tool**: Vite
- **Roteamento**: React Router DOM (v7)
- **Estilização e Componentes**: Material-UI (MUI), Emotion, Styled Components

## 2. Padrões de Projeto e Arquitetura
- **Estrutura de Componentes e Telas**: Cada tela ou componente deve ser criado em uma pasta própria com um arquivo principal `index.jsx` contendo a lógica e estrutura, e um arquivo `styles.js` contendo todos os estilos (utilizando `styled-components`).
- **Nomenclatura**: Não repita o nome do componente no arquivo final (ex: evite `Login/Login.jsx`, prefira `Login/index.jsx`).
- **Requisições de API**: Centralizadas utilizando a instância do Axios em `src/services/api.js`.
- **Feedbacks Visuais e Modais**: **É proibido** o uso da função nativa `alert()`. Sempre utilize o `ModalContext` global (através do hook `useModal()` de `src/contexts/ModalContext.jsx`) chamando a função `showModal({ title, message, type })` para seguir a identidade premium do sistema.
- **Gerenciamento de Carregamento (Loading)**: Trate o estado de carregamento (`isLoading`) localmente usando `useState` em cada tela/componente e utilize o `<Backdrop>` com `<CircularProgress>` do Material UI para bloqueio da interface. Envolva as chamadas de API em `try/finally` para o encerramento do loading.
- **Uso da propriedade \`sx\` (Material-UI)**: É permitido utilizar `sx` apenas para pequenos ajustes de margem/espaçamento locais em componentes nativos que não justifiquem criar um export no `styles.js`. Toda e qualquer regra visual complexa, definição de cores próprias ou mudança de layout deve ir obrigatoriamente para o arquivo `styles.js` criando um novo styled component.

## 3. Regras e Comportamentos para IAs
- **Atualização Contínua:** Sempre que uma nova biblioteca for adicionada, uma decisão arquitetural for tomada, ou um padrão de código for criado, a IA DEVE atualizar este arquivo (`.agents/AGENTS.md`) para manter o contexto vivo e atualizado.
- **Modificações de Código:** Respeite a estrutura existente. Use obrigatoriamente `styled-components` centralizado no arquivo `styles.js` para toda e qualquer estilização customizada de componentes do MUI ou HTML puro.
- **Idioma:** Interaja, comente o código e faça documentações em Português (PT-BR).

## 4. Skills Adicionais
Scripts auxiliares, prompts complexos ou automações podem ser salvos em `.agents/skills/<nome_da_skill>/SKILL.md`.

---
*Nota interna para IAs: Sempre verifique se o que você está implementando condiz com os padrões definidos acima e não hesite em expandir este documento quando criar algo que servirá de modelo para o resto do sistema.*
