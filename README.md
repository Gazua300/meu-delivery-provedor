# Meu Delivery Provedor

Uma aplicação web de operações para restaurantes e outros estabelecimentos que recebem pedidos por meio do ecossistema Meu Delivery. As equipes dos estabelecimentos utilizam o Provider para conferir pedidos, visualizar dados dos clientes e gerenciar seu catálogo e perfil da loja.

## O ecossistema Meu Delivery

O Provider é um dos três aplicativos conectados por meio da API do Meu Delivery Server:

- **Meu Delivery** — O aplicativo para o cliente descobrir lojas, escolher produtos e fazer pedidos.
- **Meu Delivery Provider** — O painel de operações da loja para analisar pedidos recebidos, atualizar o status deles e gerenciar produtos.
- **SaaS Dashboard** — o painel de gerenciamento e monitoramento do ecossistema.
- **Meu Delivery Server** — a API central que conecta as aplicações, autentica usuários, persiste dados e integra serviços da plataforma.

O fluxo principal tem início no aplicativo para o cliente Meu Delivery. A API registra cada pedido e o disponibiliza no painel do estabelecimento, onde ele pode ser revisado e atualizado.

## Funcionalidades

- Cadastro e login na loja, redefinição de senha e rotas protegidas por autenticação.
- Visualização de pedidos agrupados por status: pendentes (`REQUESTED`) e concluídos (`FINISHED`).
- Visualização do perfil e histórico de pedidos de cada cliente, com a possibilidade de marcar pedidos como concluídos ou retorná-los ao status de pendentes.
- Visualização do valor total dos pedidos listados e remoção de pedidos concluídos.
- Gerenciamento do catálogo de produtos: criação, edição e remoção de produtos, incluindo categoria, descrição, preço, estoque e imagem.
- Busca de produtos dentro de uma categoria selecionada.
- Edição de detalhes da loja, visualização de notificações e gerenciamento da conta.

## Tecnologias utilizadas

- React 19, TypeScript, and Vite
- React Router
- Styled Components
- Axios

## Executar localmente

Requer Node.js e npm. A partir do diretório deste projeto:

```bash
npm install
```

Crie um arquivo `.env` na raiz do projeto com a URL base da API:

```env
VITE_BASE_URL=http://localhost:3003
```

Para que os links presentes nas notificações de novos pedidos levem à página correta, configure também:

```env
VITE_RESTAURANT_NOTIFICATION_URL=/orders
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Outros comandos disponíveis:

```bash
npm run build
npm run preview
npm run lint
```

## Integração de API

O Provider utiliza a URL configurada em `VITE_BASE_URL` como base para as rotas `/providers`, `/orders`, `/users` e `/provider-notifications` no Meu Delivery Server. Ações autenticadas enviam o token da loja no cabeçalho `Authorization`.

## Aplicações relacionadas

- [Meu Delivery — Aplicativo para o cliente](https://meu-delivery-eight.vercel.app/)
- [My Delivery Provider — web app](https://my-delivery-provider.vercel.app)
- [Meu Delivery Server — Documentação da API](https://meu-delivery-server-tau.vercel.app/api-docs/)
- [Portfolio](https://portfolio-vtu0.onrender.com)
