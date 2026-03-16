import { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuthStore();

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.process-item, .manifesto-item').forEach(item => {
      observer.observe(item);
    });

    return () => observer.disconnect();
  }, []);

  // Parallax effect for the hero text
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const heroH1 = document.querySelector('.hero-h1') as HTMLElement;
      if (heroH1) {
        heroH1.style.transform = `translateY(${scrolled * 0.1}px)`;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Redirect admins to admin panel
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="pb-24">
      {/* Hero Section */}
      <section className="px-8 pt-32 pb-16 max-w-[1200px] mx-auto min-h-[85vh] flex flex-col justify-center">
        <p className="font-mono text-xl mb-8 opacity-0 animate-[fadeIn_1s_0.5s_ease-out_forwards] text-[var(--pigment-ochre)] uppercase tracking-widest">
          Farming that heals. Food that nourishes.
        </p>
        <h1 className="hero-h1 text-[clamp(2.5rem,8vw,7rem)] font-[900] leading-[0.9] text-[var(--pigment-green)] mb-12 animate-[slideUp_1s_ease-out_forwards]">
          Fresh from regenerative farms straight to your door.
        </h1>
        <div className="mt-8 animate-[fadeIn_1s_1s_ease-out_forwards] opacity-0 flex flex-wrap gap-6 items-center">
          <Link
            to="/products"
            className="inline-flex items-center gap-4 bg-[var(--pigment-green)] text-[var(--canvas)] px-10 py-5 font-bold uppercase tracking-[2px] -rotate-1 hover:rotate-0 hover:scale-105 transition-all shadow-xl hover:shadow-[var(--pigment-green)]/20"
          >
            Pre-order now <ArrowRight size={20} />
          </Link>
          <p className="font-mono text-sm max-w-[200px] opacity-60">
            orders open friday 9am — close monday 12pm
          </p>
        </div>
      </section>

      {/* Process Section */}
      <section className="px-8 py-32 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          {[
            { num: '01', title: "Whats growing", desc: "Each week we share what our partner farms are harvesting, keeping you connected to the rhythm of the seasons." },
            { num: '02', title: "Pre-order", desc: "Place your order within the week prior to delivery so the farmers harvest exactly whats needed. Zero excess." },
            { num: '03', title: "Harvest & pack", desc: "Produce is harvested at peak freshness and often on the same day. Packed with minimal, reusable materials." },
            { num: '04', title: "Collection or Delivery", desc: "WhatsApp messages will be sent out once your order has been packed for collection or delivery." },
          ].map((item, idx) => (
            <div key={idx} className="process-item relative p-10 border border-[var(--pigment-ochre)]/20 hover:border-[var(--pigment-ochre)] hover:bg-white/40 transition-all duration-500 opacity-0 translate-y-[40px] [&.visible]:opacity-100 [&.visible]:translate-y-0">
              <span className="font-mono text-[5rem] font-[900] text-[var(--pigment-ochre)] opacity-10 absolute -top-6 right-6">
                {item.num}
              </span>
              <h3 className="text-2xl font-bold mb-6 text-[var(--pigment-green)] uppercase tracking-tight">
                {item.title}
              </h3>
              <p className="leading-relaxed text-lg opacity-80">
                {item.desc}
              </p>
            </div>
          ))}

          <div className="lg:col-span-4 bg-[var(--pigment-oxide)] text-[var(--canvas)] p-12 mt-16 font-mono flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
            <div className="text-6xl font-black opacity-20">05</div>
            <div className="relative z-10">
              <strong className="text-2xl inline-block mb-3 tracking-tighter">FAIR ACCOUNTING</strong><br />
              <p className="text-lg opacity-90 max-w-[800px]">
                If produce is unavailable post-ordering, a credit will be allocated to your account instantly. Direct, transparent, and fair.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Manifesto Section */}
      <section className="px-8 py-40 bg-[var(--pigment-green)] text-[var(--canvas)] relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-white/5 blur-3xl rounded-full" />
        <div className="max-w-[1000px] mx-auto relative z-10">
          <h2 className="text-[clamp(2.5rem,6vw,4.5rem)] mb-16 leading-[1] pb-6 inline-block oxide-stroke">
            A BETTER WAY <br /> TO BUY PRODUCE
          </h2>
          <p className="text-2xl md:text-3xl mb-16 max-w-[850px] leading-relaxed font-light">
            Instead of produce sitting in a warehouse or on a shelf for days, we work directly with small farmers and harvest only what has already been ordered.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 mb-20">
            <ul className="space-y-6 font-mono text-lg">
              {[
                "Fresher food", "Less waste", "Fair trade",
                "Enriched soil", "Biodiversity", "Nutrient dense"
              ].map((benefit, idx) => (
                <li key={idx} className="flex items-center gap-4 manifesto-item opacity-0 translate-x-[-20px] [&.visible]:opacity-100 [&.visible]:translate-x-0 transition-all duration-500" style={{ transitionDelay: `${idx * 100}ms` }}>
                  <div className="w-2 h-2 rounded-full bg-[var(--pigment-ochre)]" />
                  {benefit}
                </li>
              ))}
            </ul>

            <div className="bg-white/5 p-10 border border-white/10 flex flex-col justify-center items-start">
              <h4 className="text-xl font-bold mb-4">JOIN THE HARVEST</h4>
              <p className="opacity-70 mb-8 font-mono text-sm">Be the first to know what's growing and support local food systems.</p>
              <Link to="/login" className="bg-[var(--pigment-oxide)] text-white px-8 py-3 font-bold uppercase tracking-widest hover:bg-white hover:text-[var(--pigment-green)] transition-colors">
                Community Access
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

