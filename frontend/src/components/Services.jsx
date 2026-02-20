import React from 'react';
import { motion } from 'framer-motion';
import AnimatedSection from './AnimatedSection';
import { useContentSection } from '../data/chakravyuhaContent';
import { Utensils, Bus, Bed, HeartPulse, Car, Wifi, Phone, User } from 'lucide-react';

const iconMap = {
  utensils: Utensils,
  bus: Bus,
  bed: Bed,
  'heart-pulse': HeartPulse,
  car: Car,
  wifi: Wifi
};

const Services = () => {
  const services = useContentSection('services');
  const contact = useContentSection('contact');
  const primaryCoordinator = contact?.coordinators?.[0] || {};
  const enquiryName = services?.contactPerson?.name || primaryCoordinator?.name || 'Hospitality Desk';
  const enquiryNumber = services?.contactPerson?.number || primaryCoordinator?.phone || contact?.phone || '';
  const enquiryLink = services?.enquireLink || (enquiryNumber ? `tel:${enquiryNumber}` : '');
  const hasEnquiryLink = /^https?:\/\//i.test(enquiryLink) || enquiryLink.startsWith('tel:');

  return (
    <AnimatedSection id="services" className="py-20 md:py-32 bg-black/30">
      <div className="container-custom">
        <h2 className="section-title" data-testid="services-title">{services.title}</h2>
        <p className="section-subtitle">{services.subtitle}</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {services.items.map((item, index) => {
            const Icon = iconMap[item.icon] || Utensils;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, borderColor: 'rgba(124, 58, 237, 0.5)' }}
                className="p-5 md:p-6 rounded-2xl bg-black/40 backdrop-blur-sm border border-white/10 transition-all duration-300"
                data-testid={`service-${item.id}`}
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
                </div>
                <h3 className="font-semibold text-white text-sm md:text-base mb-2">{item.title}</h3>
                <p className="text-xs md:text-sm text-gray-400 leading-relaxed">{item.description}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 p-5 md:p-6 rounded-2xl bg-black/50 backdrop-blur-sm border border-purple-500/30"
          data-testid="services-enquiry"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <h3 className="text-base md:text-lg font-semibold text-white">Need help with Accomodation</h3>
              <p className="flex items-center gap-2 text-sm text-gray-300">
                <User className="w-4 h-4 text-purple-300" />
                {enquiryName}
              </p>
              <p className="flex items-center gap-2 text-sm text-gray-300">
                <Phone className="w-4 h-4 text-purple-300" />
                {enquiryNumber || 'Number will be updated soon'}
              </p>
            </div>

            {hasEnquiryLink ? (
              <a
                href={enquiryLink}
                target={enquiryLink.startsWith('http') ? '_blank' : undefined}
                rel={enquiryLink.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:from-purple-500 hover:to-fuchsia-400 text-white text-base font-semibold tracking-wide border border-purple-300/30 shadow-[0_0_24px_rgba(168,85,247,0.45)] transition-all"
                data-testid="services-enquire-btn"
              >
                Enquire
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-white/10 text-gray-300 text-base font-semibold border border-white/10 cursor-not-allowed"
                data-testid="services-enquire-btn"
              >
                Enquire
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatedSection>
  );
};

export default Services;
