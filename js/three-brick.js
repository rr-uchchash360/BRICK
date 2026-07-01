/* =============================================
   BRICK — Three.js 3D Brick Scene
   ============================================= */

const THREE_BRICK = (() => {
  let scene, camera, renderer, brickGroup;
  let mouseX = 0, mouseY = 0;
  let targetRotX = 0, targetRotY = 0;
  let isAutoRotate = true;
  let animationId = null;
  let isVisible = true;
  let resizeObserver = null;

  function init(containerId) {
    if (typeof THREE === 'undefined') {
      console.warn('Three.js not loaded — skipping 3D brick');
      return;
    }
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 5);

    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    setupLights();
    createBrick();
    createFloor();
    createParticles();

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('touchmove', onTouchMove, { passive: true });

    resizeObserver = new ResizeObserver(() => onResize(container));
    resizeObserver.observe(container);

    document.addEventListener('visibilitychange', onVisibilityChange);

    animate();
  }

  function setupLights() {
    const ambient = new THREE.AmbientLight(0x404060, 0.3);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffeedd, 2.5);
    keyLight.position.set(3, 4, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x4466ff, 0.4);
    fillLight.position.set(-3, 1, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xff8866, 0.6);
    rimLight.position.set(-2, 3, -3);
    scene.add(rimLight);

    const accentLight = new THREE.PointLight(0xff4400, 0.4, 6);
    accentLight.position.set(0, 1.5, 2);
    scene.add(accentLight);
  }

  function createBrick() {
    brickGroup = new THREE.Group();

    const geo = new THREE.BoxGeometry(1.6, 0.8, 0.8, 24, 24, 24);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const noise = (Math.random() - 0.5) * 0.018;
      pos.setXYZ(i, x + noise * 0.3, y + noise * 1.5, z + noise);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x8B4513,
      roughness: 0.82,
      metalness: 0.01,
      clearcoat: 0.08,
      clearcoatRoughness: 0.7,
      reflectivity: 0.15,
      envMapIntensity: 0.4,
    });

    const brick = new THREE.Mesh(geo, mat);
    brick.castShadow = true;
    brick.receiveShadow = true;
    brick.position.y = -0.2;
    brickGroup.add(brick);

    const edgeGeo = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(1.6, 0.8, 0.8)
    );
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x5D3A1A, transparent: true, opacity: 0.2,
    });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    edges.position.y = -0.2;
    brickGroup.add(edges);

    scene.add(brickGroup);
  }

  function createFloor() {
    const geo = new THREE.PlaneGeometry(6, 4);
    const mat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const floor = new THREE.Mesh(geo, mat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.65;
    floor.receiveShadow = true;
    scene.add(floor);
  }

  function createParticles() {
    const count = 150;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xD4A843, size: 0.025, transparent: true,
      opacity: 0.3, blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(geo, mat);
    scene.add(particles);
  }

  function onMouseMove(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    isAutoRotate = false;
    clearTimeout(window._rotateTimeout);
    window._rotateTimeout = setTimeout(() => { isAutoRotate = true; }, 3000);
  }

  function onTouchMove(e) {
    if (e.touches.length === 0) return;
    const rect = renderer.domElement.getBoundingClientRect();
    const touch = e.touches[0];
    mouseX = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    mouseY = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
    isAutoRotate = false;
    clearTimeout(window._rotateTimeout);
    window._rotateTimeout = setTimeout(() => { isAutoRotate = true; }, 3000);
  }

  function onVisibilityChange() {
    isVisible = !document.hidden;
    if (isVisible && animationId === null) animate();
    if (!isVisible && animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  function onResize(container) {
    if (!renderer || !camera) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function animate(time) {
    if (!isVisible) { animationId = null; return; }
    if (!brickGroup) return;
    animationId = requestAnimationFrame(animate);

    if (isAutoRotate) {
      targetRotY += 0.002;
      targetRotX = Math.sin((time || 0) * 0.0003) * 0.08;
    } else {
      targetRotY += (mouseX * 0.4 - targetRotY) * 0.015;
      targetRotX += (mouseY * 0.25 - targetRotX) * 0.015;
    }
    brickGroup.rotation.y = targetRotY;
    brickGroup.rotation.x = targetRotX;
    brickGroup.position.y = Math.sin((time || 0) * 0.001) * 0.03;
    renderer.render(scene, camera);
  }

  function destroy() {
    if (animationId) cancelAnimationFrame(animationId);
    if (resizeObserver) resizeObserver.disconnect();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    if (renderer) renderer.dispose();
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
  }

  return { init, destroy };
})();
