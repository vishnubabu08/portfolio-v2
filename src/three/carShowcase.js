import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function createCarShowcase(loadingManager) {
    const group = new THREE.Group();

    // --- GARAGE ENVIRONMENT (Floor) ---
    // Floor (Reflective)
    const floorGeo = new THREE.PlaneGeometry(40, 40);
    const floorMat = new THREE.MeshBasicMaterial({
        color: 0x000000, // Pure Black (Unlit)
        side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(floor);

    // Grid / Neon Lines on Floor
    const gridHelper = new THREE.GridHelper(40, 20, 0x00f0ff, 0x111111);
    gridHelper.position.y = 0.01;
    group.add(gridHelper);

    // --- CAR MODEL ---
    const carGroup = new THREE.Group();
    group.add(carGroup);

    // Attach to userData so SceneManager can rotate it
    group.userData.carModel = carGroup;

    // --- SOLAR SYSTEM PLACEHOLDER ---
    let solarSystem = new THREE.Group();

    function createSolarSystem() {
        const sysGroup = new THREE.Group();

        // Sun (Solid Neon Core)
        const sunGeo = new THREE.SphereGeometry(1.5, 64, 64);
        const sunMat = new THREE.MeshStandardMaterial({
            color: 0x00f0ff,
            emissive: 0x00aaff,
            emissiveIntensity: 2,
            roughness: 0.1,
            metalness: 0.8
        });
        const sun = new THREE.Mesh(sunGeo, sunMat);
        sysGroup.add(sun);

        // Planet 1 (Solid)
        const p1 = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0xff00ff, roughness: 0.4, metalness: 0.6 })
        );
        p1.position.set(3, 0, 0);
        sysGroup.add(p1);

        // Planet 2 (Solid)
        const p2 = new THREE.Mesh(
            new THREE.SphereGeometry(0.6, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0x00ff00, roughness: 0.4, metalness: 0.6 })
        );
        p2.position.set(-4, 1, 2);
        sysGroup.add(p2);

        // Orbit Ring (Solid but transparent)
        const ringGeo = new THREE.TorusGeometry(3, 0.05, 16, 100);
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5,
            emissive: 0x222222
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        sysGroup.add(ring);

        return sysGroup;
    }

    solarSystem = createSolarSystem();
    solarSystem.position.set(0, 1, 0); // Slight lift
    carGroup.add(solarSystem);


    // LAZY LOAD LOGIC - Triggered by IntersectionObserver
    group.userData.loadModel = (onLoadCallback) => {
        const loader = new GLTFLoader();
        // Path relative to /public
        const modelPath = '/custom-bugatti-bolide-concept-2020/source/Custom Bugatti Bolide Concept (2020).glb';

        loader.load(modelPath, (gltf) => {
            // REMOVE PLACEHOLDER
            if (solarSystem) {
                carGroup.remove(solarSystem);
                // Optional: dispose geometries/materials
                solarSystem = null;
            }

            const model = gltf.scene;

            // Initial transforms
            const isMobile = window.innerWidth < 768;
            const scale = isMobile ? 0.45 : 0.8;
            model.scale.set(scale, scale, scale);
            model.position.set(0, 0, 0);

            // Enhance Materials
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                        child.material.envMapIntensity = 1.5;
                        child.material.needsUpdate = true;
                    }
                }
            });

            carGroup.add(model);
            if (onLoadCallback) onLoadCallback();

        }, undefined, (error) => {
            console.error('An error occurred loading the Car model:', error);
        });
    };

    // UPDATE RENDER LOOP (Rotates Solar System)
    group.userData.update = (time) => {
        if (solarSystem) {
            solarSystem.rotation.y = time * 0.5;
            solarSystem.rotation.x = Math.sin(time * 0.5) * 0.1;
        }
    };


    // --- LIGHTING (Garage specific) ---
    // Ceiling Lights
    const glowMaterial = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    for (let i = 0; i < 3; i++) {
        const stripGeo = new THREE.BoxGeometry(0.5, 0.1, 10);
        const stripMesh = new THREE.Mesh(stripGeo, glowMaterial);
        stripMesh.position.set((i - 1) * 5, 6, 0);
        group.add(stripMesh);

        const rectLight = new THREE.RectAreaLight(0x00f0ff, 15, 0.5, 10); // Balanced to 15
        rectLight.position.set((i - 1) * 5, 5.9, 0);
        rectLight.lookAt((i - 1) * 5, 0, 0);
        group.add(rectLight);
    }

    // Underglow
    const underglowLight = new THREE.PointLight(0x00f0ff, 2, 8);
    underglowLight.position.set(0, 0.2, 0);
    group.add(underglowLight);

    // Extra Key Light for visibility
    const keyLight = new THREE.SpotLight(0xffffff, 20); // Balanced to 20
    keyLight.position.set(5, 8, 5);
    keyLight.lookAt(0, 0, 0);
    keyLight.penumbra = 0.5;
    group.add(keyLight);

    const fillLight = new THREE.SpotLight(0x00f0ff, 6); // Balanced to 6
    fillLight.position.set(-5, 4, -5);
    fillLight.lookAt(0, 0, 0);
    group.add(fillLight);

    return group;
}
