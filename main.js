// センサー許可と初期化
const sceneEl = document.querySelector('a-scene');

sceneEl.addEventListener('click', () => {
  // iOS センサー許可
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission().catch(console.error);
  }
  const instr = document.getElementById('instruction');
  if(instr.innerText.includes("START")) instr.innerText = "LOOK DOWN & TAP";
});

AFRAME.registerComponent('character-recenter', {
  init() {
    this.spawned = false;
    // a-scene自体のクリックを監視（Mind-ARの干渉を避けるため）
    this.el.sceneEl.addEventListener('mousedown', (e) => {
      // リセットボタンなどを押した時は無視
      if (e.target.closest('#overlay')) return;

      if (!this.spawned) {
        const cameraEl = document.querySelector('#camera');
        const rotation = cameraEl.getAttribute('rotation');
        const angleY = rotation.y * (Math.PI / 180);

        // 身長180cmからの視点を想定：5m先、3m下
        const dist = 5.0; 
        const x = -Math.sin(angleY) * dist;
        const z = -Math.cos(angleY) * dist;
        const y = -3.0; // 地面の高さ

        this.el.object3D.position.set(x, y, z);
        this.el.object3D.rotation.set(0, angleY + Math.PI, 0); 
        this.el.setAttribute('visible', 'true');
        this.spawned = true;
        document.getElementById('instruction').innerText = "DRAG TO MOVE";
        
        console.log("Spawned at:", x, y, z);
      }
    });

    document.getElementById('recenterBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.spawned = false;
      this.el.setAttribute('visible', 'false');
      document.getElementById('instruction').innerText = "LOOK DOWN & TAP";
    });
  }
});

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