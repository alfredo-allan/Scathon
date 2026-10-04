"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  ApiError,
  changePassword,
  confirmEmailChange,
  removeAvatar,
  requestAccountVerificationCode,
  updateProfile,
  uploadAvatar,
} from "@/lib/auth";
import { resolveMediaUrl } from "@/lib/apiClient";
import { readImageAsDataUrl } from "@/lib/imageFile";
import { formatPhone, isCompletePhone } from "@/lib/phone";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * `/account/edit` page body - edição de perfil de verdade (nome, telefone,
 * cidade/estado, foto), linkada a partir de `<AccountView/>`. Antes desta
 * tela, `<AccountView/>` só MOSTRAVA esses dados; não havia como o próprio
 * cliente mudá-los depois do cadastro.
 *
 * E-mail e senha são "alterações sensíveis": agora que o SMTP funciona de
 * verdade, as duas ganham fluxo próprio de confirmação por código (ver
 * `requestAccountVerificationCode`/`confirmEmailChange`/`changePassword` em
 * `@/lib/auth`) em vez do antigo "em breve" - pedir código, digitar o código
 * que chegou por e-mail, confirmar. Pra troca de e-mail o código sempre vai
 * pro e-mail NOVO (prova que a pessoa tem acesso a essa caixa de entrada);
 * pra troca de senha, pro e-mail já cadastrado.
 */
