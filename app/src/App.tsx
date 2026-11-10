import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowRight,
  ArrowUp,
  BookOpen,
  ChevronDown,
  Clock3,
  Flower2,
  GraduationCap,
  HandHeart,
  Heart,
  Instagram,
  Leaf,
  Menu,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Sprout,
  UserRound,
  UsersRound,
  Youtube,
  X,
} from "lucide-react";
import { checkGoogleSignIn, isSupabaseConfigured, supabase } from "./lib/supabase";
import { getMyProfile, type Profile } from "./lib/access";
import { AdminPanel, adminTabFromHash } from "./pages/AdminPanel";
import { AuthGate } from "./pages/MemberPages";
import { PortalApp } from "./portal/PortalApp";
import { LotusIcon } from "./pages/brand";
import {
  MESSAGE_MAX_LENGTH,
  WHATSAPP_DISPLAY,
  channelLink,
  contactEmail,
  whatsappLink,
  type ContactChannel,
  type ContactPayload,
} from "./lib/contact";

const categories = [
  {
    icon: Sparkles,
    title: "Descubrir los dones psíquicos",
    description: "Reconoce tus señales, explora tu sensibilidad y conócete mejor.",
    color: "rose",
  },
  {
    icon: BookOpen,
    title: "Aprender los fundamentos",
    description: "Conceptos, vocabulario, tipos, ética y discernimiento.",
    color: "terracotta",
  },
  {
    icon: Sprout,
    title: "Entrenamiento y desarrollo",
    description: "Ejercicios prácticos, prácticas semanales, diarios y seguimiento.",
    color: "olive",
  },
  {
    icon: Heart,
    title: "Bienestar y vida cotidiana",
    description: "Integra, establece límites y mantén el equilibrio emocional.",
    color: "gold",
  },
  {
    icon: GraduationCap,
    title: "Academia de cursos",
    description: "Programas por niveles, talleres, materiales y mentorías.",
    color: "mauve",
  },
  {
    icon: UsersRound,
    title: "Comunidad y acompañamiento",
    description: "Comparte, pregunta, recibe orientación y crece junto a otros.",
    color: "brown",
    href: "#comunidad",
  },
];

const courses = [
  {
    level: "Principiante",
    title: "Conociendo mi sensibilidad",
    description: "Aprende a identificar tus señales, explora tu intuición y comienza tu camino.",
    lessons: 4,
    duration: "3 h",
    image: "/course-sensibilidad.jpg",
    imageAlt: "Mujer con los ojos cerrados respirando al atardecer entre hojas de otoño",
  },
  {
    level: "Intermedio",
    title: "Desarrollo de la percepción",
    description: "Ejercicios prácticos para fortalecer tu intuición y ampliar tu percepción.",
    lessons: 6,
    duration: "5 h",
    image: "/course-percepcion.jpg",
    imageAlt: "Vela encendida junto a cristales y un diario al atardecer",
  },
  {
    level: "Avanzado",
    title: "Mediumnidad en la vida diaria",
    description: "Integra tus experiencias y aprende a mantener el equilibrio.",
    lessons: 8,
    duration: "7 h",
    image: "/course-mediumnidad.jpg",
    imageAlt: "Sendero iluminado por el sol entre árboles con hojas de otoño",
  },
];

const essence = [
  { icon: Flower2, title: "Autoconocimiento" },
  { icon: BookOpen, title: "Aprendizaje consciente" },
  { icon: HandHeart, title: "Acompañamiento cercano" },
];

