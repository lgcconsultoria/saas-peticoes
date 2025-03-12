'use client'

import Link from 'next/link'
import {
    DocumentTextIcon,
    ScaleIcon,
    ClockIcon,
    SparklesIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline'

const features = [
    {
        name: 'Petições Personalizadas',
        description: 'Gere petições jurídicas personalizadas para suas necessidades específicas em questão de minutos.',
        icon: DocumentTextIcon,
    },
    {
        name: 'Fundamentação Jurídica',
        description: 'Todas as petições são geradas com fundamentação jurídica sólida e atualizada conforme a legislação vigente.',
        icon: ScaleIcon,
    },
    {
        name: 'Economia de Tempo',
        description: 'Reduza drasticamente o tempo gasto na elaboração de petições, focando no que realmente importa.',
        icon: ClockIcon,
    },
    {
        name: 'Tecnologia de IA Avançada',
        description: 'Utilizamos a mais avançada tecnologia de IA da OpenAI para garantir documentos de alta qualidade.',
        icon: SparklesIcon,
    },
]

const testimonials = [
    {
        content: "O JusPetições revolucionou minha prática jurídica. Consigo elaborar petições em uma fração do tempo que levava antes.",
        author: "Dra. Ana Silva",
        role: "Advogada, OAB/SP"
    },
    {
        content: "A qualidade das petições geradas é impressionante. A ferramenta entende perfeitamente o contexto jurídico brasileiro.",
        author: "Dr. Carlos Mendes",
        role: "Procurador, Rio de Janeiro"
    },
    {
        content: "Indispensável para escritórios de todos os tamanhos. Aumentou nossa produtividade em mais de 70%.",
        author: "Dra. Juliana Costa",
        role: "Sócia de Escritório, OAB/MG"
    },
]

export default function Home() {
    return (
        <div className="bg-white">
            {/* Header/Navbar */}
            <header className="bg-white shadow-sm">
                <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
                    <div className="flex w-full items-center justify-between border-b border-indigo-500 py-6 lg:border-none">
                        <div className="flex items-center">
                            <span className="text-2xl font-bold text-indigo-600">JusPetições</span>
                            <div className="ml-10 hidden space-x-8 lg:block">
                                <a href="#features" className="text-base font-medium text-gray-700 hover:text-indigo-600">
                                    Recursos
                                </a>
                                <a href="#testimonials" className="text-base font-medium text-gray-700 hover:text-indigo-600">
                                    Depoimentos
                                </a>
                                <a href="#pricing" className="text-base font-medium text-gray-700 hover:text-indigo-600">
                                    Preços
                                </a>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/login"
                                className="inline-block rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white hover:bg-indigo-700"
                            >
                                Entrar
                            </Link>
                            <Link
                                href="/register"
                                className="inline-block rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Registrar
                            </Link>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center space-x-6 py-4 lg:hidden">
                        <a href="#features" className="text-base font-medium text-gray-700 hover:text-indigo-600">
                            Recursos
                        </a>
                        <a href="#testimonials" className="text-base font-medium text-gray-700 hover:text-indigo-600">
                            Depoimentos
                        </a>
                        <a href="#pricing" className="text-base font-medium text-gray-700 hover:text-indigo-600">
                            Preços
                        </a>
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <div className="relative isolate overflow-hidden bg-gradient-to-b from-indigo-100/20 pt-14">
                <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                            Petições Jurídicas com Inteligência Artificial
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-gray-600">
                            Gere petições jurídicas personalizadas em minutos, com fundamentação sólida e atualizada.
                            Economize tempo e aumente a produtividade do seu escritório.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link
                                href="/dashboard"
                                className="rounded-md bg-indigo-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                Acessar Gerador de Petições
                            </Link>
                            <Link
                                href="/register"
                                className="rounded-md bg-white px-6 py-3 text-lg font-semibold text-indigo-600 shadow-sm ring-1 ring-inset ring-indigo-200 hover:bg-gray-50"
                            >
                                Criar Conta
                            </Link>
                            <a href="#features" className="text-lg font-semibold leading-6 text-gray-900 flex items-center">
                                Saiba mais <ArrowRightIcon className="ml-2 h-4 w-4" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div id="features" className="bg-white py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center">
                        <h2 className="text-base font-semibold leading-7 text-indigo-600">Recursos Poderosos</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            Tudo o que você precisa para criar petições de qualidade
                        </p>
                        <p className="mt-6 text-lg leading-8 text-gray-600">
                            Nossa plataforma combina tecnologia de ponta com conhecimento jurídico para oferecer a melhor experiência na geração de petições.
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                            {features.map((feature) => (
                                <div key={feature.name} className="relative pl-16">
                                    <dt className="text-base font-semibold leading-7 text-gray-900">
                                        <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                                            <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                                        </div>
                                        {feature.name}
                                    </dt>
                                    <dd className="mt-2 text-base leading-7 text-gray-600">{feature.description}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            </div>

            {/* Testimonials Section */}
            <div id="testimonials" className="bg-gray-50 py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center">
                        <h2 className="text-base font-semibold leading-7 text-indigo-600">Depoimentos</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            O que nossos clientes dizem
                        </p>
                        <p className="mt-6 text-lg leading-8 text-gray-600">
                            Advogados e escritórios de todo o Brasil já estão economizando tempo e aumentando a produtividade com o JusPetições.
                        </p>
                    </div>
                    <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="flex flex-col justify-between bg-white p-6 shadow-lg rounded-xl">
                                <div>
                                    <p className="text-lg font-medium leading-8 text-gray-900">"{testimonial.content}"</p>
                                </div>
                                <div className="mt-8">
                                    <div className="text-base font-semibold text-gray-900">{testimonial.author}</div>
                                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Pricing Section */}
            <div id="pricing" className="bg-white py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center">
                        <h2 className="text-base font-semibold leading-7 text-indigo-600">Preços</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            Planos para todos os tamanhos de escritório
                        </p>
                        <p className="mt-6 text-lg leading-8 text-gray-600">
                            Escolha o plano que melhor se adapta às suas necessidades e comece a economizar tempo hoje mesmo.
                        </p>
                    </div>
                    <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-2">
                        {/* Plano Básico */}
                        <div className="rounded-3xl p-8 ring-1 ring-gray-200 lg:rounded-l-3xl lg:rounded-r-none">
                            <h3 className="text-lg font-semibold leading-8 text-indigo-600">Básico</h3>
                            <p className="mt-4 flex items-baseline gap-x-2">
                                <span className="text-4xl font-bold tracking-tight text-gray-900">R$99</span>
                                <span className="text-sm font-semibold leading-6 text-gray-600">/mês</span>
                            </p>
                            <p className="mt-6 text-base leading-7 text-gray-600">
                                Perfeito para advogados autônomos e pequenos escritórios.
                            </p>
                            <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                                <li className="flex gap-x-3">
                                    <svg className="h-6 w-5 flex-none text-indigo-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                    </svg>
                                    Até 20 petições por mês
                                </li>
                                <li className="flex gap-x-3">
                                    <svg className="h-6 w-5 flex-none text-indigo-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                    </svg>
                                    Acesso a templates básicos
                                </li>
                                <li className="flex gap-x-3">
                                    <svg className="h-6 w-5 flex-none text-indigo-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                    </svg>
                                    Suporte por email
                                </li>
                            </ul>
                            <Link
                                href="/register"
                                className="mt-8 block rounded-md py-2.5 px-3.5 text-center text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 bg-white text-indigo-600 shadow-sm ring-1 ring-inset ring-indigo-200 hover:bg-gray-50"
                            >
                                Começar agora
                            </Link>
                        </div>

                        {/* Plano Pro */}
                        <div className="rounded-3xl p-8 bg-gray-900 lg:rounded-l-none lg:rounded-r-3xl">
                            <h3 className="text-lg font-semibold leading-8 text-white">Pro</h3>
                            <p className="mt-4 flex items-baseline gap-x-2">
                                <span className="text-4xl font-bold tracking-tight text-white">R$199</span>
                                <span className="text-sm font-semibold leading-6 text-gray-400">/mês</span>
                            </p>
                            <p className="mt-6 text-base leading-7 text-gray-300">
                                Ideal para escritórios em crescimento e equipes jurídicas.
                            </p>
                            <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-300">
                                <li className="flex gap-x-3">
                                    <svg className="h-6 w-5 flex-none text-indigo-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                    </svg>
                                    Petições ilimitadas
                                </li>
                                <li className="flex gap-x-3">
                                    <svg className="h-6 w-5 flex-none text-indigo-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                    </svg>
                                    Acesso a todos os templates
                                </li>
                                <li className="flex gap-x-3">
                                    <svg className="h-6 w-5 flex-none text-indigo-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                    </svg>
                                    Suporte prioritário
                                </li>
                                <li className="flex gap-x-3">
                                    <svg className="h-6 w-5 flex-none text-indigo-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                    </svg>
                                    API para integração
                                </li>
                            </ul>
                            <Link
                                href="/register"
                                className="mt-8 block rounded-md py-2.5 px-3.5 text-center text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 bg-indigo-600 text-white shadow-sm hover:bg-indigo-500"
                            >
                                Começar agora
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 