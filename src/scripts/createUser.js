const { PrismaClient } = require('@prisma/client');
const prompts = require('prompts');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const createUser = async () => {
    const { username, password } = await prompts([
        {
            type: 'text',
            name: 'username',
            message: 'Enter username for this user',
            validate: value => (value.length > 32 || value.length <= 3) ? 'Username must be between 3 and 32 characters' : true
        },
        {
            type: 'password',
            name: 'password',
            message: 'Enter password for this user'
        }
    ]);

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            username,
            password: passwordHash
        }
    });

    return user;
}

createUser()
    .then(user => {
        console.log(`Created user ${user.username}.`);
    })
    .catch(err => {
        console.log(`Failed to create user.\n${err}`);
    })