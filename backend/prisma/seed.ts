import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON");

  const client = await prisma.client.upsert({
    where: { email: "ana@example.com" },
    update: {},
    create: {
      name: "Ana Ribeiro",
      email: "ana@example.com",
      phone: "(11) 99999-0000",
      city: "Sao Paulo",
      state: "SP",
      source: "Indicacao"
    }
  });

  const project = await prisma.project.create({
    data: {
      clientId: client.id,
      name: "Apartamento Vila Mariana",
      type: "INTERIORS",
      status: "ANTEPROJECT_IN_DEVELOPMENT",
      workAddress: "Rua Vergueiro, 1000",
      contractedAmount: "42000.00",
      startsAt: new Date("2026-05-01T00:00:00.000Z"),
      expectedDeliveryDate: new Date("2026-08-30T00:00:00.000Z"),
      steps: {
        create: [
          { name: "Briefing", sortOrder: 1, status: "COMPLETED", completedAt: new Date("2026-05-03T00:00:00.000Z") },
          { name: "Levantamento", sortOrder: 2, status: "IN_PROGRESS" },
          { name: "Anteprojeto", sortOrder: 3, status: "PENDING" },
          { name: "Projeto 3D", sortOrder: 4, status: "PENDING" },
          { name: "Projeto executivo", sortOrder: 5, status: "PENDING" },
          { name: "Entrega final", sortOrder: 6, status: "PENDING" }
        ]
      }
    }
  });

  await prisma.payment.create({
    data: {
      clientId: client.id,
      projectId: project.id,
      description: "Entrada do projeto",
      amount: "14000.00",
      paidAmount: "14000.00",
      installment: 1,
      dueDate: new Date("2026-05-10T00:00:00.000Z"),
      paidAt: new Date("2026-05-10T00:00:00.000Z"),
      status: "PAID"
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
