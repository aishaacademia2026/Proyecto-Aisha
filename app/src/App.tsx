import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowRight,
  ArrowUp,
  BookOpen,
  Clock3,
  Facebook,
  Flower2,
  GraduationCap,
  HandHeart,
  Heart,
  Instagram,
  Leaf,
  Menu,
  MessageCircle,
  Plus,
  Sparkles,
  Sprout,
  UsersRound,
  X,
  Youtube,
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "./lib/supabase";

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

const faqs = [
  {
    question: "¿Necesito experiencia previa para empezar?",
    answer: "No. Nuestros cursos de nivel inicial están pensados para quienes recién comienzan a reconocer su sensibilidad. Avanzas a tu propio ritmo.",
  },
  {
    question: "¿Cómo sé qué curso es el adecuado para mí?",
    answer: "Escríbenos contándonos un poco de tu experiencia y te orientaremos personalmente hacia el programa que mejor acompañe tu momento.",
  },
  {
    question: "¿Lo que comparto es confidencial?",
    answer: "Sí. Todo lo que nos cuentas se trata con respeto y discreción, y nunca se comparte con terceros.",
  },
];

const contactTopics = [
  "Quiero saber qué curso es para mí",
  "Dudas sobre inscripción y pagos",
  "Acompañamiento personal",
  "Comunidad y encuentros en directo",
  "Otro motivo",
];

const WHATSAPP_NUMBER = "447771620333";

function ContactPage() {
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = [
      `Hola, soy ${data.get("nombre")} (${data.get("email")}).`,
      `Motivo: ${data.get("motivo")}`,
      "",
      String(data.get("mensaje")),
    ].join("\n");
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    setSent(true);
  }

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="contact-hero-inner">
          <Leaf size={44} strokeWidth={1.2} aria-hidden="true" />
          <p className="eyebrow">Contacto</p>
          <h1>Hablemos, <em>sin prisa</em></h1>
          <span className="contact-divider" aria-hidden="true" />
          <p>
            Si tienes una duda sobre los cursos, quieres contarnos tu experiencia o simplemente no sabes
            por dónde empezar, escríbenos. Leemos cada mensaje con atención y te respondemos personalmente.
          </p>
        </div>
      </section>

      <section className="contact-main">
        <div className="contact-grid">
          <div className="contact-card contact-form-card">
            {sent ? (
              <div className="contact-sent" role="status">
                <Flower2 size={56} strokeWidth={1.1} aria-hidden="true" />
                <h2>Continúa en WhatsApp</h2>
                <p>
                  Abrimos WhatsApp con tu mensaje listo. Solo debes enviarlo y te responderemos
                  personalmente. Mientras tanto, respira y date permiso para seguir explorando.
                </p>
                <button className="button button-outline" type="button" onClick={() => setSent(false)}>
                  Escribir otro mensaje
                </button>
              </div>
            ) : (
              <>
                <h2>Escríbenos</h2>
                <p className="contact-lead">Cuéntanos lo que necesites. Tu mensaje se envía por WhatsApp y te respondemos personalmente.</p>
                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="field">
                    <label htmlFor="c-nombre">Nombre</label>
                    <input id="c-nombre" name="nombre" type="text" placeholder="¿Cómo te llamas?" required autoComplete="name" />
                  </div>
                  <div className="field">
                    <label htmlFor="c-email">Correo electrónico</label>
                    <input id="c-email" name="email" type="email" placeholder="tu@correo.com" required autoComplete="email" />
                  </div>
                  <div className="field field-wide">
                    <label htmlFor="c-motivo">¿Sobre qué quieres hablarnos?</label>
                    <select id="c-motivo" name="motivo" defaultValue={contactTopics[0]}>
                      {contactTopics.map((topic) => <option key={topic}>{topic}</option>)}
                    </select>
                  </div>
                  <div className="field field-wide">
                    <label htmlFor="c-mensaje">Tu mensaje</label>
                    <textarea id="c-mensaje" name="mensaje" rows={6} placeholder="Escribe con libertad, este es un espacio seguro." required />
                  </div>
                  <div className="field-wide contact-consent">
                    <input id="c-priv" type="checkbox" required />
                    <label htmlFor="c-priv">Acepto que usen estos datos para responderme. Se tratan con total confidencialidad.</label>
                  </div>
                  <div className="field-wide contact-actions">
                    <button className="button" type="submit">
                      Enviar mensaje <ArrowRight size={16} />
                    </button>
                    <span className="contact-thanks">Gracias por confiar en nosotras.</span>
                  </div>
                </form>
              </>
            )}
          </div>

          <aside className="contact-side">
            <figure className="contact-photo">
              <img src="/conocenos-foto.jpg" alt="Aisha sonriendo entre hojas de otoño" loading="lazy" />
              <figcaption>“Un espacio para escucharte”</figcaption>
            </figure>

            <div className="contact-card contact-ways">
              <h2>Otras formas de encontrarnos</h2>
              <div className="contact-way">
                <span className="contact-way-icon"><MessageCircle size={20} strokeWidth={1.6} aria-hidden="true" /></span>
                <div>
                  <span className="contact-way-label">WhatsApp</span>
                  <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">+44 7771 620333</a>
                </div>
              </div>
              <div className="contact-way">
                <span className="contact-way-icon"><Instagram size={20} strokeWidth={1.6} aria-hidden="true" /></span>
                <div>
                  <span className="contact-way-label">Instagram</span>
                  <a href="https://www.instagram.com/diosa_aisha/" target="_blank" rel="noopener noreferrer">@diosa_aisha</a>
                </div>
              </div>
              <hr />
              <div className="contact-follow">
                <span>Síguenos</span>
                <div>
                  <a href="https://www.instagram.com/diosa_aisha/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram size={18} strokeWidth={1.6} /></a>
                  <a href="https://youtube.com/@diosa_aisha?si=OSGcO77ZR7dFuqGw" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><Youtube size={18} strokeWidth={1.6} /></a>
                  <a href="https://facebook.com" aria-label="Facebook"><Facebook size={18} strokeWidth={1.6} /></a>
                </div>
              </div>
            </div>

            <div className="contact-notice">
              <Heart size={28} strokeWidth={1.5} aria-hidden="true" />
              <p>
                Si estás atravesando un momento difícil y necesitas ayuda inmediata, por favor contacta a un
                profesional de la salud o a los servicios de emergencia de tu país.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="contact-faq">
        <div className="contact-faq-inner">
          <div className="contact-faq-heading">
            <p className="eyebrow">Antes de escribir</p>
            <h2>Preguntas frecuentes</h2>
          </div>
          <div className="contact-faq-list">
            {faqs.map(({ question, answer }) => (
              <details key={question}>
                <summary>
                  <span>{question}</span>
                  <Plus className="faq-plus" size={22} strokeWidth={1.5} aria-hidden="true" />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="about-band">
        <p>
          <span className="about-band-line" aria-hidden="true" />
          <em>No necesitas tener todas las respuestas. Solo darte la oportunidad de preguntar.</em>
          <span className="about-band-line" aria-hidden="true" />
        </p>
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
              <a href="https://youtube.com/@diosa_aisha?si=OSGcO77ZR7dFuqGw" target="_blank" rel="noopener noreferrer" aria-label="YouTube">▶</a>
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
