import React from 'react';
import { motion } from 'framer-motion';
import AnimatedSection from './AnimatedSection';
import { useContentSection } from '../data/chakravyuhaContent';
import { Check, Star } from 'lucide-react';

const PASSES_FORM_URL = 'https://forms.gle/STeHmDJ3Rq2rhj1Q9';

const EventPass = () => {
  const eventPass = useContentSection('eventPass');

  const getPassStyle = (tier) => {
    switch (tier.id) {
      case 'bronze':
        return {
          gradient: 'from-amber-900/40 to-amber-700/20',
          border: 'border-amber-600/30 hover:border-amber-500/50',
          badge: 'bg-amber-500/20 text-amber-400',
          button: 'bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500'
        };
      case 'silver':
        return {
          gradient: 'from-purple-900/40 to-purple-700/20',
          border: 'border-purple-500/50 hover:border-purple-400/70',
          badge: 'bg-purple-500/20 text-purple-400',
          button: 'bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500'
        };
      case 'gold':
        return {
          gradient: 'from-yellow-900/40 to-yellow-700/20',
          border: 'border-yellow-600/30 hover:border-yellow-500/50',
          badge: 'bg-yellow-500/20 text-yellow-400',
          button: 'bg-gradient-to-r from-yellow-700 to-yellow-600 hover:from-yellow-600 hover:to-yellow-500'
        };
      default:
        return {};
    }
  };

  return (
    <AnimatedSection id="passes" className="py-20 md:py-32">
      <div className="container-custom">
        <h2 className="section-title" data-testid="passes-title">{eventPass.title}</h2>
        <p className="section-subtitle">{eventPass.subtitle}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {eventPass.tiers.map((tier, index) => {
            const style = getPassStyle(tier);

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className={`
                  relative rounded-2xl overflow-hidden
                  bg-gradient-to-b ${style.gradient}
                  border ${style.border}
                  transition-all duration-300
                  ${tier.recommended ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-black scale-105 md:scale-110' : ''}
                `}
                data-testid={`pass-card-${tier.id}`}
              >
                {/* Recommended badge */}
                {tier.recommended && (
                  <div className="absolute top-0 left-0 right-0 py-1 bg-purple-500 text-center">
                    <span className="text-xs font-bold text-white tracking-wider flex items-center justify-center gap-1">
                      <Star className="w-3 h-3" fill="white" />
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className={`p-6 ${tier.recommended ? 'pt-10' : ''}`}>
                  {/* Pass name */}
                  <h3 className="font-audiowide text-xl text-white mb-2">{tier.name}</h3>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="font-audiowide text-4xl text-white">{tier.price}</span>
                    <span className="text-sm text-gray-400 line-through">{tier.originalPrice}</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button 
                  <button
                    className={`
                      w-full py-3 rounded-xl font-semibold text-white
                      ${style.button}
                      transition-all duration-300
                    `}
                    data-testid={`buy-${tier.id}-pass`}
                  >
                    Get {tier.name}
                  </button>
                  */}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href={PASSES_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-neon group"
            data-testid="get-your-pass-button"
          >
            <span>Get Your Pass</span>
          </a>
        </div>
      </div>
    </AnimatedSection>
  );
};

export default EventPass;
