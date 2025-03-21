-- CreateTable
CREATE TABLE "petition" (
    "id" SERIAL NOT NULL,
    "processNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "arguments" TEXT NOT NULL,
    "request" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "modalidade" TEXT,
    "objeto" TEXT,
    "autoridade" TEXT,
    "contraparte" TEXT,
    "cidade" TEXT,
    "dataDocumento" TEXT,
    "nomeAdvogado" TEXT,
    "numeroOAB" TEXT,

    CONSTRAINT "petition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "cnpj" TEXT NOT NULL,
    "razao_social" TEXT NOT NULL,
    "nome_fantasia" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "celular" TEXT,
    "nome_responsavel" TEXT,
    "endereco_rua" TEXT NOT NULL,
    "endereco_numero" TEXT,
    "endereco_complemento" TEXT,
    "endereco_bairro" TEXT,
    "endereco_cidade" TEXT,
    "endereco_uf" TEXT,
    "endereco_cep" TEXT,
    "inscricao_estadual" TEXT,
    "inscricao_municipal" TEXT,
    "percentual_comissao" DOUBLE PRECISION NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "eh_cliente" BOOLEAN NOT NULL,
    "eh_fornecedor" BOOLEAN NOT NULL,
    "palavras_chave" TEXT,
    "slug" TEXT,
    "senha_aprovacao" TEXT,
    "numero_whatsapp" TEXT,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customer_cnpj_key" ON "customer"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "customer_email_key" ON "customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customer_slug_key" ON "customer"("slug");

-- AddForeignKey
ALTER TABLE "petition" ADD CONSTRAINT "petition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
