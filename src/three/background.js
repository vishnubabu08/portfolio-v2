import * as THREE from 'three';

export function createBackgroundParticles() {
    const particlesCount = 18000; // Increased to 18000 for density behind details
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i += 3) {
        // Spread across a very large area to cover the camera movement
        posArray[i] = (Math.random() - 0.5) * 100;   // X: Wider
        posArray[i + 1] = (Math.random() - 0.5) * 80 - 20; // Y: Shifted down (-60 to +20)
        posArray[i + 2] = (Math.random() - 0.5) * 60; // Z: Deeper
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMat = new THREE.PointsMaterial({
        size: 0.05,      // Maintained size
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
            positions[i3 + 1] += 0.015; // Slowed down from 0.05 (Smoother flow)

            // Loop vertically (Reset to bottom)
            if (positions[i3 + 1] > 20) {
                positions[i3 + 1] = -60;
            }
        }
        particlesMesh.geometry.attributes.position.needsUpdate = true;
    };

    return particlesMesh;
}
