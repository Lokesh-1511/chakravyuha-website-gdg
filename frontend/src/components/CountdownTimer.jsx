import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CountdownTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const timeUnits = [
    { label: 'DAYS', value: timeLeft.days },
    { label: 'HOURS', value: timeLeft.hours },
    { label: 'MINS', value: timeLeft.minutes },
    { label: 'SECS', value: timeLeft.seconds }
  ];

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-4 max-w-full" data-testid="countdown-timer">
      {timeUnits.map((unit, index) => (
        <React.Fragment key={unit.label}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-center"
          >
            <div className="relative">
              <div 
                className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center rounded-xl glass border border-purple-500/30"
                style={{ boxShadow: '0 0 20px rgba(124, 58, 237, 0.2)' }}
              >
                <motion.span
                  key={unit.value}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="font-audiowide text-xl sm:text-3xl md:text-4xl text-white"
                >
                  {String(unit.value).padStart(2, '0')}
                </motion.span>
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full" />
            </div>
            <span className="mt-2 sm:mt-3 text-[10px] sm:text-xs font-medium tracking-widest text-gray-400">
              {unit.label}
            </span>
          </motion.div>
          {index < timeUnits.length - 1 && (
            <span className="hidden sm:inline text-2xl sm:text-3xl text-purple-500 font-bold self-start mt-4 sm:mt-5 md:mt-6">:</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default CountdownTimer;
