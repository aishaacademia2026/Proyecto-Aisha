// Contact channels for the Contacto page.
//
// The form does not need a server: it prepares the message and opens the visitor's own channel
// (their mail app or WhatsApp), so the visitor is the one who presses "send". The page says so,
// and never claims that a message was delivered.
//
// VITE_CONTACT_EMAIL overrides the public address below. Both values are public by design.

export const WHATSAPP_NUMBER = "447771620333";
export const WHATSAPP_DISPLAY = "+44 7771 620333";

export const contactEmail =
  (import.meta.env.VITE_CONTACT_EMAIL as string | undefined)?.trim() || "aishaacademia2026@gmail.com";

export const MESSAGE_MAX_LENGTH = 1500;

export type ContactPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type ContactChannel = "email" | "whatsapp";

export function whatsappLink(text?: string) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function whatsappMessage({ name, email, subject, message }: ContactPayload) {
  return [`Hola, soy ${name} (${email}).`, `Asunto: ${subject}`, "", message].join("\n");
}

export function mailtoLink({ name, email, subject, message }: ContactPayload) {
  const body = [message, "", "—", `${name}`, `Correo de contacto: ${email}`].join("\n");
  return `mailto:${contactEmail}?subject=${encodeURIComponent(`${subject} — ${name}`)}&body=${encodeURIComponent(body)}`;
}

export function channelLink(channel: ContactChannel, payload: ContactPayload) {
  return channel === "email" ? mailtoLink(payload) : whatsappLink(whatsappMessage(payload));
}
