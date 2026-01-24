import './style.css'
import { SceneManager } from './three/sceneManager.js';
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

window.addEventListener('DOMContentLoaded', () => {
    // --- SMOOTH SCROLLING (LENIS) ---
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Preset easing
        smoothWheel: true
    })

    lenis.on('scroll', ScrollTrigger.update)

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000)
    })

    gsap.ticker.lagSmoothing(0)

    // Hide loader
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader) loader.style.opacity = '0';
        setTimeout(() => {
            if (loader) loader.remove();
        }, 500);
    }, 1500);



    // Init 3D Scene
    new SceneManager('webgl-container');

    // --- CROSS-CARD VIDEO PREVIEW LOGIC (WITH FLIP) ---
    const projectCards = Array.from(document.querySelectorAll('.project-card'));

    projectCards.forEach((card, index) => {
        // Determine Partner Card (Left <-> Right)
        let partnerIndex = (index % 2 === 0) ? index + 1 : index - 1;

        // Handle last item if odd count (no partner)
        if (partnerIndex >= projectCards.length) return;

        const partnerCard = projectCards[partnerIndex];
        const videoSrc = card.getAttribute('data-video');

        if (!videoSrc || !partnerCard) return;

        const flipDuration = 0.6;

        card.addEventListener('mouseenter', () => {
            if (window.innerWidth < 768) return;

            // Ensure video exists on PARTNER
            let existingVideo = partnerCard.querySelector('.cross-preview-video');
            if (existingVideo) return;

            const video = document.createElement('video');
            video.src = videoSrc;
            const posterSrc = card.getAttribute('data-poster');
            if (posterSrc) video.poster = posterSrc;

            video.className = 'cross-preview-video';
            video.loop = true;
            video.muted = true;
            video.playsInline = true;

            Object.assign(video.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                boxSizing: 'border-box', // Ensure padding/border doesn't affect size
                objectFit: 'cover',
                borderRadius: 'inherit',
                // Counter-rotate logic: 180 (relative to card 180) = 360 (Normal)
                transform: 'rotateY(180deg) translateZ(1px)',
                backgroundColor: '#000',
                zIndex: '5',
                pointerEvents: 'none'
            });
            partnerCard.appendChild(video);

            // Preview Label on PARTNER
            let label = partnerCard.querySelector('.preview-header');
            if (!label) {
                label = document.createElement('div');
                label.className = 'preview-header';
                label.innerText = 'PREVIEW';
                Object.assign(label.style, {
                    position: 'absolute',
                    top: '20px',
                    left: '50%',
                    transform: 'translate(-50%) rotateY(180deg) translateZ(2px)',
                    zIndex: '20',
                    pointerEvents: 'none',
                    fontWeight: 'bold',
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '12px',
                    letterSpacing: '2px',
                    color: '#00f0ff',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    boxShadow: '0 0 10px rgba(0, 240, 255, 0.5)',
                    textShadow: '0 0 5px rgba(0, 240, 255, 0.8)',
                    opacity: '0',
                    transition: 'opacity 0.4s ease'
                });
                partnerCard.appendChild(label);

                requestAnimationFrame(() => {
                    label.style.opacity = '1';
                });
            } else {
                label.style.opacity = '1';
            }

            video.play().catch(e => { });

            // FLIP PARTNER
            gsap.to(partnerCard, {
                rotateY: 180,
                duration: flipDuration,
                ease: "power2.inOut"
            });
        });

        card.addEventListener('mouseleave', () => {
            // FLIP PARTNER BACK
            gsap.to(partnerCard, {
                rotateY: 0,
                duration: flipDuration,
                ease: "power2.inOut",
                onComplete: () => {
                    const video = partnerCard.querySelector('.cross-preview-video');
                    const label = partnerCard.querySelector('.preview-header');
                    if (video) video.remove();
                    if (label) label.remove();
                }
            });
        });
    });

    // Custom Cursor Logic
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');

    window.addEventListener('mousemove', (e) => {
        const posX = e.clientX;
        const posY = e.clientY;

        // Dot follows instantly
        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;

        // Outline follows with slight delay/animate function usually, 
        // but for basic CSS transition usage:
        cursorOutline.style.left = `${posX}px`;
        cursorOutline.style.top = `${posY}px`;

        // Optional: Animate outline trail for smoothness 
        // (If simple CSS transition isn't enough, we'd use requestAnimationFrame here)
        cursorOutline.animate({
            left: `${posX}px`,
            top: `${posY}px`
        }, { duration: 500, fill: "forwards" });
    });


    // --- PROJECT DETAILS MODAL LOGIC ---
    const modal = document.getElementById('project-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    const modalTech = document.getElementById('modal-tech');
    const modalGallery = document.querySelector('.modal-gallery');
    const fullIntelBtns = document.querySelectorAll('.full-intel-btn');

    const projectDetails = {
        'lone-wolf': {
            title: 'LONE WOLF LEGACY',
            desc: `Real-time online shooter built to master advanced networking, backend integration, and AI in Unity.<br><br>
            <ul style="list-style-type: disc; padding-left: 20px;">
                <li>Developed multiplayer infrastructure using <strong>Photon PUN 2</strong>, handling lobby management, room creation, and low-latency player synchronization.</li>
                <li>Integrated <strong>Google Firebase Authentication</strong> for secure user login, registration, and persistent player data management.</li>
                <li>Designed an interactive <strong>In-Game Shop</strong> featuring smooth UI animations for weapon selection, virtual currency transactions, and item unlocking.</li>
                <li>Engineered intelligent <strong>AI Bots using Unity NavMesh</strong> for tactical pathfinding and finite state machines, synchronizing randomized loadouts via RPCs.</li>
                <li>Built a <strong>Dynamic Leaderboard System</strong> and responsive Minimap that tracks real-time stats for both human players and AI.</li>
                <li>Implemented <strong>Cinemachine</strong> for immersive first-person camera mechanics and precise raycast-based shooting.</li>
            </ul>`,
            tech: ['UNITY 3D', 'PHOTON PUN 2', 'FIREBASE', 'NAVMESH AI', 'CINEMACHINE', 'NETWORKING'],
            // Linked found images
            images: [
                '/project-assets/lone-wolf-1.jpg',
                '/project-assets/lone-wolf-2.jpg',
                '/project-assets/lone-wolf-3.jpg',
                '/project-assets/lone-wolf-4.jpg',
                '/project-assets/lone-wolf-5.jpg',
                '/project-assets/lone-wolf-6.jpg',
                '/project-assets/lone-wolf-7.jpg',
                '/project-assets/lone-wolf-8.jpg'
            ]
        },
        'turbo-drive': {
            title: 'TURBO DRIVE',
            desc: `3D parking simulation game set in realistic night-time city environment with detailed urban scenery.<br><br>
            <ul style="list-style-type: disc; padding-left: 20px;">
                <li>Implemented realistic vehicle physics using <strong>Unity Wheel Colliders</strong> for smooth turning, suspension, and accurate friction handling.</li>
                <li>Designed timer and point collection system to add challenge and strategy, using the <strong>Observer Pattern</strong> to manage level events.</li>
                <li>Developed <strong>AI-driven pedestrian behavior</strong> using waypoint-based movement logic.</li>
                <li>Created a complex UI displaying objectives, remaining time, and controls for an optimal user experience.</li>
                <li>Added dynamic audio and enhanced visuals using <strong>Unity URP</strong> for immersive lighting and post-processing effects.</li>
            </ul>`,
            tech: ['UNITY URP', 'WHEEL COLLIDERS', 'OBSERVER PATTERN', 'AI NAVIGATION', 'PHYSICS'],
            images: [
                '/project-assets/turbo-drive-1.jpg',
                '/project-assets/turbo-drive-2.jpg',
                '/project-assets/turbo-drive-3.jpg',
                '/project-assets/turbo-drive-4.jpg',
                '/project-assets/turbo-drive-5.jpg',
                '/project-assets/turbo-drive-6.jpg',
                '/project-assets/turbo-drive-7.jpg',
                '/project-assets/turbo-drive-8.jpg',
                '/project-assets/turbo-drive-9.jpg'
            ]
        },
        'dranko': {
            title: "DRANKO'S QUEST",
            desc: `Fast-paced 2D platformer with reactive traps and obstacles, featuring optimized systems across 7 levels.<br><br>
            <ul style="list-style-type: disc; padding-left: 20px;">
                <li>Implemented <strong>Object Pooling</strong> for infinite level generation to ensure zero garbage collection spikes during gameplay.</li>
                <li>Added custom audio for traps, player actions, and environment events using a <strong>Singleton-based audio system</strong>.</li>
                <li>Designed dynamic traps (including player-chasing traps) and <strong>AI patrol enemies</strong> using waypoint-based movement.</li>
                <li>Developed moving platforms, point collectibles, and a door unlock system that triggers only after all points are collected.</li>
                <li>Included score system with UI updates, using 2D physics and visual feedback to enhance player immersion.</li>
            </ul>`,
            tech: ['UNITY 2D', 'OBJECT POOLING', 'SINGLETON PATTERN', 'AI PATROLS', '2D PHYSICS'],
            images: [
                '/project-assets/dranko-1.jpg',
                '/project-assets/dranko-2.jpg',
                '/project-assets/dranko-3.jpg',
                '/project-assets/dranko-4.jpg',
                '/project-assets/dranko-5.jpg',
                '/project-assets/dranko-6.jpg'
            ]
        },
        'vr-engine': {
            title: 'VR ENGINE SIM',
            desc: `An immersive VR experience allowing users to assemble and disassemble a V8 engine, focusing on realism and training.<br><br>
            <ul style="list-style-type: disc; padding-left: 20px;">
                <li>Built with <strong>Unity XR Interaction Toolkit</strong>, including teleportation, grab interaction, and socket snapping.</li>
                <li>Implemented interactive nuts, wrenches, and tools with <strong>physics-based manipulation</strong>.</li>
                <li>Designed intuitive VR controls for teleportation and object placement using motion controllers.</li>
                <li>Added tutorial UI panels with step-by-step assembly instructions to guide the user.</li>
                <li>Used <strong>VR simulation framework</strong> to enhance realism in a training-style environment.</li>
            </ul>`,
            tech: ['UNITY XR', 'VR HEADSET', 'XR INTERACTION TOOLKIT', 'PHYSICS', 'TRAINING SIM'],
            images: [
                '/project-assets/vr-engine-1.jpg',
                '/project-assets/vr-engine-2.jpg',
                '/project-assets/vr-engine-3.jpg',
                '/project-assets/vr-engine-4.jpg',
                '/project-assets/vr-engine-5.jpg',
                '/project-assets/vr-engine-6.jpg',
                '/project-assets/vr-engine-7.jpg',
                '/project-assets/vr-engine-8.jpg'
            ]
        }
    };

    fullIntelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const data = projectDetails[id];

            if (data) {
                // Populate Texts
                modalTitle.textContent = data.title;
                modalDesc.innerHTML = data.desc; // Use innerHTML to render bullet points

                // Populate Tech
                modalTech.innerHTML = data.tech.map(t => `<span>${t}</span>`).join('');

                // Populate Gallery (Placeholders)
                modalGallery.innerHTML = '';
                if (data.images && data.images.length > 0) {
                    data.images.forEach(imgSrc => {
                        // Check if it's a generic placeholder label or a path
                        if (imgSrc.includes('/') || imgSrc.includes('.')) {
                            // Render Image
                            const img = document.createElement('img');
                            img.src = imgSrc;
                            img.className = 'modal-img';
                            img.alt = data.title;
                            modalGallery.appendChild(img);
                        } else {
                            // Fallback for text placeholders (if user hasn't added images yet)
                            const div = document.createElement('div');
                            div.className = 'gallery-placeholder';
                            div.textContent = `[MISSING: ${imgSrc}]`;
                            modalGallery.appendChild(div);
                        }
                    });
                } else {
                    modalGallery.innerHTML = '<div class="gallery-placeholder">NO INTEL LOADED</div>';
                }

                // --- HORIZONTAL SCROLL ON WHEEL ---
                // We use a named function to remove it later if needed, but for now strict replacement 
                // via 'onwheel' property is sometimes clunky. Let's use robust addEventListener.

                // Clear old property just in case
                modalGallery.onwheel = null;

                // Define handler
                const horizontalScroll = (evt) => {
                    // Only hijack if we can actually scroll horizontally
                    if (modalGallery.scrollWidth > modalGallery.clientWidth) {
                        evt.preventDefault();
                        modalGallery.scrollLeft += evt.deltaY * 2.5; // Multiplier for speed
                    }
                };

                // Remove previous listener to avoid stacking (using a custom property to track it)
                if (modalGallery._wheelHandler) {
                    modalGallery.removeEventListener('wheel', modalGallery._wheelHandler);
                }

                // Add new listener
                modalGallery.addEventListener('wheel', horizontalScroll, { passive: false });
                modalGallery._wheelHandler = horizontalScroll; // Store ref

                // Show Modal
                modal.classList.add('active');
                document.body.style.overflow = 'hidden'; // Lock Body Scroll
            }
        });
    });

    // Close Logic
    modalCloseBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // --- ADVANCED STACKING TRANSITIONS ---
    // Unveil Operator Loadout background and hide Side Ops when overlapped
    const skillsSection = document.getElementById('skills');
    const sideOpsSection = document.getElementById('mini-projects');

    if (skillsSection && sideOpsSection) {
        ScrollTrigger.create({
            trigger: skillsSection,
            start: "top center", // Start fading as it approaches top
            end: "top top",      // Fully transparent/hidden when it locks
            scrub: true,
            onUpdate: (self) => {
                // Fade out Side Ops (Lower container)
                gsap.to(sideOpsSection, { opacity: 1 - self.progress, duration: 0.1 });

                // Fade out Skills Background to Transparent
                // We interpolate rgba alpha from 0.85 to 0.0
                const alpha = 0.85 * (1 - self.progress);
                skillsSection.style.background = `rgba(0, 0, 0, ${alpha})`;
                skillsSection.style.backdropFilter = `blur(${10 * (1 - self.progress)}px)`;

                // Remove border as well
                skillsSection.style.borderColor = `rgba(0, 240, 255, ${0.2 * (1 - self.progress)})`;
            }
        });
    }



    // --- ENCRYPTED CHANNEL (CONTACT FORM) ---
    const transmitBtn = document.getElementById('transmit-btn');
    if (transmitBtn) {
        transmitBtn.addEventListener('click', () => {
            const sender = document.getElementById('email-sender').value;
            const message = document.getElementById('email-message').value;

            // Construct secure line (mailto)
            const subject = `SECURE TRANSMISSION FROM: ${sender || 'UNKNOWN AGENT'}`;
            const body = `${message}\n\n[IDENTITY]: ${sender}`;
            const mailtoLink = `mailto:vishnubabu1108@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

            // Execute
            window.location.href = mailtoLink;
        });
    }

});
