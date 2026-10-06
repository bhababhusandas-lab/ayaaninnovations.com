/* Ayaan / Form 01. An original, procedurally modelled studio sculpture. */
(() => {
  'use strict';

  const canvas = document.getElementById('sculpture');
  if (!canvas) return;
  const stage = canvas.closest('.sculpture-stage') || canvas.parentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function showFallback() {
    stage.classList.remove('webgl-ready');
    stage.dataset.rendering = 'unsupported';
    const reshapeControl = document.getElementById('reshape');
    if (reshapeControl) {
      reshapeControl.disabled = true;
      reshapeControl.title = 'Interactive reshaping is unavailable in this browser.';
    }
  }
  const gl = canvas.getContext('webgl', {
    alpha: true, antialias: true, premultipliedAlpha: false,
    powerPreference: 'low-power', preserveDrawingBuffer: false
  });
  if (!gl) {
    showFallback();
    return;
  }

  const vertexSource = `
    precision highp float;
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec3 aPositionNext;
    attribute vec3 aNormalNext;
    attribute vec2 aUv;
    uniform mat4 uProjection;
    uniform mat4 uModel;
    uniform float uMorph;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    void main() {
      vec4 world = uModel * vec4(mix(aPosition, aPositionNext, uMorph), 1.0);
      vNormal = mat3(uModel) * normalize(mix(aNormal, aNormalNext, uMorph));
      vPosition = world.xyz;
      vUv = aUv;
      gl_Position = uProjection * (world + vec4(0.0, 0.0, -6.35, 0.0));
    }
  `;
  const fragmentSource = `
    precision mediump float;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    void main() {
      vec3 n = normalize(vNormal);
      vec3 view = normalize(vec3(0.0, 0.0, 6.35) - vPosition);
      vec3 key = normalize(vec3(-3.5, 5.0, 5.5));
      vec3 fill = normalize(vec3(4.0, 1.2, 2.8));
      vec3 rim = normalize(vec3(0.5, 3.8, -4.0));
      float diffuse = max(dot(n, key), 0.0);
      float fillLight = max(dot(n, fill), 0.0);
      float rimLight = pow(max(dot(n, rim), 0.0), 2.0);
      float specular = pow(max(dot(n, normalize(key + view)), 0.0), 42.0);
      float broadSpecular = pow(max(dot(n, normalize(key + view)), 0.0), 12.0);
      float fresnel = pow(1.0 - max(dot(n, view), 0.0), 3.0);
      float groove = 0.965 + 0.035 * cos(vUv.x * 80.0 * 6.2831853);
      float cavity = smoothstep(0.20, 1.55, length(vPosition.xy));
      vec3 pigment = vec3(0.91, 0.185, 0.046);
      vec3 light = vec3(0.40, 0.34, 0.28)
        + diffuse * vec3(0.93, 0.80, 0.65)
        + fillLight * vec3(0.34, 0.28, 0.20)
        + rimLight * vec3(0.53, 0.34, 0.19);
      vec3 color = pigment * light * groove * mix(0.88, 1.0, cavity);
      color += specular * vec3(0.60, 0.43, 0.27);
      color += broadSpecular * vec3(0.18, 0.10, 0.05);
      color += fresnel * rimLight * vec3(0.18, 0.065, 0.022);
      color = pow(max(color, vec3(0.0)), vec3(0.91));
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  function shader(type, source) {
    const result = gl.createShader(type);
    gl.shaderSource(result, source);
    gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
      gl.deleteShader(result);
      throw new Error('Unable to compile sculpture shader');
    }
    return result;
  }

  let program;
  try {
    program = gl.createProgram();
    const vertex = shader(gl.VERTEX_SHADER, vertexSource);
    const fragment = shader(gl.FRAGMENT_SHADER, fragmentSource);
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Unable to link sculpture program');
  } catch (_) {
    showFallback();
    return;
  }

  const TAU = Math.PI * 2;
  const rings = 800;
  const sides = 32;
  const stride = 14;
  const vertices = new Float32Array((rings + 1) * (sides + 1) * stride);
  const indices = new Uint16Array(rings * sides * 6);

  function normalize(v) {
    const length = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / length, v[1] / length, v[2] / length];
  }
  function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
  function subtract(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }
  function point(t, v, alternate) {
    const major = alternate ? 1.02 : 1.08;
    const lobe = alternate ? 0.64 : 0.46;
    const width = alternate ? 0.221 : 0.264;
    const c2 = Math.cos(t * 2), s2 = Math.sin(t * 2);
    const c3 = Math.cos(t * 3), s3 = Math.sin(t * 3);
    const radius = major + lobe * c3;
    const derivative = -3 * lobe * s3;
    const tangent = normalize([
      derivative * c2 - 2 * radius * s2,
      derivative * s2 + 2 * radius * c2,
      3 * lobe * c3
    ]);
    const dot = c2 * tangent[0] + s2 * tangent[1];
    const normal = normalize([c2 - dot * tangent[0], s2 - dot * tangent[1], -dot * tangent[2]]);
    const binormal = cross(tangent, normal);
    const rib = width * (0.98 + 0.02 * Math.cos(80 * t));
    const x = Math.cos(v) * rib;
    const y = Math.sin(v) * rib * (alternate ? 1.14 : 1.0);
    return [
      radius * c2 + normal[0] * x + binormal[0] * y,
      radius * s2 + normal[1] * x + binormal[1] * y,
      lobe * s3 + normal[2] * x + binormal[2] * y
    ];
  }
  function surface(t, v, alternate) {
    const position = point(t, v, alternate);
    const along = subtract(point(t + 0.0001, v, alternate), point(t - 0.0001, v, alternate));
    const around = subtract(point(t, v + 0.0001, alternate), point(t, v - 0.0001, alternate));
    // Around x along points outwards for this transported frame.
    return {position, normal: normalize(cross(around, along))};
  }

  let offset = 0;
  for (let ring = 0; ring <= rings; ring++) {
    const t = ring / rings * TAU;
    for (let side = 0; side <= sides; side++) {
      const v = side / sides * TAU;
      const first = surface(t, v, false);
      const second = surface(t, v, true);
      vertices.set(first.position, offset);
      vertices.set(first.normal, offset + 3);
      vertices.set(second.position, offset + 6);
      vertices.set(second.normal, offset + 9);
      vertices[offset + 12] = ring / rings;
      vertices[offset + 13] = side / sides;
      offset += stride;
    }
  }
  offset = 0;
  for (let ring = 0; ring < rings; ring++) {
    for (let side = 0; side < sides; side++) {
      const a = ring * (sides + 1) + side;
      const b = a + sides + 1;
      indices.set([a, a + 1, b, b, a + 1, b + 1], offset);
      offset += 6;
    }
  }

  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  const attributes = [['aPosition', 3, 0], ['aNormal', 3, 3], ['aPositionNext', 3, 6], ['aNormalNext', 3, 9], ['aUv', 2, 12]];
  for (const [name, size, start] of attributes) {
    const location = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride * 4, start * 4);
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.clearColor(0, 0, 0, 0);

  const uniforms = {
    projection: gl.getUniformLocation(program, 'uProjection'),
    model: gl.getUniformLocation(program, 'uModel'),
    morph: gl.getUniformLocation(program, 'uMorph')
  };
  const pointer = {x: 0, y: 0};
  const current = {x: 0, y: 0};
  let width = 1, height = 1, frame = 0, previousTime = 0, elapsed = 0;
  let visible = true, lost = false, explicitPaused = false;
  let morph = 0, morphTarget = 0;

  function isPaused() { return explicitPaused || reducedMotion.matches; }

  function projection(aspect) {
    const f = 1 / Math.tan(35 * Math.PI / 360);
    const near = 0.1, far = 30;
    return new Float32Array([
      f / aspect, 0, 0, 0, 0, f, 0, 0,
      0, 0, (far + near) / (near - far), -1,
      0, 0, 2 * far * near / (near - far), 0
    ]);
  }

  function modelMatrix(x, y, z, size) {
    const cx = Math.cos(x), sx = Math.sin(x), cy = Math.cos(y), sy = Math.sin(y);
    const cz = Math.cos(z), sz = Math.sin(z);
    return new Float32Array([
      size * cy * cz, size * (sx * sy * cz + cx * sz), size * (-cx * sy * cz + sx * sz), 0,
      -size * cy * sz, size * (-sx * sy * sz + cx * cz), size * (cx * sy * sz + sx * cz), 0,
      size * sy, -size * sx * cy, size * cx * cy, 0,
      0, Math.sin(elapsed * 0.5) * 0.035, 0, 1
    ]);
  }

  function render() {
    if (lost) return;
    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const aspect = width / height;
    const scale = Math.min(1, aspect * 1.05) * 0.98;
    gl.uniformMatrix4fv(uniforms.projection, false, projection(aspect));
    gl.uniformMatrix4fv(uniforms.model, false, modelMatrix(
      0.63 + Math.sin(elapsed * 0.12) * 0.15 + current.y * 0.16,
      -0.24 + Math.sin(elapsed * 0.19) * 0.28 + current.x * 0.25,
      -0.22 + Math.sin(elapsed * 0.1) * 0.12,
      scale
    ));
    gl.uniform1f(uniforms.morph, morph);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  }

  function tick(time) {
    frame = 0;
    if (lost || !visible || document.hidden) { previousTime = 0; return; }
    const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.04) : 1 / 60;
    previousTime = time;
    const paused = isPaused();
    if (!paused) elapsed += delta;
    const ease = 1 - Math.exp(-delta * 6);
    current.x += (pointer.x - current.x) * ease;
    current.y += (pointer.y - current.y) * ease;
    morph += (morphTarget - morph) * (reducedMotion.matches ? 1 : 1 - Math.exp(-delta * 4));
    if (Math.abs(morphTarget - morph) < 0.0002) morph = morphTarget;
    render();
    if (!paused || morph !== morphTarget || Math.abs(current.x - pointer.x) + Math.abs(current.y - pointer.y) > 0.001) start();
  }

  function start() {
    if (!frame && visible && !document.hidden && !lost) frame = requestAnimationFrame(tick);
  }
  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    width = Math.max(1, Math.round(bounds.width * dpr));
    height = Math.max(1, Math.round(bounds.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    render();
    start();
  }

  stage.addEventListener('pointermove', (event) => {
    if (isPaused() || event.pointerType === 'touch') return;
    const bounds = stage.getBoundingClientRect();
    pointer.x = (event.clientX - bounds.left) / bounds.width * 2 - 1;
    pointer.y = (event.clientY - bounds.top) / bounds.height * 2 - 1;
    start();
  }, {passive: true});
  stage.addEventListener('pointerleave', () => { pointer.x = pointer.y = 0; start(); });

  const reshape = document.getElementById('reshape');
  if (reshape) {
    reshape.addEventListener('click', () => {
      morphTarget = morphTarget ? 0 : 1;
      reshape.dataset.form = morphTarget ? '02' : '01';
      stage.dataset.form = morphTarget ? '02' : '01';
      const label = document.querySelector('[data-form-number]');
      if (label) label.textContent = morphTarget ? '02' : '01';
      start();
    });
  }

  window.addEventListener('ayaan:motion', (event) => {
    explicitPaused = Boolean(event.detail && event.detail.paused);
    pointer.x = pointer.y = 0;
    previousTime = 0;
    start();
  });
  reducedMotion.addEventListener('change', () => { previousTime = 0; start(); });
  document.addEventListener('visibilitychange', () => { previousTime = 0; start(); });

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize, {passive: true});
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      previousTime = 0;
      start();
    }, {rootMargin: '80px'}).observe(canvas);
  }
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    lost = true;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    showFallback();
  });

  window.AyaanSculpture = {
    pause() { explicitPaused = true; start(); },
    resume() { explicitPaused = false; previousTime = 0; start(); },
    get paused() { return isPaused(); },
    get form() { return morphTarget ? 2 : 1; },
    get supported() { return !lost; }
  };
  stage.classList.add('webgl-ready');
  stage.dataset.rendering = 'webgl';
  stage.dataset.form = '01';
  resize();
})();
