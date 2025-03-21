-- AlterTable
ALTER TABLE "petition" ADD COLUMN     "customerId" TEXT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "authMethod" TEXT NOT NULL DEFAULT 'credentials',
ADD COLUMN     "image" TEXT;

-- AddForeignKey
ALTER TABLE "petition" ADD CONSTRAINT "petition_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
