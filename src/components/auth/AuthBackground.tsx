import React, { useEffect, useState, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { LogoMark } from '../common/LogoMark';

interface ParallaxOffset {
  x: number;
  y: number;
}

export const AuthBackground: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const [offset, setOffset] = useState<ParallaxOffset>({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);

  // Smooth mouse parallax loop using requestAnimationFrame
  useEffect(() => {
    if (shouldReduceMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      // Normalize to -1 ... 1
      const normX = (e.clientX / innerWidth) * 2 - 1;
      const normY = (e.clientY / innerHeight) * 2 - 1;
      targetRef.current = { x: normX, y: normY };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const animateLoop = () => {
      // Smooth lerp damping
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * 0.04;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * 0.04;

      setOffset({
        x: currentRef.current.x,
        y: currentRef.current.y,
      });

      rafId.current = requestAnimationFrame(animateLoop);
    };

    rafId.current = requestAnimationFrame(animateLoop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [shouldReduceMotion]);

  return (
    <div 
      className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* 1. SOFT AMBIENT RADIAL GLOWS */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Faint blue ambient glow behind hero headline */}
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: [-15, 15, -15],
                  y: [-10, 10, -10],
                }
          }
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-[10%] left-[5%] w-[650px] h-[650px] rounded-full bg-[radial-gradient(circle,rgba(224,236,255,0.45)_0%,rgba(238,242,255,0.2)_45%,transparent_70%)] blur-3xl"
          style={{
            transform: `translate3d(${offset.x * 12}px, ${offset.y * 12}px, 0)`,
          }}
        />

        {/* Faint soft glow in the upper-right corner */}
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: [12, -12, 12],
                  y: [10, -10, 10],
                }
          }
          transition={{
            duration: 32,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-[5%] right-[2%] w-[580px] h-[580px] rounded-full bg-[radial-gradient(circle,rgba(224,231,255,0.4)_0%,rgba(241,245,249,0.2)_45%,transparent_70%)] blur-3xl"
          style={{
            transform: `translate3d(${offset.x * -10}px, ${offset.y * -10}px, 0)`,
          }}
        />
      </div>

      {/* 2. SOFT BACKGROUND WAVES (NEAR BOTTOM) */}
      <div 
        className="absolute inset-x-0 bottom-0 h-[450px] overflow-hidden"
        style={{
          transform: `translate3d(${offset.x * 4}px, ${offset.y * 4}px, 0)`,
        }}
      >
        <svg
          viewBox="0 0 1920 450"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover preserve-3d"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="softWaveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EEF2FF" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#F1F5F9" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="softWaveGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.3" />
              <stop offset="60%" stopColor="#F8FAFC" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Background gentle wave */}
          <motion.path
            d="M 0,220 C 320,170 680,260 1080,200 C 1480,140 1720,230 1920,180 L 1920,450 L 0,450 Z"
            fill="url(#softWaveGrad1)"
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    d: [
                      "M 0,220 C 320,170 680,260 1080,200 C 1480,140 1720,230 1920,180 L 1920,450 L 0,450 Z",
                      "M 0,200 C 360,240 720,180 1120,230 C 1500,270 1700,160 1920,210 L 1920,450 L 0,450 Z",
                      "M 0,220 C 320,170 680,260 1080,200 C 1480,140 1720,230 1920,180 L 1920,450 L 0,450 Z",
                    ],
                  }
            }
            transition={{
              duration: 26,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Front subtle translucent wave */}
          <motion.path
            d="M 0,310 C 380,260 760,340 1180,280 C 1540,230 1760,320 1920,270 L 1920,450 L 0,450 Z"
            fill="url(#softWaveGrad2)"
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    d: [
                      "M 0,310 C 380,260 760,340 1180,280 C 1540,230 1760,320 1920,270 L 1920,450 L 0,450 Z",
                      "M 0,290 C 420,330 800,260 1220,310 C 1580,350 1740,250 1920,290 L 1920,450 L 0,450 Z",
                      "M 0,310 C 380,260 760,340 1180,280 C 1540,230 1760,320 1920,270 L 1920,450 L 0,450 Z",
                    ],
                  }
            }
            transition={{
              duration: 32,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </svg>
      </div>

      {/* 3. CURVED NETWORK / CONNECTION DATA LINES */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{
          transform: `translate3d(${offset.x * 6}px, ${offset.y * 6}px, 0)`,
        }}
      >
        <svg
          viewBox="0 0 1920 1080"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover"
          preserveAspectRatio="none"
        >
          {/* Main sweeping data curve traversing from lower-left to right */}
          <motion.path
            d="M -100,780 C 300,720 550,860 920,680 C 1280,510 1520,740 2050,640"
            stroke="rgba(186, 210, 245, 0.45)"
            strokeWidth="1.4"
            strokeDasharray="8 14"
            strokeLinecap="round"
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    strokeDashoffset: [0, -220],
                  }
            }
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* Secondary parallel harmonic network line */}
          <motion.path
            d="M -50,860 C 350,810 600,920 980,750 C 1340,590 1560,790 2020,720"
            stroke="rgba(203, 222, 250, 0.35)"
            strokeWidth="1.2"
            strokeDasharray="6 12"
            strokeLinecap="round"
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    strokeDashoffset: [0, -180],
                  }
            }
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* Upper arching connection path behind hero and cards */}
          <motion.path
            d="M -80,480 C 420,380 750,560 1140,430 C 1460,320 1720,440 2000,340"
            stroke="rgba(191, 219, 254, 0.3)"
            strokeWidth="1.2"
            strokeDasharray="10 16"
            strokeLinecap="round"
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    strokeDashoffset: [0, 260],
                  }
            }
            transition={{
              duration: 24,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* Lower gentle exit curve */}
          <motion.path
            d="M 200,980 C 600,920 950,1020 1350,910 C 1680,820 1850,900 2050,860"
            stroke="rgba(219, 234, 254, 0.35)"
            strokeWidth="1"
            strokeDasharray="8 14"
            strokeLinecap="round"
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    strokeDashoffset: [0, -220],
                  }
            }
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </svg>
      </div>

      {/* 4. SMALL PARTICLES / DATA DOT GRID CLUSTERS */}
      {/* Cluster 1: Upper-Left (above hero headline) */}
      <div
        className="absolute top-10 left-6 sm:left-14 hidden md:block"
        style={{
          transform: `translate3d(${offset.x * 7}px, ${offset.y * 7}px, 0)`,
        }}
      >
        <div className="grid grid-cols-4 gap-3.5">
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.div
              key={`dot-tl-${i}`}
              className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-400"
              animate={
                shouldReduceMotion
                  ? { opacity: 0.22 }
                  : {
                      opacity: [0.15, 0.38, 0.15],
                    }
              }
              transition={{
                duration: 4.5 + (i % 4) * 0.8,
                repeat: Infinity,
                delay: (i * 0.25) % 3,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>

      {/* Cluster 2: Lower-Left (under process cards, beside big tile) */}
      <div
        className="absolute bottom-20 left-48 sm:left-64 hidden lg:block"
        style={{
          transform: `translate3d(${offset.x * 5}px, ${offset.y * 5}px, 0)`,
        }}
      >
        <div className="grid grid-cols-4 gap-3.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={`dot-bl-${i}`}
              className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-slate-400"
              animate={
                shouldReduceMotion
                  ? { opacity: 0.2 }
                  : {
                      opacity: [0.12, 0.32, 0.12],
                    }
              }
              transition={{
                duration: 5.2 + (i % 3) * 0.7,
                repeat: Infinity,
                delay: (i * 0.3) % 2.5,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>

      {/* Cluster 3: Far-Right (behind/next to login card) */}
      <div
        className="absolute top-44 right-8 sm:right-16 hidden md:block"
        style={{
          transform: `translate3d(${offset.x * 8}px, ${offset.y * 8}px, 0)`,
        }}
      >
        <div className="grid grid-cols-3 gap-3.5">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={`dot-tr-${i}`}
              className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-400"
              animate={
                shouldReduceMotion
                  ? { opacity: 0.25 }
                  : {
                      opacity: [0.16, 0.38, 0.16],
                    }
              }
              transition={{
                duration: 4.8 + (i % 5) * 0.6,
                repeat: Infinity,
                delay: (i * 0.22) % 3,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>

      {/* 5. FLOATING 3D NEXALINK LOGO TILES */}

      {/* TILE 1: Large Foreground Tile in Lower-Left Corner */}
      <motion.div
        className="absolute -bottom-10 -left-8 sm:-bottom-8 sm:-left-4 md:bottom-2 md:left-4 z-0 pointer-events-none"
        style={{
          transform: `translate3d(${offset.x * 14}px, ${offset.y * 14}px, 0)`,
        }}
      >
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  y: [-12, 14, -12],
                  rotateZ: [-14, -10, -16, -14],
                  rotateX: [16, 20, 14, 16],
                  rotateY: [-16, -12, -18, -16],
                }
          }
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-[36px] sm:rounded-[44px] flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 245, 252, 0.85) 50%, rgba(226, 235, 247, 0.7) 100%)',
            boxShadow: `
              0 30px 60px -15px rgba(15, 23, 42, 0.18),
              0 12px 30px -6px rgba(147, 197, 253, 0.28),
              inset 1.5px 1.5px 3px rgba(255, 255, 255, 1),
              inset -1.5px -1.5px 3px rgba(148, 163, 184, 0.22)
            `,
            border: '1px solid rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            transformStyle: 'preserve-3d',
            perspective: 800,
          }}
        >
          {/* Embossed NexaLink Monogram */}
          <div 
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-slate-800"
            style={{
              filter: 'drop-shadow(0 3px 6px rgba(15, 23, 42, 0.16))',
            }}
          >
            <LogoMark className="w-full h-full text-slate-800" withAccent={false} />
          </div>
        </motion.div>
      </motion.div>

      {/* TILE 2: Small/Medium Tile in Far-Left Middle */}
      <motion.div
        className="absolute top-[34%] left-[2%] sm:left-[3.5%] hidden sm:block pointer-events-none"
        style={{
          transform: `translate3d(${offset.x * 9}px, ${offset.y * 9}px, 0)`,
        }}
      >
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  y: [-10, 12, -10],
                  rotateZ: [-18, -14, -20, -18],
                  rotateX: [18, 22, 16, 18],
                  rotateY: [14, 18, 12, 14],
                }
          }
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center opacity-85"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(241, 245, 249, 0.8) 100%)',
            boxShadow: `
              0 20px 35px -8px rgba(15, 23, 42, 0.12),
              0 8px 18px -4px rgba(147, 197, 253, 0.2),
              inset 1px 1px 2px rgba(255, 255, 255, 0.95),
              inset -1px -1px 2px rgba(148, 163, 184, 0.2)
            `,
            border: '1px solid rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div 
            className="w-8 h-8 text-slate-700"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(15, 23, 42, 0.12))',
            }}
          >
            <LogoMark className="w-full h-full text-slate-700" withAccent={false} />
          </div>
        </motion.div>
      </motion.div>

      {/* TILE 3: Small/Subtle Tile in Center-Left Background */}
      <motion.div
        className="absolute bottom-[30%] left-[26%] hidden xl:block pointer-events-none"
        style={{
          transform: `translate3d(${offset.x * 5}px, ${offset.y * 5}px, 0)`,
        }}
      >
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  y: [8, -8, 8],
                  rotateZ: [8, 12, 6, 8],
                }
          }
          transition={{
            duration: 21,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-11 h-11 rounded-xl flex items-center justify-center opacity-40 blur-[0.6px]"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(241, 245, 249, 0.6) 100%)',
            boxShadow: '0 12px 24px -6px rgba(15, 23, 42, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
          }}
        >
          <div className="w-6 h-6 text-slate-600">
            <LogoMark className="w-full h-full text-slate-600" withAccent={false} />
          </div>
        </motion.div>
      </motion.div>

      {/* TILE 4: Medium Tile in Upper-Right */}
      <motion.div
        className="absolute top-[6%] right-[3%] sm:top-[8%] sm:right-[4%] hidden sm:block pointer-events-none"
        style={{
          transform: `translate3d(${offset.x * 10}px, ${offset.y * 10}px, 0)`,
        }}
      >
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  y: [-14, 12, -14],
                  rotateZ: [14, 18, 11, 14],
                  rotateX: [-15, -11, -17, -15],
                  rotateY: [14, 18, 11, 14],
                }
          }
          transition={{
            duration: 17,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-18 h-18 sm:w-20 sm:h-20 rounded-[22px] flex items-center justify-center opacity-90"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(241, 246, 252, 0.82) 100%)',
            boxShadow: `
              0 24px 44px -10px rgba(15, 23, 42, 0.15),
              0 8px 20px -4px rgba(147, 197, 253, 0.22),
              inset 1.2px 1.2px 2.5px rgba(255, 255, 255, 1),
              inset -1.2px -1.2px 2.5px rgba(148, 163, 184, 0.2)
            `,
            border: '1px solid rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <div 
            className="w-10 h-10 text-slate-800"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(15, 23, 42, 0.14))',
            }}
          >
            <LogoMark className="w-full h-full text-slate-800" withAccent={false} />
          </div>
        </motion.div>
      </motion.div>

      {/* TILE 5: Medium-Small Tile in Lower-Right */}
      <motion.div
        className="absolute bottom-[20%] right-[4%] sm:right-[6%] hidden sm:block pointer-events-none"
        style={{
          transform: `translate3d(${offset.x * 8}px, ${offset.y * 8}px, 0)`,
        }}
      >
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  y: [12, -12, 12],
                  rotateZ: [12, 8, 14, 12],
                  rotateX: [14, 10, 16, 14],
                  rotateY: [-12, -8, -15, -12],
                }
          }
          transition={{
            duration: 19,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] flex items-center justify-center opacity-85"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(240, 245, 251, 0.8) 100%)',
            boxShadow: `
              0 20px 36px -8px rgba(15, 23, 42, 0.13),
              0 8px 16px -4px rgba(147, 197, 253, 0.2),
              inset 1px 1px 2px rgba(255, 255, 255, 0.95),
              inset -1px -1px 2px rgba(148, 163, 184, 0.18)
            `,
            border: '1px solid rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div 
            className="w-8 h-8 text-slate-700"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(15, 23, 42, 0.12))',
            }}
          >
            <LogoMark className="w-full h-full text-slate-700" withAccent={false} />
          </div>
        </motion.div>
      </motion.div>

      {/* TILE 6: Subtle Small Tile near Far-Right Edge */}
      <motion.div
        className="absolute top-[58%] right-[1.5%] hidden lg:block pointer-events-none"
        style={{
          transform: `translate3d(${offset.x * 6}px, ${offset.y * 6}px, 0)`,
        }}
      >
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  y: [-8, 9, -8],
                  rotateZ: [-10, -7, -13, -10],
                }
          }
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-11 h-11 rounded-xl flex items-center justify-center opacity-45 blur-[0.4px]"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(241, 245, 249, 0.7) 100%)',
            boxShadow: '0 12px 24px -6px rgba(15, 23, 42, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.85)',
          }}
        >
          <div className="w-6 h-6 text-slate-600">
            <LogoMark className="w-full h-full text-slate-600" withAccent={false} />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
