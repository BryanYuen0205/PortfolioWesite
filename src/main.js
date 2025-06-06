import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const stars = [];
const loadingManager = new THREE.LoadingManager();
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg')
})
const loader = new GLTFLoader(loadingManager);
const textureLoader = new THREE.TextureLoader(loadingManager);


let targetCameraPos = new THREE.Vector3(0, 0, 30);
let balloon, plane;
let targetPlaneX = 10;
let targetPlaneY = 5;
let targetPlaneZ = 5;
let targetBallonY = 0;


loadingManager.onLoad = () => {
  const loadingScreen = document.getElementById('loading-screen');
  loadingScreen.classList.add('fade-out');

  setTimeout(() => {
    loadingScreen.remove();

    const mainContent = document.querySelector('main');
    mainContent.classList.add('show');
  }, 500);
};

renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
camera.position.setZ(30);

renderer.render(scene, camera);

// const gridHelper = new THREE.GridHelper(200, 50);
// scene.add(gridHelper);

const ambientLight = new THREE.AmbientLight(0xffccaa, 0.4);
const directionalLight = new THREE.DirectionalLight(0xffccaa, 3);
directionalLight.position.set(-10, 20, 30); // Position like a low sun
directionalLight.target.position.set(0, 0, 0); // Aim at the center

scene.add(ambientLight, directionalLight, directionalLight.target);



const controls = new OrbitControls(camera, renderer.domElement);

function addStar() {
  const geometry = new THREE.SphereGeometry(0.25, 24, 24);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff, // Add emissive color
    emissiveIntensity: 1,
    transparent: true,
    opacity: 1
  });
  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));
  star.position.set(x, y, z);

  // Store a random phase for twinkling
  stars.push({
    mesh: star,
    phase: Math.random() * Math.PI * 2,
    speed: 0.5 + Math.random() // Vary twinkle speed
  });

  scene.add(star);
}

Array(200).fill().forEach(addStar);

const spaceTexture = textureLoader.load('./sky.jpg');
scene.background = spaceTexture;


loader.load('./hotAirBalloon.glb', function (gltf) {
    balloon = gltf.scene;
    balloon.position.set(-3,0,30);
    scene.add(balloon); // Add the loaded model to your scene
}, undefined, function (error) {
    console.error(error); // Handle errors
});

loader.load('./plane.glb', function (gltf) {
    plane = gltf.scene;
    plane.position.set(10, 5, 5);
    plane.rotation.y = 10;
    scene.add(plane); // Add the loaded model to your scene
}, undefined, function (error) {
    console.error(error); // Handle errors
});


scene.fog = new THREE.Fog(0xffcc99, 10, 100);

function moveCamera() {
  const t = document.body.getBoundingClientRect().top;
  
  if (balloon) {
    balloon.rotation.y += 0.02;
    balloon.position.x = Math.sin(t * 0.001) * 2 - 3;
    targetBallonY = Math.sin(t * 0.002) * 0.5; 
  }

  if (plane) {
    targetPlaneY = 5 + Math.sin(t * 0.002) * 2; 
    targetPlaneZ = 5 + t * -0.01; 
    targetPlaneX = 10 + t * 0.005; 
  }

  targetCameraPos.z = 30 + t * -0.005;
  targetCameraPos.x = t * -0.0002;
  targetCameraPos.y = t * -0.0002;
}

document.body.onscroll = moveCamera;

function animate(time){
  requestAnimationFrame(animate);

  camera.position.lerp(targetCameraPos, 0.05); // Smoothly interpolate

  for (const star of stars) {
    const twinkle = Math.abs(Math.sin(time * 0.001 * star.speed + star.phase));
    star.mesh.material.opacity = 0.5 + 0.5 * twinkle; // Opacity between 0.5 and 1
  }
  
  if (plane) {
    plane.position.z += (targetPlaneZ - plane.position.z) * 0.15;
    plane.position.y += (targetPlaneY - plane.position.y) * 0.15;
    plane.position.x += (targetPlaneX - plane.position.x) * 0.15;
  }

  if(balloon) {
    balloon.position.y += (targetBallonY - balloon.position.y) * 0.15;
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();
