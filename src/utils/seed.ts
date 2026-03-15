import "dotenv/config";
import prisma from '../lib/prisma';
import { UserRole } from '@prisma/client';

async function main() {
    console.log('Seeding database...');

    const adminEmail = 'admin@fundingpanda.com';

    const adminExists = await prisma.user.findUnique({
        where: { email: adminEmail },
    });

    if (!adminExists) {
        await prisma.user.create({
            data: {
                name: 'Admin',
                email: adminEmail,
                // password: 'adminpassword', // In a real application, ensure this is hashed and secure   
                role: UserRole.ADMIN,
                isVerified: true,
            },
        });
        console.log('Admin user created: admin@fundingpanda.com');
    } else {
        console.log('Admin already exists.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

// npx prisma db seed