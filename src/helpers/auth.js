import { compare } from 'bcrypt';

export const compareHash = async (password, passwordHash) => {
    return await compare(password, passwordHash);
}