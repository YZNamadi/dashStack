import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.findFirst({ where: { name: 'Administrator' } });
  const user = await prisma.user.findFirst();
  if (adminRole && user) {
    await prisma.userRole.create({ data: { userId: user.id, roleId: adminRole.id } });
    console.log('Assigned Administrator role to user', user.email);
  } else {
    console.log('No user or admin role found');
  }
  await prisma.$disconnect();
}

main(); 