export function AccountEditView() {
  const router = useRouter();
  const { user, token, isAuthenticated, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks sempre antes de qualquer `return` condicional (regra dos hooks).
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [phone, setPhone] = useState(user?.phone ? formatPhone(user.phone) : "");
  const [city, setCity] = useState(user?.city ?? "");
  const [state, setState] = useState(user?.state ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Troca de e-mail (2FA por código) - ver doc comment do componente.
  const [emailChangeOpen, setEmailChangeOpen] = useState(false);
  const [emailChangeStep, setEmailChangeStep] = useState<"pedir" | "confirmar">("pedir");
  const [newEmail, setNewEmail] = useState("");
  const [emailChangeCode, setEmailChangeCode] = useState("");
  const [isSendingEmailCode, setIsSendingEmailCode] = useState(false);
  const [isConfirmingEmail, setIsConfirmingEmail] = useState(false);
  const [emailChangeError, setEmailChangeError] = useState<string | null>(null);
  const [emailChangeSuccess, setEmailChangeSuccess] = useState(false);

  // Troca de senha (2FA por código) - mesmo padrão da troca de e-mail acima.
  const [passwordChangeOpen, setPasswordChangeOpen] = useState(false);
  const [passwordChangeStep, setPasswordChangeStep] = useState<"pedir" | "confirmar">("pedir");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordChangeCode, setPasswordChangeCode] = useState("");
  const [isSendingPasswordCode, setIsSendingPasswordCode] = useState(false);
  const [isConfirmingPassword, setIsConfirmingPassword] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  if (!isAuthenticated || !user || !token) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Você precisa entrar pra editar seu perfil.</p>
        <Link
          href="/login"
          className="rounded-app bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950"
        >
          Entrar
        </Link>
      </div>
    );
  }

  const currentAvatarSrc = resolveMediaUrl(user.avatarUrl);
  const hasCurrentAvatar = Boolean(currentAvatarSrc) && !imageFailed;

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setAvatarPreview(dataUrl);
      setAvatarFile(file);
      setError(null);
    } catch {
      setError("Não foi possível carregar essa foto. Tente outra imagem.");
    }
  }

  async function handleRemovePhoto() {
    // Só um novo arquivo escolhido nesta sessão de edição, ainda não
    // enviado - descarta local, sem chamar o backend.
    if (avatarFile) {
      setAvatarFile(null);
      setAvatarPreview(null);
      return;
    }
    if (!hasCurrentAvatar) return;
    // TS não carrega o narrowing de `user`/`token` do `return` condicional lá
    // em cima pra dentro de funções aninhadas (closures) - mesmo padrão já
    // usado em `<AccountAddressesView/>`'s `handleAddAddress`.
    if (!token || !user) return;

    setIsRemovingAvatar(true);
    setError(null);
    try {
      await removeAvatar(token);
      updateUser({ ...user, avatarUrl: null });
    } catch {
      setError("Não foi possível remover a foto agora. Tente de novo em instantes.");
    } finally {
      setIsRemovingAvatar(false);
    }
  }

  async function handleSubmit() {
    // Mesmo motivo do guard em `handleRemovePhoto` acima.
    if (!token) return;

    const trimmedName = displayName.trim();
    if (trimmedName.length < 2) {
      setError("Digite seu nome completo.");
      return;
    }
    if (phone.trim().length > 0 && !isCompletePhone(phone)) {
      setError("Digite um telefone válido, com DDD, ou deixe em branco.");
      return;
    }
    const trimmedState = state.trim().toUpperCase();
    if (trimmedState.length > 0 && trimmedState.length !== 2) {
      setError("O estado é a sigla de 2 letras (ex.: SP).");
      return;
    }

    setError(null);
    setSuccess(false);
    setIsSaving(true);
    try {
      let latestUser = await updateProfile(token, {
        displayName: trimmedName,
        phone: phone.trim() || null,
        city: city.trim() || null,
        state: trimmedState || null,
      });

      if (avatarFile) {
        latestUser = await uploadAvatar(token, avatarFile);
      }

      updateUser(latestUser);
      setAvatarFile(null);
      setAvatarPreview(null);
      setImageFailed(false);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível salvar suas alterações agora. Tente de novo em instantes.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  // -- Troca de e-mail (2FA) ------------------------------------------------

  function handleCancelEmailChange() {
    setEmailChangeOpen(false);
    setEmailChangeStep("pedir");
    setNewEmail("");
    setEmailChangeCode("");
    setEmailChangeError(null);
  }

  async function handleRequestEmailCode() {
    // Mesmo motivo do guard em `handleRemovePhoto` acima (closure não herda
    // o narrowing do `return` condicional lá em cima).
    if (!token || !user) return;

    const trimmed = newEmail.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setEmailChangeError("Digite um e-mail válido.");
      return;
    }
    if (trimmed.toLowerCase() === user.email.toLowerCase()) {
      setEmailChangeError("Esse já é o seu e-mail atual.");
      return;
    }

    setEmailChangeError(null);
    setIsSendingEmailCode(true);
    try {
      await requestAccountVerificationCode(token, "email_change", trimmed);
      setEmailChangeStep("confirmar");
    } catch (err) {
      setEmailChangeError(
        err instanceof ApiError ? err.message : "Não foi possível enviar o código agora. Tente de novo em instantes.",
      );
    } finally {
      setIsSendingEmailCode(false);
    }
  }

  async function handleConfirmEmailChange() {
    if (!token) return;

    const trimmedCode = emailChangeCode.trim();
    if (!/^\d{6}$/.test(trimmedCode)) {
      setEmailChangeError("Digite o código de 6 dígitos recebido por e-mail.");
      return;
    }

    setEmailChangeError(null);
    setIsConfirmingEmail(true);
    try {
      const updated = await confirmEmailChange(token, trimmedCode);
      updateUser(updated);
      handleCancelEmailChange();
      setEmailChangeSuccess(true);
    } catch (err) {
      setEmailChangeError(err instanceof ApiError ? err.message : "Código inválido ou expirado. Tente de novo.");
    } finally {
      setIsConfirmingEmail(false);
    }
  }

  // -- Troca de senha (2FA) -------------------------------------------------

  function handleCancelPasswordChange() {
    setPasswordChangeOpen(false);
    setPasswordChangeStep("pedir");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordChangeCode("");
    setPasswordChangeError(null);
  }

  async function handleRequestPasswordCode() {
    if (!token) return;

    if (currentPassword.length === 0) {
      setPasswordChangeError("Digite sua senha atual.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordChangeError("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError("As duas senhas novas precisam ser iguais.");
      return;
    }

    setPasswordChangeError(null);
    setIsSendingPasswordCode(true);
    try {
      await requestAccountVerificationCode(token, "password_change");
      setPasswordChangeStep("confirmar");
    } catch (err) {
      setPasswordChangeError(
        err instanceof ApiError ? err.message : "Não foi possível enviar o código agora. Tente de novo em instantes.",
      );
    } finally {
      setIsSendingPasswordCode(false);
    }
  }

  async function handleConfirmPasswordChange() {
    if (!token) return;

    const trimmedCode = passwordChangeCode.trim();
    if (!/^\d{6}$/.test(trimmedCode)) {
      setPasswordChangeError("Digite o código de 6 dígitos recebido por e-mail.");
      return;
    }

    setPasswordChangeError(null);
    setIsConfirmingPassword(true);
    try {
      await changePassword(token, currentPassword, newPassword, trimmedCode);
      handleCancelPasswordChange();
      setPasswordChangeSuccess(true);
    } catch (err) {
      setPasswordChangeError(
        err instanceof ApiError
          ? err.message
          : "Código inválido ou expirado, ou senha atual incorreta. Tente de novo.",
      );
    } finally {
      setIsConfirmingPassword(false);
    }
  }

  return (
    <div className="px-4 md:px-8 py-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-neutral-900 dark:hover:text-neutral-100">
              Página Inicial
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/account" className="hover:text-neutral-900 dark:hover:text-neutral-100">
              Minha Conta
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-neutral-900 dark:text-neutral-100">Editar Perfil</li>
        </ol>
      </nav>

      <h1 className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50 md:text-2xl">
        Editar Perfil
      </h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        Atualize sua foto e seus dados cadastrais.
      </p>

      <div className="mt-6 max-w-md">
        <div className="flex items-center gap-4">
          <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
            {avatarPreview ? (
              <Image src={avatarPreview} alt="" fill unoptimized className="object-cover" />
            ) : hasCurrentAvatar ? (
              <Image
                src={currentAvatarSrc as string}
                alt={user.displayName}
                fill
                unoptimized
                onError={() => setImageFailed(true)}
                className="object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-neutral-500 dark:text-neutral-400">
                {displayName.trim() ? displayName.trim().charAt(0).toUpperCase() : "?"}
              </span>
            )}
          </span>
          <div className="flex flex-col items-start gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold uppercase tracking-widest text-neutral-900 underline underline-offset-4 dark:text-neutral-100"
            >
              {avatarPreview || hasCurrentAvatar ? "Trocar foto" : "Adicionar foto"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            {(avatarPreview || hasCurrentAvatar) && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={isRemovingAvatar}
                className="text-xs text-neutral-500 underline underline-offset-4 hover:text-neutral-900 disabled:opacity-40 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                {isRemovingAvatar ? "Removendo…" : "Remover foto"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
            Nome completo
            <input
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full rounded-app border border-neutral-300 bg-transparent px-3 py-3 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-neutral-100"
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
              E-mail
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full rounded-app border border-neutral-200 bg-neutral-100 px-3 py-3 text-sm font-normal normal-case tracking-normal text-neutral-500 outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-500"
              />
            </label>

            {!emailChangeOpen && (
              <button
                type="button"
                onClick={() => {
                  setEmailChangeOpen(true);
                  setEmailChangeSuccess(false);
                }}
                className="self-start text-[11px] font-semibold normal-case tracking-normal text-neutral-900 underline underline-offset-4 dark:text-neutral-100"
              >
                Trocar e-mail de cadastro
              </button>
            )}
            {emailChangeSuccess && !emailChangeOpen && (
              <p className="text-[11px] normal-case tracking-normal text-green-700 dark:text-green-500">
                E-mail atualizado com sucesso.
              </p>
            )}

            {emailChangeOpen && (
              <div className="flex flex-col gap-2 rounded-app border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
                {emailChangeStep === "pedir" ? (
                  <>
                    <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
                      Novo e-mail
                      <input
                        type="email"
                        autoComplete="email"
                        value={newEmail}
                        onChange={(event) => setNewEmail(event.target.value)}
                        placeholder="novo@email.com"
                        className="w-full rounded-app border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-100"
                      />
                    </label>
                    <p className="text-[11px] normal-case tracking-normal text-neutral-500 dark:text-neutral-400">
                      Vamos mandar um código de confirmação pro e-mail novo.
                    </p>
                    {emailChangeError && (
                      <p className="text-[11px] normal-case tracking-normal text-red-600 dark:text-red-400">
                        {emailChangeError}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleRequestEmailCode}
                        disabled={isSendingEmailCode}
                        className="rounded-app bg-neutral-950 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-950"
                      >
                        {isSendingEmailCode ? "Enviando…" : "Enviar código"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEmailChange}
                        className="rounded-app border border-neutral-300 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-900 dark:border-neutral-700 dark:text-neutral-100"
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] normal-case tracking-normal text-neutral-600 dark:text-neutral-400">
                      Digite o código de 6 dígitos que mandamos pra{" "}
                      <strong className="font-semibold text-neutral-900 dark:text-neutral-100">{newEmail}</strong>.
                    </p>
                    <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
                      Código
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={emailChangeCode}
                        onChange={(event) => setEmailChangeCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        className="w-full rounded-app border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-[0.3em] text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-100"
                      />
                    </label>
                    {emailChangeError && (
                      <p className="text-[11px] normal-case tracking-normal text-red-600 dark:text-red-400">
                        {emailChangeError}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmEmailChange}
                        disabled={isConfirmingEmail}
                        className="rounded-app bg-neutral-950 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-950"
                      >
                        {isConfirmingEmail ? "Confirmando…" : "Confirmar troca"}
                      </button>
                      <button
                        type="button"
                        onClick={handleRequestEmailCode}
                        disabled={isSendingEmailCode}
                        className="text-[11px] normal-case tracking-normal text-neutral-500 underline underline-offset-4 hover:text-neutral-900 disabled:opacity-40 dark:text-neutral-400 dark:hover:text-neutral-100"
                      >
                        Pedir um código novo
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEmailChange}
                        className="text-[11px] normal-case tracking-normal text-neutral-500 underline underline-offset-4 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

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

          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
              Cidade
              <input
                type="text"
                autoComplete="address-level2"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="w-full rounded-app border border-neutral-300 bg-transparent px-3 py-3 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-neutral-100"
              />
            </label>
            <label className="flex w-24 flex-col gap-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
              Estado
              <input
                type="text"
                autoComplete="address-level1"
                value={state}
                maxLength={2}
                onChange={(event) => setState(event.target.value.toUpperCase())}
                placeholder="SP"
                className="w-full rounded-app border border-neutral-300 bg-transparent px-3 py-3 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-neutral-100"
              />
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            {!passwordChangeOpen && (
              <button
                type="button"
                onClick={() => {
                  setPasswordChangeOpen(true);
                  setPasswordChangeSuccess(false);
                }}
                className="self-start text-xs font-semibold uppercase tracking-widest text-neutral-900 underline underline-offset-4 dark:text-neutral-100"
              >
                Trocar senha
              </button>
            )}
            {passwordChangeSuccess && !passwordChangeOpen && (
              <p className="text-[11px] normal-case tracking-normal text-green-700 dark:text-green-500">
                Senha atualizada com sucesso.
              </p>
            )}

            {passwordChangeOpen && (
              <div className="flex flex-col gap-2 rounded-app border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
                {passwordChangeStep === "pedir" ? (
                  <>
                    <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
                      Senha atual
                      <input
                        type="password"
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        className="w-full rounded-app border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-100"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
                      Nova senha
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        className="w-full rounded-app border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-100"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
                      Confirmar nova senha
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={confirmNewPassword}
                        onChange={(event) => setConfirmNewPassword(event.target.value)}
                        className="w-full rounded-app border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-100"
                      />
                    </label>
                    <p className="text-[11px] normal-case tracking-normal text-neutral-500 dark:text-neutral-400">
                      Vamos mandar um código de confirmação pro seu e-mail cadastrado.
                    </p>
                    {passwordChangeError && (
                      <p className="text-[11px] normal-case tracking-normal text-red-600 dark:text-red-400">
                        {passwordChangeError}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleRequestPasswordCode}
                        disabled={isSendingPasswordCode}
                        className="rounded-app bg-neutral-950 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-950"
                      >
                        {isSendingPasswordCode ? "Enviando…" : "Enviar código"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelPasswordChange}
                        className="rounded-app border border-neutral-300 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-900 dark:border-neutral-700 dark:text-neutral-100"
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] normal-case tracking-normal text-neutral-600 dark:text-neutral-400">
                      Digite o código de 6 dígitos que mandamos pro seu e-mail.
                    </p>
                    <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
                      Código
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={passwordChangeCode}
                        onChange={(event) => setPasswordChangeCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        className="w-full rounded-app border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-[0.3em] text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-100"
                      />
                    </label>
                    {passwordChangeError && (
                      <p className="text-[11px] normal-case tracking-normal text-red-600 dark:text-red-400">
                        {passwordChangeError}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmPasswordChange}
                        disabled={isConfirmingPassword}
                        className="rounded-app bg-neutral-950 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-950"
                      >
                        {isConfirmingPassword ? "Confirmando…" : "Confirmar troca"}
                      </button>
                      <button
                        type="button"
                        onClick={handleRequestPasswordCode}
                        disabled={isSendingPasswordCode}
                        className="text-[11px] normal-case tracking-normal text-neutral-500 underline underline-offset-4 hover:text-neutral-900 disabled:opacity-40 dark:text-neutral-400 dark:hover:text-neutral-100"
                      >
                        Pedir um código novo
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelPasswordChange}
                        className="text-[11px] normal-case tracking-normal text-neutral-500 underline underline-offset-4 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          {success && (
            <p className="text-xs text-green-700 dark:text-green-500">Dados atualizados com sucesso.</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="rounded-app bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-950"
            >
              {isSaving ? "Salvando…" : "Salvar alterações"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/account")}
              className="rounded-app border border-neutral-300 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-900 transition-colors hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
