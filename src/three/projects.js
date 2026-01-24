import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

export function initProjects() {
    // Shared Loaders
    const gltfLoader = new GLTFLoader();
    const fbxLoader = new FBXLoader();
    const objLoader = new OBJLoader();
    const mtlLoader = new MTLLoader();

    // Helper: Unified Model Loader
    const loadModel = (path, scene, onLoaded) => {
        const extension = path.split('.').pop().toLowerCase();
        const loader = extension === 'fbx' ? fbxLoader : gltfLoader;

        loader.load(
            path,
            (loadedAsset) => {
                let model;
                let mixer = null;

                if (extension === 'fbx') {
                    model = loadedAsset;
                    if (model.animations && model.animations.length > 0) {
                        mixer = new THREE.AnimationMixer(model);
                        const action = mixer.clipAction(model.animations[0]);
                        action.play();
                    }
                } else {
                    model = loadedAsset.scene;
                    if (loadedAsset.animations && loadedAsset.animations.length > 0) {
                        mixer = new THREE.AnimationMixer(model);
                        const action = mixer.clipAction(loadedAsset.animations[0]);
                        action.play();
                    }
                }

                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        if (child.material) {
                            child.material.transparent = false;
                            child.material.alphaTest = 0.5;
                            child.material.depthWrite = true;
                            child.material.side = THREE.DoubleSide;
                        }
                    }
                });

                // Standardize Model Size & Position
                const box = new THREE.Box3().setFromObject(model);
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);

                const targetScale = 4.5 / maxDim;
                model.scale.set(targetScale, targetScale, targetScale);

                const center = box.getCenter(new THREE.Vector3());
                model.position.x = -center.x * targetScale;
                model.position.y = -2.0;
                model.position.z = -center.z * targetScale;

                scene.add(model);
                console.log(`Model loaded from ${path}`);

                if (onLoaded) onLoaded(model, mixer);
            },
            undefined,
            (error) => {
                console.warn(`Failed to load model at ${path}. Using placeholder.`, error);
            }
        );
    };

    // Shooter Project (Ghost Only - Centered)
    create3DViewer('project-shooter-canvas', (scene) => {
        let model = null;
        let mixer = null;
        const placeholder = createPlaceholder(scene, 0x00ff00);

        loadModel('/models/ghost-simon-riley-fully-customizable-free (1)/source/ghost1.glb', scene, (loadedModel, loadedMixer) => {
            scene.remove(placeholder);
            model = loadedModel;
            mixer = loadedMixer;

            // Ghost Specific Adjustments
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetScale = 11.0 / maxDim;
            model.scale.set(targetScale, targetScale, targetScale);

            const center = box.getCenter(new THREE.Vector3());
            model.position.x = -center.x * targetScale; // Centered
            model.position.y = -center.y * targetScale - 1.8; // Raised slightly (Offset -1.8)
            model.position.z = -center.z * targetScale;
        });

        return (time, delta) => {
            if (model) {
                if (mixer) mixer.update(delta);
                else model.rotation.y = time * 0.5; // Auto-rotation RESTORED
            } else {
                placeholder.rotation.y = time * 0.5;
            }
        };
    });

    // Car Project (New Toyota Supra FBX Only - Centered)
    create3DViewer('project-car-canvas', (scene) => {
        let model = null;
        let mixer = null;
        const placeholder = createPlaceholder(scene, 0xff0000);

        // Load NEW Toyota Supra FBX
        const newSupraPath = '/toyota-supra-mk4-a80/source/TOYOTA_SUPRA_MK4/SOURCE/TOYOTA_SUPRA_MK/TOYOTA_SUPRA_MK.fbx';

        loadModel(newSupraPath, scene, (loadedModel, loadedMixer) => {
            if (scene.children.includes(placeholder)) scene.remove(placeholder);

            model = loadedModel;
            mixer = loadedMixer;

            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);

            // Adjusted scale to 0.05
            const targetScale = 0.05 / maxDim;
            model.scale.set(targetScale, targetScale, targetScale);

            const center = box.getCenter(new THREE.Vector3());
            model.position.x = -center.x * targetScale; // Centered X
            model.position.y = -center.y * targetScale - 1.2; // Raised (Offset -1.2)
            model.position.z = -center.z * targetScale;
        });

        return (time, delta) => {
            if (model) {
                model.rotation.y = time * 0.5; // Auto-rotation RESTORED
            }
            if (mixer) mixer.update(delta);

            if (!model) {
                placeholder.rotation.y = time * 0.3;
            }
        };
    });
}

function createPlaceholder(scene, color) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
        color: color,
        wireframe: true,
        emissive: color,
        emissiveIntensity: 0.2
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    return mesh;
}

function create3DViewer(containerId, initScene) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.z = 5;
    camera.position.y = 1;
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(2, 5, 5);
    scene.add(dirLight);

    const animateCallback = initScene(scene);
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime();
        const delta = clock.getDelta();
        if (animateCallback) animateCallback(time, delta);
        renderer.render(scene, camera);
    }
    animate();

    const resizeObserver = new ResizeObserver(() => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
    resizeObserver.observe(container);
}
