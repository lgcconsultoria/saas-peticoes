import db from "../../../lib/db";
import { compareSync } from "bcrypt-ts";

type User = {
    name: string;
    email: string;
    password?: string;
}

export async function findUserByCredentials(email: string, password: string): Promise<User | null> {

    const user = await db.user.findFirst({
        where: {
            email
        }
    })

    if (!user) {
        return null
    }

    const passwordMatch = compareSync(password, user.password)

    if (passwordMatch) {
        return { email: user.email, name: user.name! };
    }

    return null;
}



