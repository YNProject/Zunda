// 1. センサー許可と初期化
window.addEventListener('click', function requestAccess() {
  // iOS センサー許可
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission().catch(console.error);
  }
  
  // 一度クリックしたら案内を変える
  const instr = document.getElementById('instruction');
  if(instr.innerText.includes("START")) {
    instr.innerText = "TAP GROUND TO SPAWN";
  }
}, { once: false });

// 2. 移動ロジック
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
      this.el.object3D.rotation.y = -moveAngle + Math.PI / 2;
      this.el.setAttribute('animation-mixer', {clip: 'WALK', loop: 'repeat'});
    }
  }
});

// 3. スポーン & リセンター
AFRAME.registerComponent('character-recenter', {
  init() {
    this.spawned = false;
    const scene = this.el.sceneEl;
    const instruction = document.getElementById('instruction');

    scene.addEventListener('click', (e) => {
      const intersection = e.detail.intersection;
      // ボタン以外の場所をクリックした場合
      if (intersection && !this.spawned && e.target.id === 'dummy-floor') {
        const point = intersection.point;
        this.el.object3D.position.set(point.x, point.y, point.z);
        this.el.setAttribute('visible', 'true');
        this.spawned = true;
        instruction.innerText = "DRAG TO MOVE";
      }
    });

    document.getElementById('recenterBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.spawned = false;
      this.el.setAttribute('visible', 'false');
      instruction.innerText = "TAP GROUND TO SPAWN";
    });
  }
});