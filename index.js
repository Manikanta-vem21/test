import * as THREE from 'three';
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "jsm/renderers/CSS2DRenderer.js";

document.addEventListener("DOMContentLoaded", function () {
const container = document.getElementById("three-container");

//  WebGL Renderer inside `#three-container`
const renderer = new THREE.WebGLRenderer({ antialias: true });
const w = container.clientWidth;
const h = container.clientHeight;
renderer.setSize(w, h);
container.appendChild(renderer.domElement);

//  Label Renderer also inside `#three-container`
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(w, h);
labelRenderer.domElement.style.position = "absolute";
labelRenderer.domElement.style.top = "0px";
labelRenderer.domElement.style.left = "0px";
labelRenderer.domElement.style.pointerEvents = "none";
container.appendChild(labelRenderer.domElement);

const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 10);
camera.position.set(1, 1.2, 1.2);
// Function to update renderer and camera on window resize
function onWindowResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
}

// Listen for window resize events
window.addEventListener("resize", onWindowResize);

const scene = new THREE.Scene();

// Lights
const light = new THREE.AmbientLight(0x404040);
scene.add(light);
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x080820, 1);
scene.add(hemiLight);

//  OrbitControls (Mouse Rotation)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;

//  Icosahedron (Main Sphere)
const geometry = new THREE.IcosahedronGeometry(1.0, 2);
const material = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

//  Wireframe Overlay
const wiremat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
const wiremesh = new THREE.Mesh(geometry, wiremat);
wiremesh.scale.setScalar(1.001);
mesh.add(wiremesh);

//  Clickable Spheres & Labels
const vertexMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const sphereGeometry = new THREE.SphereGeometry(0.04, 20, 20);
const clickableObjects = [];

//  URLs and Short Names
const linkData = [
    { url: "https://manikanta-vem21.github.io/Nobitha-s", name: "Nobita" },
    { url: "https://manikanta-vem21.github.io/CircuitBoard", name: "Circuit" },
    { url: "https://manikanta-vem21.github.io/Bike", name: "Bike" },
    { url: "https://manikanta-vem21.github.io/Moon", name: "Moon" },
    { url: "https://manikanta-vem21.github.io/Phone", name: "Phone" },
    { url: "https://manikanta-vem21.github.io/GrillSpeaker", name: "Speaker" },
    { url: "https://manikanta-vem21.github.io/corssMindPlane", name: "Plane" },
    { url: "https://manikanta-vem21.github.io/Drone", name: "Drone" }
];

//  Array of Specific Vertex Indices (Only These Will Have Clickable Spheres)
const vertexIndices = [0, 120, 180, 240, 300, 360, 420, 480];
const visitedSpheres = new Set();

vertexIndices.forEach((vertexIndex, i) => {
    if (i >= linkData.length) return;

    // Get vertex position
    const vertex = new THREE.Vector3();
    vertex.fromBufferAttribute(geometry.attributes.position, vertexIndex);

    // Convert local position to world coordinates
    mesh.localToWorld(vertex);

    //  Unique material for each sphere
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    //  Clickable Sphere
    const sphere = new THREE.Mesh(sphereGeometry, vertexMaterial);
    sphere.position.copy(vertex);
    mesh.add(sphere);
    clickableObjects.push({ sphere, url: linkData[i].url });

    //  Clickable Tooltip (2D Text)
    const labelDiv = document.createElement("div");
    labelDiv.className = "label";
    labelDiv.textContent = linkData[i].name;
    labelDiv.style.color = "white";
    labelDiv.style.fontSize = "14px";
    labelDiv.style.padding = "4px 8px";
    labelDiv.style.borderRadius = "5px";
    labelDiv.style.background = "rgba(0, 0, 0, 0.6)";
    labelDiv.style.pointerEvents = "none";
    labelDiv.style.cursor = "pointer";
    labelDiv.onclick = () => window.open(linkData[i].url, "_blank");

    const labelObject = new CSS2DObject(labelDiv);
    labelObject.position.copy(vertex.clone().multiplyScalar(1.1));
    mesh.add(labelObject);
});

// Raycasting for Clickable Spheres & Hover Detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isHovering = false;

// Detect Mouse Hover
container.addEventListener("mousemove", (event) => {
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / w) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / h) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(mesh);

    isHovering = intersects.length > 0;
});

//  Detect Mouse Hover and Change Cursor
container.addEventListener("mousemove", (event) => {
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / w) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / h) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects.map(o => o.sphere));

    container.style.cursor = intersects.length > 0 ? "pointer" : "default";
});

window.addEventListener("click", (event) => {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects.map(o => o.sphere));

    if (intersects.length > 0) {
        const clickedSphere = intersects[0].object;
        const sphereData = clickableObjects.find(o => o.sphere === clickedSphere);

        if (sphereData) {
            window.open(sphereData.url, "_blank"); // Open the URL in a new tab

            // ✅ Change color only for the clicked sphere
            clickedSphere.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        }
        setTimeout(() => {
            isHovering = false;
        }, 1000);
    }
});

//  Animation Loop
function animate() {
    requestAnimationFrame(animate);

    if (!isHovering) {
        mesh.rotation.y += 0.003;
        mesh.rotation.x += 0.003;
    }

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    controls.update();
}
animate();
});