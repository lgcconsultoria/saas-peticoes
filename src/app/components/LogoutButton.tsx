"use client"

import { signOut } from "next-auth/react";
import { showSuccess } from "@/lib/toast";

export default function LogoutButton() {
    const handleSignOut = () => {
        showSuccess("Sessão encerrada com sucesso!");
        signOut();
    };

    return (
        <button onClick={handleSignOut} className="text-xs text-blue-200 hover:text-white cursor-pointer">
            Sair
        </button>
    );
}
