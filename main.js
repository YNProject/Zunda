// 1. iOSセンサー許可
window.addEventListener('click', function requestInventory() {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then(response => {
        if (response === 'granted') {
          document.getElementById('instruction').innerText = "TAP GROUND TO SPAWN";
        }
      })
      .catch(console.error);
  } else {
    document.getElementById('instruction').innerText = "TAP GROUND TO SPAWN";
  }
}, { once: true });

// 2. 移動ロジック
AFRAME.registerComponent('character-move', {
  init() {
    this.camera = document.querySelector('#camera');
    this.active = false;
    this.currentAnim = ""; // ★現在のアニメ名を保存する変数を追加
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
      this.setAnim('IDLE'); // ★関数で切り替え
    });
  },

  // ★アニメーションがリセットされないように「変更があった時だけ」適用する
  setAnim(name) {
    if (this.currentAnim !== name) {
      this.currentAnim = name;
      this.el.setAttribute('animation-mixer', {clip: name, loop: 'repeat', crossFadeDuration: 0.4});
    }
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
      const camRotation = this.camera.object3D.rotation;
      const moveAngle = angle - camRotation.y;
      const speed = 0.005;

      this.el.object3D.position.x += Math.cos(moveAngle) * speed * timeDelta;
      this.el.object3D.position.z += Math.sin(moveAngle) * speed * timeDelta;
      
      // ★向きの修正：進む方向を向くように調整
      this.el.object3D.rotation.y = -moveAngle - Math.PI / 2;

      this.setAnim('WALK'); // ★連打されないように関数を使用
    } else {
      this.setAnim('IDLE');
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
      if (intersection && !this.spawned) {
        if (e.target.closest('#overlay')) return;
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