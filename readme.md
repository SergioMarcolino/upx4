-- =============================================
-- Tabela de Usuários (Users)
-- =============================================
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY, -- Chave Primária Auto-incremental
    email NVARCHAR(255) NOT NULL UNIQUE, -- Email único para login
    password NVARCHAR(255) NOT NULL -- Armazenará o HASH da senha (NUNCA a senha real)
);
GO -- Separa os lotes de comandos

-- =============================================
-- Tabela de Fornecedores (Suppliers)
-- =============================================
CREATE TABLE Suppliers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    companyName NVARCHAR(255) NOT NULL, -- Nome Fantasia
    cnpj NVARCHAR(20) NOT NULL UNIQUE, -- CNPJ (VARCHAR permite máscara, UNIQUE para não repetir)
    contactName NVARCHAR(255) NULL, -- Nome do Contato (Opcional)
    phone NVARCHAR(20) NULL -- Telefone (Opcional)
);
GO

-- =============================================
-- Tabela de Produtos (Products)
-- =============================================
CREATE TABLE Products (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL, -- NVARCHAR(MAX) para descrições longas
    category NVARCHAR(100) NOT NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'anunciado' CHECK (status IN ('anunciado', 'desativado')), -- Status com valor padrão e restrição
    imageBase64 NVARCHAR(MAX) NULL, -- Armazena Base64 (Alternativa: VARBINARY(MAX) ou caminho do arquivo)
    purchase_price DECIMAL(10, 2) NOT NULL CHECK (purchase_price >= 0), -- Preço de Custo >= 0
    sale_price DECIMAL(10, 2) NOT NULL CHECK (sale_price >= 0), -- Preço de Venda >= 0
    quantity INT NOT NULL DEFAULT 0, -- Cache do estoque atual (gerenciado pela aplicação)
    date DATETIME2(7) NOT NULL DEFAULT GETDATE(), -- Data de criação/atualização com valor padrão
    supplierId INT NOT NULL, -- Chave Estrangeira para Fornecedor

    -- Define a Chave Estrangeira
    CONSTRAINT FK_Products_Suppliers FOREIGN KEY (supplierId)
        REFERENCES Suppliers(id)
        ON DELETE NO ACTION -- O que fazer se o fornecedor for deletado? (NO ACTION impede deletar fornecedor com produtos)
        ON UPDATE CASCADE -- Se o ID do fornecedor mudar (raro), atualiza aqui também
);
GO

-- Adicionar um índice na coluna supplierId pode ser útil para performance
CREATE INDEX IX_Products_SupplierId ON Products(supplierId);
GO

-- =============================================
-- Tabela de Movimentações de Estoque (StockMovements)
-- =============================================
CREATE TABLE StockMovements (
    id INT IDENTITY(1,1) PRIMARY KEY,
    productId INT NOT NULL, -- Chave Estrangeira para Produto
    type NVARCHAR(50) NOT NULL CHECK (type IN ('SALE', 'PURCHASE', 'INITIAL_ADJUSTMENT', 'MANUAL_ADJUSTMENT')), -- Tipo da movimentação com restrição
    quantity INT NOT NULL, -- Pode ser negativo para saídas
    createdAt DATETIME2(7) NOT NULL DEFAULT GETDATE(), -- Data/Hora da movimentação

    -- Define a Chave Estrangeira
    CONSTRAINT FK_StockMovements_Products FOREIGN KEY (productId)
        REFERENCES Products(id)
        ON DELETE CASCADE -- Se o produto for deletado, suas movimentações também são (IMPORTANTE!)
        ON UPDATE CASCADE -- Se o ID do produto mudar, atualiza aqui
);
GO

-- Adicionar um índice na coluna productId é essencial para performance
CREATE INDEX IX_StockMovements_ProductId ON StockMovements(productId);
GO

-- =============================================
-- Tabela de Vendas (Sales)
-- =============================================
CREATE TABLE Sales (
    id INT IDENTITY(1,1) PRIMARY KEY,
    totalAmount DECIMAL(10, 2) NOT NULL CHECK (totalAmount >= 0), -- Valor total da venda
    createdAt DATETIME2(7) NOT NULL DEFAULT GETDATE() -- Data/Hora da venda
    -- Poderia adicionar customerId (FK para uma tabela Customers) aqui no futuro
);
GO

-- =============================================
-- Tabela de Itens da Venda (SaleItems)
-- =============================================
-- Esta tabela normaliza o array 'items' que estava dentro de sales.json
CREATE TABLE SaleItems (
    id INT IDENTITY(1,1) PRIMARY KEY,
    saleId INT NOT NULL, -- Chave Estrangeira para Venda
    productId INT NOT NULL, -- Chave Estrangeira para Produto (o produto vendido)
    quantitySold INT NOT NULL CHECK (quantitySold > 0), -- Quantidade vendida (sempre positiva aqui)
    pricePerUnit DECIMAL(10, 2) NOT NULL CHECK (pricePerUnit >= 0), -- Preço de venda unitário (congelado)
    costPerUnit DECIMAL(10, 2) NOT NULL CHECK (costPerUnit >= 0), -- Custo unitário (congelado)

    -- Define as Chaves Estrangeiras
    CONSTRAINT FK_SaleItems_Sales FOREIGN KEY (saleId)
        REFERENCES Sales(id)
        ON DELETE CASCADE, -- Se a venda for deletada, os itens também são
        -- ON UPDATE CASCADE, -- Não costuma ser necessário para ID auto-incremental

    CONSTRAINT FK_SaleItems_Products FOREIGN KEY (productId)
        REFERENCES Products(id)
        ON DELETE NO ACTION -- Impede deletar um produto que já foi vendido (MUITO IMPORTANTE para histórico!)
        -- ON UPDATE CASCADE -- Não costuma ser necessário
);
GO

-- Adicionar índices nas chaves estrangeiras é crucial para performance de relatórios
CREATE INDEX IX_SaleItems_SaleId ON SaleItems(saleId);
CREATE INDEX IX_SaleItems_ProductId ON SaleItems(productId);
GO
