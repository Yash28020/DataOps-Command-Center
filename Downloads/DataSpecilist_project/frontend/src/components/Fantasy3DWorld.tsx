import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Fantasy3DWorldProps {
  reducedEffects?: boolean;
}

export const Fantasy3DWorld: React.FC<Fantasy3DWorldProps> = ({ reducedEffects = false }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [is3DReady, setIs3DReady] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // --- SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070B24, 0.001);

    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    camera.position.set(0, 15, 120);

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      container.appendChild(renderer.domElement);
      setIs3DReady(true);
    } catch (e) {
      console.warn('WebGL not supported, falling back to CSS cosmic gradient', e);
      return;
    }

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0x211044, 2.0);
    scene.add(ambientLight);

    const cyanDirLight = new THREE.DirectionalLight(0x54E8FF, 3.0);
    cyanDirLight.position.set(-150, 200, 100);
    scene.add(cyanDirLight);

    const goldPointLight = new THREE.PointLight(0xFFD98A, 4.0, 600);
    goldPointLight.position.set(120, 80, -50);
    scene.add(goldPointLight);

    const violetPointLight = new THREE.PointLight(0x9B7CFF, 3.0, 500);
    violetPointLight.position.set(-100, -40, -80);
    scene.add(violetPointLight);

    // --- 1. GIGANTIC LUMINOUS PLANET IN THE DISTANCE ---
    const planetGroup = new THREE.Group();
    planetGroup.position.set(180, 80, -380);

    // Planet Body
    const planetGeo = new THREE.SphereGeometry(65, 48, 48);
    const planetMat = new THREE.MeshStandardMaterial({
      color: 0x1E1452,
      emissive: 0x3E1888,
      emissiveIntensity: 0.6,
      roughness: 0.4,
      metalness: 0.3,
    });
    const planet = new THREE.Mesh(planetGeo, planetMat);
    planetGroup.add(planet);

    // Atmospheric Glow Ring
    const ringGeo = new THREE.RingGeometry(85, 125, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x54E8FF,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.3;
    ring.rotation.y = Math.PI / 6;
    planetGroup.add(ring);

    // Outer faint aura
    const auraGeo = new THREE.SphereGeometry(72, 32, 32);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x7547F5,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    const aura = new THREE.Mesh(auraGeo, auraMat);
    planetGroup.add(aura);

    scene.add(planetGroup);

    // --- 2. FLOATING CELESTIAL ISLANDS ---
    const islandsGroup = new THREE.Group();

    // Helper to generate fantasy floating island
    const createFloatingIsland = (
      x: number, y: number, z: number,
      scale: number,
      hasCastle = false,
      hasWaterfall = false
    ) => {
      const island = new THREE.Group();
      island.position.set(x, y, z);
      island.scale.set(scale, scale, scale);

      // Top plateau (Green/violet crystal terrace)
      const topGeo = new THREE.CylinderGeometry(18, 14, 5, 8);
      const topMat = new THREE.MeshStandardMaterial({
        color: 0x2A1B6B,
        emissive: 0x1A0F45,
        roughness: 0.6,
      });
      const top = new THREE.Mesh(topGeo, topMat);
      island.add(top);

      // Bottom craggy inverted mountain
      const bottomGeo = new THREE.ConeGeometry(15, 28, 8);
      const bottomMat = new THREE.MeshStandardMaterial({
        color: 0x130C36,
        roughness: 0.8,
        flatShading: true,
      });
      const bottom = new THREE.Mesh(bottomGeo, bottomMat);
      bottom.rotation.x = Math.PI;
      bottom.position.y = -14;
      island.add(bottom);

      // Floating Crystal Monoliths
      for (let i = 0; i < 4; i++) {
        const crystalGeo = new THREE.OctahedronGeometry(2 + Math.random() * 2, 0);
        const crystalMat = new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? 0x54E8FF : 0xFFD98A,
          emissive: i % 2 === 0 ? 0x54E8FF : 0xFFD98A,
          emissiveIntensity: 0.8,
          roughness: 0.1,
          metalness: 0.9,
        });
        const crystal = new THREE.Mesh(crystalGeo, crystalMat);
        const angle = (i / 4) * Math.PI * 2;
        crystal.position.set(Math.cos(angle) * 11, 4 + Math.random() * 3, Math.sin(angle) * 11);
        island.add(crystal);
      }

      // Fantasy Castle Spires
      if (hasCastle) {
        const castleGroup = new THREE.Group();
        // Central Keep
        const keepGeo = new THREE.CylinderGeometry(4, 5, 14, 8);
        const keepMat = new THREE.MeshStandardMaterial({
          color: 0x392288,
          roughness: 0.5,
        });
        const keep = new THREE.Mesh(keepGeo, keepMat);
        keep.position.y = 8;
        castleGroup.add(keep);

        // Tower Roof Spire
        const roofGeo = new THREE.ConeGeometry(5, 10, 8);
        const roofMat = new THREE.MeshStandardMaterial({
          color: 0x7547F5,
          emissive: 0x54E8FF,
          emissiveIntensity: 0.4,
          roughness: 0.2,
        });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 19;
        castleGroup.add(roof);

        // Flanking Towers
        for (let t = -1; t <= 1; t += 2) {
          const towerGeo = new THREE.CylinderGeometry(2, 2.5, 10, 6);
          const tower = new THREE.Mesh(towerGeo, keepMat);
          tower.position.set(t * 7, 6, 0);

          const towerSpire = new THREE.Mesh(roofGeo, roofMat);
          towerSpire.scale.set(0.6, 0.7, 0.6);
          towerSpire.position.set(t * 7, 14, 0);

          castleGroup.add(tower);
          castleGroup.add(towerSpire);
        }

        // Castle Glowing Beacon
        const beaconGeo = new THREE.SphereGeometry(1.5, 16, 16);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xFFD98A });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.y = 25;
        castleGroup.add(beacon);

        island.add(castleGroup);
      }

      // Luminous Waterfall (Falling light particles)
      if (hasWaterfall) {
        const fallGeo = new THREE.CylinderGeometry(1.2, 0.4, 22, 8, 1, true);
        const fallMat = new THREE.MeshBasicMaterial({
          color: 0x54E8FF,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide,
        });
        const fall = new THREE.Mesh(fallGeo, fallMat);
        fall.position.set(13, -8, 2);
        fall.rotation.z = -0.15;
        island.add(fall);
      }

      // Magical Orbiting Energy Ring
      const ringEnergyGeo = new THREE.TorusGeometry(22, 0.3, 8, 48);
      const ringEnergyMat = new THREE.MeshBasicMaterial({
        color: 0x7547F5,
        transparent: true,
        opacity: 0.4,
      });
      const ringEnergy = new THREE.Mesh(ringEnergyGeo, ringEnergyMat);
      ringEnergy.rotation.x = Math.PI / 3;
      island.add(ringEnergy);

      return island;
    };

    // Island 1: Midground Left with Castle & Luminous Waterfall
    const island1 = createFloatingIsland(-90, 15, -120, 1.2, true, true);
    islandsGroup.add(island1);

    // Island 2: Foreground Right with Crystal Obelisks
    const island2 = createFloatingIsland(95, -10, -80, 1.0, false, false);
    islandsGroup.add(island2);

    // Island 3: Distant High Center with Towering Spire
    const island3 = createFloatingIsland(10, 45, -220, 1.6, true, false);
    islandsGroup.add(island3);

    // Island 4: Lower Left Floating Sanctuary
    const island4 = createFloatingIsland(-140, -35, -160, 0.9, false, true);
    islandsGroup.add(island4);

    scene.add(islandsGroup);

    // --- 3. COSMIC STARDUST & TWINKLING PARTICLES (2,500 particles) ---
    const starCount = reducedEffects ? 800 : 2500;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const palette = [
      new THREE.Color(0x54E8FF), // Electric cyan
      new THREE.Color(0xFFD98A), // Enchanted gold
      new THREE.Color(0xB99AFF), // Magical lavender
      new THREE.Color(0xF6F4FF), // Crystal white
    ];

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 800;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 500;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 800 - 100;

      const col = palette[Math.floor(Math.random() * palette.length)];
      starColors[i * 3] = col.r;
      starColors[i * 3 + 1] = col.g;
      starColors[i * 3 + 2] = col.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // --- 4. SHOOTING STARS / COMETS ---
    const comets: { mesh: THREE.Mesh; speed: number; dir: THREE.Vector3 }[] = [];
    for (let c = 0; c < 3; c++) {
      const cometGeo = new THREE.SphereGeometry(1.2, 8, 8);
      const cometMat = new THREE.MeshBasicMaterial({ color: 0x54E8FF });
      const cometMesh = new THREE.Mesh(cometGeo, cometMat);
      cometMesh.position.set(
        -300 + Math.random() * 200,
        150 + Math.random() * 100,
        -150 - Math.random() * 100
      );
      scene.add(cometMesh);
      comets.push({
        mesh: cometMesh,
        speed: 2.5 + Math.random() * 2.0,
        dir: new THREE.Vector3(1, -0.4, 0.2).normalize(),
      });
    }

    // --- MOUSE PARALLAX & CAMERA SWAY ---
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    const onWindowResize = () => {
      if (!renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onWindowResize);

    // --- ANIMATION LOOP ---
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Camera gentle sway + mouse parallax
      targetX = mouseX * 25;
      targetY = mouseY * 15;
      camera.position.x += (targetX - camera.position.x) * 0.03;
      camera.position.y += (targetY + 15 + Math.sin(elapsedTime * 0.4) * 3 - camera.position.y) * 0.03;
      camera.lookAt(0, 10, -100);

      // Planet rotation & gentle float
      planetGroup.rotation.y = elapsedTime * 0.03;
      ring.rotation.z = elapsedTime * 0.015;

      // Floating Islands natural floating motion
      island1.position.y = 15 + Math.sin(elapsedTime * 0.8) * 3;
      island1.rotation.y = Math.sin(elapsedTime * 0.2) * 0.05;

      island2.position.y = -10 + Math.sin(elapsedTime * 0.7 + 1.5) * 2.5;
      island2.rotation.y = Math.cos(elapsedTime * 0.25) * 0.06;

      island3.position.y = 45 + Math.cos(elapsedTime * 0.6 + 2.0) * 3.5;
      island4.position.y = -35 + Math.sin(elapsedTime * 0.9 + 0.8) * 2.8;

      // Stardust gentle drift
      starField.rotation.y = elapsedTime * 0.008;
      starField.rotation.x = Math.sin(elapsedTime * 0.005) * 0.02;

      // Animate shooting comets
      comets.forEach((c) => {
        c.mesh.position.addScaledVector(c.dir, c.speed);
        if (c.mesh.position.x > 350 || c.mesh.position.y < -150) {
          c.mesh.position.set(-300 - Math.random() * 100, 180 + Math.random() * 80, -200);
        }
      });

      if (renderer) {
        renderer.render(scene, camera);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onWindowResize);
      if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, [reducedEffects]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Three.js 3D Interactive Canvas */}
      <div ref={mountRef} className="absolute inset-0 z-0" />

      {/* Atmospheric Fantasy Overlay Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-fantasy-midnight/40 via-transparent to-fantasy-midnight/80 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-gradient-to-br from-nebula/20 via-cyan-accent/10 to-transparent blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-32 -right-32 w-[650px] h-[650px] bg-gradient-to-tl from-lavender-accent/15 via-gold-accent/10 to-transparent blur-[160px] pointer-events-none rounded-full" />
    </div>
  );
};
