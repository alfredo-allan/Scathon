/**
 * Validação e máscara de CPF/CNPJ do destinatário - coletado direto do
 * cliente no checkout (`<RecipientDocumentModal/>`, usado em
 * `<CheckoutView/>`) quando o frete é pela Melhor Envio (pedido do Alfredo
 * em 2026-10-10: antes só o admin digitava isso na hora de comprar a
 * etiqueta - ver `<AdminOrdersTab/>`, que continua existindo como reserva
 * pra pedido sem esse dado). Mesmo algoritmo de dígito verificador (CPF/CNPJ
 * - fórmula pública da Receita Federal) replicado em `app/validation.py` no
 * backend - qualquer mudança aqui precisa espelhar lá também, senão um
 * documento que o frontend aceita pode ser recusado pelo backend (ou
 * vice-versa).
 */

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Máscara "ao digitar" - CPF (`000.000.000-00`) até 11 dígitos, CNPJ
 * (`00.000.000/0000-00`) a partir do 12º. Mesma técnica de substituições
 * encadeadas de `@/lib/phone`'s `formatPhone`/`@/lib/viaCep`'s `formatCep`.
 */
export function formatDocument(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

/** CPF (11 dígitos) - confere os dois dígitos verificadores, não só o
 * tamanho. Rejeita sequências como "00000000000" (passam na conta, mas
 * nunca são CPFs reais). */
export function isValidCpf(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  const nums = digits.split("").map(Number);

  let total = 0;
  for (let i = 0; i < 9; i++) total += nums[i] * (10 - i);
  let check1 = (total * 10) % 11;
  if (check1 === 10) check1 = 0;
  if (check1 !== nums[9]) return false;

  total = 0;
  for (let i = 0; i < 10; i++) total += nums[i] * (11 - i);
  let check2 = (total * 10) % 11;
  if (check2 === 10) check2 = 0;
  if (check2 !== nums[10]) return false;

  return true;
}

/** CNPJ (14 dígitos) - mesma ideia do CPF acima, com os pesos oficiais de
 * cada dígito verificador. */
export function isValidCnpj(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false;
  const nums = digits.split("").map(Number);

  const checkDigit = (length: number): number => {
    const weights =
      length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let total = 0;
    for (let i = 0; i < length; i++) total += nums[i] * weights[i];
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  if (checkDigit(12) !== nums[12]) return false;
  if (checkDigit(13) !== nums[13]) return false;

  return true;
}

/** CPF (11 dígitos) ou CNPJ (14) - detecta qual é pelo tamanho depois de
 * tirar a pontuação, e já valida o dígito verificador do que achar. */
export function isValidDocument(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length === 11) return isValidCpf(digits);
  if (digits.length === 14) return isValidCnpj(digits);
  return false;
}
