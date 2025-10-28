# 📦 Fluxa ERP - Sistema de Gestão de Estoque

O **Fluxa ERP** é um sistema de gestão completo (Full Stack) focado em **controle de estoque, vendas e fornecedores**.  
Construído com **Angular 17+** no frontend e **Node.js/Express + TypeORM** no backend, este projeto serve como uma solução moderna para gerenciamento de **pequenos negócios**.

O sistema migrou de uma arquitetura simples baseada em arquivos `.json` para um **banco de dados relacional robusto (SQL Server)**, garantindo **escalabilidade, segurança e integridade dos dados**.

---

## ✨ Funcionalidades Principais

### 🔐 Autenticação
- Sistema de **registro e login** de usuários com **JWT (JSON Web Tokens)**.

### 📊 Dashboard
- Painel de controle com **KPIs** e **gráficos dinâmicos**.
- Visualização de **lucro**, **receita**, **top produtos** e **estoque por categoria**.

### 📦 Gestão de Produtos
- CRUD completo: **Criar, Ler, Atualizar e Deletar** produtos.

### 🧾 Gestão de Fornecedores
- CRUD completo de fornecedores.

### 🏷️ Controle de Estoque (Kardex)
- **Entrada inicial (INITIAL_ADJUSTMENT)** no cadastro do produto.
- **Baixa automática (SALE)** ao realizar uma venda.
- **Validação automática** para impedir vendas de produtos com estoque zerado.

### 💰 Módulo de Vendas (PDV)
- Tela de vendas intuitiva com seleção de produtos e finalização da transação.

### 📈 Relatórios (BI)
- Gráficos dinâmicos com filtros de período (**Hoje**, **Mês**, **Ano**).
- Geração de **relatórios em PDF** detalhados (financeiro e de itens vendidos por mês/ano).

---

## 💻 Tecnologias Utilizadas

### **Frontend** (`frontend-gestao-marketplace`)
- Angular 17+ (Standalone Components)
- TypeScript  
- Tailwind CSS (UI moderna e responsiva)
- ng2-charts (wrapper do Chart.js)
- Heroicons (ícones SVG)
- date-fns (manipulação de datas)

### **Backend** (`backend-gestao-marketplace`)
- Node.js  
- Express.js (API REST)  
- TypeScript  
- TypeORM (ORM para SQL Server)  
- Microsoft SQL Server  
- `mssql` (driver Node.js para SQL Server)  
- `jsonwebtoken` (JWT para autenticação)  
- `bcrypt` (hash de senhas)  
- `pdfkit` (geração de relatórios PDF)

---

## 🖼️ Screenshots

- Dashboard
<img width="1862" height="941" alt="image" src="https://github.com/user-attachments/assets/cf8f4776-545d-4f7a-b52d-8011cdcf4705" />
- Lista de Produtos
   <img width="1878" height="941" alt="image" src="https://github.com/user-attachments/assets/e52122f9-2e08-40c0-aa73-45674792c187" />
- Modal de Edição
  <img width="1871" height="942" alt="image" src="https://github.com/user-attachments/assets/c3e83f0a-4f70-456e-9e04-334a6561a9bb" />
- Tela de Vendas (PDV)
  <img width="1877" height="939" alt="image" src="https://github.com/user-attachments/assets/456346a4-e493-4a51-bc33-764c3ee91f9b" />
- Modal de Relatório
  <img width="1878" height="939" alt="image" src="https://github.com/user-attachments/assets/f6313ef4-50f2-49cc-95f2-f109775e0cca" />
  <img width="792" height="875" alt="image" src="https://github.com/user-attachments/assets/705c530b-9c5d-4bd0-8027-6f3dbbfb86f9" />

---

## 🚀 Como Executar o Projeto

Siga estes passos para configurar e rodar o ambiente de desenvolvimento completo.

---

### 🧩 Pré-requisitos

Antes de iniciar, instale as seguintes ferramentas:

* **Node.js** (v18 ou superior)
* **Angular CLI**

  ```bash
  npm install -g @angular/cli
  ```
* **SQL Server** (Instância local ou remota, ex: SQL Server Express)
* **SSMS** (SQL Server Management Studio) ou **Azure Data Studio** para gerenciar o banco de dados

---

### 🗄️ 1. Configuração do Banco de Dados (SQL Server)

