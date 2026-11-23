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
- Visualização de pedidos pendentes, concluídos e expirados, com o status do pagamento separado do status de entrega.
- Finalização de pedidos somente após a aprovação do pagamento; pedidos pagos permanecem aguardando a entrega.
- Visualização do perfil e histórico de pedidos dos clientes atendidos pelo estabelecimento.
- Arquivamento de pedidos concluídos ou expirados e busca no histórico arquivado por cliente, produto, status ou data.
- Na lista de arquivados, exibição do status do pagamento; a tela do cliente continua mostrando o estado do pedido, como `Expirado`.
- Alerta visual para pedidos pagos há mais de um minuto e ainda não concluídos.
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

O Provider utiliza a URL configurada em `VITE_BASE_URL` como base para as rotas `/providers`, `/orders`, `/users` e `/provider-notifications` no Meu Delivery Server. Ações autenticadas enviam o token da loja no cabeçalho `Authorization`. O status do pagamento não substitui o estado de entrega: somente pedidos com pagamento aprovado podem ser finalizados pelo estabelecimento.

## Aplicações relacionadas

- [Meu Delivery — Aplicativo para o cliente](https://meu-delivery-eight.vercel.app/)
- [Meu Delivery Provedor — Painel da loja](https://meu-delivery-provedor.vercel.app/)
- [SaaS Dashboard — Painel SaaS](https://saa-s-dashboard-eta.vercel.app/)
- [Meu Delivery Server — Documentação da API](https://meu-delivery-server-tau.vercel.app/api-docs/)
- [Portfolio](https://meu-porfolio-two.vercel.app/)
