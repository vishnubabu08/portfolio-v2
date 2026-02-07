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

    const loader = new GLTFLoader(loadingManager);
    // Path relative to /public
    const modelPath = '/custom-bugatti-bolide-concept-2020/source/Custom Bugatti Bolide Concept (2020).glb';

    loader.load(modelPath, (gltf) => {
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
    }, undefined, (error) => {
        console.error('An error occurred loading the Car model:', error);
    });


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
