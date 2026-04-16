# Sidebar Premium Acolhedora

Data: 2026-04-16
Status: Aprovada em conversa, aguardando revisao final do documento
Area: Dashboard / navegacao lateral

## Contexto

O dashboard do PataFamilia ja esta funcional, mas a sidebar esquerda ainda transmite uma sensacao visual amadora. O componente atual cumpre o papel de navegacao e contexto da familia, porem depende de muitos estilos inline, usa caracteres e emoji como icones estruturais, e cria pouca hierarquia visual entre marca, navegacao principal, pets e bloco de usuario.

O produto pede um visual colorido, acolhedor e tematico para pets, mas sem infantilizacao. A sidebar precisa elevar a percepcao de qualidade do app sem parecer uma interface de outro produto.

## Objetivo

Redesenhar a sidebar esquerda do dashboard com uma direcao "premium acolhedora", mantendo a estrutura mental atual do usuario, preservando toda a logica existente e aumentando a percepcao de qualidade visual, clareza e consistencia.

## Nao Objetivos

- Nao alterar a arquitetura de rotas do app
- Nao alterar a API do componente `SidebarClient`
- Nao alterar a logica de realtime das notificacoes
- Nao alterar autenticacao, dados de pets, dados da familia ou fluxo de logout
- Nao redesenhar o restante do dashboard nesta tarefa
- Nao transformar a sidebar em um elemento chamativo demais a ponto de competir com o conteudo principal

## Direcao Visual

### Conceito

A sidebar deve parecer mais refinada, acolhedora e intencional. O fundo escuro continua sendo a ancora visual do dashboard, mas com maior profundidade, melhores transicoes de contraste e blocos mais bem definidos.

### Sensacao desejada

- acolhedora e confiavel
- premium sem parecer corporativa fria
- tematica de pets com elegancia
- mais madura e produto-pronta

### Principios visuais

- usar a paleta existente do produto, especialmente `--amber`, `--teal`, `--coral` e `--sidebar-bg`
- manter o fundo escuro, com tratamento mais rico que um bloco chapado
- reforcar o estado ativo com superficie tonal, borda sutil e melhor contraste
- usar icones vetoriais consistentes em vez de texto ou emoji para navegacao estrutural
- preservar os emojis dos pets apenas como parte da identidade de cada pet, nao como sistema de navegacao
- aumentar a hierarquia por espacamento, tipografia e superficie, nao apenas por cor

## Estrutura Proposta

### 1. Topo da marca

O topo atual sera evoluido para um cabecalho com mais presenca visual.

Mudancas:

- manter simbolo da marca e nome `PataFamilia`
- destacar o nome com tipografia mais forte e melhor alinhamento
- manter o nome da familia como contexto secundario
- aplicar acabamento visual mais nobre no bloco, com separacao mais elegante do restante da navegacao

Objetivo:

Transformar o topo em ancora visual do app, nao apenas um logo encaixado.

### 2. Navegacao principal

A navegacao principal continuara com os mesmos destinos atuais:

- `/dashboard`
- `/notificacoes`
- `/familia`

Mudancas:

- substituir icones textuais por icones de `lucide-react`
- padronizar area de clique, alinhamento e densidade
- melhorar leitura do item ativo com fundo tonal ambar, borda ou glow sutil e contraste superior
- manter badge de notificacoes nao lidas com melhor acabamento visual

Objetivo:

Fazer a navegacao parecer parte de um sistema maduro e consistente.

### 3. Bloco dos pets

Esta sera a area com maior ganho de personalidade do redesign.

Mudancas:

- manter a lista de pets como secao dedicada
- melhorar a apresentacao de cada item com avatar/detalhe visual mais coerente
- destacar melhor o nome do pet e o status de alerta
- tratar hover, item ativo e badges com mais clareza
- tornar o CTA de adicionar pet mais elegante e intencional

Objetivo:

Dar cara de produto ao bloco mais distintivo do PataFamilia sem exagerar no aspecto ludico.

### 4. Bloco final do usuario

O bloco final deixara de parecer apenas um rodape funcional e passara a se comportar como um card discreto de contexto.

Mudancas:

- manter avatar com iniciais
- manter nome do usuario e papel na familia
- melhorar aparencia do link para perfil
- manter o botao `Sair`, mas com linguagem visual coerente com a sidebar

Objetivo:

Encerrar a barra com um bloco mais sofisticado e claramente conectado ao restante do sistema.

### 5. Ritmo e espacamento

O redesign deve melhorar o ritmo geral da barra.

Mudancas:

- aumentar a clareza entre grupos
- reduzir sensacao de amontoado
- melhorar paddings, gaps e alinhamento interno
- manter largura estavel da sidebar para evitar impacto no layout pai

## Implementacao Tecnica

### Arquivos principais

- `components/layout/SidebarClient.tsx`
- `components/layout/SidebarClient.module.css`

Escopo de arquivos:

- a implementacao deve ficar concentrada nesses dois arquivos
- nenhum outro arquivo deve sofrer alteracoes estruturais nesta tarefa

## Abordagem tecnica

- preservar a interface de props atual do componente
- preservar o `useEffect` com Supabase Realtime para badge de notificacoes
- preservar `handleSignOut`
- reorganizar a marcacao em blocos mais semanticos
- usar `lucide-react` para icones estruturais
- migrar a maior parte do tratamento visual para `SidebarClient.module.css`
- manter o componente como Client Component

## Responsividade

Nesta tarefa, a prioridade e elevar a qualidade da sidebar desktop existente.

Requisitos:

- manter comportamento atual do layout geral
- evitar overflow horizontal
- garantir truncamento ou acomodacao decente para nomes maiores de usuario, familia e pets
- nao introduzir um padrao mobile novo nesta tarefa
- se algum ajuste defensivo for necessario para telas menores, ele deve apenas evitar quebra visual, sem redefinir a arquitetura do layout

## Acessibilidade

- garantir contraste adequado no fundo escuro
- estados ativos e badges nao devem depender apenas de cor
- manter focos visiveis em links e botoes
- manter areas clicaveis confortaveis
- evitar icon-only actions sem contexto suficiente

## Riscos e Mitigacoes

### Risco 1: Sidebar ficar refinada demais em relacao ao resto do dashboard

Mitigacao:

- manter a linguagem dentro da paleta existente
- evitar efeitos muito vistosos
- priorizar refinamento de hierarquia sobre decoracao

### Risco 2: Regressao funcional em navegacao ou badge

Mitigacao:

- nao alterar a logica central do componente
- validar links ativos, badge, perfil e logout apos a mudanca

### Risco 3: Manutencao continuar ruim mesmo com redesign

Mitigacao:

- diminuir o volume de estilo inline
- agrupar estilos por responsabilidade visual clara

## Validacao

Antes de concluir a implementacao, validar:

- estado ativo em `/dashboard`
- estado ativo em `/notificacoes`
- estado ativo em `/familia`
- estado ativo em `/pets/[id]`
- estado ativo em `/perfil`
- badge de notificacoes nao lidas
- lista com zero, um e varios pets
- nomes mais longos de familia e usuario
- comportamento visual do botao `Sair`
- lint do projeto

## Entrega Esperada

Ao final, a sidebar deve:

- parecer parte de um produto mais maduro e confiavel
- manter a identidade acolhedora do PataFamilia
- valorizar os pets como elemento central do app
- melhorar a leitura visual sem exigir reaprendizado do usuario
- preservar a funcionalidade atual com baixo risco tecnico
