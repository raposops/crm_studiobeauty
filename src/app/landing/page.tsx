'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Script from 'next/script';

const CTA_URL = 'https://crmstudio.fidustecnologia.com.br/cadastrar';

const benefits = [
  {
    icon: '📅',
    title: 'Agenda Online Inteligente',
    desc: 'Seus clientes agendam pelo celular 24h por dia, 7 dias por semana. Chega de telefone ocupado e cliente sem horário!',
  },
  {
    icon: '💬',
    title: 'WhatsApp Automático',
    desc: 'Confirmações, lembretes e cancelamentos enviados automaticamente. Reduza faltas em até 70% sem precisar fazer nada.',
  },
  {
    icon: '💰',
    title: 'Controle Financeiro Total',
    desc: 'Veja o faturamento do dia, da semana e do mês. Saiba exatamente quanto cada profissional trouxe para o caixa.',
  },
  {
    icon: '💇',
    title: 'Gestão de Profissionais',
    desc: 'Comissões calculadas automaticamente por serviço. Sem planilha, sem briga, sem erro.',
  },
  {
    icon: '📊',
    title: 'Relatórios que Falam por Si',
    desc: 'Quais serviços vendem mais? Quais clientes retornam? Tome decisões com dados reais do seu salão.',
  },
  {
    icon: '🚀',
    title: 'Começa Hoje, Sem Complicação',
    desc: 'Cadastro em 2 minutos. Sem técnico, sem treinamento longo, sem burocracia. Você já usa no primeiro dia.',
  },
];

const testimonials = [
  {
    name: 'Mariana Costa',
    role: 'Dona do Studio M, Porto Alegre',
    text: 'Em 3 semanas usando o sistema, meus clientes pararam de ligar para marcar horário. Simplesmente magico! Meu faturamento subiu 30%.',
    avatar: '👩',
  },
  {
    name: 'Fernanda Luz',
    role: 'Proprietaria do Salao Bella, Florianopolis',
    text: 'Antes eu perdia tempo com agenda em papel e faltas. Agora o sistema manda mensagem automatica e minhas profissionais recebem as comissoes direitinho.',
    avatar: '👩',
  },
  {
    name: 'Patricia Melo',
    role: 'Empreendedora, Curitiba',
    text: 'Achei que seria dificil de usar, mas configurei tudo sozinha em 1 hora. Hoje nao consigo imaginar meu salao sem o CRM Studio Beauty!',
    avatar: '👩',
  },
];

const steps = [
  { num: '1', title: 'Faca seu Cadastro', desc: 'Preencha seus dados em menos de 2 minutos. Simples assim.' },
  { num: '2', title: 'Configure seu Salao', desc: 'Adicione seus servicos, profissionais e horarios em uma tarde.' },
  { num: '3', title: 'Comece a Usar Hoje', desc: 'Compartilhe seu link de agendamento e veja os clientes chegando!' },
];

