import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, model, controls, mixer, clock;
let loadingManager;

function init() {
    // Container
    const container = document.getElementById('threejs-container');
    if (!container) {
        console.error('Three.js container not found!');
        return;
    }

    // Clock for animations
    clock = new THREE.Clock();

    // Loading manager for tracking progress
    loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {
        console.log('Loading file: ' + url + ' (' + itemsLoaded + '/' + itemsTotal + ')');
    };
    loadingManager.onError = function(url) {
        console.error('Error loading: ' + url);
    };

    // Scene
    scene = new THREE.Scene();
    
    // Camera
    camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 5); // Adjust initial camera position

    // Renderer with better performance settings
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        powerPreference: "high-performance" 
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for better performance
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Add a subtle purple accent light to match the portfolio theme
    const purpleLight = new THREE.PointLight(0x9d4edd, 1, 10);
    purpleLight.position.set(-2, 1, 2);
    scene.add(purpleLight);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.target.set(0, 1, 0);
    controls.autoRotate = true; // Auto-rotate for better visual appeal
    controls.autoRotateSpeed = 1.0; // Slow rotation speed
    controls.update();

    // Load Model
    const loader = new GLTFLoader(loadingManager);
    loader.load(
        'models/feltronic.glb',
        function (gltf) {
            model = gltf.scene;
            
            // Scale and position adjustments
            model.scale.set(0.6, 0.6, 0.6);
            model.position.y = 0;
            
            // Enable shadows for all meshes in the model
            model.traverse(function(node) {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    
                    // Improve material quality if needed
                    if (node.material) {
                        node.material.metalness = 0.8;
                        node.material.roughness = 0.2;
                    }
                }
            });
            
            scene.add(model);
            console.log('Model loaded successfully');
            
            // Handle animations if they exist
            if (gltf.animations && gltf.animations.length) {
                mixer = new THREE.AnimationMixer(model);
                const action = mixer.clipAction(gltf.animations[0]);
                action.play();
                console.log('Animation loaded and playing');
            }
            
            // Start animation loop after model is loaded
            animate();
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error('An error happened loading the model:', error);
        }
    );

    // Add interactive features
    container.addEventListener('click', onModelClick, false);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
    
    // Initial resize to ensure correct sizing
    onWindowResize();
}

function onModelClick(event) {
    // Toggle auto-rotation on click
    if (controls) {
        controls.autoRotate = !controls.autoRotate;
    }
    
    // Optional: Add a visual feedback when clicked
    if (model) {
        // Create a quick scale animation
        const currentScale = model.scale.x;
        const timeline = { scale: currentScale };
        
        // Simple animation using requestAnimationFrame
        const startTime = Date.now();
        const duration = 300; // ms
        
        function scaleAnimation() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Scale up then back down
            if (progress < 0.5) {
                const scale = currentScale + (progress * 0.1);
                model.scale.set(scale, scale, scale);
            } else {
                const scale = currentScale + ((1 - progress) * 0.1);
                model.scale.set(scale, scale, scale);
            }
            
            if (progress < 1) {
                requestAnimationFrame(scaleAnimation);
            } else {
                model.scale.set(currentScale, currentScale, currentScale);
            }
        }
        
        requestAnimationFrame(scaleAnimation);
    }
}

function onWindowResize() {
    const container = document.getElementById('threejs-container');
    if (!container) return;

    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);

    // Update controls
    controls.update();
    
    // Update animations
    if (mixer) {
        mixer.update(clock.getDelta());
    }
    
    // Add subtle floating motion to the model
    if (model) {
        model.position.y = Math.sin(Date.now() * 0.001) * 0.1;
    }

    // Render scene
    renderer.render(scene, camera);
}

// Initialize Three.js scene
init();

// Add a fallback message if WebGL is not supported
if (!renderer) {
    const container = document.getElementById('threejs-container');
    if (container) {
        const fallbackMessage = document.createElement('div');
        fallbackMessage.style.textAlign = 'center';
        fallbackMessage.style.padding = '20px';
        fallbackMessage.style.color = '#ffffff';
        fallbackMessage.innerHTML = 'Your browser does not support WebGL, which is required to view the 3D model.<br>Please try using a modern browser like Chrome, Firefox, or Edge.';
        container.appendChild(fallbackMessage);
    }
}
