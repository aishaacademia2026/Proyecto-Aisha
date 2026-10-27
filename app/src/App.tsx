import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowRight,
  ArrowUp,
  BookOpen,
  Clock3,
  Flower2,
  GraduationCap,
  HandHeart,
  Heart,
  Leaf,
  Menu,
  Send,
  Sparkles,
  Sprout,
  UsersRound,
  X,
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import {
  ContactNotConfiguredError,
  WHATSAPP_DISPLAY,
  contactEmail,
  sendContactMessage,
  whatsappLink,
  whatsappMessage,
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

function LotusIcon() {
  return (
    <svg viewBox="0 0 64 54" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M32 4C25 13 24 26 32 39C40 26 39 13 32 4Z" />
      <path d="M32 39C24 36 17 28 16 16C25 18 31 26 32 39Z" />
      <path d="M32 39C40 36 47 28 48 16C39 18 33 26 32 39Z" />
      <path d="M32 40C22 40 11 35 6 24C16 23 26 28 32 40Z" />
      <path d="M32 40C42 40 53 35 58 24C48 23 38 28 32 40Z" />
      <path d="M32 41C25 45 15 46 8 42C16 39 26 38 32 41Z" />
      <path d="M32 41C39 45 49 46 56 42C48 39 38 38 32 41Z" />
    </svg>
  );
}

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
            Hay momentos en la vida en los que sentimos que queremos comprendernos mejor,
            escuchar nuestra intuición y descubrir esa sensibilidad que nos hace únicos.
          </p>
          <p>
            <strong>En Aisha, encontrarás un espacio para explorar, aprender y crecer desde el corazón.</strong>{" "}
            Te acompañamos en el camino de descubrir tu sensibilidad psíquica y acercarte a la
            mediumnidad a través de cursos, ejercicios prácticos y experiencias de aprendizaje,
            siempre desde el respeto, la conciencia y el equilibrio.
          </p>
          <a
            className="button"
            href="#esencia"
            onClick={(event) => {
              event.preventDefault();
              document.getElementById("esencia")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Conoce nuestra esencia <ArrowRight size={16} />
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
type ContactStatus = "idle" | "sending" | "sent" | "error";

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

function ContactPage() {
  const [values, setValues] = useState<ContactFields>(emptyContact);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<ContactStatus>("idle");
  const [fallbackOnly, setFallbackOnly] = useState(false);
  const [trap, setTrap] = useState("");

  function update<K extends keyof ContactFields>(key: K, value: ContactFields[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function checkField(key: keyof ContactFields) {
    const message = validateContact(values)[key];
    setErrors((current) => ({ ...current, [key]: message }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const found = validateContact(values);
    setErrors(found);
    const firstInvalid = (Object.keys(found) as (keyof ContactFields)[])[0];
    if (firstInvalid) {
      document.getElementById(`contact-${firstInvalid}`)?.focus();
      return;
    }

    // Bots fill hidden fields; humans never see this one.
    if (trap) {
      setStatus("sent");
      return;
    }

    setStatus("sending");
    setFallbackOnly(false);
    try {
      await sendContactMessage({
        name: values.name.trim(),
        email: values.email.trim(),
        subject: values.subject,
        message: values.message.trim(),
      });
      setStatus("sent");
    } catch (error) {
      setFallbackOnly(error instanceof ContactNotConfiguredError);
      setStatus("error");
    }
  }

  function resetForm() {
    setValues(emptyContact);
    setErrors({});
    setStatus("idle");
  }

  const sending = status === "sending";
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
            {status === "sent" ? (
              <div className="contact-sent" role="status">
                <Flower2 size={56} strokeWidth={1.1} aria-hidden="true" />
                <h2>Tu mensaje ha sido enviado</h2>
                <p>
                  Gracias por escribirnos. Te responderemos personalmente a la brevedad.
                  Mientras tanto, respira y date permiso para seguir explorando.
                </p>
                <button className="button button-outline" type="button" onClick={resetForm}>
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <>
                <h2>Envíanos un mensaje</h2>
                <form className="contact-form" onSubmit={handleSubmit} noValidate aria-busy={sending}>
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

                  {status === "error" && (
                    <div className="field-wide form-alert" role="alert">
                      <p>
                        {fallbackOnly
                          ? "El envío desde el formulario todavía no está activado, pero puedes escribirnos directamente por WhatsApp."
                          : "No pudimos enviar tu mensaje. Inténtalo de nuevo en unos minutos o escríbenos por WhatsApp."}
                      </p>
                      <a
                        href={whatsappLink(whatsappMessage({ name: values.name, email: values.email, subject: values.subject, message: values.message }))}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Escribir por WhatsApp
                      </a>
                    </div>
                  )}

                  <div className="field-wide contact-actions">
                    <button className="button" type="submit" disabled={sending}>
                      {sending ? "Enviando…" : "Enviar mensaje"} <Send size={16} aria-hidden="true" />
                    </button>
                  </div>
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

type Route = "home" | "about" | "contact";

function getRoute(): Route {
  if (window.location.hash === "#conocenos") return "about";
  if (window.location.hash === "#contacto") return "contact";
  return "home";
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authMessage, setAuthMessage] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [route, setRoute] = useState<Route>(getRoute);

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
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
    if (!supabase) return;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setAuthMessage("No pudimos comprobar tu sesión. Inténtalo de nuevo.");
        return;
      }
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    setAuthMessage("");
    if (!supabase) {
      setAuthMessage("Configura las credenciales de Supabase en el archivo .env para activar el acceso con Google.");
      return;
    }

    setIsSigningIn(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setAuthMessage(`No pudimos iniciar sesión: ${error.message}`);
      setIsSigningIn(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) setAuthMessage(`No pudimos cerrar sesión: ${error.message}`);
    else setAuthMessage("");
  }

  return (
    <>
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
          <a href="#cursos" onClick={() => setMenuOpen(false)}>Cursos</a>
          <a href="#comunidad" onClick={() => setMenuOpen(false)}>Comunidad</a>
          <a className={route === "contact" ? "active" : undefined} href="#contacto" onClick={() => setMenuOpen(false)}>Contacto</a>
        </nav>

        <div className="header-actions">
          {session ? (
            <div className="signed-in">
              <span className="user-greeting">
                {session.user.user_metadata.full_name || session.user.email}
              </span>
              <button className="button button-small button-outline" onClick={signOut} type="button">
                Cerrar sesión
              </button>
            </div>
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

      {authMessage && (
        <div className="auth-notice" role="status">
          <span>{authMessage}</span>
          <button type="button" onClick={() => setAuthMessage("")} aria-label="Cerrar aviso">
            <X size={16} />
          </button>
        </div>
      )}

      <main>
        {route === "about" ? (
          <AboutPage />
        ) : route === "contact" ? (
          <ContactPage />
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
            {categories.map(({ icon: Icon, title, description, color }) => (
              <article className={`category-card ${color}`} key={title}>
                <span className="category-icon"><Icon size={29} strokeWidth={1.35} /></span>
                <h3>{title}</h3>
                <p>{description}</p>
                <a href="#cursos">Saber más <ArrowRight size={13} /></a>
              </article>
            ))}
          </div>
        </section>

        <section className="featured-courses" id="cursos">
          <div className="courses-layout section-wrap">
            <div className="courses-intro">
              <p className="eyebrow">Cursos destacados</p>
              <h2>Tu formación,{" "}<br />paso a paso</h2>
              <p>
                Programas diseñados para acompañarte en cada etapa de tu camino.
                Desde los primeros pasos hasta un nivel avanzado de desarrollo.
              </p>
              <a className="button button-dark" href="#catalogo">
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
                    <button className="course-link" onClick={signInWithGoogle} type="button">
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
          <button className="button" onClick={signInWithGoogle} type="button">
            Quiero unirme <ArrowRight size={16} />
          </button>
        </div>
        </section>
          </>
        )}
      </main>

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
            <a href="#comunidad">Blog</a>
            <a href="#comunidad">Comunidad</a>
            <a href="#contacto">Contacto</a>
          </div>
          <div className="footer-social">
            <span>Síguenos</span>
            <div className="social-icons" aria-label="Redes sociales">
              <a href="https://www.instagram.com/diosa_aisha/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">ig</a>
              <a href="https://facebook.com" aria-label="Facebook">f</a>
              <a href="https://youtube.com/@diosa_aisha?si=vppX1qKN-0VMe3i4" target="_blank" rel="noopener noreferrer" aria-label="YouTube">▶</a>
              <a href="https://pinterest.com" aria-label="Pinterest">p</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom section-wrap">
          <span>© 2026 AISHA. Todos los derechos reservados.</span>
          <span>Explora <b>·</b> Aprende <b>·</b> Transforma</span>
        </div>
      </footer>

      <a className="back-to-top" href="#inicio" aria-label="Volver al inicio">
        <ArrowUp size={17} />
      </a>
      <span className="sr-only">{isSupabaseConfigured ? "Supabase conectado" : "Supabase pendiente de configuración"}</span>
    </>
  );
}

export default App;
