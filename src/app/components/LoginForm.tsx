"use client"

import Form from "next/form";
import loginAction from "../login/loginAction";
import { useActionState } from "react";

export default function LoginForm() {

    const [state, formAction, isPending] = useActionState(loginAction, null)

    return (
        <>
            {state?.success === false && (
                <div className="bg-red-500 text-white p-2 rounded-md">
                    <strong>{state.message}</strong>
                </div>
            )}
            <Form action={formAction} className="mt-8 space-y-6">
                <div className="rounded-md shadow-sm -space-y-px">
                    <div>
                        <input
                            type="email"
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            placeholder="Email"
                            name="email"
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            placeholder="Senha"
                            name="password"
                        />
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
                    >
                        Entrar
                    </button>
                </div>
            </Form>
        </>
    )
}
