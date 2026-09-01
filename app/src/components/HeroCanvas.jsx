import { useEffect, useRef } from 'react';

/**
 * The 3D scene behind the hero: two nested wireframe icosahedrons
 * surrounded by orbiting nodes, all rotating gently toward the cursor.
 *
 * Performance notes:
 *  - three.js is imported dynamically, so it lands in its own chunk
 *    and never blocks first paint.
 *  - The scene is skipped entirely on small screens and when the user
 *    prefers reduced motion.
 *  - Rendering pauses when the canvas scrolls out of view.
 */
export default function HeroCanvas() {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const smallScreen = window.matchMedia('(max-width: 767px)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (smallScreen || reduced) return undefined;

    let disposed = false;
    let cleanup = () => {};

    import('three')
      .then((THREE) => {
        if (disposed || !hostRef.current) return;

        const width = host.clientWidth;
        const height = host.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
        camera.position.z = 13;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        host.appendChild(renderer.domElement);

        const group = new THREE.Group();
        scene.add(group);

        const outerGeo = new THREE.IcosahedronGeometry(3.4, 1);
        const outerMat = new THREE.MeshBasicMaterial({
          color: 0x3d2ef5,
          wireframe: true,
          transparent: true,
          opacity: 0.16,
        });
        const outer = new THREE.Mesh(outerGeo, outerMat);
        group.add(outer);

        const innerGeo = new THREE.IcosahedronGeometry(2.2, 0);
        const innerMat = new THREE.MeshBasicMaterial({
          color: 0x0b0b0d,
          wireframe: true,
          transparent: true,
          opacity: 0.14,
        });
        const inner = new THREE.Mesh(innerGeo, innerMat);
        group.add(inner);

        // Orbiting nodes
        const nodeGeo = new THREE.SphereGeometry(0.055, 10, 10);
        const nodeMat = new THREE.MeshBasicMaterial({
          color: 0x0b0b0d,
          transparent: true,
          opacity: 0.4,
        });
        const accentMat = new THREE.MeshBasicMaterial({
          color: 0x3d2ef5,
          transparent: true,
          opacity: 0.75,
        });

        const nodes = [];
        const axis = new THREE.Vector3(0, 1, 0);
        for (let i = 0; i < 150; i += 1) {
          const mesh = new THREE.Mesh(nodeGeo, i % 9 === 0 ? accentMat : nodeMat);
          const r = 4.6 + Math.random() * 5.4;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          mesh.position.set(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta) * 0.6,
            r * Math.cos(phi)
          );
          mesh.userData = {
            speed: 0.0006 + Math.random() * 0.0016,
            offset: Math.random() * Math.PI * 2,
          };
          group.add(mesh);
          nodes.push(mesh);
        }

        let pointerX = 0;
        let pointerY = 0;
        const onMove = (e) => {
          pointerX = e.clientX / window.innerWidth - 0.5;
          pointerY = e.clientY / window.innerHeight - 0.5;
        };
        window.addEventListener('mousemove', onMove, { passive: true });

        // Pause the render loop when the hero is off screen.
        let visible = true;
        const visObserver = new IntersectionObserver(
          ([entry]) => {
            visible = entry.isIntersecting;
          },
          { threshold: 0 }
        );
        visObserver.observe(host);

        let frame;
        let t = 0;
        const tick = () => {
          frame = requestAnimationFrame(tick);
          if (!visible) return;

          t += 0.008;
          outer.rotation.x += 0.0013;
          outer.rotation.y += 0.0021;
          inner.rotation.x -= 0.0026;
          inner.rotation.y -= 0.0017;

          nodes.forEach((n) => {
            n.position.applyAxisAngle(axis, n.userData.speed);
            n.position.y += Math.sin(t + n.userData.offset) * 0.0016;
          });

          group.rotation.y += (pointerX * 0.5 - group.rotation.y) * 0.03;
          group.rotation.x += (pointerY * 0.32 - group.rotation.x) * 0.03;

          renderer.render(scene, camera);
        };
        tick();

        const onResize = () => {
          if (!hostRef.current) return;
          const w = host.clientWidth;
          const h = host.clientHeight;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        window.addEventListener('resize', onResize);

        cleanup = () => {
          cancelAnimationFrame(frame);
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('resize', onResize);
          visObserver.disconnect();

          outerGeo.dispose();
          innerGeo.dispose();
          nodeGeo.dispose();
          outerMat.dispose();
          innerMat.dispose();
          nodeMat.dispose();
          accentMat.dispose();
          renderer.dispose();

          if (renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
          }
        };
      })
      .catch(() => {
        // three.js failed to load — the hero still works without it.
      });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <div ref={hostRef} aria-hidden="true" className="absolute inset-0 z-0" />;
}
