'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { findAccount, registerAccount } from '@/lib/accounts'
import { saveAddress } from '@/lib/addresses'
import { formatCep, isCompleteCep, lookupAddressByCep, type ViaCepAddress } from '@/lib/viaCep'
import { formatPhone, isCompletePhone } from '@/lib/phone'
import { readImageAsDataUrl } from '@/lib/imageFile'

type Mode = 'entrar' | 'criar'
type CepStatus = 'idle' | 'loading' | 'done' | 'invalid'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * `/login` page body: a real, responsive sign-in/sign-up screen - a single
 * centered column at every breakpoint (no photo panel; that split-screen
 * treatment didn't earn its keep on desktop, so the form is just centered
 * there too, same as mobile). There's still no real backend, but this is no
 * longer a rubber-stamp form either -
 * "Entrar" checks the typed e-mail/senha against `@/lib/accounts`'s mock
 * accounts table (seeded with cliente@scathon.com / senha123 for a customer,
 * and admin@scathon.com / senha123 for `/admin` - a matching admin login
 * routes straight there instead of home), and "Criar Conta" collects the
 * account's actual base data - nome
 * completo, e-mail, telefone, foto, senha and an endereço de entrega
 * (CEP-assisted, same ViaCEP lookup `<ShippingEstimator/>`/`<CartView/>`
 * already use) - and adds a real entry to that same table plus a saved
 * address, then signs the new account straight in. Swap `registerAccount`/
 * `findAccount`'s bodies for real requests once there's an endpoint; this
 * form doesn't need to change either way.
 */
