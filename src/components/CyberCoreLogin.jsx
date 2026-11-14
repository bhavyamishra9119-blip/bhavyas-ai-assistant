import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { Power, Sparkles, Shield, Cpu, Activity, ArrowRight } from 'lucide-react';
import * as THREE from 'three';

/* ════════════════════════════════════════════════════════════
   FUTURISTIC CYBER-CORE 3D ENTRY INTERFACE
   - Full-Screen 3D WebGL Liquid Metal Core & Floating Orbit Rings
   - Interactive Mouse Parallax & Dynamic Volumetric Lighting
   - Ultra-Sleek Glassmorphic Control HUD with 3D Tilt
   - 100% Theme Dynamic (Cyber Teal, Aurora Mint, Sakura Pink, Vortex Violet)
   ════════════════════════════════════════════════════════════ */

const THEME_COLORS = {
  purple:  { primary: '#ffffff', secondary: '#71717a', light: '#f4f4f5', hex: 0xffffff, secHex: 0x71717a, floorRgb: '255, 255, 255' },
  emerald: { primary: '#ffffff', secondary: '#71717a', light: '#f4f4f5', hex: 0xffffff, secHex: 0x71717a, floorRgb: '255, 255, 255' },
  cyber:   { primary: '#ffffff', secondary: '#71717a', light: '#f4f4f5', hex: 0xffffff, secHex: 0x71717a, floorRgb: '255, 255, 255' },
  rose:    { primary: '#ffffff', secondary: '#71717a', light: '#f4f4f5', hex: 0xffffff, secHex: 0x71717a, floorRgb: '255, 255, 255' }
};

