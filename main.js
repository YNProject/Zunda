// センサー許可
window.addEventListener('click', () => {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission().catch(console.error);
  }
  const instr = document.getElementById('instruction');
  if(instr.innerText.includes("START")) instr.innerText = "TAP TO SPAWN";
}, { once: false });

AFRAME.registerComponent('character-recenter', {
  init() {
    this.spawned = false;
    this.el.sceneEl.addEventListener('mousedown', (e) => {
      if (e.target.closest('#overlay')) return;

      if (!this.spawned) {
        const cameraEl = document.querySelector('#camera');
        
        // 【超重要】カメラが今どこを向いているかのベクトルを取得
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(cameraEl.object3D.quaternion);
        
        // 水平方向だけの向き（Y軸）を計算
        const angleY = Math.atan2(direction.x, direction.z);

        // 5m前方、3m下を算出
        const dist = 5.0; 
        const spawnPosX = cameraEl.object3D.position.x + Math.sin(angleY) * dist;
        const spawnPosZ = cameraEl.object3D.position.z + Math.cos(angleY) * dist;
        const spawnPosY = -3.0; // 床の高さ

        this.el.object3D.position.set(spawnPosX, spawnPosY, spawnPosZ);
        this.el.object3D.rotation.set(0, angleY, 0); 
        
        this.el.setAttribute('visible', 'true');
        this.spawned = true;
        document.getElementById('instruction').innerText = "DRAG TO MOVE";
      }
    });

    document.getElementById('recenterBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.spawned = false;
      this.el.setAttribute('visible', 'false');
      document.getElementById('instruction').innerText = "TAP TO SPAWN";
    });
  }
});

// ジョイスティックと移動
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
      this.joystickParent.style.display = 'block';
    });
    window.addEventListener('touchmove', (e) => {
      if (!this.active) return;
      this.currentPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    });
    window.addEventListener('touchend', () => {
      this.active = false;
      this.joystickParent.style.display = 'none';
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
      this.el.object3D.position.y = -3.0;
      this.el.object3D.rotation.y = -moveAngle + Math.PI / 2;
      this.el.setAttribute('animation-mixer', {clip: 'WALK', loop: 'repeat'});
    }
  }
});