export function LoginView() {
  const router = useRouter()
  const { isAuthenticated, user, login, logout } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<Mode>('entrar')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Signup's "endereço" step - same CEP-format-then-ViaCEP-lookup pattern
  // as `<ShippingEstimator/>`/`<CartView/>`, just feeding `saveAddress`
  // instead of a shipping quote.
  const [addressCep, setAddressCep] = useState('')
  const [cepStatus, setCepStatus] = useState<CepStatus>('idle')
  const [resolvedAddress, setResolvedAddress] = useState<ViaCepAddress | null>(null)
  const [addressNumber, setAddressNumber] = useState('')
  const [addressComplement, setAddressComplement] = useState('')

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
  }

  async function runAddressLookup(rawCep: string) {
    if (!isCompleteCep(rawCep)) {
      setCepStatus('invalid')
      setResolvedAddress(null)
      return
    }
    setCepStatus('loading')
    const address = await lookupAddressByCep(rawCep)
    setResolvedAddress(address)
    setCepStatus(address ? 'done' : 'invalid')
  }

  function handleCepChange(value: string) {
    const formatted = formatCep(value)
    setAddressCep(formatted)
    if (!isCompleteCep(formatted)) {
      setCepStatus('idle')
      setResolvedAddress(null)
      return
    }
    runAddressLookup(formatted)
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await readImageAsDataUrl(file)
      setAvatarPreview(dataUrl)
    } catch {
      setError('Não foi possível carregar essa foto. Tente outra imagem.')
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const trimmedEmail = email.trim()
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError('Digite um e-mail válido.')
      return
    }
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.')
      return
    }

    if (mode === 'entrar') {
      const account = findAccount(trimmedEmail)
      if (!account || account.password !== password) {
        setError('E-mail ou senha inválidos.')
        return
      }
      setError(null)
      setIsSubmitting(true)
      login(`mock-token-${Date.now()}`, {
        id: `user-${account.email}`,
        displayName: account.displayName,
        email: account.email,
        avatarUrl: account.avatarUrl,
        phone: account.phone,
        role: account.role
      })
      router.push(account.role === 'admin' ? '/admin' : '/')
      return
    }

    // mode === "criar"
    const trimmedName = name.trim()
    if (trimmedName.length < 2) {
      setError('Digite seu nome completo.')
      return
    }
    if (!isCompletePhone(phone)) {
      setError('Digite um telefone válido, com DDD.')
      return
    }
    if (!resolvedAddress || addressNumber.trim().length === 0) {
      setError('Informe seu CEP e o número do endereço de entrega.')
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      const account = await registerAccount({
        email: trimmedEmail,
        password,
        displayName: trimmedName,
        phone,
        avatarUrl: avatarPreview,
        // `registerAccount` always forces this back to "customer" itself
        // (see its doc comment) - passed here only to satisfy `MockAccount`'s
        // required field, never trusted as the actual source of truth.
        role: 'customer'
      })
      await saveAddress({
        label: 'Principal',
        cep: addressCep,
        street: resolvedAddress.street,
        number: addressNumber.trim(),
        complement: addressComplement.trim() || undefined,
        neighborhood: resolvedAddress.neighborhood,
        city: resolvedAddress.city,
        state: resolvedAddress.state
      })
      login(`mock-token-${Date.now()}`, {
        id: `user-${account.email}`,
        displayName: account.displayName,
        email: account.email,
        avatarUrl: account.avatarUrl,
        phone: account.phone,
        role: account.role
      })
      router.push('/')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reachable directly (typed URL, back button, a link before session
  // state caught up) while already signed in - rather than silently
  // re-logging the visitor in, this hands them straight to their account
  // or an easy way out, no form in sight.
  if (isAuthenticated && user) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-4 text-center">
        <span className="w-16 h-16 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt={user.displayName} width={64} height={64} unoptimized className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-neutral-800 dark:text-neutral-100">
              {user.displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </span>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Você já está conectado como <strong className="text-neutral-900 dark:text-neutral-100">{user.displayName}</strong>.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/account"
            className="rounded-app bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950">
            Minha Conta
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="rounded-app border border-neutral-300 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-900 transition-colors hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500">
            Sair
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-14 md:px-8">
      <div className="w-full max-w-sm">
        <Link href="/" aria-label="Scathon" className="mb-10 flex justify-center">
          <Image
            src="/branding/BrandigLogoDark.png"
            alt="Scathon"
            width={500}
            height={211}
            className="block h-8 w-auto object-contain dark:hidden"
          />
          <Image
            src="/branding/BradingLogoLigth.png"
            alt="Scathon"
            width={500}
            height={211}
            className="hidden h-8 w-auto object-contain dark:block"
          />
        </Link>

        <div className="mb-7 flex border-b border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => switchMode('entrar')}
            className={`flex-1 border-b-2 pb-3 text-xs font-semibold uppercase tracking-widest transition-colors ${
              mode === 'entrar'
                ? 'border-neutral-950 text-neutral-950 dark:border-neutral-100 dark:text-neutral-100'
                : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:text-neutral-600 dark:hover:text-neutral-300'
            }`}>
            Entrar
          </button>
          <button
            type="button"
            onClick={() => switchMode('criar')}
            className={`flex-1 border-b-2 pb-3 text-xs font-semibold uppercase tracking-widest transition-colors ${
              mode === 'criar'
                ? 'border-neutral-950 text-neutral-950 dark:border-neutral-100 dark:text-neutral-100'
                : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:text-neutral-600 dark:hover:text-neutral-300'
            }`}>
            Criar Conta
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'criar' && (
            <>
              <div className="flex items-center gap-4">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                  {avatarPreview ? (
                    <Image src={avatarPreview} alt="" fill unoptimized className="object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-neutral-500 dark:text-neutral-400">
                      {name.trim() ? name.trim().charAt(0).toUpperCase() : '?'}
                    </span>
                  )}
                </span>
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold uppercase tracking-widest text-neutral-900 underline underline-offset-4 dark:text-neutral-100">
                    {avatarPreview ? 'Trocar foto' : 'Adicionar foto'}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  <p className="mt-1 text-[11px] normal-case tracking-normal text-neutral-500 dark:text-neutral-400">Opcional</p>
                </div>
              </div>

              <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
                Nome completo
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full rounded-app border border-neutral-300 bg-transparent px-3 py-3 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-neutral-100"
                />
              </label>
            </>
          )}

          <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
            E-mail
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-app border border-neutral-300 bg-transparent px-3 py-3 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-neutral-100"
            />
          </label>

          {mode === 'criar' && (
            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
              Telefone
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(formatPhone(event.target.value))}
                placeholder="(11) 91234-5678"
                className="w-full rounded-app border border-neutral-300 bg-transparent px-3 py-3 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-neutral-100"
              />
            </label>
          )}

          <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
            Senha
            <input
              type="password"
              autoComplete={mode === 'entrar' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="w-full rounded-app border border-neutral-300 bg-transparent px-3 py-3 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-neutral-100"
            />
          </label>

          {mode === 'criar' && (
            <div className="flex flex-col gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
                Endereço de entrega
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={addressCep}
                  onChange={(event) => handleCepChange(event.target.value)}
                  placeholder="CEP"
                  maxLength={9}
                  className="w-32 rounded-app border border-neutral-300 bg-transparent px-3 py-3 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-neutral-100"
                />
                <button
                  type="button"
                  onClick={() => runAddressLookup(addressCep)}
                  disabled={cepStatus === 'loading'}
                  className="flex-1 rounded-app border border-neutral-300 px-3 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-800 transition-colors hover:border-neutral-500 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-100">
                  {cepStatus === 'loading' ? 'Buscando...' : 'Buscar CEP'}
                </button>
              </div>

              {cepStatus === 'invalid' && (
                <p className="text-xs normal-case tracking-normal text-red-600 dark:text-red-400">
                  Não encontramos esse CEP. Confira e tente de novo.
                </p>
              )}

              {resolvedAddress && (
                <>
                  <p className="text-xs normal-case tracking-normal text-neutral-600 dark:text-neutral-400">
                    {[resolvedAddress.street, resolvedAddress.neighborhood].filter(Boolean).join(', ')}
                    {resolvedAddress.city ? ` — ${resolvedAddress.city}/${resolvedAddress.state}` : ''}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={addressNumber}
                      onChange={(event) => setAddressNumber(event.target.value)}
                      placeholder="Número"
                      className="w-24 rounded-app border border-neutral-300 bg-transparent px-3 py-3 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-neutral-100"
                    />
                    <input
                      type="text"
                      value={addressComplement}
                      onChange={(event) => setAddressComplement(event.target.value)}
                      placeholder="Complemento (opcional)"
                      className="flex-1 rounded-app border border-neutral-300 bg-transparent px-3 py-3 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-neutral-100"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-app bg-neutral-950 py-3.5 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-950">
            {isSubmitting ? 'Entrando…' : mode === 'entrar' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        {mode === 'entrar' && (
          <p className="mt-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:text-neutral-600">
            Para testar: cliente@scathon.com / senha123
            <br />
            Admin: admin@scathon.com / senha123
          </p>
        )}

        <p className="mt-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
          {mode === 'entrar' ? (
            <>
              Ainda não tem conta?{' '}
              <button
                type="button"
                onClick={() => switchMode('criar')}
                className="text-neutral-900 underline underline-offset-2 dark:text-neutral-100">
                Criar conta
              </button>
            </>
          ) : (
            <>
              Já tem conta?{' '}
              <button
                type="button"
                onClick={() => switchMode('entrar')}
                className="text-neutral-900 underline underline-offset-2 dark:text-neutral-100">
                Entrar
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
