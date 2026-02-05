import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createSoldierScene } from './soldier.js';
import { createCarShowcase } from './carShowcase.js';
import { createBackgroundParticles } from './background.js';

gsap.registerPlugin(ScrollTrigger);

export class SceneManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.init();
        this.setupScenes();
        this.setupScrollAnimations();
        this.setupInteraction();
        this.animate();

        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Parallax / Mouse
        this.mouseX = 0;
        this.mouseY = 0;
        window.addEventListener('mousemove', (e) => {
            this.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            this.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        });

        // Track target element for profile
        this.profileTarget = document.getElementById('profile-card-target');
        // Initialize Paused State
        this.isPaused = false;
    }

    stopRendering() {
        this.isPaused = true;
    }

    resumeRendering() {
        this.isPaused = false;
        // Reset time to avoid jump? Not critical for this scene.
        this.animate();
    }

    init() {
        // --- LOADING MANAGER ---
        this.loadingManager = new THREE.LoadingManager();
        const loaderScreen = document.getElementById('loading-screen');
        const loaderProgress = document.querySelector('.loader-progress');

        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            if (loaderProgress) {
                const percentage = Math.floor((itemsLoaded / itemsTotal) * 100);
                loaderProgress.innerText = `${percentage}%`;
            }
        };

        const onFinishedLoading = () => {
            // FORCE COMPILATION: Upload textures/shaders to GPU now to prevent scroll hitch later
            if (this.renderer && this.scene && this.camera) {
                // TRICK: Move camera to look at the Car (y=-30) to force renderer to compile it
                // Otherwise, if it's off-screen, compile() might skip it.
                const originalPos = this.camera.position.clone();
                const originalRot = this.camera.rotation.clone();

                // Teleport to Car Showcase
                this.camera.position.set(0, -30, 10);
                this.camera.lookAt(0, -30, 0);
                this.camera.updateMatrixWorld();

                // Compile
                this.renderer.compile(this.scene, this.camera);

                // Restore
                this.camera.position.copy(originalPos);
                this.camera.rotation.copy(originalRot);
                this.camera.updateMatrixWorld();
            }

            if (loaderScreen) {
                loaderScreen.classList.add('fade-out');
                setTimeout(() => {
                    loaderScreen.style.display = 'none';
                }, 500);
            }
        };

        this.loadingManager.onLoad = onFinishedLoading;

        // Mobile Safety: If we skip 3D models (Soldier/Car), the manager has 0 items and onLoad might not fire.
        // We force a check or timeout to clear the screen.
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            // Force completion after a short "fake load" to let UI settle
            setTimeout(onFinishedLoading, 1000);
        }

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000); // Deep Black
        this.scene.fog = new THREE.FogExp2(0x000000, 0.02);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);

        // Mobile Adjustment: Move camera back to reduce "zoom" effect in portrait mode
        // isMobile is already defined above
        this.camera.position.set(0, 0, isMobile ? 8 : 5);

        this.renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        // OPTIMIZATION: Cap Pixel Ratio to 1.5 max (or 1 on mobile) to reduce lag on high-res screens
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 1.5));

        this.renderer.shadowMap.enabled = !isMobile; // Disable shadows on mobile for performance
        if (!isMobile) {
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

        // Environment Map (Critical for PBR Materials like Car Paint)
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

        this.container.appendChild(this.renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
        this.scene.add(ambientLight);
    }

    setupScenes() {
        const isMobile = window.innerWidth < 768;

        // 1. Ghost Head (Soldier Group) - Pass LoadingManager
        // SKIP ON MOBILE
        if (!isMobile) {
            this.soldierGroup = createSoldierScene(this.loadingManager);
            // Initial Hero Position
            this.soldierGroup.position.set(1.5, 0, 0);
            this.scene.add(this.soldierGroup);
        }

        // 2. Car Showcase - Pass LoadingManager
        // SKIP ON MOBILE
        if (!isMobile) {
            this.carShowcase = createCarShowcase(this.loadingManager);
            this.carShowcase.position.set(0, -30, 0);
            this.scene.add(this.carShowcase);

            this.carModel = this.carShowcase.userData.carModel;
        }

        // 3. Global Background Particles
        // Keep particles but maybe reduce count? For now just keep them.
        this.bgParticles = createBackgroundParticles();
        this.scene.add(this.bgParticles);
    }

    setupScrollAnimations() {
        // --- ANIMATION TIMELINE ---

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: "body",
                start: "top top",
                end: "bottom bottom",
                scrub: 1,
                onUpdate: (self) => {
                    this.scrollProgress = self.progress;
                    this.updateSoldierPosition();
                }
            }
        });

        // 1. Move Camera to Garage (Global movement)
        // We use specific timings to ensure the camera reaches the garage at the right scroll time

        // Phase 1: Hero -> About (0 - 0.3)
        // Camera stays relatively stable or slight movement, handled by parallax/default

        // Phase 2: Approach Garage (0.3 - 0.7)
        tl.to(this.camera.position, {
            x: 4,
            y: -28, // Just above car floor (-30)
            z: 6,
            duration: 2
        }, 1); // Start at t=1

        tl.to(this.camera.rotation, {
            x: -0.2,
            y: 0.5,
            duration: 2
        }, 1);

        // Phase 3: Final Showcase Position (0.7 - 1.0)
        tl.to(this.camera.position, {
            x: 0,
            y: -28.5,
            z: 7,
            duration: 1
        }, 3); // Start at t=3

        tl.to(this.camera.rotation, { x: 0, y: 0, duration: 1 }, 3);
    }

    // --- KEY LOGIC: Fit 3D Object to DOM Element ---
    get3DPositionForDomElement(element) {
        if (!element) return new THREE.Vector3(0, -100, 0);

        const rect = element.getBoundingClientRect();

        // Calculate normalized device coordinates (NDC)
        const x = ((rect.left + rect.width / 2) / window.innerWidth) * 2 - 1;
        const y = -((rect.top + rect.height / 2) / window.innerHeight) * 2 + 1;

        // Get camera view size at depth 0
        const distanceToCamera = this.camera.position.z - 0; // Assuming obj at z=0
        const vFov = this.camera.fov * Math.PI / 180;
        const planeHeightAtDistance = 2 * Math.tan(vFov / 2) * distanceToCamera;
        const planeWidthAtDistance = planeHeightAtDistance * this.camera.aspect;

        const worldX = x * planeWidthAtDistance / 2;
        const worldY = y * planeHeightAtDistance / 2 + this.camera.position.y;

        return new THREE.Vector3(worldX, worldY, 0);
    }

    updateSoldierPosition() {
        // Logic:
        // Scroll 0 -> Hero Position (Fixed World Pos)
        // Scroll 0.2 (About Section) -> Profile Card Position (Fixed World Pos relative to element)
        // Scroll > 0.5 -> Fly away

        if (!this.soldierGroup || !this.profileTarget) return;

        const isMobile = window.innerWidth < 768;
        const heroPos = isMobile ? new THREE.Vector3(0, 0.5, 0) : new THREE.Vector3(1.5, 0, 0);
        const scrollY = window.scrollY;

        // Get Profile Card Position in World Space
        const profilePos = this.get3DPositionForDomElement(this.profileTarget);
        // Fine tune Z for profile
        profilePos.z = 0.0;

        // Mobile-specific offsets for profile target
        if (isMobile) {
            profilePos.x = 0; // Force center
            profilePos.y += 0.5; // Slight lift
        } else {
            profilePos.x -= 0.3; // Desktop offset
            profilePos.y += 1.0; // Desktop offset
        }

        // Interpolate based on scroll
        const heroHeight = window.innerHeight;

        let progress = 0;
        if (scrollY < heroHeight) {
            progress = scrollY / heroHeight; // 0 to 1 as we scroll through hero
        } else {
            progress = 1;
        }

        // Smooth step 0 to 1
        const t = Math.min(Math.max(progress, 0), 1);

        if (t < 1) {
            // Lerp from Hero to Profile
            this.soldierGroup.position.lerpVectors(heroPos, profilePos, t);
            this.soldierGroup.scale.setScalar(1 - t * 0.15); // CLOSER (Final 0.85)

            // Look specific way
            // t * Math.PI * 2 = 360 spin. 
            // We want it to end "little bit left". 
            // Let's add approx 0.5 radians (~30 degrees) to the final destination.
            this.soldierGroup.rotation.y = (t * Math.PI * 2) + (t * 0.5);
        } else {
            // Lock to profile 
            this.soldierGroup.position.copy(profilePos);
            // Ensure final rotation holds that "left" look
            this.soldierGroup.rotation.y = (Math.PI * 2) + 0.5;

            // Fade out if we scroll past about
            const aboutSectionOffset = document.getElementById('about').offsetTop;
            if (scrollY > aboutSectionOffset + 500) {
                this.soldierGroup.visible = false;
            } else {
                this.soldierGroup.visible = true;
            }
        }
    }

    setupInteraction() {
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };

        window.addEventListener('mousedown', () => isDragging = true);
        window.addEventListener('mouseup', () => isDragging = false);

        window.addEventListener('mousemove', (e) => {
            if (isDragging && this.carModel && this.camera.position.y < -20) {
                const deltaMove = {
                    x: e.offsetX - previousMousePosition.x,
                    y: e.offsetY - previousMousePosition.y
                };

                const deltaRotationQuaternion = new THREE.Quaternion()
                    .setFromEuler(new THREE.Euler(0, deltaMove.x * 0.005, 0, 'XYZ'));

                this.carModel.quaternion.multiplyQuaternions(deltaRotationQuaternion, this.carModel.quaternion);
            }
            previousMousePosition = { x: e.offsetX, y: e.offsetY };
        });
    }

    updateLabels() {
        const carLabels = document.querySelectorAll('.car-label');
        const isInShowcase = this.camera.position.y < -20;
        carLabels.forEach(label => {
            if (isInShowcase) {
                label.classList.add('visible');
            } else {
                label.classList.remove('visible');
            }
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        if (this.isPaused) return;

        requestAnimationFrame(this.animate.bind(this));

        // Animation/Update loops
        if (this.soldierGroup && this.soldierGroup.userData.update) {
            this.soldierGroup.userData.update(performance.now() * 0.001);
        }

        // Trigger manual position update for smoothness
        this.updateSoldierPosition();

        this.updateLabels();
        this.renderer.render(this.scene, this.camera);
    }
}
