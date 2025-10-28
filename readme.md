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