function AboutPage() {
  return (
    <div className="about-page">
      <section className="about-main section-wrap">
        <figure className="about-photo">
          <img
            src="/conocenos-foto.jpg"
            alt="Aisha sonriendo entre hojas de otoño, con la mano sobre el corazón"
            fetchPriority="high"
          />
          <figcaption>
            <span>“Un espacio para descubrirte”</span>
            <Leaf size={22} strokeWidth={1.3} aria-hidden="true" />
          </figcaption>
        </figure>

        <div className="about-copy">
          <img className="about-logo" src="/aisha-logo.png" alt="Logo de Aisha, academia online de mediumnidad" />
          <h1>
            <span>Un viaje hacia tu interior,</span> <span>a tu propio ritmo</span>
          </h1>
          <span className="about-divider" aria-hidden="true" />
          <p>
            <strong>Hola, soy Aisha. Me alegra que estés aquí.</strong>
          </p>
          <p>
            Desde niña vivía experiencias que me costaba explicar. Veía figuras que reconocía como ángeles, personas que habían fallecido y maestros ascendidos. Cuando intenté contárselo a mis padres, se asustaron y dejé de hablar del tema con ellos.
          </p>
          <p>
            Con los años empecé a percibir con más intensidad lo que yo entendía como la energía de otras personas. A veces tenía impresiones sobre situaciones que estaban viviendo o que sentía que podían ocurrir. En ese momento aún no sabía cómo interpretar esas experiencias. Con el tiempo aprendí a reconocer algunas como clarividencia y canalización. Me daba miedo compartir lo que percibía porque podía equivocarme o decir algo que incomodara a alguien.
          </p>
          <p>
            Mi mudanza a Londres marcó un punto de inflexión. Allí decidí explorar mi sensibilidad con más calma y profundidad. Encontré personas que fueron mis maestras y maestros, y que me ayudaron a comprender algo que hoy guía mi práctica. Escuchar mi intuición también implica hacerme preguntas, reconocer mis límites y decidir con cuidado qué compartir.
          </p>
          <p>
            En ese camino aprendí a integrar la luz y la sombra, a reconocer tanto lo que me resulta fácil aceptar de mí como lo que me cuesta mirar. Esa práctica me ayuda a vivir con más coherencia entre lo que siento, lo que digo y lo que hago.
          </p>
          <p>
            Hoy acompaño a personas que desean explorar, desde una mirada espiritual, el vínculo que mantienen con sus seres queridos fallecidos. En algunas sesiones comparto lo que percibo como mensajes de esos seres queridos. Mi práctica también incluye la canalización de mensajes que asocio con los ángeles y con quienes llamo hermanos de las estrellas.
          </p>
          <h2 className="about-subtitle">¿Por qué creé la Academia Aisha?</h2>
          <p>
            Creé esta academia para ofrecer el espacio que me habría gustado encontrar cuando empecé a hacerme preguntas sobre mi sensibilidad. Aquí puedes aprender los fundamentos de la mediumnidad, explorar tu percepción con ejercicios guiados y practicar cómo escuchar tu intuición cuando el ruido mental dificulta distinguir lo que sientes.
          </p>
          <p>
            A lo largo de los cursos trabajamos el discernimiento, la ética y los límites personales. Son herramientas para explorar estas experiencias con respeto y llevar lo que aprendes a tu vida cotidiana.
          </p>
          <p>
            <strong>Puedes empezar por una pregunta, una práctica o la curiosidad que te trajo hasta aquí. En Aisha, puedes avanzar a tu propio ritmo.</strong>
          </p>
          <a className="button" href="#cursos">
            Conoce nuestros cursos <ArrowRight size={16} />
          </a>
        </div>
      </section>

      <section className="about-essence section-wrap" id="esencia">
        <h2>
          <Leaf className="about-essence-leaf" size={26} strokeWidth={1.2} aria-hidden="true" />
          <span>Un camino que recorremos contigo</span>
        </h2>
        <div className="about-cards">
          {essence.map(({ icon: Icon, title }) => (
            <article className="about-card" key={title}>
              <Icon size={46} strokeWidth={1} />
              <h3>{title}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="about-band">
        <p>
          <span className="about-band-line" aria-hidden="true" />
          <em>No necesitas tener todas las respuestas. Solo darte la oportunidad de comenzar.</em>
          <span className="about-band-line" aria-hidden="true" />
        </p>
      </section>
    </div>
  );
}

const contactSubjects = [
  "Información sobre cursos",
  "Desarrollo de la sensibilidad",
  "Mediumnidad y aprendizaje",
  "Soporte o acceso a la plataforma",
  "Otras consultas",
];

type ContactFields = ContactPayload & { privacy: boolean };
type ContactErrors = Partial<Record<keyof ContactFields, string>>;
type ContactStatus = "idle" | "opened";

const emptyContact: ContactFields = { name: "", email: "", subject: "", message: "", privacy: false };

function validateContact(values: ContactFields): ContactErrors {
  const errors: ContactErrors = {};
  if (!values.name.trim()) errors.name = "Cuéntanos cómo te llamas.";
  if (!values.email.trim()) errors.email = "Escribe tu correo electrónico para poder responderte.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) errors.email = "Revisa tu correo: parece que le falta algo.";
  if (!values.subject) errors.subject = "Elige el asunto de tu mensaje.";
  if (!values.message.trim()) errors.message = "Escribe tu mensaje, aunque sea breve.";
  if (!values.privacy) errors.privacy = "Necesitamos tu aceptación para poder responderte.";
  return errors;
}

function LeafDivider({ className }: { className?: string }) {
  return (
    <span className={`leaf-divider${className ? ` ${className}` : ""}`} aria-hidden="true">
      <Leaf size={18} strokeWidth={1.3} />
    </span>
  );
}

const TELEGRAM_URL = (import.meta.env.VITE_TELEGRAM_URL as string | undefined)?.trim() || "https://t.me/+-tRyfxE_UMlmYmY0";

function CommunityPage() {
  const [notice, setNotice] = useState(false);
  const networks = [
    { name: "Instagram", note: "Reflexiones y novedades", href: "https://www.instagram.com/diosa_aisha/", icon: <Instagram size={34} strokeWidth={1.6} /> },
    { name: "YouTube", note: "Videos guiados", href: "https://youtube.com/@diosa_aisha?si=vppX1qKN-0VMe3i4", icon: <Youtube size={38} strokeWidth={1.6} /> },
    {
      name: "TikTok",
      note: "Prácticas cortas",
      href: "https://www.tiktok.com/@aisha_diosa?_r=1&_t=ZG-9BIHHNIgnuS",
      icon: (
        <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor" aria-hidden="true">
          <path d="M19.6 6.7a5.2 5.2 0 0 1-3.2-1.1A5.2 5.2 0 0 1 14.6 2h-3.3v13.1a2.7 2.7 0 1 1-2.7-2.7c.3 0 .5 0 .8.1V9.1a6 6 0 1 0 5.2 5.9V8.8a8.4 8.4 0 0 0 4.9 1.6V7a5 5 0 0 1-.1-.3z" />
        </svg>
      ),
    },
  ];
  return (
    <div className="community-page">
      <section className="community-hero">
        <div className="community-hero-copy">
          <p className="eyebrow">ACADEMIA AISHA</p>
          <h1>Únete a la comunidad Aisha</h1>
          <p className="community-hero-lead">Un espacio para seguir creciendo en compañía</p>
          <p className="community-hero-text">
            Explorar tu sensibilidad y escuchar tu intuición puede abrir muchas preguntas. En la comunidad Aisha encontrarás reflexiones, pequeñas prácticas y novedades de la academia para acompañarte en ese camino, a tu propio ritmo.
          </p>
          {TELEGRAM_URL ? (
            <a className="community-cta" href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
              <Send size={26} aria-hidden="true" /> Unirme a la comunidad en Telegram
            </a>
          ) : (
            <button className="community-cta" type="button" onClick={() => setNotice(true)}>
              <Send size={26} aria-hidden="true" /> Unirme a la comunidad en Telegram
            </button>
          )}
          {notice && <p className="community-notice" role="status">Muy pronto compartiremos aquí el enlace a la comunidad en Telegram. Mientras tanto, síguenos en nuestras redes.</p>}
          <p className="community-also">También puedes encontrarnos en</p>
          <div className="community-networks">
            {networks.map((n) => (
              <a key={n.name} className="community-network" href={n.href} target="_blank" rel="noopener noreferrer" aria-label={n.name}>
                <span className="community-network-icon">{n.icon}</span>
                <span><strong>{n.name}</strong><small>{n.note}</small></span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function CoursesPage({ onView }: { onView: (title: string) => void }) {
  return (
    <div className="courses-page">
      <section className="courses-hero">
        <p className="eyebrow">TODOS LOS CURSOS</p>
        <h1>Encuentra tu próximo paso</h1>
        <p className="courses-hero-sub">Explora tu sensibilidad, escucha tu intuición y aprende a tu propio ritmo.</p>
      </section>
      <section className="courses-list section-wrap" aria-label="Cursos disponibles">
        {courses.map((course, index) => (
          <article className="courses-card" key={course.title}>
            <div className="courses-card-image">
              <img src={course.image} alt={course.imageAlt} loading={index === 0 ? "eager" : "lazy"} />
              {index === 0 && <span className="courses-card-tag">Ideal para empezar</span>}
            </div>
            <div className="courses-card-body">
              <h2>{course.title}</h2>
              <p>{course.description}</p>
              <p className="courses-card-meta">{course.level} · {course.lessons} clases · {course.duration}</p>
              <button className="courses-card-button" type="button" onClick={() => onView(course.title)}>Ver curso</button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function ContactPage() {
  const [values, setValues] = useState<ContactFields>(emptyContact);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<ContactStatus>("idle");
  const [channel, setChannel] = useState<ContactChannel>("email");
  const [prepared, setPrepared] = useState<ContactPayload | null>(null);
  const [trap, setTrap] = useState("");

  function update<K extends keyof ContactFields>(key: K, value: ContactFields[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function checkField(key: keyof ContactFields) {
    const message = validateContact(values)[key];
    setErrors((current) => ({ ...current, [key]: message }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const chosen: ContactChannel = submitter?.value === "whatsapp" ? "whatsapp" : "email";

    const found = validateContact(values);
    setErrors(found);
    const firstInvalid = (Object.keys(found) as (keyof ContactFields)[])[0];
    if (firstInvalid) {
      document.getElementById(`contact-${firstInvalid}`)?.focus();
      return;
    }

    // Bots fill hidden fields; humans never see this one.
    if (trap) return;

    const payload: ContactPayload = {
      name: values.name.trim(),
      email: values.email.trim(),
      subject: values.subject,
      message: values.message.trim(),
    };
    setPrepared(payload);
    setChannel(chosen);
    setStatus("opened");
    openChannel(chosen, payload);
  }

  function openChannel(target: ContactChannel, payload: ContactPayload) {
    const link = channelLink(target, payload);
    if (target === "whatsapp") window.open(link, "_blank", "noopener,noreferrer");
    else window.location.href = link;
  }

  function resetForm() {
    setValues(emptyContact);
    setErrors({});
    setPrepared(null);
    setStatus("idle");
  }

  const fieldProps = (key: keyof ContactFields) => ({
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `contact-${key}-error` : undefined,
  });
  const fieldError = (key: keyof ContactFields) =>
    errors[key] ? <p className="field-error" id={`contact-${key}-error`}>{errors[key]}</p> : null;

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <img
          src="/contact-hero.jpg"
          alt="Mujer serena con el rostro elevado hacia la luz dorada del atardecer, entre árboles de otoño"
          fetchPriority="high"
        />
        <div className="contact-hero-copy">
          <p className="eyebrow">Contáctanos</p>
          <LeafDivider />
          <h1>Estamos aquí<br />para ti</h1>
          <p className="contact-hero-sub">
            Si tienes alguna consulta, deseas más información sobre nuestros cursos o necesitas ayuda, escríbenos. Será un gusto acompañarte.
          </p>
        </div>
      </section>

      <section className="contact-main">
        <div className="contact-grid">
          <div className="contact-info">
            <h2>¿Tienes alguna pregunta?</h2>
            <p className="contact-lead">Será un placer ayudarte. Escríbenos y te responderemos a la brevedad.</p>

            <ul className="contact-blocks">
              <li>
                <img src="/contact-icon-mail.png" alt="" />
                <div>
                  <h3>Correo electrónico</h3>
                  {contactEmail ? (
                    <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                  ) : (
                    <span className="contact-placeholder">[correo por configurar]</span>
                  )}
                </div>
              </li>
              <li>
                <img src="/contact-icon-whatsapp.png" alt="" />
                <div>
                  <h3>WhatsApp</h3>
                  <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">{WHATSAPP_DISPLAY}</a>
                </div>
              </li>
              <li>
                <img src="/contact-icon-location.png" alt="" />
                <div>
                  <h3>Nuestra ubicación</h3>
                  <span>Atención online</span>
                </div>
              </li>
            </ul>

            <p className="contact-sign">
              Tu camino interior<br />también merece ser acompañado
            </p>
            <LeafDivider className="contact-sign-divider" />
          </div>

          <div className="contact-form-card">
            <img className="contact-form-leaves" src="/contact-leaves.jpg" alt="" loading="lazy" />
            {status === "opened" && prepared ? (
              <div className="contact-sent" role="status">
                <Flower2 size={56} strokeWidth={1.1} aria-hidden="true" />
                <h2>Tu mensaje está listo</h2>
                <p>
                  {channel === "email"
                    ? "Abrimos tu aplicación de correo con el mensaje ya escrito. Solo falta que pulses «Enviar» allí."
                    : "Abrimos WhatsApp con el mensaje ya escrito. Solo falta que pulses «Enviar» allí."}
                  {" "}Hasta entonces, el mensaje todavía no ha salido.
                </p>
                <p className="contact-sent-help">
                  ¿No se abrió?{" "}
                  <button type="button" className="link-button" onClick={() => openChannel(channel, prepared)}>Intentar de nuevo</button>
                  {channel === "email" ? (
                    <>
                      {" "}o escríbenos a <a href={`mailto:${contactEmail}`}>{contactEmail}</a>, o{" "}
                      <button type="button" className="link-button" onClick={() => openChannel("whatsapp", prepared)}>envíalo por WhatsApp</button>.
                    </>
                  ) : (
                    <>
                      {" "}o{" "}
                      <button type="button" className="link-button" onClick={() => openChannel("email", prepared)}>envíalo por correo</button>.
                    </>
                  )}
                </p>
                <button className="button button-outline" type="button" onClick={resetForm}>
                  Escribir otro mensaje
                </button>
              </div>
            ) : (
              <>
                <h2>Envíanos un mensaje</h2>
                <form className="contact-form" onSubmit={handleSubmit} noValidate>
                  <div className="field">
                    <label htmlFor="contact-name">Nombre completo</label>
                    <input
                      id="contact-name"
                      type="text"
                      autoComplete="name"
                      placeholder="¿Cómo te llamas?"
                      value={values.name}
                      onChange={(event) => update("name", event.target.value)}
                      onBlur={() => checkField("name")}
                      required
                      {...fieldProps("name")}
                    />
                    {fieldError("name")}
                  </div>
                  <div className="field">
                    <label htmlFor="contact-email">Correo electrónico</label>
                    <input
                      id="contact-email"
                      type="email"
                      autoComplete="email"
                      placeholder="tu@correo.com"
                      value={values.email}
                      onChange={(event) => update("email", event.target.value)}
                      onBlur={() => checkField("email")}
                      required
                      {...fieldProps("email")}
                    />
                    {fieldError("email")}
                  </div>
                  <div className="field field-wide">
                    <label htmlFor="contact-subject">Asunto</label>
                    <select
                      id="contact-subject"
                      value={values.subject}
                      onChange={(event) => update("subject", event.target.value)}
                      onBlur={() => checkField("subject")}
                      required
                      {...fieldProps("subject")}
                    >
                      <option value="" disabled>Selecciona un asunto</option>
                      {contactSubjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                    </select>
                    {fieldError("subject")}
                  </div>
                  <div className="field field-wide">
                    <label htmlFor="contact-message">Mensaje</label>
                    <textarea
                      id="contact-message"
                      rows={6}
                      maxLength={MESSAGE_MAX_LENGTH}
                      placeholder="Escribe con libertad, este es un espacio seguro."
                      value={values.message}
                      onChange={(event) => update("message", event.target.value)}
                      onBlur={() => checkField("message")}
                      required
                      {...fieldProps("message")}
                    />
                    {fieldError("message")}
                  </div>

                  <div className="field-wide contact-consent">
                    <div>
                      <input
                        id="contact-privacy"
                        type="checkbox"
                        checked={values.privacy}
                        onChange={(event) => update("privacy", event.target.checked)}
                        required
                        {...fieldProps("privacy")}
                      />
                      <label htmlFor="contact-privacy">
                        Acepto que usen mis datos para responderme. Se tratan con total confidencialidad.
                      </label>
                    </div>
                    {fieldError("privacy")}
                  </div>

                  <div className="contact-trap" aria-hidden="true">
                    <label htmlFor="contact-website">No completes este campo</label>
                    <input id="contact-website" type="text" tabIndex={-1} autoComplete="off" value={trap} onChange={(event) => setTrap(event.target.value)} />
                  </div>

                  <div className="field-wide contact-actions">
                    <button className="button" type="submit" name="channel" value="email">
                      Enviar por correo <Send size={16} aria-hidden="true" />
                    </button>
                    <button className="button button-whatsapp" type="submit" name="channel" value="whatsapp">
                      Enviar por WhatsApp <MessageCircle size={16} aria-hidden="true" />
                    </button>
                  </div>
                  <p className="field-wide contact-note">
                    Se abrirá tu aplicación de correo o WhatsApp con el mensaje ya escrito; el envío lo confirmas tú allí.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="contact-quote">
        <img src="/contact-quote.jpg" alt="Paisaje de montañas y bosque otoñal bajo la luz dorada del atardecer" loading="lazy" />
        <blockquote>
          <p>Todo gran cambio comienza<br />con una simple decisión:<br />la de escuchar tu voz interior.</p>
          <LeafDivider />
        </blockquote>
      </section>
    </div>
  );
}

type Route = "home" | "about" | "courses" | "community" | "contact" | "portal" | "admin";

// Earlier links (#mis-cursos, #curso/<slug>) now live inside Mi espacio.
function normalizeLegacyHash() {
  const hash = window.location.hash;
  if (hash === "#mis-cursos") window.location.replace("#mi-espacio/cursos");
  else if (hash.startsWith("#curso/")) window.location.replace("#mi-espacio/cursos/" + hash.slice("#curso/".length));
}

function getRoute(): Route {
  const hash = window.location.hash;
  if (hash === "#conocenos") return "about";
  if (hash === "#cursos") return "courses";
  if (hash === "#comunidad") return "community";
  if (hash === "#contacto") return "contact";
  if (hash === "#mi-espacio" || hash.startsWith("#mi-espacio/")) return "portal";
  if (hash === "#admin" || hash.startsWith("#admin/")) return "admin";
  return "home";
}

const RETURN_HASH_KEY = "aisha:return-hash";

// Google sends the visitor back with the failure in the query string or the hash.
function readAuthError(): string | null {
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const code = params.get("error_code") || hashParams.get("error_code") || params.get("error") || hashParams.get("error");
  const description = params.get("error_description") || hashParams.get("error_description");
  if (!code && !description) return null;
  if (code === "access_denied") return "Cancelaste el acceso con Google. Cuando quieras, inténtalo de nuevo.";
  return "No pudimos completar el acceso con Google. Inténtalo de nuevo en unos minutos.";
}

function userAvatar(session: Session): string | undefined {
  const meta = session.user.user_metadata;
  return meta.avatar_url || meta.picture || undefined;
}

function UserMenu({ session, isAdmin, onSignOut }: { session: Session; isAdmin: boolean; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const avatar = userAvatar(session);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="user-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menú de mi cuenta"
        onClick={() => setOpen(!open)}
      >
        {avatar ? <img className="user-avatar" src={avatar} alt="" referrerPolicy="no-referrer" /> : <UserRound size={22} aria-hidden="true" />}
        <span className="user-greeting">{session.user.user_metadata.full_name || session.user.email}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className="user-menu-panel" role="menu">
          <a role="menuitem" href="#mi-espacio" onClick={() => setOpen(false)}><GraduationCap size={16} aria-hidden="true" /> Mi espacio</a>
          {isAdmin && (
            <a role="menuitem" href="#admin/resumen" onClick={() => setOpen(false)}><ShieldCheck size={16} aria-hidden="true" /> Panel de administración</a>
          )}
          <button role="menuitem" type="button" onClick={() => { setOpen(false); onSignOut(); }}>Cerrar sesión</button>
        </div>
      )}
    </div>
  );
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authMessage, setAuthMessage] = useState(() => readAuthError() ?? "");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [route, setRoute] = useState<Route>(() => {
    normalizeLegacyHash();
    return getRoute();
  });
  const [hash, setHash] = useState(() => window.location.hash);
  const [authReady, setAuthReady] = useState(!supabase);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [profileFailed, setProfileFailed] = useState(false);
  const [profileTick, setProfileTick] = useState(0);

  useEffect(() => {
    const onHashChange = () => {
      normalizeLegacyHash();
      setRoute(getRoute());
      setHash(window.location.hash);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const id = window.location.hash.slice(1);
    const target = route === "home" && id ? document.getElementById(id) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [route]);

  useEffect(() => {
    if (window.location.search.includes("error") || window.location.hash.includes("error")) {
      window.history.replaceState(null, "", window.location.pathname + (window.location.hash.includes("error") ? "" : window.location.hash));
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    void supabase.auth.getSession().then(({ data, error }) => {
      setAuthReady(true);
      if (error) {
        setAuthMessage("No pudimos comprobar tu sesión. Inténtalo de nuevo.");
        return;
      }
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event !== "SIGNED_IN") return;
      try {
        const back = sessionStorage.getItem(RETURN_HASH_KEY);
        sessionStorage.removeItem(RETURN_HASH_KEY);
        if (back && back !== window.location.hash) window.location.hash = back;
      } catch {
        // sessionStorage can be blocked; the visitor simply stays where Google sent them.
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // The role comes from the server; the interface only uses it to decide what to show.
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setProfileReady(false);
      return;
    }
    let cancelled = false;
    setProfileReady(false);
    setProfileFailed(false);
    getMyProfile()
      .then((next) => {
        if (!cancelled) setProfile(next);
      })
      .catch(() => {
        if (!cancelled) {
          setProfile(null);
          setProfileFailed(true);
        }
      })
      .finally(() => {
        if (!cancelled) setProfileReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, profileTick]);

  async function signInWithGoogle() {
    setAuthMessage("");
    if (!supabase) {
      setAuthMessage("Configura las credenciales de Supabase en el archivo .env para activar el acceso con Google.");
      return;
    }
    if (isSigningIn) return;

    setIsSigningIn(true);
    const status = await checkGoogleSignIn();
    if (status !== "ready") {
      setAuthMessage(
        status === "provider-disabled"
          ? "El acceso con Google todavía no está activado. Inténtalo más tarde."
          : "No pudimos conectar con el servicio de acceso. Revisa tu conexión e inténtalo de nuevo."
      );
      setIsSigningIn(false);
      return;
    }

    try {
      sessionStorage.setItem(RETURN_HASH_KEY, window.location.hash);
    } catch {
      // Optional: without it the visitor lands on the home page after signing in.
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      setAuthMessage(`No pudimos iniciar sesión: ${error.message}`);
      setIsSigningIn(false);
    }
  }

  // Course and community calls to action: ask for Google first, then confirm once signed in.
  function handleInterest(message: string) {
    if (!session) {
      void signInWithGoogle();
      return;
    }
    setAuthMessage(message);
  }

  // The admin console replaces the public site chrome with its own sidebar and top bar.
  const portalShell = route === "portal" && authReady && Boolean(session);
  const adminShell = (route === "admin" && profileReady && profile?.role === "admin") || portalShell;

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) setAuthMessage(`No pudimos cerrar sesión: ${error.message}`);
    else setAuthMessage("");
  }

  return (
    <>
      {!adminShell && (
      <header className="site-header">
        <img className="header-leaf header-leaf-left" src="/leaf-corner.png" alt="" aria-hidden="true" />
        <a className="brand" href="#inicio" aria-label="AISHA, inicio">
          <span className="brand-mark">
            <LotusIcon />
          </span>
          <span className="brand-copy">
            <span className="brand-name">AISHA</span>
            <span className="brand-subtitle">Academia de mediumnidad</span>
          </span>
        </a>

        <button
          className="menu-toggle"
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className={`main-nav${menuOpen ? " is-open" : ""}`} aria-label="Navegación principal">
          <a className={route === "home" ? "active" : undefined} href="#inicio" onClick={() => setMenuOpen(false)}>Inicio</a>
          <a className={route === "about" ? "active" : undefined} href="#conocenos" onClick={() => setMenuOpen(false)}>Conócenos</a>
          <a className={route === "courses" ? "active" : undefined} href="#cursos" onClick={() => setMenuOpen(false)}>Cursos</a>
          <a className={route === "community" ? "active" : undefined} href="#comunidad" onClick={() => setMenuOpen(false)}>Comunidad</a>
          <a className={route === "contact" ? "active" : undefined} href="#contacto" onClick={() => setMenuOpen(false)}>Contacto</a>
        </nav>

        <div className="header-actions">
          {session ? (
            <UserMenu session={session} isAdmin={profile?.role === "admin"} onSignOut={signOut} />
          ) : (
            <button
              className="button button-small"
              onClick={signInWithGoogle}
              disabled={isSigningIn}
              type="button"
            >
              {isSigningIn ? "Conectando…" : "Iniciar sesión"}
            </button>
          )}
        </div>
      </header>
      )}

      {authMessage && (
        <div className="auth-notice" role="status" aria-live="polite">
          <span>{authMessage}</span>
          <button type="button" onClick={() => setAuthMessage("")} aria-label="Cerrar aviso">
            <X size={16} />
          </button>
        </div>
      )}

      <main>
        {route === "about" ? (
          <AboutPage />
        ) : route === "courses" ? (
          <CoursesPage onView={(title) => handleInterest(`Ya iniciaste sesión. Tus cursos con acceso están en «Mi espacio». Muy pronto podrás inscribirte en «${title}».`)} />
        ) : route === "community" ? (
          <CommunityPage />
        ) : route === "contact" ? (
          <ContactPage />
        ) : route === "portal" ? (
          <AuthGate ready={authReady} session={session} onSignIn={signInWithGoogle} isSigningIn={isSigningIn} title="Mi espacio Aisha">
            {session && (
              <PortalApp
                session={session}
                hash={hash}
                profileName={profile?.full_name ?? null}
                onNameChange={(name) => setProfile((current) => (current ? { ...current, full_name: name } : current))}
                onSignOut={signOut}
              />
            )}
          </AuthGate>
        ) : route === "admin" ? (
          <AuthGate ready={authReady} session={session} onSignIn={signInWithGoogle} isSigningIn={isSigningIn} title="Panel de administración">
            {!profileReady ? (
              <div className="member-page"><div className="member-wrap"><div className="state-box" role="status"><span className="spinner" aria-hidden="true" /> Cargando…</div></div></div>
            ) : profileFailed ? (
              <div className="member-page">
                <div className="member-wrap">
                  <div className="state-box state-error" role="alert">
                    <p>No pudimos comprobar tus permisos. Inténtalo de nuevo en unos minutos.</p>
                    <button className="button button-small button-outline" type="button" onClick={() => setProfileTick((value) => value + 1)}>Reintentar</button>
                  </div>
                </div>
              </div>
            ) : profile?.role === "admin" ? (
              session && <AdminPanel tab={adminTabFromHash(hash)} session={session} onSignOut={signOut} />
            ) : (
              <div className="member-page">
                <div className="member-wrap">
                  <div className="gate-card">
                    <ShieldCheck size={34} strokeWidth={1.4} aria-hidden="true" />
                    <h1>Solo para administración</h1>
                    <p>Tu cuenta no tiene permisos para entrar a esta sección.</p>
                    <a className="button" href="#mi-espacio">Ir a mi espacio</a>
                  </div>
                </div>
              </div>
            )}
          </AuthGate>
        ) : (
          <>
        <section className="hero" id="inicio">
          <img
            className="hero-banner"
            src="/hero-bg.jpg"
            alt="Atardecer otoñal entre montañas, con la fundadora de AISHA sonriendo"
            fetchPriority="high"
          />
          <div className="hero-copy">
            <p className="eyebrow">Academia online de mediumnidad</p>
            <h1>Descubre tu sensibilidad,<br />aprende a <em>comprenderla</em></h1>
            <p className="hero-description">
              Un espacio seguro y consciente para explorar tus dones psíquicos,
              desarrollar tu intuición y aprender a integrar la mediumnidad en tu vida.
            </p>
            <a className="button" href="#cursos">
              Explora nuestros cursos <ArrowRight size={16} />
            </a>
          </div>
        </section>

        <section className="categories section-wrap" id="nosotros">
          <div className="section-heading centered">
            <p className="eyebrow">Nuestras áreas de formación</p>
            <h2>Un camino completo para tu desarrollo</h2>
          </div>
          <div className="category-grid">
            {categories.map(({ icon: Icon, title, description, color, href }) => (
              <article className={`category-card ${color}`} key={title}>
                <span className="category-icon"><Icon size={29} strokeWidth={1.35} /></span>
                <h3>{title}</h3>
                <p>{description}</p>
                <a href={href ?? "#cursos"}>Saber más <ArrowRight size={13} /></a>
              </article>
            ))}
          </div>
        </section>

        <section className="featured-courses" id="cursos-destacados">
          <div className="courses-layout section-wrap">
            <div className="courses-intro">
              <p className="eyebrow">Cursos destacados</p>
              <h2>Tu formación,{" "}<br />paso a paso</h2>
              <p>
                Programas diseñados para acompañarte en cada etapa de tu camino.
                Desde los primeros pasos hasta un nivel avanzado de desarrollo.
              </p>
              <a className="button button-dark" href="#cursos">
                Ver todos los cursos <ArrowRight size={16} />
              </a>
            </div>
            <div className="course-grid" id="catalogo">
              {courses.map((course) => (
                <article className="course-card" key={course.title}>
                  <div className="course-image-wrap">
                    <img src={course.image} alt={course.imageAlt} loading="lazy" />
                    <span className="level-tag">{course.level}</span>
                  </div>
                  <div className="course-body">
                    <h3>{course.title}</h3>
                    <p>{course.description}</p>
                    <div className="course-meta">
                      <span><BookOpen size={14} /> {course.lessons} clases</span>
                      <span><Clock3 size={14} /> {course.duration}</span>
                    </div>
                    <button
                      className="course-link"
                      onClick={() => handleInterest(`Ya iniciaste sesión. Muy pronto podrás inscribirte en «${course.title}».`)}
                      type="button"
                    >
                      Me interesa <ArrowRight size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="testimonial" aria-label="Testimonio">
          <div className="testimonial-inner">
            <span className="quote-mark">“</span>
            <blockquote>
              Esta academia me ha dado herramientas reales para entender lo que siento
              y vivirlo con más calma y confianza. La forma en que explican todo es clara,
              cercana y muy respetuosa.
            </blockquote>
            <p className="quote-author">— Carolina R. —</p>
            <div className="quote-dots" aria-hidden="true"><span /><span /><span /></div>
          </div>
        </section>

        <section className="community-band" id="comunidad">
          <div className="community section-wrap">
          <div className="community-icon"><UsersRound size={38} strokeWidth={1.4} /></div>
          <div className="community-copy">
            <h2>Únete a nuestra comunidad</h2>
            <p>Comparte tu experiencia, haz preguntas, participa en encuentros en directo y forma parte de un espacio seguro y respetuoso.</p>
          </div>
          <a className="button" href="#comunidad">
            Quiero unirme <ArrowRight size={16} />
          </a>
        </div>
        </section>
          </>
        )}
      </main>

      {!adminShell && (
      <footer className="site-footer">
        <div className="footer-main section-wrap">
          <a className="footer-brand" href="#inicio">
            <span className="footer-logo"><LotusIcon /></span>
            <span>AISHA<small>Academia de mediumnidad</small></span>
          </a>
          <div className="footer-links">
            <a href="#inicio">Inicio</a>
            <a href="#conocenos">Conócenos</a>
            <a href="#cursos">Cursos</a>
          </div>
          <div className="footer-links">
            <a href="#comunidad">Comunidad</a>
            <a href="#contacto">Contacto</a>
          </div>
          <div className="footer-social">
            <span>Síguenos</span>
            <div className="social-icons" aria-label="Redes sociales">
              <a href="https://www.instagram.com/diosa_aisha/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">ig</a>
              <a href="https://facebook.com" aria-label="Facebook">f</a>
              <a href="https://youtube.com/@diosa_aisha?si=vppX1qKN-0VMe3i4" target="_blank" rel="noopener noreferrer" aria-label="YouTube">▶</a>
              <a href="https://www.tiktok.com/@aisha_diosa?_r=1&_t=ZG-9BIHHNIgnuS" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                  <path d="M19.6 6.7a5.2 5.2 0 0 1-3.2-1.1A5.2 5.2 0 0 1 14.6 2h-3.3v13.1a2.7 2.7 0 1 1-2.7-2.7c.3 0 .5 0 .8.1V9.1a6 6 0 1 0 5.2 5.9V8.8a8.4 8.4 0 0 0 4.9 1.6V7a5 5 0 0 1-.1-.3z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom section-wrap">
          <span>© 2026 AISHA. Todos los derechos reservados.</span>
          <span>Explora <b>·</b> Aprende <b>·</b> Transforma</span>
        </div>
      </footer>
      )}

      {!adminShell && (
      <a className="back-to-top" href="#inicio" aria-label="Volver al inicio">
        <ArrowUp size={17} />
      </a>
      )}
      <span className="sr-only">{isSupabaseConfigured ? "Supabase conectado" : "Supabase pendiente de configuración"}</span>
    </>
  );
}

export default App;
