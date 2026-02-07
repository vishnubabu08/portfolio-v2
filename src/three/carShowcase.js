import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

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

    // LAZY LOAD LOGIC - Triggered by IntersectionObserver
    group.userData.loadModel = (onLoadCallback) => {
        const loader = new GLTFLoader();

        // Setup Draco Loader
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('/draco/');
        loader.setDRACOLoader(dracoLoader);

        // Path relative to /public
        const modelPath = '/custom-bugatti-bolide-concept-2020/source/bugatti-optimized.glb';

        loader.load(modelPath, (gltf) => {
            const model = gltf.scene;

            // Initial transforms
            const isMobile = window.innerWidth < 768;
            const scale = isMobile ? 0.45 : 0.8;
            model.scale.set(scale, scale, scale);
            model.position.set(0, 0, 0);

            // Enhance Materials & Optimize Shadows
            model.traverse((child) => {
                if (child.isMesh) {
                    // OPTIMIZATION: Only cast shadows from the Body, not every screw
                    // We check if geometry is large enough or just enable for everything if name check is hard.
                    // For now, let's keep it simple but maybe disable for very small objects if we could.
                    // Actually, simple bounding sphere check?
                    if (child.geometry.boundingSphere && child.geometry.boundingSphere.radius > 0.5) {
                        child.castShadow = true;
                    } else {
                        child.castShadow = false;
                    }
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


    // --- LIGHTING (Garage specific) ---
    // Ceiling Lights - OPTIMIZED: Replaced RectAreaLight (Expensive) with PointLight (Cheap)
    const glowMaterial = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    for (let i = 0; i < 3; i++) {
        // Visual Strips
        const stripGeo = new THREE.BoxGeometry(0.5, 0.1, 10);
        const stripMesh = new THREE.Mesh(stripGeo, glowMaterial);
        stripMesh.position.set((i - 1) * 5, 6, 0);
        group.add(stripMesh);

        // Optimized Light Source (Point instead of Rect)
        const pointLight = new THREE.PointLight(0x00f0ff, 15, 10); // Decay distance 10
        pointLight.position.set((i - 1) * 5, 5.0, 0);
        group.add(pointLight);
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
    keyLight.castShadow = true; // Only this main light casts shadow
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    group.add(keyLight);

    const fillLight = new THREE.SpotLight(0x00f0ff, 6); // Balanced to 6
    fillLight.position.set(-5, 4, -5);
    fillLight.lookAt(0, 0, 0);
    group.add(fillLight);

    return group;
}
