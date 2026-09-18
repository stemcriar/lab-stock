# 🧪 LabStock - Laboratório de Prototipagem STEM CRIAR

Sistema de Controle de Estoque e Inventário Físico com **Servidor Backend em Node.js**, banco de dados relacional **SQLite** e interface web moderna em **React + Tailwind CSS + Recharts**.

Permite que **qualquer computador de bancada, tablet ou smartphone na rede local** visualize, cadastre e movimente itens em tempo real.

---

## 🚀 Como Executar o Sistema

### Iniciar o Sistema Completo em Desenvolvimento
Na pasta do projeto:

```bash
npm run dev
```

Isso iniciará simultaneamente:
- **Backend API (SQLite)** em: `http://localhost:3001`
- **Frontend Web (React)** em: `http://localhost:1000`

> Use `npm run dev` para desenvolvimento local e testes rápidos.

### Rodar em Produção na Raspberry Pi
Para produção, o ideal é compilar a interface e servir os arquivos estáticos, mantendo o backend em execução em paralelo.

```bash
npm run build
npm run server
```

Em seguida, para servir o frontend em produção:

```bash
npm run preview -- --host 0.0.0.0 --port 1000
```

Isso deixa o frontend disponível em:

```text
http://<IP-da-raspberry>:1000
```

Para que a API continue funcionando, o backend precisa estar rodando em `http://localhost:3001`.

---

## 🌐 Acesso por Múltiplos Dispositivos na Rede Local

O servidor e a interface foram configurados para escutar em `0.0.0.0`, permitindo que qualquer dispositivo conectado ao mesmo Wi-Fi/rede do laboratório acesse o sistema:

1. Descubra o IP da Raspberry Pi ou do computador que está rodando o servidor (ex: `hostname -I` no Linux ou `ipconfig` no Windows).
2. No tablet, celular ou outro PC do laboratório, abra o navegador e acesse:
   ```
   http://192.168.1.100:1000
   ```
3. Todos os dispositivos verão as alterações, cadastros e baixas de estoque sincronizados instantaneamente no mesmo banco de dados SQLite!

---

## 📡 Rotas da API REST (Backend)

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Status do servidor e banco de dados SQLite |
| `GET` | `/api/itens` | Lista todos os itens cadastrados no estoque |
| `GET` | `/api/itens/:id` | Retorna os detalhes de um item específico (ex: `/api/itens/ITEM-001`) |
| `POST` | `/api/itens` | Cadastra novo item (com ID automático e entrada inicial no histórico) |
| `PUT` | `/api/itens/:id` | Atualiza os dados de cadastro de um item |
| `DELETE` | `/api/itens/:id` | Exclui um item do estoque |
| `GET` | `/api/movimentacoes` | Retorna o histórico completo de movimentações de estoque |
| `POST` | `/api/movimentacoes` | Registra entrada (+), saída (-) ou ajuste (=) com validação de saldo |
| `GET` | `/api/categorias` | Lista as categorias e subcategorias |
| `POST` | `/api/categorias` | Cria nova categoria |
| `PUT` | `/api/categorias/:id` | Edita categoria existente |
| `DELETE` | `/api/categorias/:id` | Remove categoria (com validação se há itens vinculados) |
| `GET` | `/api/localizacoes` | Lista salas, armários e prateleiras |
| `POST` | `/api/localizacoes` | Adiciona nova sala ou bancada |
| `PUT` | `/api/localizacoes/:id` | Atualiza sala e armários |
| `DELETE` | `/api/localizacoes/:id` | Remove localização |
| `POST` | `/api/admin/zerar` | Zera itens e histórico mantendo as categorias |

---

## 🗄️ Estrutura do Banco de Dados SQLite

O arquivo do banco de dados fica salvo em:
`server/database.sqlite`

### Tabelas:
- **`items`**: Catálogo físico de materiais (nome, categoria, subcategoria, localização em JSON, tags em JSON, quantidades atual/mínima/ideal, fornecedor, preço unitário, foto, observações).
- **`movements`**: Log auditável e imutável de entradas, saídas e ajustes de saldo.
- **`categories`**: Categorias do laboratório com cores e subcategorias.
- **`locations`**: Hierarquia de salas, armários e prateleiras.

---

## 🛠️ Tecnologias Utilizadas

- **Backend**: Node.js com SQLite nativo (`DatabaseSync`), HTTP Server REST, CORS e suporte a rede local.
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts.
- **Build / Dev**: Vite 6 com proxy reverso para `/api`.
