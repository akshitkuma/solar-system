// Main Three.js variables
        let scene, camera, renderer, controls;
        let planets = {};
        let clock = new THREE.Clock();
        let isPaused = false;
        let showOrbits = true;
        let showLabels = true;
        let orbitRings = [];
        let labels = [];

        // Initialize the application
        function init() {
            // Create the scene
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x000000);

            // Setup camera with wider view
            camera = new THREE.PerspectiveCamera(
                60,
                window.innerWidth / window.innerHeight,
                0.1,
                2000
            );
            camera.position.set(0, 100, 200);

            // Create renderer
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            document.getElementById('scene-container').appendChild(renderer.domElement);

            // Add orbit controls
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.minDistance = 50;
            controls.maxDistance = 500;

            // Add lighting
            addLighting();

            // Create celestial bodies with larger scale
            createCelestialBodies();

            // Add event listeners
            setupEventListeners();

            // Start animation loop
            animate();
        }

        function addLighting() {
            // Ambient light
            const ambientLight = new THREE.AmbientLight(0x404040);
            scene.add(ambientLight);

            // Directional light (sun light)
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
            directionalLight.position.set(0, 0, 0);
            scene.add(directionalLight);

            // Point light for sun glow
            const sunLight = new THREE.PointLight(0xffff00, 2, 200);
            sunLight.position.set(0, 0, 0);
            scene.add(sunLight);
        }

        function createCelestialBodies() {
            // Create sun (much larger)
            createSun();

            // Create planets (larger scale)
            createPlanets();

            // Add stars background
            createStars();

            // Add orbit rings
            addOrbitRings();
        }

        function createSun() {
            const geometry = new THREE.SphereGeometry(20, 64, 64);
            const material = new THREE.MeshPhongMaterial({
                color: 0xffff00,
                emissive: 0xffff00,
                emissiveIntensity: 1.0,
                specular: 0xffffff,
                shininess: 10
            });
            const sun = new THREE.Mesh(geometry, material);
            sun.name = "Sun";
            scene.add(sun);

            // Add glow effect
            const glowGeometry = new THREE.SphereGeometry(22, 64, 64);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.3
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            sun.add(glow);

            planets["Sun"] = {
                mesh: sun,
                orbitSpeed: 0,
                rotationSpeed: 0.01
            };

            addLabel(sun, "Sun");
        }

        function createPlanets() {
            const planetData = [
                { name: "Mercury", color: 0x8a8a8a, size: 5, orbitRadius: 40, orbitSpeed: 0.04, rotationSpeed: 0.004 },
                { name: "Venus", color: 0xe6c229, size: 8, orbitRadius: 60, orbitSpeed: 0.015, rotationSpeed: 0.002 },
                { name: "Earth", color: 0x3498db, size: 8.5, orbitRadius: 80, orbitSpeed: 0.01, rotationSpeed: 0.02 },
                { name: "Mars", color: 0xe67e22, size: 6, orbitRadius: 100, orbitSpeed: 0.008, rotationSpeed: 0.018 },
                { name: "Jupiter", color: 0xf1c40f, size: 18, orbitRadius: 130, orbitSpeed: 0.002, rotationSpeed: 0.04 },
                { name: "Saturn", color: 0xf39c12, size: 15, orbitRadius: 160, orbitSpeed: 0.0009, rotationSpeed: 0.038, hasRing: true },
                { name: "Uranus", color: 0x1abc9c, size: 12, orbitRadius: 190, orbitSpeed: 0.0004, rotationSpeed: 0.03 },
                { name: "Neptune", color: 0x2980b9, size: 11.5, orbitRadius: 220, orbitSpeed: 0.0001, rotationSpeed: 0.032 }
            ];

            planetData.forEach(planet => {
                const geometry = new THREE.SphereGeometry(planet.size, 64, 64);
                const material = new THREE.MeshPhongMaterial({ 
                    color: planet.color,
                    specular: 0x333333,
                    shininess: 10
                });
                const mesh = new THREE.Mesh(geometry, material);

                const angle = Math.random() * Math.PI * 2;
                mesh.position.x = planet.orbitRadius * Math.cos(angle);
                mesh.position.z = planet.orbitRadius * Math.sin(angle);

                mesh.name = planet.name;
                scene.add(mesh);

                if (planet.hasRing) {
                    const ringGeometry = new THREE.RingGeometry(planet.size + 2, planet.size + 5, 64);
                    const ringMaterial = new THREE.MeshBasicMaterial({ 
                        color: 0xcccccc, 
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.8
                    });
                    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                    ring.rotation.x = Math.PI / 2;
                    mesh.add(ring);
                }

                planets[planet.name] = {
                    mesh: mesh,
                    orbitRadius: planet.orbitRadius,
                    orbitSpeed: planet.orbitSpeed,
                    rotationSpeed: planet.rotationSpeed,
                    angle: angle
                };

                addLabel(mesh, planet.name);
                addPlanetTooltip(planet.name, mesh);
            });
        }

        function createStars() {
            const starsGeometry = new THREE.BufferGeometry();
            const starCount = 10000;
            const positions = new Float32Array(starCount * 3);

            for (let i = 0; i < starCount; i++) {
                const i3 = i * 3;
                positions[i3] = (Math.random() - 0.5) * 3000;
                positions[i3 + 1] = (Math.random() - 0.5) * 3000;
                positions[i3 + 2] = (Math.random() - 0.5) * 3000;
            }

            starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const starsMaterial = new THREE.PointsMaterial({ 
                color: 0xffffff, 
                size: 1.5,
                transparent: true,
                opacity: 0.9
            });
            const stars = new THREE.Points(starsGeometry, starsMaterial);
            scene.add(stars);
        }

        function addOrbitRings() {
            orbitRings = [];
            
            for (const planetName in planets) {
                if (planetName === "Sun") continue;
                
                const planet = planets[planetName];
                const orbitRing = new THREE.Line(
                    new THREE.BufferGeometry().setFromPoints(
                        new THREE.EllipseCurve(0, 0, planet.orbitRadius, planet.orbitRadius, 0, 2 * Math.PI, false, 0)
                            .getPoints(100)
                            .map(p => new THREE.Vector3(p.x, 0, p.y))
                    ),
                    new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.5 })
                );
                orbitRing.rotation.x = Math.PI / 2;
                scene.add(orbitRing);
                orbitRings.push(orbitRing);
            }
        }

        function addLabel(mesh, text) {
            const label = document.createElement('div');
            label.className = 'planet-label';
            label.textContent = text;
            label.style.position = 'absolute';
            label.style.color = 'white';
            label.style.pointerEvents = 'none';
            label.style.fontSize = '14px';
            label.style.fontWeight = 'bold';
            label.style.textShadow = '0 0 5px black';
            document.body.appendChild(label);
            
            labels.push({
                mesh: mesh,
                element: label
            });
        }

        function updateLabels() {
            labels.forEach(label => {
                const vector = new THREE.Vector3();
                vector.setFromMatrixPosition(label.mesh.matrixWorld);
                vector.project(camera);
                
                const x = (vector.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
                const y = (-(vector.y * 0.5) + 0.5) * renderer.domElement.clientHeight;
                
                label.element.style.left = `${x}px`;
                label.element.style.top = `${y}px`;
                label.element.style.display = showLabels ? 'block' : 'none';
            });
        }

        function toggleOrbits() {
            showOrbits = !showOrbits;
            orbitRings.forEach(ring => {
                ring.visible = showOrbits;
            });
            document.getElementById('toggle-orbits').textContent = showOrbits ? 'Hide Orbits' : 'Show Orbits';
        }

        function toggleLabels() {
            showLabels = !showLabels;
            document.getElementById('toggle-labels').textContent = showLabels ? 'Hide Labels' : 'Show Labels';
            updateLabels();
        }

        function addPlanetTooltip(planetName, mesh) {
            const tooltip = document.createElement('div');
            tooltip.className = 'planet-tooltip';
            tooltip.textContent = planetName;
            document.body.appendChild(tooltip);

            mesh.userData.tooltip = tooltip;
            
            mesh.addEventListener('mouseenter', () => {
                tooltip.style.display = 'block';
            });
            
            mesh.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        }

        function updateTooltips() {
            for (const planetName in planets) {
                if (planetName === "Sun") continue;
                
                const planet = planets[planetName];
                if (planet.mesh.userData.tooltip) {
                    const vector = new THREE.Vector3();
                    vector.setFromMatrixPosition(planet.mesh.matrixWorld);
                    vector.project(camera);
                    
                    const x = (vector.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
                    const y = (-(vector.y * 0.5) + 0.5) * renderer.domElement.clientHeight;
                    
                    planet.mesh.userData.tooltip.style.left = `${x}px`;
                    planet.mesh.userData.tooltip.style.top = `${y}px`;
                }
            }
        }

        function setupEventListeners() {
            window.addEventListener('resize', onWindowResize);
            document.getElementById('pause-resume').addEventListener('click', togglePause);
            document.getElementById('reset-view').addEventListener('click', resetView);
            document.getElementById('toggle-orbits').addEventListener('click', toggleOrbits);
            document.getElementById('toggle-labels').addEventListener('click', toggleLabels);
            document.getElementById('dark-mode').addEventListener('change', toggleDarkMode);
            setupSpeedControls();
        }

        function setupSpeedControls() {
            const controlsContainer = document.getElementById('planet-controls');
            
            for (const planetName in planets) {
                if (planetName === "Sun") continue;
                
                const controlDiv = document.createElement('div');
                controlDiv.className = 'control-group';
                
                const label = document.createElement('label');
                label.htmlFor = `${planetName}-speed`;
                label.textContent = planetName;
                
                const slider = document.createElement('input');
                slider.type = 'range';
                slider.id = `${planetName}-speed`;
                slider.min = '0';
                slider.max = '0.1';
                slider.step = '0.001';
                slider.value = planets[planetName].orbitSpeed;
                
                slider.addEventListener('input', (e) => {
                    planets[planetName].orbitSpeed = parseFloat(e.target.value);
                });
                
                controlDiv.appendChild(label);
                controlDiv.appendChild(slider);
                controlsContainer.appendChild(controlDiv);
            }
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function togglePause() {
            isPaused = !isPaused;
            document.getElementById('pause-resume').textContent = isPaused ? 'Resume' : 'Pause';
        }

        function resetView() {
            camera.position.set(0, 100, 200);
            controls.reset();
        }

        function toggleDarkMode(e) {
            const isDark = e.target.checked;
            document.body.style.backgroundColor = isDark ? '#000' : '#fff';
            scene.background = new THREE.Color(isDark ? 0x000000 : 0xf0f0f0);
        }

        function animate() {
            requestAnimationFrame(animate);
            
            const delta = clock.getDelta();
            
            if (!isPaused) {
                for (const planetName in planets) {
                    const planet = planets[planetName];
                    
                    if (planetName !== "Sun") {
                        planet.angle += planet.orbitSpeed * delta;
                        planet.mesh.position.x = planet.orbitRadius * Math.cos(planet.angle);
                        planet.mesh.position.z = planet.orbitRadius * Math.sin(planet.angle);
                    }
                    
                    planet.mesh.rotation.y += planet.rotationSpeed * delta;
                }
            }
            
            controls.update();
            updateTooltips();
            updateLabels();
            
            renderer.render(scene, camera);
        }

        document.addEventListener('DOMContentLoaded', init);