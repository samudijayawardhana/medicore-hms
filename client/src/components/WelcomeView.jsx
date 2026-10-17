import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Stethoscope,
  FlaskConical,
  Pill,
  CreditCard,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import './WelcomeView.css';

export default function WelcomeView({ onNavigateToLogin }) {
  // Photos collection: Hospital Exterior, Reception Lobby, Clinical Care Specialists
  const slides = [
    {
      image: '/welcome/exterior_hospital.jpg',
      title: 'Hospital Infrastructure',
      subtitle: 'Modern 24/7 emergency & specialized care units',
      tag: 'Hospital Exterior'
    },
    {
      image: '/welcome/reception_lobby.jpg',
      title: 'Smart Reception & Triage',
      subtitle: 'Digital channelling & seamless check-in',
      tag: 'OPD & Reception'
    },
    {
      image: '/welcome/doctors_clinical.jpg',
      title: 'Digital EMR & Clinical Teams',
      subtitle: 'Real-time patient monitoring & collaborative care',
      tag: 'Clinical Care'
    }
  ];

  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance photos every 5 seconds with pause on hover
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const handleNext = (e) => {
    e?.stopPropagation();
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = (e) => {
    e?.stopPropagation();
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // 6 Circular Module Features matching user mockup
  const features = [
    {
      id: 'patients',
      title: 'Patient',
      subtitle: 'Management',
      icon: Users,
      color: '#0284c7',
      bg: '#e0f2fe'
    },
    {
      id: 'appointments',
      title: 'Appointment',
      subtitle: 'Scheduling',
      icon: Calendar,
      color: '#10b981',
      bg: '#dcfce7'
    },
    {
      id: 'emr',
      title: 'Medical',
      subtitle: 'Records',
      icon: Stethoscope,
      color: '#9333ea',
      bg: '#f3e8ff'
    },
    {
      id: 'laboratory',
      title: 'Laboratory',
      subtitle: 'Services',
      icon: FlaskConical,
      color: '#d97706',
      bg: '#fef3c7'
    },
    {
      id: 'pharmacy',
      title: 'Pharmacy',
      subtitle: 'Management',
      icon: Pill,
      color: '#e11d48',
      bg: '#ffe4e6'
    },
    {
      id: 'billing',
      title: 'Billing &',
      subtitle: 'Payments',
      icon: CreditCard,
      color: '#0d9488',
      bg: '#ccfbf1'
    }
  ];

  return (
    <div className="hc-welcome-root">
      {/* Decorative Organic Waves in Corners */}
      <svg
        className="hc-wave-corner-top"
        viewBox="0 0 500 320"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M 0,0 L 500,0 C 420,110 320,180 200,210 C 90,235 0,180 0,130 Z"
          fill="rgba(224, 242, 254, 0.45)"
        />
      </svg>

      <svg
        className="hc-wave-corner-bottom"
        viewBox="0 0 360 260"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M 0,260 C 140,240 220,170 250,95 C 270,45 295,15 360,0 L 360,260 Z"
          fill="rgba(224, 242, 254, 0.6)"
        />
        <path
          d="M 80,260 C 180,250 260,190 290,120 C 310,70 325,30 360,0 L 360,260 Z"
          fill="rgba(186, 230, 253, 0.45)"
        />
      </svg>

      {/* Top Navigation Bar */}
      <header className="hc-welcome-topbar">
        {/* Brand Logo: MediCore */}
        <div className="hc-brand-group">
          <div className="hc-brand-badge">
            <svg viewBox="0 0 32 32" className="hc-brand-cross-icon" fill="none">
              <rect x="12" y="4" width="8" height="24" rx="4" fill="#ffffff" />
              <rect x="4" y="12" width="24" height="8" rx="4" fill="#ffffff" />
              {/* Central ECG pulse line cutout/accent */}
              <path
                d="M 5 16 H 11 L 13.5 10 L 16.5 22 L 19 13 L 21 17 H 27"
                stroke="#0284c7"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="hc-brand-text-wrap">
            <span className="hc-brand-name">
              Medi<span className="hc-brand-core">Core</span>
            </span>
          </div>
        </div>

        {/* Right Tagline */}
        <div className="hc-top-tagline">
          <span>Better Care</span>
          <span className="hc-top-tagline-sep">|</span>
          <span>Smarter Management</span>
          <span className="hc-top-tagline-sep">|</span>
          <span>Healthier Tomorrow</span>
        </div>
      </header>

      {/* Main Two-Column Stage */}
      <main className="hc-stage">
        {/* Left Visual Section: Prominent Hero Photo Stage with S-Curve Boundary */}
        <div
          className="hc-visual-stage"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Photo Stack (Cross-fading slideshow) */}
          <div className="hc-photo-stack">
            {slides.map((slide, idx) => (
              <div
                key={idx}
                className={`hc-photo-layer ${idx === activeSlide ? 'active' : ''}`}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="hc-photo-img"
                />
              </div>
            ))}
          </div>

          {/* S-Curve SVG Overlay on the right edge of the visual stage */}
          <svg
            className="hc-curve-overlay"
            viewBox="0 0 180 1000"
            preserveAspectRatio="none"
          >
            {/* Soft sky-blue wave accent ribbon underneath */}
            <path
              d="M 180,0 L 55,0 C 105,180 0,360 8,500 C 16,630 115,740 85,860 C 65,930 15,970 0,1000 L 180,1000 Z"
              className="hc-curve-accent-fill"
            />
            {/* Primary pure white wave boundary matching the page canvas */}
            <path
              d="M 180,0 L 80,0 C 130,180 25,360 32,500 C 40,630 140,740 110,860 C 90,930 40,970 24,1000 L 180,1000 Z"
              className="hc-curve-primary-fill"
            />
          </svg>

          {/* Subtle bottom fade for clean contrast with floating motto */}
          <div className="hc-bottom-fade" />

          {/* Floating Photo Tag & Mini Indicator Dots */}
          <div className="hc-photo-meta-bar">
            <div className="hc-photo-badge">
              <Sparkles size={13} className="hc-sparkle-icon" />
              <span>{slides[activeSlide].tag}</span>
            </div>
            <div className="hc-slide-dots">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSlide(idx);
                  }}
                  className={`hc-slide-dot ${idx === activeSlide ? 'active' : ''}`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Subtle Prev/Next Arrow Buttons on Hover */}
          <button
            onClick={handlePrev}
            className="hc-nav-arrow hc-nav-prev"
            aria-label="Previous photo"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={handleNext}
            className="hc-nav-arrow hc-nav-next"
            aria-label="Next photo"
          >
            <ChevronRight size={18} />
          </button>

          {/* Bottom-Left Motto Pill: Pulse Line + Heart + "Your Health, Our Priority" */}
          <div className="hc-priority-motto">
            <svg
              className="hc-priority-ecg-svg"
              viewBox="0 0 105 32"
              fill="none"
            >
              {/* Heartbeat pulse waveform */}
              <path
                d="M 3 16 H 24 L 30 7 L 39 25 L 46 10 L 52 20 L 57 16 H 68"
                stroke="#0284c7"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Heart outline icon */}
              <path
                d="M 88 12 C 88 9 85.5 7 83 7 C 80.5 7 78.5 9 78 10.5 C 77.5 9 75.5 7 73 7 C 70.5 7 68 9 68 12 C 68 16.5 78 22.5 78 22.5 C 78 22.5 88 16.5 88 12 Z"
                stroke="#0284c7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
            <span className="hc-priority-text">Your Health, Our Priority</span>
          </div>
        </div>

        {/* Right Content Section: Clean Centered Typography & Modules */}
        <div className="hc-content-stage">
          <div className="hc-hero-box">
            {/* Welcome Greeting */}
            <p className="hc-welcome-lead">Welcome to</p>

            {/* Main Title: MediCore */}
            <h1 className="hc-hero-title">
              Medi<span className="hc-title-accent">Core</span>
            </h1>

            {/* Subtitle */}
            <h2 className="hc-hero-subtitle">Hospital Management System</h2>

            {/* Tagline with Bullet Points */}
            <div className="hc-hero-tagline">
              <span>Efficient Management</span>
              <span className="hc-bullet-dot">•</span>
              <span>Better Healthcare</span>
              <span className="hc-bullet-dot">•</span>
              <span>Healthier Community</span>
            </div>

            {/* Paragraph Description */}
            <p className="hc-hero-description">
              Manage patients, appointments, medical records,
              laboratory services, pharmacy and billing
              in one place.
            </p>

            {/* Primary Action Button */}
            <div className="hc-cta-wrap">
              <button
                onClick={() => onNavigateToLogin()}
                className="hc-btn-get-started"
                id="btn-get-started"
              >
                <ArrowRight size={20} className="hc-btn-arrow" />
                <span>Get Started</span>
              </button>
            </div>

            {/* Circular Feature Modules (6 modules from mockup) */}
            <div className="hc-modules-row">
              {features.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={feat.id}
                    className="hc-module-item"
                    onClick={() => onNavigateToLogin(feat.id)}
                    role="button"
                    tabIndex={0}
                    title={`Open ${feat.title} ${feat.subtitle}`}
                  >
                    <div
                      className="hc-module-circle"
                      style={{ backgroundColor: feat.bg, color: feat.color }}
                    >
                      <Icon size={22} strokeWidth={2.2} />
                    </div>
                    <span className="hc-module-label">
                      <span>{feat.title}</span>
                      <span>{feat.subtitle}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
