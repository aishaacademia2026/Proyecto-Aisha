// Contact channels and form delivery for the Contacto page.
//
// - VITE_CONTACT_EMAIL: public contact address. Leave empty to show a placeholder.
// - VITE_CONTACT_ENDPOINT: URL of a form service (e.g. Formspree) that accepts a JSON POST.
//   Without it the form validates but does not pretend to send; it offers WhatsApp instead.
// Both values are public by design: never put secret keys in them.

export const WHATSAPP_NUMBER = "447771620333";
export const WHATSAPP_DISPLAY = "+44 7771 620333";

export const contactEmail = (import.meta.env.VITE_CONTACT_EMAIL as string | undefined)?.trim() || "";
const contactEndpoint = (import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined)?.trim() || "";

export const isContactFormConfigured = Boolean(contactEndpoint);

export type ContactPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export class ContactNotConfiguredError extends Error {
  constructor() {
    super("Contact form endpoint is not configured");
    this.name = "ContactNotConfiguredError";
  }
}

export function whatsappLink(text?: string) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function whatsappMessage({ name, email, subject, message }: ContactPayload) {
  return [`Hola, soy ${name} (${email}).`, `Asunto: ${subject}`, "", message].join("\n");
}

export async function sendContactMessage(payload: ContactPayload): Promise<void> {
  if (!contactEndpoint) throw new ContactNotConfiguredError();

  const response = await fetch(contactEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Contact request failed with status ${response.status}`);
}
