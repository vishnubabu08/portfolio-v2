import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function createSoldierScene() {
  const group = new THREE.Group();

  // --- MATS (Keep for particles/lighting) ---
  // ... (Materials are less critical now as we use the model's mats, but keeping for particles)

  // --- GHOST HEAD MODEL ---
  const headGroup = new THREE.Group();
  group.add(headGroup);

  const loader = new GLTFLoader();
  // Path relative to /public
  const modelPath = '/ghost-mask (1)/source/Head2.glb';

  loader.load(modelPath, (gltf) => {
    const model = gltf.scene;

    // Scale and Position
    const isMobile = window.innerWidth < 768;
    const scale = isMobile ? 6.0 : 10.0;
    model.scale.set(scale, scale, scale);
    model.position.set(0, -8.0, 0);

    // Traverse to fix materials
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material) {
          // KEY FIXES FOR TEXTURES/HOLLOWS:
          child.material.transparent = false;       // Disable transparency
          child.material.format = THREE.RGBAFormat; // Ensure format
          child.material.side = THREE.DoubleSide;   // Render both sides
          child.material.depthWrite = true;         // Force depth writing

          // Reset PBR slightly to ensure visibility if textures are dark
          child.material.metalness = 0.5;
          child.material.roughness = 0.4;
          child.material.envMapIntensity = 1.0; // Reduced to 1.0 (Dimm)

          child.material.needsUpdate = true;
        }
      }
    });

    headGroup.add(model);
  }, undefined, (error) => {
    console.error('An error occurred loading the Ghost model:', error);
  });


  // --- 1. AMBIENT PARTICLES (Reverted to Original) ---
  const particlesCount = 200;
  const posArray = new Float32Array(particlesCount * 3);

  for (let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 5;
  }

  const particlesGeo = new THREE.BufferGeometry();
  particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

  const particlesMat = new THREE.PointsMaterial({
    size: 0.02,
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  });

  const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
  group.add(particlesMesh); // Stays in world space


  // --- 2. GHOST MASK PARTICLES (New, Attached to Head) ---
  const maskParticlesCount = 600;
  const maskPosArray = new Float32Array(maskParticlesCount * 3);

  for (let i = 0; i < maskParticlesCount * 3; i += 3) {
    // Spread around the mask which is at (0, -8.0, 0) inside headGroup
    // INCREASED SPREAD (Wider and Taller)
    maskPosArray[i] = (Math.random() - 0.5) * 15;     // X spread (was 8)
    maskPosArray[i + 1] = ((Math.random() - 0.5) * 15) - 8.0; // Y centered at -8.0 (spread was 10)
    maskPosArray[i + 2] = (Math.random() - 0.5) * 15;     // Z spread (was 8)
  }

  const maskParticlesGeo = new THREE.BufferGeometry();
  maskParticlesGeo.setAttribute('position', new THREE.BufferAttribute(maskPosArray, 3));

  // Reuse material or create new one if needed (sharing for performance)
  const maskParticlesMesh = new THREE.Points(maskParticlesGeo, particlesMat);
  headGroup.add(maskParticlesMesh); // Moves with the head


  // --- LIGHTING ---
  const rimLight = new THREE.SpotLight(0x00f0ff, 10); // Reduced to 10
  rimLight.position.set(-2, 3, -2);
  rimLight.lookAt(0, 0, 0);
  group.add(rimLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1); // Reduced to 1
  keyLight.position.set(2, 2, 5);
  group.add(keyLight);

  const fillLight = new THREE.AmbientLight(0x404040, 0.5); // Reduced to 0.5
  group.add(fillLight);


  // --- ANIMATION LOOP EXPORT ---
  group.userData.update = (time) => {
    // 1. Floating (Idle)
    headGroup.position.y = Math.sin(time * 0.8) * 0.05;

    // 2. Slow Rotation (Character Select)
    headGroup.rotation.y = Math.sin(time * 0.2) * 0.3;

    // 3. Micro Movements
    headGroup.rotation.x = Math.sin(time * 0.5) * 0.05;

    // Update Ambient Particles
    const positions = particlesMesh.geometry.attributes.position.array;
    for (let i = 0; i < particlesCount; i++) {
      let i3 = i * 3;
      positions[i3 + 1] += 0.001;
      if (positions[i3 + 1] > 2.5) positions[i3 + 1] = -1;
    }
    particlesMesh.geometry.attributes.position.needsUpdate = true;

    // Update Ghost Particles
    const maskPositions = maskParticlesMesh.geometry.attributes.position.array;
    for (let i = 0; i < maskParticlesCount; i++) {
      let i3 = i * 3;
      maskPositions[i3 + 1] += 0.005; // Float faster
      // Reset check: Range is approx -13 to -3
      if (maskPositions[i3 + 1] > -3.0) maskPositions[i3 + 1] = -13.0; // Reset to bottom
    }
    maskParticlesMesh.geometry.attributes.position.needsUpdate = true;
  };

  return group;
}
