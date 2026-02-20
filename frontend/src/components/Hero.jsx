import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import CountdownTimer from './CountdownTimer';
import { useContentSection } from '../data/chakravyuhaContent';
import { Trophy, Briefcase, Calendar, Users, ArrowDown } from 'lucide-react';

const Hero = ({ scrollToSection }) => {
  const hero = useContentSection('hero');
  const titleRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    // GSAP animation for title
    if (titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 50, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out' }
      );
    }

    // Animate stats counters
    if (statsRef.current) {
      gsap.fromTo(
        statsRef.current.children,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, delay: 0.5, ease: 'power2.out' }
      );
    }
  }, []);

  const stats = [
    { icon: Trophy, label: 'Prize Pool', value: hero.prizePool },
    { icon: Briefcase, label: 'Internships', value: hero.internships },
    { icon: Calendar, label: 'Events', value: hero.events },
    { icon: Users, label: 'Participants', value: hero.participants }
  ];

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-purple-600/20 rounded-full blur-[90px] sm:blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-cyan-500/10 rounded-full blur-[90px] sm:blur-[120px]" />
      </div>

      <div className="container-custom relative z-10 py-20 md:py-32">
        <div className="flex flex-col items-center text-center">
          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-4"
          >
            <span className="inline-block px-4 py-1.5 text-xs font-medium tracking-widest text-purple-300 uppercase bg-purple-500/20 rounded-full border border-purple-500/30">
              {hero.tagline}
            </span>
          </motion.div>

          {/* Main title */}
          <h1
            ref={titleRef}
            className="font-audiowide text-[clamp(1.9rem,9vw,3.6rem)] md:text-6xl lg:text-7xl xl:text-8xl text-white mb-2 tracking-wide break-words leading-tight px-2 max-w-[95vw]"
            style={{ textShadow: '0 0 40px rgba(124, 58, 237, 0.5)' }}
            data-testid="hero-title"
          >
            {hero.title}
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-base sm:text-lg md:text-xl text-gray-400 mb-8 max-w-[92vw] md:max-w-3xl px-2"
          >
            {hero.subtitle}
          </motion.p>

          {/* Countdown timer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <CountdownTimer targetDate={hero.countdownDate} />
          </motion.div>

          {/* Date badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-8 max-w-full px-2"
          >
            <span className="inline-flex flex-wrap justify-center items-center gap-2 px-4 sm:px-6 py-3 text-xs sm:text-sm md:text-base font-audiowide text-white bg-black/40 backdrop-blur-sm rounded-full border border-purple-500/30 max-w-full">
              <Calendar className="w-4 h-4 text-purple-400" />
              {hero.dates}
            </span>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <a
              href={hero.registerUrl || 'https://unstop.com/college-fests/chakravyuha-2026-madras-institute-of-technology-mit-anna-university-chennai-tamil-nadu-439521'}
              className="btn-neon group"
              data-testid="register-btn"
            >
              <span className="flex items-center gap-2">
                EXPLORE EVENTS
              </span>
            </a>
          </motion.div>

          {/* Stats */}
          <div ref={statsRef} className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-8 mt-12 md:mt-16">
            {stats.map(({ icon: Icon, label, value }, index) => (
              <motion.div
                key={label}
                className="flex flex-col items-center p-3 sm:p-4 md:p-6 rounded-2xl glass min-w-[108px] sm:min-w-[120px] md:min-w-[140px]"
                whileHover={{ scale: 1.05, borderColor: 'rgba(124, 58, 237, 0.5)' }}
                data-testid={`stat-${label.toLowerCase().replace(' ', '-')}`}
              >
                <Icon className="w-5 h-5 md:w-6 md:h-6 text-purple-400 mb-2" />
                <span className="font-audiowide text-xl md:text-2xl text-white">{value}</span>
                <span className="text-xs text-gray-400 mt-1">{label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{ delay: 1, y: { repeat: Infinity, duration: 1.5 } }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <button
          onClick={() => scrollToSection && scrollToSection('about')}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Scroll down"
        >
          <ArrowDown className="w-6 h-6" />
        </button>
      </motion.div>
    </section>
  );
};

export default Hero;
