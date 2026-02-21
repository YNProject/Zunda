// --- 1. iOSセンサー・カメラ開始許可 ---
window.addEventListener('click', function requestAccess() {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission().catch(console.error);
  }
  
  const instr = document.getElementById('instruction');
  if(instr.innerText.includes("START")) {
    instr.innerText = "LOOK DOWN & TAP GROUND";
  }
}, { once: false });

// --- 2. キャラクター移動（ジョイスティック）ロジック ---
AFRAME.registerComponent('character-move', {
  init() {
    this.camera = document.querySelector('#camera');
    this.active = false;
    this.startPos = { x: 0, y: 0 };
    this.currentPos = { x: 0, y: 0 };

    const overlay = document.getElementById('overlay');
    this.joystickParent = document.createElement('div');
    this.joystickParent.className = 'joystick-container';
    this.joystickOrigin = document.createElement('div');
    this.joystickOrigin.className = 'joystick origin';
    this.joystickPosition = document.createElement('div');
    this.joystickPosition.className = 'joystick position';
    this.joystickParent.appendChild(this.joystickOrigin);
    this.joystickParent.appendChild(this.joystickPosition);
    overlay.appendChild(this.joystickParent);

    window.addEventListener('touchstart', (e) => {
      if (!this.el.getAttribute('visible')) return;
      this.active = true;
      this.startPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      this.currentPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      this.joystickParent.classList.add('visible');
    });

    window.addEventListener('touchmove', (e) => {
      if (!this.active) return;
      this.currentPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    });

    window.addEventListener('touchend', () => {
      this.active = false;
      this.joystickParent.classList.remove('visible');
      this.el.setAttribute('animation-mixer', {clip: 'IDLE', loop: 'repeat'});
    });
  },

  tick(time, timeDelta) {
    if (!this.active) return;

    const dx = this.currentPos.x - this.startPos.x;
    const dy = this.currentPos.y - this.startPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = 50;
    const clampedDist = Math.min(distance, maxRadius);
    const angle = Math.atan2(dy, dx);

    this.joystickOrigin.style.left = `${this.startPos.x}px`;
    this.joystickOrigin.style.top = `${this.startPos.y}px`;
    this.joystickPosition.style.left = `${this.startPos.x + Math.cos(angle) * clampedDist}px`;
    this.joystickPosition.style.top = `${this.startPos.y + Math.sin(angle) * clampedDist}px`;

    if (distance > 5) {
      const camY = this.camera.object3D.rotation.y;
      const moveAngle = angle - camY;
      const speed = 0.005;

      this.el.object3D.position.x += Math.cos(moveAngle) * speed * timeDelta;
      this.el.object3D.position.z += Math.sin(moveAngle) * speed * timeDelta;
      // 床の高さ(0)を維持
      this.el.object3D.position.y = 0;

      this.el.object3D.rotation.y = -moveAngle + Math.PI / 2;
      this.el.setAttribute('animation-mixer', {clip: 'WALK', loop: 'repeat'});
    }
  }
});

// --- 3. スポーン・リセンターロジック ---
AFRAME.registerComponent('character-recenter', {
  init() {
    this.spawned = false;
    const scene = this.el.sceneEl;
    const instruction = document.getElementById('instruction');

scene.addEventListener('click', (e) => {
  const intersection = e.detail.intersection;
  const instruction = document.getElementById('instruction');

  if (intersection && !this.spawned && e.target.id === 'dummy-floor') {
    const cameraEl = document.querySelector('#camera');
    
    // カメラの向き（Y軸回転）を取得
    const camRotY = cameraEl.object3D.rotation.y;

    // 【重要】カメラの座標に関わらず、地面(Y=0)に配置する
    // 距離を2.5メートルに少し伸ばして、視界に入りやすくします
    const distance = 2.5; 
    const spawnPosX = cameraEl.object3D.position.x - Math.sin(camRotY) * distance;
    const spawnPosZ = cameraEl.object3D.position.z - Math.cos(camRotY) * distance;
    
    // Y座標を 0 に固定（空中浮遊を防止）
    const spawnPosY = 0; 

    this.el.object3D.position.set(spawnPosX, spawnPosY, spawnPosZ);
    
    // キャラクターの向きをカメラの方へ向ける
    this.el.object3D.rotation.y = camRotY + Math.PI; 

    this.el.setAttribute('visible', 'true');
    this.spawned = true;
    instruction.innerText = "DRAG TO MOVE";
  }
});

    // リセンターボタンでリセット
    document.getElementById('recenterBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.spawned = false;
      this.el.setAttribute('visible', 'false');
      instruction.innerText = "LOOK DOWN & TAP GROUND";
    });
  }
});