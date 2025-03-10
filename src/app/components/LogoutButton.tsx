"use client"

import { signOut } from "next-auth/react";

export default function LogoutButton() {
    return (
        <button onClick={() => signOut()} className="text-xs text-blue-200 hover:text-white cursor-pointer">Sair</button>
    )
}
