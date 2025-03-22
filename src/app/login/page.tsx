"use client"

import Link from 'next/link';
import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LoginForm from '../components/LoginForm';
import { signIn } from 'next-auth/react';
import { showSuccess } from '@/lib/toast';

function LoginContent() {
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');

  useEffect(() => {
    if (registered === 'true') {
      showSuccess('Conta criada com sucesso! Você já pode fazer login.');
    }
  }, [registered]);

  return (
    <>
      <LoginForm />

      <div className="flex items-center justify-center">
        <h5 className="font-semibold text-slate-600">OU</h5>
      </div>

      <div className="mt-6">
        <button
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer"
        >
          Entrar com Google
        </button>
      </div>
    </>
  );
}

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Entre na sua conta
          </h2>
        </div>
        
        <Suspense fallback={<div className="text-center">Carregando...</div>}>
          <LoginContent />
        </Suspense>

        <div className="text-center mt-4">
          <Link
            href="/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Não tem uma conta? Cadastre-se
          </Link>
        </div>
      </div>
    </div>
  );
}
