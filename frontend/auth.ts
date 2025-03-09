import { findUserByCredentials } from "@/app/login/loginAction";
import NextAuth, { Awaitable, RequestInternal, User } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: {},
                password: {},
            },
            authorize: async (credentials, req): Promise<User | null> => {
                console.log(credentials)
                
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await findUserByCredentials(
                    credentials.email,
                    credentials.password
                )

                if (!user) {
                    return null;
                }

                return {
                    id: user.email,
                    email: user.email,
                    name: user.name
                }
            }
        })
    ],
})
