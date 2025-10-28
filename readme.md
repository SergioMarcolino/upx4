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
- Lista de Produtos  
- Modal de Edição  
- Tela de Vendas (PDV)  
- Modal de Relatório  
- Geração de PDF  

---

## 🚀 Como Executar o Projeto

### 🧩 Pré-requisitos
Certifique-se de ter instalado:
- Node.js **v18+**
- Angular CLI  
  ```bash
  npm install -g @angular/cli


-- Adicionar índices nas chaves estrangeiras é crucial para performance de relatórios
CREATE INDEX IX_SaleItems_SaleId ON SaleItems(saleId);
CREATE INDEX IX_SaleItems_ProductId ON SaleItems(productId);
GO