export default function LandingPage() {
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleScroll = () => setHeaderScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePlayVideo = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setVideoPlaying(true);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0510', color: 'white', overflowX: 'hidden', fontFamily: "'Poppins', 'Inter', system-ui, sans-serif" }}>
      {/* Facebook Pixel Code */}
      <Script id="facebook-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '27715847204764005');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img height="1" width="1" style={{ display: 'none' }} src="https://www.facebook.com/tr?id=27715847204764005&ev=PageView&noscript=1" alt="" />
      </noscript>
      {/* End Facebook Pixel Code */}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .lp-gradient-text {
          background: linear-gradient(135deg, #f472b6 0%, #a855f7 40%, #e879f9 70%, #fb7185 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .lp-gradient-gold {
          background: linear-gradient(135deg, #fbbf24, #f59e0b, #fde68a, #f59e0b);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .lp-btn {
          background: linear-gradient(135deg, #ec4899, #a855f7, #8b5cf6);
          border: none; cursor: pointer; transition: all 0.4s ease;
          position: relative; overflow: hidden; color: white; font-family: inherit;
          font-weight: 800; text-decoration: none; display: inline-block; text-align: center;
        }
        .lp-btn::before {
          content: ''; position: absolute; top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transition: left 0.6s ease;
        }
        .lp-btn:hover::before { left: 100%; }
        .lp-btn:hover { transform: translateY(-2px); box-shadow: 0 20px 40px rgba(168,85,247,0.5); }
        .lp-btn-outline {
          background: transparent; border: 2px solid rgba(244,114,182,0.6);
          cursor: pointer; transition: all 0.3s ease; color: white; font-family: inherit;
          font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 8px;
        }
        .lp-btn-outline:hover {
          border-color: #f472b6; background: rgba(244,114,182,0.1);
          transform: translateY(-2px); box-shadow: 0 10px 30px rgba(244,114,182,0.2);
        }
        .lp-card {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(244,114,182,0.15);
          backdrop-filter: blur(12px); transition: all 0.3s ease; border-radius: 20px;
        }
        .lp-card:hover {
          border-color: rgba(168,85,247,0.4); background: rgba(168,85,247,0.06);
          transform: translateY(-4px); box-shadow: 0 20px 40px rgba(168,85,247,0.15);
        }
        @keyframes lp-float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes lp-pulse-ring { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }
        @keyframes lp-scroll { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(8px); } }
        .lp-float { animation: lp-float 4s ease-in-out infinite; }
        .lp-pulse-ring { animation: lp-pulse-ring 2s ease-out infinite; position: absolute; width: 80px; height: 80px; border: 3px solid rgba(244,114,182,0.5); border-radius: 50%; }
        .lp-counter {
          font-size: 2.8rem; font-weight: 900;
          background: linear-gradient(135deg, #f472b6, #a855f7);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .lp-divider { background: linear-gradient(90deg, transparent, rgba(168,85,247,0.5), rgba(236,72,153,0.5), transparent); height: 1px; }
        @media (max-width: 768px) {
          .lp-desktop-nav { display: none !important; }
          .lp-hero-section { align-items: flex-start !important; padding-top: 120px !important; }
          .lp-hero-title { font-size: 2.2rem !important; }
          .lp-hero-sub { font-size: 0.95rem !important; }
          .lp-mockup-grid { grid-template-columns: 1fr !important; }
          .lp-cta-big { padding: 16px 32px !important; font-size: 1rem !important; }
        }
      `}</style>

      {/* HEADER */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: headerScrolled ? 'rgba(10,5,16,0.95)' : 'transparent',
        backdropFilter: headerScrolled ? 'blur(20px)' : 'none',
        borderBottom: headerScrolled ? '1px solid rgba(168,85,247,0.2)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #ec4899, #a855f7)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              ✂️
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1, color: 'white' }}>CRM Studio</p>
              <p style={{ fontSize: '0.65rem', color: '#f472b6', letterSpacing: '0.1em', fontWeight: 600 }}>BEAUTY</p>
            </div>
          </div>

          <nav className="lp-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 32, fontSize: '0.9rem' }}>
            <a href="#beneficios" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Benefícios</a>
            <a href="#como-funciona" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Como Funciona</a>
            <a href="#depoimentos" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Depoimentos</a>
            <a href="#planos" style={{ color: '#f472b6', fontWeight: 600, textDecoration: 'none' }}>Planos & Preços</a>
          </nav>

          <a href="#planos" className="lp-btn" style={{ padding: '10px 24px', borderRadius: 30, fontSize: '0.85rem' }}>
            Ver Planos 🚀
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="lp-hero-section" style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden', paddingTop: 80 }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <Image src="/images/landing_salon_bg.jpg" alt="Salao de beleza" fill style={{ objectFit: 'cover', objectPosition: 'center top' }} priority />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(10,5,16,0.55) 0%, rgba(10,5,16,0.25) 40%, rgba(10,5,16,0.88) 80%, #0a0510 100%)',
          }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(168,85,247,0.25) 0%, transparent 60%)' }} />
        </div>

        {/* Particles */}
        {[
          { w: 6, h: 6, bg: '#f472b6', t: '20%', l: '10%', delay: '0s', op: 0.6 },
          { w: 4, h: 4, bg: '#a855f7', t: '40%', l: '5%', delay: '1s', op: 0.5 },
          { w: 8, h: 8, bg: '#e879f9', t: '15%', r: '15%', delay: '2s', op: 0.4 },
          { w: 5, h: 5, bg: '#fb7185', t: '60%', r: '8%', delay: '0.5s', op: 0.5 },
        ].map((p, i) => (
          <div key={i} className="lp-float" style={{
            position: 'absolute', borderRadius: '50%', width: p.w, height: p.h,
            background: p.bg, top: p.t, left: (p as any).l, right: (p as any).r,
            animationDelay: p.delay, opacity: p.op,
          }} />
        ))}

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px', position: 'relative', zIndex: 10, width: '100%', textAlign: 'center' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)',
            borderRadius: 30, padding: '8px 20px', marginBottom: 32, backdropFilter: 'blur(10px)',
          }}>
            <span style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: 700, letterSpacing: '0.1em' }}>
              ✨ SISTEMA DE GESTÃO PARA SALÕES DE BELEZA
            </span>
          </div>

          <h1 className="lp-hero-title" style={{ fontSize: '3.8rem', fontWeight: 900, lineHeight: 1.1, marginBottom: 24, color: 'white' }}>
            Seu Salão no{' '}
            <span className="lp-gradient-text">Próximo Nível</span>
            <br />
            <span style={{ fontSize: '75%', fontWeight: 300, color: '#e2e8f0' }}>Comece Hoje, Sem Complicação</span>
          </h1>

          <p className="lp-hero-sub" style={{ fontSize: '1.2rem', color: '#cbd5e1', maxWidth: 680, margin: '0 auto 48px', lineHeight: 1.7 }}>
            O CRM Studio Beauty é o sistema completo que transforma a gestão do seu salão:
            {' '}<strong style={{ color: '#f472b6' }}>agenda online, WhatsApp automático, controle financeiro e muito mais</strong>.
            Tudo em um só lugar. Sem técnico. Sem treinamento. Você já usa hoje.
          </p>

          {/* Social proof avatars */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 44 }}>
            <div style={{ display: 'flex' }}>
              {['👩', '👩', '👩'].map((av, i) => (
                <div key={i} style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ec4899, #a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.3rem', border: '2px solid #0a0510', marginLeft: i > 0 ? -12 : 0,
                }}>{av}</div>
              ))}
            </div>
            <p style={{ fontSize: '0.92rem', color: '#94a3b8' }}>
              <strong style={{ color: '#f472b6' }}>+500 salões</strong> já automatizaram sua gestão
            </p>
          </div>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            <a href={CTA_URL} className="lp-btn" style={{ padding: '18px 44px', borderRadius: 50, fontSize: '1.1rem', boxShadow: '0 20px 40px rgba(168,85,247,0.4)' }}>
              🚀 Quero Começar Agora
            </a>
            <a href="#vsl" className="lp-btn-outline" style={{ padding: '18px 40px', borderRadius: 50, fontSize: '1rem' }}>
              ▶ Assistir Apresentação
            </a>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#475569' }}>
            Sem fidelidade &nbsp;|&nbsp; Cancele quando quiser &nbsp;|&nbsp; Suporte incluso
          </p>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: '0.65rem', color: '#64748b', letterSpacing: '0.15em' }}>ROLE PARA VER</p>
          <div style={{ width: 24, height: 40, border: '2px solid rgba(168,85,247,0.4)', borderRadius: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 4 }}>
            <div style={{ width: 4, height: 10, background: '#a855f7', borderRadius: 2, animation: 'lp-scroll 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(236,72,153,0.1))', borderTop: '1px solid rgba(168,85,247,0.2)', borderBottom: '1px solid rgba(168,85,247,0.2)', padding: '40px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, textAlign: 'center' }}>
          {[
            { num: '+500', label: 'Saloes Ativos' },
            { num: '70%', label: 'Reducao de Faltas' },
            { num: '2min', label: 'Para Cadastrar' },
            { num: '24/7', label: 'Agendamento Online' },
          ].map((stat, i) => (
            <div key={i}>
              <p className="lp-counter">{stat.num}</p>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: 4 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VSL */}
      <section id="vsl" style={{ padding: '100px 24px', background: '#0a0510' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ color: '#f472b6', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.85rem', marginBottom: 12 }}>
              📹 APRESENTAÇÃO DO SISTEMA
            </p>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: 1.2, marginBottom: 16, color: 'white' }}>
              Veja como é{' '}<span className="lp-gradient-text">simples e poderoso</span>
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
              Entenda por que centenas de salões escolheram o CRM Studio Beauty
            </p>
          </div>

          {/* Video container */}
          <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(168,85,247,0.3)', background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(236,72,153,0.1))', boxShadow: '0 40px 80px rgba(168,85,247,0.3)' }}>
            <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#0d0717' }}>
              {/* VIDEO - coloque seu video em public/videos/vsl.mp4 */}
              <video
                ref={videoRef}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                controls
                poster="/images/landing_salon_bg.jpg"
                preload="metadata"
              >
                <source src="/videos/vsl.mp4" type="video/mp4" />
                Seu navegador nao suporta video.
              </video>

              {!videoPlaying && (
                <div
                  onClick={handlePlayVideo}
                  style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    background: 'rgba(10,5,16,0.5)', backdropFilter: 'blur(2px)',
                  }}
                >
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80 }}>
                    <div className="lp-pulse-ring" />
                    <div className="lp-pulse-ring" style={{ animationDelay: '0.5s' }} />
                    <div style={{
                      width: 80, height: 80, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ec4899, #a855f7)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 40px rgba(168,85,247,0.6)', position: 'relative', zIndex: 10,
                    }}>
                      <span style={{ fontSize: 28, marginLeft: 6 }}>▶</span>
                    </div>
                  </div>
                  <p style={{ marginTop: 24, fontWeight: 700, fontSize: '1.1rem', color: '#e2e8f0' }}>
                    Clique para assistir a apresentacao
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 6 }}>Aprox. 5 minutos</p>
                </div>
              )}
            </div>
          </div>

          {/* Post-VSL CTA */}
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <p style={{ color: '#f472b6', fontWeight: 600, marginBottom: 20, fontSize: '1.1rem' }}>
              Como o video falou — clique no botao abaixo e comece agora!
            </p>
            <a href={CTA_URL} className="lp-btn lp-cta-big" style={{ padding: '22px 60px', borderRadius: 50, fontSize: '1.2rem', boxShadow: '0 20px 50px rgba(236,72,153,0.5)' }}>
              Quero Meu Acesso Agora — E Rápido!
            </a>
            <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: 12 }}>
              Pagamento seguro pelo Asaas &nbsp;|&nbsp; Acesso imediato após confirmação
            </p>
          </div>
        </div>
      </section>

      <div className="lp-divider" style={{ maxWidth: '80%', margin: '0 auto' }} />

      {/* BENEFITS */}
      <section id="beneficios" style={{ padding: '100px 24px', background: 'linear-gradient(180deg, #0a0510 0%, #0e0820 100%)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ color: '#f472b6', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.85rem', marginBottom: 12 }}>
              BENEFICIOS EXCLUSIVOS
            </p>
            <h2 style={{ fontSize: '2.6rem', fontWeight: 800, lineHeight: 1.2, marginBottom: 20, color: 'white' }}>
              Tudo que seu salão precisa{' '}
              <span className="lp-gradient-text">em um so sistema</span>
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: 560, margin: '0 auto' }}>
              Esqueça as planilhas, os cadernos e o WhatsApp sobrecarregado. O CRM Studio Beauty faz tudo por você.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {benefits.map((b, i) => (
              <div key={i} className="lp-card" style={{ padding: '32px 28px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: 'radial-gradient(circle, rgba(168,85,247,0.15), transparent)', borderRadius: '50%' }} />
                <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>{b.icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 10, color: '#f1f5f9' }}>{b.title}</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: 1.7 }}>{b.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 64 }}>
            <a href={CTA_URL} className="lp-btn" style={{ padding: '18px 48px', borderRadius: 50, fontSize: '1.05rem' }}>
              Quero Todos Esses Benefícios
            </a>
          </div>
        </div>
      </section>

      {/* APP MOCKUP */}
      <section style={{ padding: '80px 24px', background: '#0e0820' }}>
        <div className="lp-mockup-grid" style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <p style={{ color: '#f472b6', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.85rem', marginBottom: 12 }}>
              DISPONIVEL EM TODOS OS DISPOSITIVOS
            </p>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.2, marginBottom: 24, color: 'white' }}>
              Gerencie seu salao de{' '}
              <span className="lp-gradient-text">qualquer lugar</span>
            </h2>
            <p style={{ color: '#94a3b8', lineHeight: 1.8, marginBottom: 32 }}>
              Smartphone, tablet ou computador. O sistema funciona perfeitamente em qualquer dispositivo.
              Veja em tempo real os agendamentos, o caixa e os clientes onde voce estiver.
            </p>
            {[
              'Link de agendamento personalizado para seu salao',
              'Notificacoes em tempo real no WhatsApp',
              'Dashboard com faturamento do dia',
              'Relatorio de comissoes por profissional',
              'Historico completo de cada cliente',
            ].map((item, i) => (
              <p key={i} style={{ color: '#cbd5e1', fontSize: '0.95rem', marginBottom: 12 }}>✅ {item}</p>
            ))}
            <a href={CTA_URL} className="lp-btn" style={{ marginTop: 24, padding: '16px 40px', borderRadius: 50, fontSize: '1rem', display: 'inline-block' }}>
              🚀 Começar Agora
            </a>
          </div>
          <div className="lp-float" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '10%', background: 'radial-gradient(ellipse, rgba(168,85,247,0.3), transparent)', filter: 'blur(40px)' }} />
            <Image
              src="/images/landing_mockup.jpg"
              alt="App CRM Studio Beauty"
              width={600} height={450}
              style={{ width: '100%', height: 'auto', borderRadius: 24, position: 'relative', zIndex: 1, boxShadow: '0 30px 80px rgba(168,85,247,0.35)' }}
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" style={{ padding: '100px 24px', background: '#0a0510' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ color: '#f472b6', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.85rem', marginBottom: 12 }}>
              SIMPLES ASSIM
            </p>
            <h2 style={{ fontSize: '2.6rem', fontWeight: 800, lineHeight: 1.2, marginBottom: 16, color: 'white' }}>
              Comece a usar em{' '}
              <span className="lp-gradient-text">3 passos</span>
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
              Sem tecnico. Sem instalacao. Sem treinamento longo. So voce e o sistema.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 32 }}>
            {steps.map((step, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ec4899, #a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.8rem', fontWeight: 900, margin: '0 auto 20px',
                  boxShadow: '0 0 30px rgba(168,85,247,0.5)', color: 'white',
                }}>
                  {step.num}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 10, color: 'white' }}>{step.title}</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
          {/* Tutorial Video */}
          <div style={{ marginTop: 48, position: 'relative', borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(168,85,247,0.3)', background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(236,72,153,0.1))', boxShadow: '0 40px 80px rgba(168,85,247,0.3)' }}>
            <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#0d0717' }}>
              <video
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                controls
                preload="metadata"
              >
                <source src="/videos/passo_a_passo.mp4" type="video/mp4" />
                Seu navegador não suporta vídeo.
              </video>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 56 }}>
            <a href={CTA_URL} className="lp-btn lp-cta-big" style={{ padding: '20px 56px', borderRadius: 50, fontSize: '1.1rem', boxShadow: '0 20px 50px rgba(168,85,247,0.4)' }}>
              Quero Começar em 2 Minutos
            </a>
            <p style={{ color: '#475569', fontSize: '0.8rem', marginTop: 12 }}>
              Seus dados protegidos &nbsp;|&nbsp; Funciona no celular &nbsp;|&nbsp; Pagamento seguro
            </p>
          </div>
        </div>
      </section>

      <div className="lp-divider" style={{ maxWidth: '80%', margin: '0 auto' }} />

      {/* TESTIMONIALS */}
      <section id="depoimentos" style={{ padding: '100px 24px', background: 'linear-gradient(180deg, #0a0510 0%, #0e0820 100%)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ color: '#f472b6', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.85rem', marginBottom: 12 }}>
              DEPOIMENTOS REAIS
            </p>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: 1.2, color: 'white' }}>
              Quem já usa,{' '}
              <span className="lp-gradient-text">nao volta atras</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {testimonials.map((t, i) => (
              <div key={i} className="lp-card" style={{ padding: '32px 28px' }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  {[...Array(5)].map((_, s) => (
                    <span key={s} style={{ color: '#fbbf24', fontSize: '1rem' }}>⭐</span>
                  ))}
                </div>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.8, marginBottom: 24, fontStyle: 'italic' }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #ec4899, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'white' }}>{t.name}</p>
                    <p style={{ color: '#64748b', fontSize: '0.8rem' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING CTA */}
      <section id="planos" style={{ padding: '100px 24px', background: 'linear-gradient(180deg, #0a0510 0%, #0f0724 50%, #0a0510 100%)', borderTop: '1px solid rgba(168,85,247,0.2)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ display: 'inline-block', padding: '8px 24px', borderRadius: 30, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', marginBottom: 20 }}>
              <span className="lp-gradient-gold" style={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.08em' }}>
                💎 PLANOS & PREÇOS TRANSPARENTES
              </span>
            </div>

            <h2 style={{ fontSize: '2.8rem', fontWeight: 900, lineHeight: 1.15, marginBottom: 16, color: 'white' }}>
              Escolha o plano ideal para o <span className="lp-gradient-text">seu salão</span>
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: 620, margin: '0 auto' }}>
              Comece hoje com liberação imediata. Sem taxa de implantação, sem letras miúdas e sem fidelidade.
            </p>
          </div>

          {/* Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, alignItems: 'stretch', marginBottom: 56 }}>
            
            {/* PLANO BÁSICO */}
            <div className="lp-plan-card" style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(244,114,182,0.2)',
              borderRadius: 28,
              padding: '40px 32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              backdropFilter: 'blur(12px)',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: '#cbd5e1', background: 'rgba(255,255,255,0.08)', padding: '4px 12px', borderRadius: 20 }}>
                    ESSENCIAL
                  </span>
                </div>

                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>
                  Plano Básico
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 24 }}>
                  Ideal para autônomos e pequenos salões que desejam automatizar agendamentos e atendimento no WhatsApp.
                </p>

                <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: '1.2rem', color: '#94a3b8', fontWeight: 600 }}>R$</span>
                    <span style={{ fontSize: '3.2rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>49,99</span>
                    <span style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 500 }}>/mês</span>
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 8 }}>
                    Sem fidelidade • Cancele quando quiser
                  </p>
                </div>

                {/* Features List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f472b6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    O que você recebe:
                  </p>
                  {[
                    { title: 'Agenda Online Inteligente 24h', desc: 'Link personalizado para clientes agendarem sozinhos' },
                    { title: 'WhatsApp Automático', desc: 'Confirmações e lembretes para zerar faltas' },
                    { title: 'Gestão de Profissionais', desc: 'Comissões customizadas calculadas automaticamente' },
                    { title: 'Cadastro de Clientes', desc: 'Histórico de atendimentos e preferências' },
                    { title: 'Relatórios de Faturamento', desc: 'Acompanhe vendas e receitas do salão' },
                    { title: 'Multiplataforma', desc: 'Acesse pelo celular, tablet ou computador' },
                    { title: 'Suporte por WhatsApp', desc: 'Atendimento humanizado para tirar dúvidas' },
                  ].map((feat, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(168,85,247,0.25)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0, marginTop: 2 }}>
                        ✓
                      </div>
                      <div>
                        <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f1f5f9' }}>{feat.title}</p>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <a
                  href="/cadastrar?plano=basico"
                  className="lp-btn-outline"
                  style={{ width: '100%', padding: '16px 24px', borderRadius: 50, fontSize: '1rem', justifyContent: 'center', textAlign: 'center' }}
                >
                  Começar no Plano Básico
                </a>
              </div>
            </div>

            {/* PLANO PRO COMPLETO */}
            <div className="lp-plan-card" style={{
              background: 'linear-gradient(180deg, rgba(168,85,247,0.14) 0%, rgba(236,72,153,0.1) 100%), rgba(20,10,35,0.85)',
              border: '2px solid rgba(236,72,153,0.6)',
              borderRadius: 28,
              padding: '40px 32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow: '0 25px 60px rgba(168,85,247,0.3)',
              backdropFilter: 'blur(16px)',
            }}>
              {/* Badge Top */}
              <div style={{
                position: 'absolute',
                top: -14,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                padding: '6px 20px',
                borderRadius: 20,
                boxShadow: '0 8px 20px rgba(236,72,153,0.5)',
                whiteSpace: 'nowrap',
              }}>
                🔥 MAIS ESCOLHIDO • COMPLETO
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: '#f472b6', background: 'rgba(236,72,153,0.15)', padding: '4px 12px', borderRadius: 20 }}>
                    GESTÃO TOTAL
                  </span>
                </div>

                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>
                  Plano PRO <span className="lp-gradient-text">Completo</span>
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 24 }}>
                  Tudo o que seu salão precisa: automação, fluxo de caixa financeiro completo e gráficos executivos.
                </p>

                <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: '1.2rem', color: '#f472b6', fontWeight: 600 }}>R$</span>
                    <span style={{ fontSize: '3.4rem', fontWeight: 900, background: 'linear-gradient(135deg, #f472b6, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>
                      69,90
                    </span>
                    <span style={{ color: '#cbd5e1', fontSize: '1rem', fontWeight: 500 }}>/mês</span>
                  </div>
                  <p style={{ color: '#a855f7', fontSize: '0.8rem', marginTop: 8, fontWeight: 600 }}>
                    ✨ Melhor custo-benefício • Acesso total e imediato
                  </p>
                </div>

                {/* Features List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f472b6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Tudo do Básico + Recursos Exclusivos:
                  </p>
                  {[
                    { title: 'Tudo do Plano Básico incluso', desc: 'Agenda, WhatsApp, Profissionais e Clientes', highlight: true },
                    { title: 'Fluxo de Caixa Completo', desc: 'Controle de despesas fixas (aluguel, contas, insumos)', highlight: true },
                    { title: 'Lançamentos Avulsos Diários', desc: 'Registro manual de entradas e saídas extras no caixa', highlight: true },
                    { title: 'Relatórios Financeiros Avançados', desc: 'Métricas de lucratividade, ticket médio e gráficos', highlight: true },
                    { title: 'Controle de Formas de Pagamento', desc: 'PIX, Cartão, Dinheiro e Saldo/Crédito de clientes', highlight: false },
                    { title: 'Suporte Prioritário VIP', desc: 'Atendimento prioritário via WhatsApp', highlight: true },
                    { title: 'Atualizações Gratuitas Contínuas', desc: 'Novas funcionalidades liberadas em primeira mão', highlight: false },
                  ].map((feat, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: feat.highlight ? 'linear-gradient(135deg, #ec4899, #a855f7)' : 'rgba(168,85,247,0.3)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        flexShrink: 0,
                        marginTop: 2,
                        boxShadow: feat.highlight ? '0 0 10px rgba(236,72,153,0.5)' : 'none',
                      }}>
                        ✓
                      </div>
                      <div>
                        <p style={{ fontSize: '0.95rem', fontWeight: feat.highlight ? 700 : 600, color: feat.highlight ? '#ffffff' : '#f1f5f9' }}>
                          {feat.title}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: feat.highlight ? '#cbd5e1' : '#94a3b8' }}>{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <a
                  href="/cadastrar?plano=pro"
                  className="lp-btn lp-cta-big"
                  style={{
                    width: '100%',
                    padding: '18px 24px',
                    borderRadius: 50,
                    fontSize: '1.05rem',
                    boxShadow: '0 15px 35px rgba(236,72,153,0.5)',
                    display: 'block',
                    textAlign: 'center',
                  }}
                >
                  🚀 Quero o Plano PRO Completo
                </a>
              </div>
            </div>

          </div>

          {/* Trust badges footer */}
          <div style={{ textAlign: 'center', borderTop: '1px solid rgba(168,85,247,0.15)', paddingTop: 40 }}>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: 24 }}>
              🔒 Pagamento 100% seguro processado pelo Asaas • Ativação automática e imediata
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
              {[
                { icon: '🔒', text: 'Pagamento Seguro via PIX / Cartão' },
                { icon: '⚡', text: 'Acesso Imediato sem Espera' },
                { icon: '🎧', text: 'Suporte Humanizado por WhatsApp' },
                { icon: '❌', text: 'Sem Fidelidade — Cancele Quando Quiser' },
              ].map((g, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', padding: '8px 16px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '1.1rem' }}>{g.icon}</span>
                  <span style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 500 }}>{g.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FLOATING CTA BAR */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        padding: '16px 24px', background: 'rgba(10,5,16,0.97)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(168,85,247,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <div>
          <p style={{ color: '#f472b6', fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.2 }}>Comece hoje!</p>
          <p style={{ color: '#64748b', fontSize: '0.75rem' }}>Sem tecnico, sem espera ✨</p>
        </div>
        <a href={CTA_URL} className="lp-btn" style={{ padding: '14px 28px', borderRadius: 30, fontSize: '0.9rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
          🚀 Quero Agora
        </a>
      </div>

      {/* FOOTER */}
      <footer style={{ background: '#060310', borderTop: '1px solid rgba(168,85,247,0.15)', padding: '48px 24px 120px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #ec4899, #a855f7)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            ✂️
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontWeight: 800, lineHeight: 1, color: '#f1f5f9' }}>CRM Studio Beauty</p>
            <p style={{ fontSize: '0.65rem', color: '#f472b6', letterSpacing: '0.1em' }}>GESTAO INTELIGENTE PARA SALOES</p>
          </div>
        </div>
        <p style={{ color: '#334155', fontSize: '0.85rem', marginBottom: 8 }}>
          &copy; 2026 CRM Studio Beauty — Todos os direitos reservados
        </p>
        <p style={{ color: '#1e293b', fontSize: '0.75rem' }}>
          Desenvolvido por{' '}
          <a href="https://fidustecnologia.com.br" style={{ color: '#a855f7', textDecoration: 'none' }}>
            Fidus Tecnologia
          </a>
        </p>
      </footer>
    </div>
  );
}
