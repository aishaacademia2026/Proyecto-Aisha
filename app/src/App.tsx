import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowRight,
  ArrowUp,
  BookOpen,
  Clock3,
  GraduationCap,
  Heart,
  Menu,
  Sparkles,
  Sprout,
  UsersRound,
  X,
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
    image:
      "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Vela encendida en un espacio tranquilo",
  },
  {
    level: "Avanzado",
    title: "Mediumnidad en la vida diaria",
    description: "Integra tus experiencias y aprende a mantener el equilibrio.",
    lessons: 8,
    duration: "7 h",
    image:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Sendero rodeado de árboles en tonos otoñales",
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

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authMessage, setAuthMessage] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
          <a className="active" href="#inicio" onClick={() => setMenuOpen(false)}>Inicio</a>
          <a href="#nosotros" onClick={() => setMenuOpen(false)}>Nosotros</a>
          <a href="#cursos" onClick={() => setMenuOpen(false)}>Cursos</a>
          <a href="#comunidad" onClick={() => setMenuOpen(false)}>Comunidad</a>
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
              <h2>Tu formación,<br />paso a paso</h2>
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
      </main>

      <footer className="site-footer">
        <div className="footer-main section-wrap">
          <a className="footer-brand" href="#inicio">
            <span className="footer-logo"><LotusIcon /></span>
            <span>AISHA<small>Academia de mediumnidad</small></span>
          </a>
          <div className="footer-links">
            <a href="#inicio">Inicio</a>
            <a href="#nosotros">Nosotros</a>
            <a href="#cursos">Cursos</a>
          </div>
          <div className="footer-links">
            <a href="#comunidad">Blog</a>
            <a href="#comunidad">Comunidad</a>
            <a href="#comunidad">Contacto</a>
          </div>
          <div className="footer-social">
            <span>Síguenos</span>
            <div className="social-icons" aria-label="Redes sociales">
              <a href="https://instagram.com" aria-label="Instagram">ig</a>
              <a href="https://facebook.com" aria-label="Facebook">f</a>
              <a href="https://youtube.com" aria-label="YouTube">▶</a>
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
