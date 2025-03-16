import Link from "next/link";
import RegisterForm from "../components/RegisterForm";

export default function Register() {

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crie sua conta
          </h2>
        </div>

        <RegisterForm />

        <div className="text-center mt-4">
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Já tem uma conta? Faça login
          </Link>
        </div>
      </div>
    </div>
  );
}