export default function CyberCoreLogin({ onLoginSuccess, isOn, setIsOn, theme = 'purple', savedName = '' }) {
  const [logoError, setLogoError] = useState(false);
  const [logoUrl] = useState(() => '/logo.png');
  const [fallbackUrl] = useState(() => '/logo_fallback.svg');
  const [username, setUsername] = useState(savedName || '');
  
  const currentTheme = THEME_COLORS[theme] || THEME_COLORS.purple;

  // 3D Card Tilt State
  const cardRef = useRef(null);
  const usernameInputRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // WebGL 3D Canvas Ref
  const canvasRef = useRef(null);

  useEffect(() => {
    if (savedName) setUsername(savedName);
  }, [savedName]);

  useEffect(() => {
    if (usernameInputRef.current) usernameInputRef.current.focus();
  }, []);

  /* ─────────────────────────────────────────────────────────────
     THREE.JS 3D WEBGL CYBER-CORE SCENE INITIALIZATION
     ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 7.5;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Group holding all 3D objects for mouse rotation
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // 1. Central Morphing Cyber-Core (Icosahedron Geometry)
    const coreGeo = new THREE.IcosahedronGeometry(1.6, 6);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: currentTheme.hex,
      emissive: currentTheme.secHex,
      emissiveIntensity: isOn ? 0.45 : 0.05,
      metalness: 0.85,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      wireframe: false
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(coreMesh);

    // Wireframe overlay on core
    const wireGeo = new THREE.IcosahedronGeometry(1.62, 2);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: isOn ? 0.2 : 0.05
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    coreMesh.add(wireMesh);

    // 2. Outer Gyroscope Energy Rings
    const ring1Geo = new THREE.TorusGeometry(2.3, 0.03, 16, 100);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: currentTheme.hex,
      emissive: currentTheme.hex,
      emissiveIntensity: isOn ? 0.8 : 0.1,
      metalness: 0.9,
      roughness: 0.1
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    coreGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(2.8, 0.02, 16, 100);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: currentTheme.secHex,
      emissive: currentTheme.secHex,
      emissiveIntensity: isOn ? 0.6 : 0.05,
      metalness: 0.9,
      roughness: 0.1
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.y = Math.PI / 4;
    coreGroup.add(ring2);

    // 3. Floating 3D Star Particles Field
    const particleCount = 350;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 16;
      particlePos[i + 1] = (Math.random() - 0.5) * 16;
      particlePos[i + 2] = (Math.random() - 0.5) * 16;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));

    const particleMat = new THREE.PointsMaterial({
      color: currentTheme.hex,
      size: 0.06,
      transparent: true,
      opacity: isOn ? 0.75 : 0.2
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 4. Volumetric Point Lights
    const pLight1 = new THREE.PointLight(currentTheme.hex, isOn ? 4 : 0.5, 25);
    pLight1.position.set(3, 4, 5);
    scene.add(pLight1);

    const pLight2 = new THREE.PointLight(currentTheme.secHex, isOn ? 3 : 0.2, 25);
    pLight2.position.set(-4, -3, 3);
    scene.add(pLight2);

    const ambLight = new THREE.AmbientLight(0xffffff, isOn ? 0.35 : 0.1);
    scene.add(ambLight);

    // Store original vertex positions for wave deformation animation
    const posAttr = coreGeo.attributes.position;
    const originalPositions = posAttr.array.slice();

    // Mouse Parallax Trackers
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;

    const handleMouseMoveWindow = (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMoveWindow);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId;
    let clock = new THREE.Clock();

    const animateScene = () => {
      const time = clock.getElapsedTime();

      // Smooth camera / group inertia follow
      targetX += (mouseX * 0.4 - targetX) * 0.05;
      targetY += (mouseY * 0.4 - targetY) * 0.05;
      coreGroup.rotation.y = targetX;
      coreGroup.rotation.x = -targetY;

      // Continuous 3D rotation
      coreMesh.rotation.y += isOn ? 0.008 : 0.002;
      coreMesh.rotation.z += isOn ? 0.004 : 0.001;
      ring1.rotation.z += isOn ? 0.012 : 0.003;
      ring2.rotation.x += isOn ? -0.009 : -0.002;
      particles.rotation.y += 0.0008;

      // Organic Liquid Surface Deformation (Deform vertices along normals)
      if (isOn) {
        const positions = posAttr.array;
        for (let i = 0; i < positions.length; i += 3) {
          const u = originalPositions[i];
          const v = originalPositions[i + 1];
          const w = originalPositions[i + 2];
          const dist = Math.sqrt(u * u + v * v + w * w);
          const wave = Math.sin(u * 2 + time * 3) * Math.cos(v * 2 + time * 2) * 0.12;
          
          positions[i] = u + (u / dist) * wave;
          positions[i + 1] = v + (v / dist) * wave;
          positions[i + 2] = w + (w / dist) * wave;
        }
        posAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animateScene);
    };

    animateScene();

    return () => {
      window.removeEventListener('mousemove', handleMouseMoveWindow);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, [theme, isOn]);

  /* ── 3D Card Hover Tilt Handlers ── */
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const rotX = -(y - yc) / 18;
    const rotY = (x - xc) / 18;
    setTilt({ x: rotX, y: rotY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) onLoginSuccess(username.trim());
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#000000] text-slate-100 flex items-center justify-center select-none">
      
      {/* ── 3D WebGL Canvas Background ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-0 pointer-events-none"
      />

      {/* ── Ambient Radial Glow Overlay ── */}
      <div
        className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-700"
        style={{
          opacity: isOn ? 1 : 0.2,
          background: `radial-gradient(circle at 50% 50%, rgba(${currentTheme.floorRgb}, 0.22) 0%, rgba(${currentTheme.floorRgb}, 0.05) 50%, transparent 80%)`
        }}
      />

      {/* ── Top Floating Power Core Toggle Button ── */}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOn(prev => !prev)}
        className="absolute top-8 left-8 z-30 flex items-center gap-3 px-5 py-2.5 rounded-2xl backdrop-blur-2xl transition-all duration-300 cursor-pointer"
        style={{
          background: isOn ? `rgba(${currentTheme.floorRgb}, 0.15)` : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isOn ? currentTheme.primary : 'rgba(255,255,255,0.12)'}`,
          boxShadow: isOn ? `0 0 25px ${currentTheme.primary}50` : 'none'
        }}
      >
        <Power className={`w-4 h-4 ${isOn ? 'animate-pulse' : ''}`} style={{ color: isOn ? currentTheme.primary : '#a1a1aa' }} />
        <span className="font-mono text-xs font-semibold tracking-wider" style={{ color: isOn ? currentTheme.light : '#a1a1aa' }}>
          {isOn ? 'CYBER CORE: ONLINE' : 'CYBER CORE: STANDBY'}
        </span>
      </motion.button>

      {/* ── CENTRAL FLOATING 3D GLASS HUD PANEL ── */}
      <AnimatePresence>
        {isOn && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            className="relative z-20 w-full max-w-[420px] px-4"
          >
            <div
              ref={cardRef}
              style={{
                perspective: 1400,
                transformStyle: 'preserve-3d'
              }}
            >
              <div
                className="relative w-full rounded-[30px] p-[1.5px] transition-transform duration-150 ease-out"
                style={{
                  background: `linear-gradient(145deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.05) 40%, ${currentTheme.primary}40 100%)`,
                  boxShadow: `0 35px 90px rgba(0,0,0,0.85), 0 0 60px ${currentTheme.primary}30`,
                  transform: `perspective(1400px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                  transition: isHovered ? 'none' : 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)'
                }}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={handleMouseLeave}
              >
                {/* Frosted Glass Container Inner */}
                <div
                  className="relative w-full rounded-[28.5px] px-8 py-9 overflow-hidden backdrop-blur-[36px] saturate-[190%]"
                  style={{
                    background: 'linear-gradient(155deg, rgba(14, 16, 32, 0.72) 0%, rgba(6, 7, 16, 0.88) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  {/* Subtle Scanning Light Sweep */}
                  <div
                    className="absolute -top-[100px] left-0 right-0 h-[100px] pointer-events-none opacity-40 animate-[scan_6s_ease-in-out_infinite]"
                    style={{
                      background: `linear-gradient(180deg, transparent, ${currentTheme.primary}30, transparent)`
                    }}
                  />

                  {/* Header Eyebrow */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 font-mono text-[10.5px] tracking-widest uppercase" style={{ color: currentTheme.primary }}>
                      <span className="w-2 h-2 rounded-full animate-ping" style={{ background: currentTheme.primary, boxShadow: `0 0 10px ${currentTheme.primary}` }} />
                      AETHER AI CORE // SECURE
                    </div>
                    <Shield className="w-4 h-4 opacity-60" style={{ color: currentTheme.primary }} />
                  </div>

                  {/* Title & Subtitle */}
                  <h1
                    className="font-mono font-extrabold text-3xl sm:text-4xl tracking-tight mb-1.5 bg-clip-text text-transparent"
                    style={{
                      backgroundImage: `linear-gradient(100deg, #ffffff 10%, ${currentTheme.light} 50%, ${currentTheme.primary} 90%)`,
                      filter: `drop-shadow(0 0 20px ${currentTheme.primary}40)`
                    }}
                  >
                    WELCOME
                  </h1>
                  <p className="font-mono text-xs tracking-wider mb-6 text-slate-300 opacity-80">
                    BHAVYA'S AI ASSISTANT IS READY
                  </p>

                  {/* Floating Logo Badge */}
                  <div
                    className="absolute top-7 right-7 w-12 h-12 rounded-2xl p-[1.5px] shadow-lg flex items-center justify-center overflow-hidden animate-[floatLogo_4s_ease-in-out_infinite]"
                    style={{
                      background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                      boxShadow: `0 0 20px ${currentTheme.primary}60`
                    }}
                  >
                    <div className="w-full h-full rounded-[14px] bg-slate-950/80 backdrop-blur-md flex items-center justify-center overflow-hidden">
                      {logoError ? (
                        <img src={fallbackUrl} alt="AI Core" className="w-3/4 h-3/4 object-contain" />
                      ) : (
                        <img
                          src={logoUrl}
                          alt="AI Logo"
                          onError={() => setLogoError(true)}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="cyber-username" className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase mb-2" style={{ color: currentTheme.primary }}>
                        <Cpu className="w-3.5 h-3.5" />
                        <span>OPERATOR USERNAME</span>
                      </label>
                      <input
                        id="cyber-username"
                        ref={usernameInputRef}
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="Enter your name..."
                        required
                        className="w-full px-4 py-3.5 rounded-xl bg-white/[0.05] backdrop-blur-md border border-white/15 text-white font-sans text-sm outline-none transition-all duration-200 placeholder:text-slate-500"
                        style={{
                          caretColor: currentTheme.primary
                        }}
                        onFocus={e => {
                          e.target.style.borderColor = currentTheme.primary;
                          e.target.style.boxShadow = `0 0 25px ${currentTheme.primary}35`;
                        }}
                        onBlur={e => {
                          e.target.style.borderColor = 'rgba(255,255,255,0.15)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      className="group relative w-full py-4 px-6 rounded-xl font-mono font-bold text-xs tracking-widest text-slate-950 uppercase cursor-pointer overflow-hidden transition-all duration-300 flex items-center justify-center gap-2"
                      style={{
                        background: `linear-gradient(135deg, ${currentTheme.secondary}, ${currentTheme.primary} 60%, ${currentTheme.light})`,
                        boxShadow: `0 10px 35px ${currentTheme.primary}60`
                      }}
                    >
                      <span className="relative z-10 font-black">ENTER ASSISTANT</span>
                      <ArrowRight className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </button>
                  </form>

                  {/* Telemetry Visualizer Bars */}
                  <div className="flex items-center justify-center gap-1.5 mt-6 h-4">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 rounded-full animate-bounce"
                        style={{
                          height: `${Math.sin(i * 0.8) * 8 + 12}px`,
                          animationDelay: `${i * 0.12}s`,
                          background: currentTheme.primary,
                          boxShadow: `0 0 8px ${currentTheme.primary}`
                        }}
                      />
                    ))}
                  </div>

                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes scan {
          0% { top: -100px; }
          50% { top: 100%; }
          100% { top: -100px; }
        }
        @keyframes floatLogo {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
