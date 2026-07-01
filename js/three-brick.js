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
  let isTabVisible = true;
  let isOnScreen = true;
  let resizeObserver = null;

  /* ---- Procedural texture generation (ancient Bangladeshi terracotta) ---- */

  function hash(x, y) {
    var h = x * 374761393 + y * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    return (h ^ (h >> 16)) & 0x7fffffff;
  }

  function smoothNoise(x, y) {
    var ix = Math.floor(x), iy = Math.floor(y);
    var fx = x - ix, fy = y - iy;
    fx = fx * fx * (3 - 2 * fx);
    fy = fy * fy * (3 - 2 * fy);
    var a = hash(ix, iy), b = hash(ix + 1, iy);
    var c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
    a /= 0x7fffffff; b /= 0x7fffffff;
    c /= 0x7fffffff; d /= 0x7fffffff;
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }

  function fbm(x, y, octaves) {
    var val = 0, amp = 0.5, freq = 1;
    for (var i = 0; i < octaves; i++) {
      val += amp * smoothNoise(x * freq, y * freq);
      amp *= 0.5; freq *= 2;
    }
    return val;
  }

  function generateBrickTexture(size) {
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');
    var imgData = ctx.createImageData(size, size);
    var d = imgData.data;

    for (var py = 0; py < size; py++) {
      for (var px = 0; px < size; px++) {
        var u = px / size, v = py / size;
        var i4 = (py * size + px) * 4;

        var n = fbm(u * 4, v * 4, 4);
        var n2 = fbm(u * 8 + 1.7, v * 8 + 3.2, 3);
        var n3 = smoothNoise(u * 16, v * 16);

        var burnt = fbm(u * 3 + 5.5, v * 3 + 2.3, 3);
        var isBurnt = burnt > 0.55;

        var r, g, b;
        if (isBurnt) {
          r = 80 + n * 20 + n2 * 6;
          g = 12 + n * 6 + n2 * 3;
          b = 18 + n * 5 + n2 * 3;
        } else {
          r = 190 + n * 30 + n2 * 10;
          g = 28 + n * 10 + n2 * 4;
          b = 35 + n * 8 + n2 * 4;
        }

        r += (n3 - 0.5) * 10;
        g += (n3 - 0.5) * 3;
        b += (n3 - 0.5) * 4;

        var grain = (smoothNoise(u * 60, v * 60) - 0.5) * 14;
        r += grain; g += grain * 0.6; b += grain * 0.3;

        d[i4] = Math.max(0, Math.min(255, r));
        d[i4 + 1] = Math.max(0, Math.min(255, g));
        d[i4 + 2] = Math.max(0, Math.min(255, b));
        d[i4 + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    var heightData = new Float32Array(size * size);
    for (var py = 0; py < size; py++) {
      for (var px = 0; px < size; px++) {
        var i = py * size + px;
        var i4 = i * 4;
        heightData[i] = (d[i4] + d[i4 + 1] + d[i4 + 2]) / 765;
      }
    }

    var tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    return { tex: tex, heightData: heightData, size: size };
  }

  function generateNormalMap(heightData, size) {
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');
    var imgData = ctx.createImageData(size, size);
    var d = imgData.data;
    var strength = 4.0;

    for (var py = 0; py < size; py++) {
      for (var px = 0; px < size; px++) {
        var left = heightData[py * size + Math.max(px - 1, 0)];
        var right = heightData[py * size + Math.min(px + 1, size - 1)];
        var up = heightData[Math.max(py - 1, 0) * size + px];
        var down = heightData[Math.min(py + 1, size - 1) * size + px];
        var dx = (left - right) * strength / size;
        var dy = (up - down) * strength / size;
        var len = Math.sqrt(dx * dx + dy * dy + 1);
        var i4 = (py * size + px) * 4;
        d[i4] = Math.round((dx / len * 0.5 + 0.5) * 255);
        d[i4 + 1] = Math.round((dy / len * 0.5 + 0.5) * 255);
        d[i4 + 2] = Math.round((1 / len * 0.5 + 0.5) * 255);
        d[i4 + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    var tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  function generateRoughnessMap(size) {
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');
    var imgData = ctx.createImageData(size, size);
    var d = imgData.data;

    for (var py = 0; py < size; py++) {
      for (var px = 0; px < size; px++) {
        var u = px / size, v = py / size;
        var i4 = (py * size + px) * 4;
        var n = fbm(u * 5, v * 5, 3) * 0.4 + 0.3;
        var val = Math.round((n + (smoothNoise(u * 30, v * 30) - 0.5) * 0.15) * 255);
        d[i4] = d[i4 + 1] = d[i4 + 2] = Math.max(0, Math.min(255, val));
        d[i4 + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    var tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

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

    const tier = window.DEVICE_TIER || 'high';
    const maxDpr = tier === 'low' ? 1 : tier === 'mid' ? 1.5 : 2;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 5);

    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: tier !== 'low',
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
    renderer.shadowMap.enabled = tier !== 'low';
    if (tier !== 'low') {
      renderer.shadowMap.type = tier === 'mid' ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
    }
    renderer.toneMapping = tier === 'low' ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    setupLights(tier);
    createBrick(tier);
    if (tier !== 'low') createFloor();
    if (tier !== 'low') createParticles(tier);

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('touchmove', onTouchMove, { passive: true });

    resizeObserver = new ResizeObserver(() => onResize(container));
    resizeObserver.observe(container);

    document.addEventListener('visibilitychange', onVisibilityChange);

    var scrollObserver = new IntersectionObserver(function(entries) {
      isOnScreen = entries[0].isIntersecting;
      updateVisibility();
    }, { threshold: 0 });
    scrollObserver.observe(container);

    animate();
  }

  function setupLights(tier) {
    var ambient = new THREE.AmbientLight(0xffccaa, 0.25);
    scene.add(ambient);

    var keyLight = new THREE.DirectionalLight(0xffddbb, 3.0);
    keyLight.position.set(4, 5, 4);
    if (tier !== 'low') {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = tier === 'mid' ? 512 : 1024;
      keyLight.shadow.mapSize.height = tier === 'mid' ? 512 : 1024;
      keyLight.shadow.bias = -0.001;
    }
    scene.add(keyLight);

    var fillLight = new THREE.DirectionalLight(0x99bbff, 0.35);
    fillLight.position.set(-3, 0.5, -3);
    scene.add(fillLight);

    var rimLight = tier !== 'low' ? new THREE.DirectionalLight(0xff9944, 0.6) : null;
    if (rimLight) {
      rimLight.position.set(-1, 2, -4);
      scene.add(rimLight);
    }

    var bounceLight = tier !== 'low' ? new THREE.DirectionalLight(0xff8844, 0.3) : null;
    if (bounceLight) {
      bounceLight.position.set(0, -1, 2);
      scene.add(bounceLight);
    }
  }

  function createBrick(tier) {
    brickGroup = new THREE.Group();

    var w = 1.8, h = 0.75, d = 0.9;
    var seg = tier === 'low' ? 4 : tier === 'mid' ? 8 : 16;
    var geo = new THREE.BoxGeometry(w, h, d, seg, seg, seg);

    var pos = geo.attributes.position;
    var hw = w / 2, hh = h / 2, hd = d / 2;
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      var nx = x / hw, ny = y / hh, nz = z / hd;

      var edgeX = Math.min(Math.abs(nx), 1);
      var edgeY = Math.min(Math.abs(ny), 1);
      var edgeZ = Math.min(Math.abs(nz), 1);
      var edgeDist = Math.min(1 - Math.abs(nx), 1 - Math.abs(ny), 1 - Math.abs(nz));
      var isCorner = edgeDist < 0.15;

      var bulge = 0;
      if (isCorner) {
        var t = edgeDist / 0.15;
        bulge = (1 - t * t) * 0.025;
      }

      var noise = 0;
      if (tier !== 'low') {
        noise = (Math.random() - 0.5) * 0.035;
        if (isCorner) noise *= 0.5;
      }

      pos.setXYZ(i, x + x * bulge + noise, y + y * bulge * 0.6 + noise * 0.5, z + z * bulge * 0.7 + noise * 0.5);
    }
    geo.computeVertexNormals();

    var texSize = tier === 'low' ? 256 : tier === 'mid' ? 512 : 1024;
    var result = generateBrickTexture(texSize);
    var normalTex = tier !== 'low' ? generateNormalMap(result.heightData, texSize) : null;
    var roughTex = tier !== 'low' ? generateRoughnessMap(texSize) : null;

    var mat = new THREE.MeshPhysicalMaterial({
      map: result.tex,
      normalMap: normalTex,
      normalScale: tier !== 'low' ? new THREE.Vector2(1.5, 1.5) : null,
      roughnessMap: roughTex,
      roughness: 0.85,
      metalness: 0.0,
      clearcoat: tier === 'low' ? 0 : 0.03,
      clearcoatRoughness: 0.6,
      envMapIntensity: tier === 'low' ? 0 : 0.3,
    });

    var brick = new THREE.Mesh(geo, mat);
    brick.castShadow = tier !== 'low';
    brick.receiveShadow = tier !== 'low';
    brick.position.y = -0.2;
    brickGroup.add(brick);

    scene.add(brickGroup);
  }

  function createFloor() {
    var geo = new THREE.PlaneGeometry(8, 6);
    var mat = new THREE.ShadowMaterial({ opacity: 0.3 });
    var floor = new THREE.Mesh(geo, mat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.65;
    floor.receiveShadow = true;
    scene.add(floor);
  }

  function createParticles(tier) {
    var count = tier === 'mid' ? 60 : 150;
    var positions = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.PointsMaterial({
      color: 0xD4A843, size: 0.025, transparent: true,
      opacity: 0.3, blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    var particles = new THREE.Points(geo, mat);
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
    isTabVisible = !document.hidden;
    updateVisibility();
  }

  function updateVisibility() {
    var shouldRender = isTabVisible && isOnScreen;
    if (shouldRender && !isVisible) {
      isVisible = true;
      if (animationId === null) animate();
    } else if (!shouldRender && isVisible) {
      isVisible = false;
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
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
