/**
 * Reads an `<input type="file">` image and returns it as a small, resized
 * JPEG data URL - used for the signup form's "foto" field, since there's
 * no upload backend to send the original file to yet and `avatarUrl` on
 * `User` (see `@/types`) is just a plain string the rest of the app already
 * knows how to render (`<UserAvatar/>`, `<Image src={user.avatarUrl}/>`
 * elsewhere).
 *
 * Downscaling to `maxDimension` before encoding matters here specifically
 * because the result gets persisted to `localStorage` via `authStore`/
 * `accountsStore` - a raw phone photo (often several MB) would eat a big
 * chunk of the small per-origin storage quota; a 256px JPEG comfortably
 * doesn't.
 */
export function readImageAsDataUrl(file: File, maxDimension = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(reader.error ?? new Error("Não foi possível ler o arquivo."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      image.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // No canvas support (very unlikely) - fall back to the
          // untouched original rather than failing the whole form.
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      image.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
