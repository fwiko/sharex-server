import { prisma } from "@lib/prisma";
import { compareHash } from "@helpers/auth";

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('method not allowed.');
        return;
    }

    // Authorise request
    const { username, password } = req.headers;
    const userRecord = await prisma.user.findUnique({ where: { username } });
    if (!userRecord || !compareHash(password, userRecord.password)) {
        res.status(401).send('unauthorised.');
        return;
    }

}