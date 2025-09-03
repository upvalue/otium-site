import { useEffect, useRef } from 'preact/hooks';
import * as THREE from 'three';

export default function VaporwaveScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    // Renderer setup with transparent background
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Create vaporwave sun (yellow)
    const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(0, 2, -15);
    scene.add(sun);

    // Add gradient bands to sun (orange to yellow gradient)
    const bandCount = 8;
    for (let i = 0; i < bandCount; i++) {
      const bandGeometry = new THREE.RingGeometry(
        3.1 + i * 0.01,
        3.5 + i * 0.01,
        32
      );
      const bandMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.1 - i * 0.01, 1, 0.5 + i * 0.05),
        side: THREE.DoubleSide,
        opacity: 0.8 - i * 0.1,
        transparent: true
      });
      const band = new THREE.Mesh(bandGeometry, bandMaterial);
      band.position.copy(sun.position);
      band.position.z += 0.1;
      scene.add(band);
    }

    // Create grid floor
    const gridSize = 40;
    const gridDivisions = 40;
    const gridHelper = new THREE.GridHelper(
      gridSize, 
      gridDivisions, 
      0xff00ff, 
      0x00ffff
    );
    gridHelper.position.y = -2;
    scene.add(gridHelper);

    // Create perspective grid lines going to horizon
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0xff00ff,
      opacity: 0.6,
      transparent: true
    });

    // Add perspective lines
    for (let i = -20; i <= 20; i += 2) {
      const points = [];
      points.push(new THREE.Vector3(i, -2, 10));
      points.push(new THREE.Vector3(i * 0.3, -2, -20));
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, lineMaterial);
      scene.add(line);
    }

    // Add some glowing wireframe mountains
    const mountainPoints = [];
    for (let i = 0; i <= 20; i++) {
      const x = (i - 10) * 2;
      const y = Math.sin(i * 0.3) * 2 + Math.random() * 1;
      mountainPoints.push(new THREE.Vector2(x, y));
    }
    
    const mountainShape = new THREE.Shape(mountainPoints);
    const mountainGeometry = new THREE.ShapeGeometry(mountainShape);
    const mountainMaterial = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      wireframe: true,
      wireframeLinewidth: 2
    });
    
    const leftMountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
    leftMountain.position.set(-10, -1, -10);
    leftMountain.rotation.y = Math.PI * 0.2;
    scene.add(leftMountain);

    const rightMountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
    rightMountain.position.set(10, -1, -10);
    rightMountain.rotation.y = -Math.PI * 0.2;
    rightMountain.scale.x = -1;
    scene.add(rightMountain);

    // Dynamic floating shapes system
    interface FloatingShape {
      mesh: THREE.Mesh;
      velocity: THREE.Vector3;
      rotationSpeed: THREE.Vector3;
    }
    
    const floatingShapes: FloatingShape[] = [];
    let lastSpawnTime = 0;
    const spawnInterval = 3000 + Math.random() * 4000; // Spawn every 3-7 seconds
    
    // Function to create random shape
    const createRandomShape = () => {
      const shapeType = Math.floor(Math.random() * 5);
      let geometry: THREE.BufferGeometry;
      
      switch(shapeType) {
        case 0:
          geometry = new THREE.ConeGeometry(0.5 + Math.random() * 0.5, 1 + Math.random() * 0.5, 4);
          break;
        case 1:
          geometry = new THREE.BoxGeometry(0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4);
          break;
        case 2:
          geometry = new THREE.OctahedronGeometry(0.6 + Math.random() * 0.4);
          break;
        case 3:
          geometry = new THREE.TetrahedronGeometry(0.7 + Math.random() * 0.3);
          break;
        case 4:
          geometry = new THREE.IcosahedronGeometry(0.6 + Math.random() * 0.3);
          break;
        default:
          geometry = new THREE.BoxGeometry(1, 1, 1);
      }
      
      const material = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? 0x00ffff : 0xff00ff,
        wireframe: true
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      
      // Random spawn position (from sides or top)
      const spawnSide = Math.random();
      if (spawnSide < 0.33) {
        // Spawn from left
        mesh.position.set(-15, Math.random() * 6 - 1, Math.random() * 10 - 5);
      } else if (spawnSide < 0.66) {
        // Spawn from right
        mesh.position.set(15, Math.random() * 6 - 1, Math.random() * 10 - 5);
      } else {
        // Spawn from top
        mesh.position.set(Math.random() * 20 - 10, 8, Math.random() * 10 - 5);
      }
      
      // Random velocity
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.05,
        (Math.random() - 0.7) * 0.03,
        (Math.random() - 0.5) * 0.02
      );
      
      // Random rotation speed
      const rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.03,
        (Math.random() - 0.5) * 0.01
      );
      
      return { mesh, velocity, rotationSpeed };
    };

    // Animation loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      
      const currentTime = Date.now();
      
      // Spawn new shapes infrequently
      if (currentTime - lastSpawnTime > spawnInterval) {
        const newShape = createRandomShape();
        scene.add(newShape.mesh);
        floatingShapes.push(newShape);
        lastSpawnTime = currentTime;
      }
      
      // Update floating shapes
      for (let i = floatingShapes.length - 1; i >= 0; i--) {
        const shape = floatingShapes[i];
        
        // Apply velocity
        shape.mesh.position.add(shape.velocity);
        
        // Apply rotation
        shape.mesh.rotation.x += shape.rotationSpeed.x;
        shape.mesh.rotation.y += shape.rotationSpeed.y;
        shape.mesh.rotation.z += shape.rotationSpeed.z;
        
        // Remove shapes that are off screen
        if (shape.mesh.position.x < -20 || shape.mesh.position.x > 20 ||
            shape.mesh.position.y < -10 || shape.mesh.position.y > 10 ||
            shape.mesh.position.z < -25 || shape.mesh.position.z > 15) {
          scene.remove(shape.mesh);
          if (shape.mesh.geometry) shape.mesh.geometry.dispose();
          if (shape.mesh.material) (shape.mesh.material as THREE.Material).dispose();
          floatingShapes.splice(i, 1);
        }
      }

      // Pulse sun
      sun.scale.setScalar(1 + Math.sin(currentTime * 0.001) * 0.05);

      // Move grid slightly for effect
      gridHelper.position.z = (currentTime * 0.0001) % 1;

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      style={{ 
        width: '100%', 
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: -1
      }} 
    />
  );
}