1. Abra o **SQL Server Management Studio (SSMS)** e conecte-se ao seu servidor SQL.

2. Crie um novo banco de dados:

   ```sql
   CREATE DATABASE FluxaDB;
   ```

3. Execute o script SQL completo (fornecido anteriormente) para criar as tabelas:

   * `Users`
   * `Suppliers`
   * `Products`
   * `StockMovements`
   * `Sales`
   * `SaleItems`

4. Crie um novo login para o SQL Server com autenticação SQL:

   ```sql
   CREATE LOGIN fluxa_app_user WITH PASSWORD = 'SuaSenhaForteAqui';
   ```

5. Mapeie o login para um usuário dentro do banco e conceda permissões:

   ```sql
   USE FluxaDB;
   CREATE USER fluxa_app_user FOR LOGIN fluxa_app_user;
   EXEC sp_addrolemember 'db_datareader', 'fluxa_app_user';
   EXEC sp_addrolemember 'db_datawriter', 'fluxa_app_user';
   ```

---

### ⚙️ 2. Configuração do Backend (`backend-gestao-marketplace`)

1. Navegue até a pasta do backend:

   ```bash
   cd backend-gestao-marketplace
   ```

2. Instale as dependências (pode precisar da flag `--legacy-peer-deps` por causa do TypeORM/MSSQL):

   ```bash
   npm install --legacy-peer-deps
   ```

3. Crie ou edite o arquivo **`src/config.ts`** com suas credenciais de conexão:

   ```typescript
   // Em src/config.ts

   // 1. Defina sua chave secreta para JWT
   export const JWT_SECRET = 'SUA_CHAVE_SECRETA_MUITO_FORTE_AQUI';

   // 2. Defina os dados de conexão do SQL Server
   const DB_USER = 'fluxa_app_user';     // Usuário que você criou no SQL
   const DB_PASSWORD = 'SuaSenhaForteAqui'; // Senha que você criou

   export const sqlConfig: MSSQLConfig = {
     server: 'NOME_DO_SEU_SERVIDOR\\SQLEXPRESS', // Ex: 'DESKTOP-8OAV9DP'
     database: 'FluxaDB',
     user: DB_USER,
     password: DB_PASSWORD,
     options: {
       encrypt: false,
       trustServerCertificate: true,
     },
   };
   ```

4. Execute o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   Se tudo estiver correto, você verá no console:

   ```
   [TypeORM] DataSource inicializado com sucesso!
   🚀 Servidor backend rodando...
   ```

---

### 💻 3. Configuração do Frontend (`frontend-gestao-marketplace`)

1. Abra um novo terminal e vá até a pasta do frontend:

   ```bash
   cd ../frontend-gestao-marketplace
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Execute o servidor de desenvolvimento do Angular:

   ```bash
   ng serve
   ```

4. Acesse no navegador:
   👉 [http://localhost:4200](http://localhost:4200)

---

### 🧭 4. Ordem de Uso

1. Acesse **[http://localhost:4200](http://localhost:4200)**
2. Crie uma **nova conta** na tela de Registro
3. Faça **Login**
4. Cadastre alguns **Fornecedores** (na tela de Fornecedores ou “Novo Fornecedor”)
5. Cadastre alguns **Produtos**, associando-os aos fornecedores
6. Vá até a tela de **Vendas (PDV)** e realize algumas vendas
7. Explore a **Dashboard** para ver os gráficos e métricas atualizados
8. Gere um **Relatório em PDF** na tela de Produtos ou Financeiro

---

✅ **Dica:**
Após cada venda, o sistema atualiza automaticamente o **Kardex (movimentação de estoque)** e os **gráficos da Dashboard**, refletindo as informações em tempo real.

---

## 🧠 Arquitetura

```text
FluxaERP/
├── backend-gestao-marketplace/
│   ├── src/
│   │   ├── config.ts
│   │   ├── entities/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   └── app.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend-gestao-marketplace/
│   ├── src/
│   │   ├── app/
│   │   ├── assets/
│   │   ├── environments/
│   │   └── main.ts
│   ├── angular.json
│   └── package.json
│
└── README.md
```

---

## 🧾 Licença

Este projeto é de uso livre para fins educacionais e comerciais, desde que citada a fonte.

---

**Desenvolvido com ❤️ por [Sergio Marcolino / Equipe Fluxa]**
