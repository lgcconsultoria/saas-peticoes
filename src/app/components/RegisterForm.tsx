"use client"

import Form from "next/form";
import registerAction from "../register/registerAction";
import { useActionState } from "react";

export default function RegisterForm() {

    const [state, formAction, isPending] = useActionState(registerAction, null)

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
                            type="text"                          
                            name="name"
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                            placeholder="Nome completo"
                        />
                    </div>
                    <div>
                        <input
                            type="email"  
                            name="email"
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                            placeholder="Email"
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            name="password"
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                            placeholder="Senha"
                            minLength={6}
                        />
                    </div>
                </div>

                <div>
                    <button
                        disabled={isPending}
                        type="submit"
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 cursor-pointer"
                    >
                        Cadastrar
                    </button>
                </div>
            </Form>
        </>
    )
}
