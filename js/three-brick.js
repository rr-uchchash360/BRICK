(function() {
var envMap = null;
var activeCount = 0;

function RoundedBoxGeometry(w, h, d, seg, r) {
  seg = Math.max(2, seg || 2);
  r = Math.min(r || 0.05, Math.min(w, h, d) / 2);
  var geo = new THREE.BoxGeometry(w, h, d, seg, seg, seg);
  var pos = geo.attributes.position;
  var half = new THREE.Vector3(w / 2 - r, h / 2 - r, d / 2 - r);
  var center = new THREE.Vector3();
  var v = new THREE.Vector3();
  for (var i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    center.copy(v).clamp(
      new THREE.Vector3(-half.x, -half.y, -half.z),
      new THREE.Vector3(half.x, half.y, half.z)
    );
    v.sub(center).normalize().multiplyScalar(r).add(center);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function displaceVertices(geo, strength) {
  strength = strength || 0.004;
  geo.computeVertexNormals();
  var pos = geo.attributes.position;
  var nor = geo.attributes.normal;
  var v = new THREE.Vector3();
  var n = new THREE.Vector3();
  for (var i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    n.fromBufferAttribute(nor, i);
    var s1 = Math.sin(v.x * 23.7) * Math.cos(v.y * 41.3) * Math.sin(v.z * 59.1);
    var s2 = Math.sin(v.x * 67.1 + 1.3) * Math.cos(v.y * 89.7 + 2.7) * Math.sin(v.z * 31.9 + 0.5);
    var noise = s1 * 0.7 + s2 * 0.3;
    v.addScaledVector(n, noise * strength);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

function buildEnvMap(width) {
  width = width || 512;
  var height = width / 2;
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0a0704';
  ctx.fillRect(0, 0, width, height);
  var key = ctx.createRadialGradient(width * 0.32, height * 0.38, 10, width * 0.32, height * 0.38, width * 0.2);
  key.addColorStop(0, 'rgba(255,240,226,0.8)');
  key.addColorStop(0.15, 'rgba(255,240,226,0.35)');
  key.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = key;
  ctx.fillRect(0, 0, width, height);
  var tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  return tex;
}

function initBrick(selector, isGold) {
  var el = document.querySelector(selector);
  if (!el) return;

  var rect = el.getBoundingClientRect();
  var w = Math.max(rect.width, 200);
  var h = Math.max(rect.height, 160);

  var renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(w, h);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.7;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.cursor = 'grab';
  renderer.domElement.style.touchAction = 'none';
  el.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(18, w / h, 0.1, 50);
  camera.position.set(4.8, 2.2, 7.0);
  camera.lookAt(0, 0, 0);

  var geo = new RoundedBoxGeometry(2.0, 0.6, 1.0, 2, 0.065);
  displaceVertices(geo, 0.004);

  var mat;
  if (isGold) {
    mat = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      metalness: 0.35,
      roughness: 0.5,
      envMapIntensity: 1.5,
    });
  } else {
    mat = new THREE.MeshStandardMaterial({
      color: 0x701611,
      roughness: 0.8,
      metalness: 0.0,
      envMapIntensity: 0.6,
    });
  }
  if (envMap) mat.envMap = envMap;

  var mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  scene.add(new THREE.HemisphereLight(0xffeedd, 0x4a2c1a, 0.6));
  var keyLight = new THREE.DirectionalLight(0xfff0e6, 1.2);
  keyLight.position.set(3, 4, 3);
  scene.add(keyLight);
  var fillLight = new THREE.DirectionalLight(0xffccaa, 0.2);
  fillLight.position.set(-2, 1, 2);
  scene.add(fillLight);
  var rimLight = new THREE.DirectionalLight(0xeef4ff, 0.15);
  rimLight.position.set(-0.5, 2, -4);
  scene.add(rimLight);

  var angleY = 0;
  var angleX = 0;
  var velY = 0;
  var velX = 0;
  var isDragging = false;
  var prevX = 0;
  var prevY = 0;
  var prevAngleY = 0;
  var prevAngleX = 0;
  var lastAngleY = 0;
  var lastAngleX = 0;
  var animId = null;
  var isVisible = false;

  renderer.domElement.addEventListener('mousedown', function(e) {
    isDragging = true;
    prevX = e.clientX;
    prevY = e.clientY;
    prevAngleY = angleY;
    prevAngleX = angleX;
    lastAngleY = angleY;
    lastAngleX = angleX;
    velY = 0;
    velX = 0;
    renderer.domElement.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    var dx = e.clientX - prevX;
    var dy = e.clientY - prevY;
    var nextY = prevAngleY + dx * 0.008;
    var nextX = prevAngleX - dy * 0.008;
    velY = (nextY - lastAngleY) * 0.4;
    velX = (nextX - lastAngleX) * 0.4;
    lastAngleY = nextY;
    lastAngleX = nextX;
    angleY = nextY;
    angleX = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, nextX));
  });

  window.addEventListener('mouseup', function() {
    if (isDragging) {
      isDragging = false;
      renderer.domElement.style.cursor = 'grab';
    }
  });

  renderer.domElement.addEventListener('touchstart', function(e) {
    var t = e.changedTouches[0];
    isDragging = true;
    prevX = t.clientX;
    prevY = t.clientY;
    prevAngleY = angleY;
    prevAngleX = angleX;
    lastAngleY = angleY;
    lastAngleX = angleX;
    velY = 0;
    velX = 0;
  }, { passive: true });

  renderer.domElement.addEventListener('touchmove', function(e) {
    if (!isDragging) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - prevX;
    var dy = t.clientY - prevY;
    var nextY = prevAngleY + dx * 0.008;
    var nextX = prevAngleX - dy * 0.008;
    velY = (nextY - lastAngleY) * 0.4;
    velX = (nextX - lastAngleX) * 0.4;
    lastAngleY = nextY;
    lastAngleX = nextX;
    angleY = nextY;
    angleX = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, nextX));
  }, { passive: true });

  renderer.domElement.addEventListener('touchend', function() {
    isDragging = false;
  }, { passive: true });

  var resizeObserver = new ResizeObserver(function() {
    var r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
      renderer.setSize(r.width, r.height);
    }
  });
  resizeObserver.observe(el);

  var io = new IntersectionObserver(function(entries) {
    var e = entries[0];
    isVisible = e.isIntersecting;
    if (e.isIntersecting) {
      activeCount++;
      if (!animId) renderLoop();
    } else {
      activeCount--;
      if (activeCount <= 0 && animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    }
  }, { threshold: 0.05 });
  io.observe(el);

  function renderLoop() {
    animId = requestAnimationFrame(renderLoop);

    if (!isVisible && !isDragging) return;

    if (!isDragging) {
      if (Math.abs(velY) > 0.0001 || Math.abs(velX) > 0.0001) {
        angleY += velY;
        velY *= 0.94;
        angleX += velX;
        velX *= 0.94;
        angleX = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, angleX));
        if (angleX <= -Math.PI / 4 || angleX >= Math.PI / 4) velX = 0;
      } else {
        velY = 0;
        velX = 0;
        angleY += 0.003;
      }
    }

    mesh.rotation.x = angleX;
    mesh.rotation.y = angleY;

    renderer.render(scene, camera);
  }

  renderLoop();
}

document.addEventListener('DOMContentLoaded', function() {
  if (!envMap) envMap = buildEnvMap(512);

  initBrick('#productBrickContainer');
  initBrick('.hero-brick');
  initBrick('.showcase-brick-3d');
});
})();
