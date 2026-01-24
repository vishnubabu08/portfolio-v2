import * as THREE from 'three';

export function initBackground() {
    const canvas = document.querySelector('#bg-canvas');
    if (!canvas) {
        console.error("Background canvas not found!");
        return;
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.002);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true, // Allow CSS background to show through if needed, though we set scene bg to transparent usually
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Particles
    const geometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
        // Spread particles across a wide area
        posArray[i] = (Math.random() - 0.5) * 100;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const material = new THREE.PointsMaterial({
        size: 0.15,
        color: 0x00f3ff, // Neon Cyan
        transparent: true,
        opacity: 0.8,
    });

    const particlesMesh = new THREE.Points(geometry, material);
    scene.add(particlesMesh);

    // Grid Helper (Futuristic Floor)
    const gridHelper = new THREE.GridHelper(200, 50, 0xbc13fe, 0x2a2a2a);
    gridHelper.position.y = -10;
    scene.add(gridHelper);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;

    // Target interaction values for smooth interpolation
    let targetX = 0;
    let targetY = 0;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX);
        mouseY = (event.clientY - windowHalfY);
    });

    // Animation Loop
    const clock = new THREE.Clock();

    function animate() {
        const elapsedTime = clock.getElapsedTime();

        // Rotate particles
        particlesMesh.rotation.y = elapsedTime * 0.05;
        particlesMesh.rotation.x = elapsedTime * 0.02;

        // Smooth camera movement based on mouse
        targetX = mouseX * 0.001;
        targetY = mouseY * 0.001;

        particlesMesh.rotation.y += 0.05 * (targetX - particlesMesh.rotation.y);
        particlesMesh.rotation.x += 0.05 * (targetY - particlesMesh.rotation.x);

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    animate();

    // Resize Handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

export function createBackgroundParticles() {
    const particlesCount = 6000; // Increased to 6000
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i += 3) {
        // Spread across a very large area to cover the camera movement
        posArray[i] = (Math.random() - 0.5) * 60;   // X: Wide
        posArray[i + 1] = (Math.random() - 0.5) * 60; // Y: Tall
        posArray[i + 2] = (Math.random() - 0.5) * 40; // Z: Deep
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMat = new THREE.PointsMaterial({
        size: 0.035,      // Slightly increased from 0.025
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particlesMesh = new THREE.Points(particlesGeo, particlesMat);

    // Animation function
    particlesMesh.userData.update = (time) => {
        const positions = particlesMesh.geometry.attributes.position.array;
        for (let i = 0; i < particlesCount; i++) {
            let i3 = i * 3;
            positions[i3 + 1] += 0.005; // Constant slow rise

            // Loop vertically
            if (positions[i3 + 1] > 30) {
                positions[i3 + 1] = -30;
            }
        }
        particlesMesh.geometry.attributes.position.needsUpdate = true;

        // Gentle rotation of entire system
        particlesMesh.rotation.y = time * 0.05;
    };

    return particlesMesh;
}
