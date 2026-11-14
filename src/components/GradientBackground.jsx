import { useEffect, useRef } from 'react';

/**
 * GradientBackground — ports the 3D shader blob background from
 * 3d-gradient-background.html into a React component using Three.js via CDN.
 * Renders a fixed canvas behind all UI content.
 */
export default function GradientBackground() {
  const canvasRef = useRef(null);
  const cleanupRef = useRef(null);

  useEffect(() => {
    // Skip if user prefers reduced motion
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return;

    // Load Three.js from CDN if not already loaded
    const loadThree = () =>
      new Promise((resolve) => {
        if (window.THREE) { resolve(window.THREE); return; }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.onload = () => resolve(window.THREE);
        document.head.appendChild(script);
      });

    let animId;
    let renderer;

    loadThree().then((THREE) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        100
      );
      camera.position.z = 6;

      const geometry = new THREE.PlaneGeometry(20, 12, 1, 1);

      const uniforms = {
        u_time:       { value: 0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_colorA:     { value: new THREE.Color('#000000') }, // background pure black
        u_colorB:     { value: new THREE.Color('#18181b') }, // dark zinc
        u_colorC:     { value: new THREE.Color('#27272a') }, // medium zinc
        u_colorD:     { value: new THREE.Color('#111111') }, // deep black
      };

      const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          precision highp float;
          varying vec2 vUv;
          uniform float u_time;
          uniform vec2 u_resolution;
          uniform vec3 u_colorA;
          uniform vec3 u_colorB;
          uniform vec3 u_colorC;
          uniform vec3 u_colorD;

          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
          }
          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
              mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
              u.y
            );
          }
          float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 5; i++) {
              v += a * noise(p);
              p *= 2.0;
              a *= 0.5;
            }
            return v;
          }

          void main() {
            vec2 uv = vUv;
            vec2 aspectCorrected = uv;
            aspectCorrected.x *= u_resolution.x / u_resolution.y;

            float t = u_time * 0.05;

            float n1 = fbm(aspectCorrected * 1.6 + vec2(t * 1.3, -t));
            float n2 = fbm(aspectCorrected * 1.9 - vec2(-t * 0.7, t * 1.1) + 4.2);
            float blend = fbm(aspectCorrected * 1.1 + vec2(t * 0.4, t * 0.6));

            vec3 col = u_colorA;
            col = mix(col, u_colorD, smoothstep(0.2, 0.7, n1));
            col = mix(col, u_colorB, smoothstep(0.35, 0.85, n2) * 0.9);
            col = mix(col, u_colorC, smoothstep(0.55, 0.95, blend) * 0.6);

            float vig = smoothstep(1.1, 0.2, length(uv - 0.5));
            col *= mix(0.7, 1.0, vig);

            gl_FragColor = vec4(col, 1.0);
          }
        `,
      });

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      const handleResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        uniforms.u_resolution.value.set(w, h);
      };
      window.addEventListener('resize', handleResize);

      const clock = new THREE.Clock();
      const animate = () => {
        uniforms.u_time.value = clock.getElapsedTime();
        renderer.render(scene, camera);
        animId = requestAnimationFrame(animate);
      };
      animate();

      cleanupRef.current = () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', handleResize);
        renderer.dispose();
        geometry.dispose();
        material.dispose();
      };
    });

    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        display: 'block',
        pointerEvents: 'none',
      }}
    />
  );
}
