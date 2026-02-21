// 1. iOSセンサー許可（カメラを動かすために必須）
window.addEventListener('click', function requestAccess() {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission().then(state => {
      if(state === 'granted') {
        document.getElementById('instruction').innerText = "TAP TO SPAWN";
      }
    }).catch(console.error);
  } else {
    const instr = document.getElementById('instruction');
    if (instr && instr.innerText.includes("START")) { instr.innerText = "TAP TO SPAWN"; }
  }
}, { once: true });

AFRAME.registerComponent('character-move', {
  init() {
    this.camera = document.querySelector('#camera');
    this.active = false;
    this.currentAnim = ""; 
    this.startPos = { x: 0, y: 0 };
    this.currentPos = { x: 0, y: 0 };
    
    this.joyContainer = document.getElementById('joystick-container');
    this.joyOrigin = document.querySelector('.joystick.origin');
    this.joyPos = document.querySelector('.joystick.position');

    window.addEventListener('touchstart', (e) => {
      if (!this.el.getAttribute('visible')) return;
      this.active = true;
      this.startPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      this.currentPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      this.joyContainer.style.display = 'block';
    });

    window.addEventListener('touchmove', (e) => {
      if (!this.active) return;
      this.currentPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    });

    window.addEventListener('touchend', () => {
      this.active = false;
      this.joyContainer.style.display = 'none';
      this.setAnim('IDLE');
    });
  },

  setAnim(name) {
    if (this.currentAnim !== name) {
      this.currentAnim = name;
      const body = document.querySelector('#zunda_body');
      body.setAttribute('animation-mixer', {clip: name, loop: 'repeat'});
    }
  },

  tick(time, timeDelta) {
    if (!this.active) return;

    const dx = this.currentPos.x - this.startPos.x;
    const dy = this.currentPos.y - this.startPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    this.joyOrigin.style.left = `${this.startPos.x}px`;
    this.joyOrigin.style.top = `${this.startPos.y}px`;
    const clampedDist = Math.min(distance, 40);
    this.joyPos.style.left = `${this.startPos.x + Math.cos(angle) * clampedDist}px`;
    this.joyPos.style.top = `${this.startPos.y + Math.sin(angle) * clampedDist}px`;

    if (distance > 5) {
      // カメラの向き（ラジアン）を取得
      const camRot = this.camera.object3D.rotation.y;
      const moveAngle = angle - camRot;
      const speed = 0.005;

      this.el.object3D.position.x += Math.cos(moveAngle) * speed * timeDelta;
      this.el.object3D.position.z += Math.sin(moveAngle) * speed * timeDelta;
      this.el.object3D.position.y = -3.0;

      // ★向きの修正：進行方向を向くように Math.PI（180度）の調整を変更
      // 逆を向く場合は、ここの -Math.PI / 2 を +Math.PI / 2 に変えてみてください
      this.el.object3D.rotation.y = -moveAngle - Math.PI / 2;

      this.setAnim('WALK');
    } else {
      this.setAnim('IDLE');
    }
  }
});

AFRAME.registerComponent('character-recenter', {
  init() {
    this.spawned = false;
    this.el.sceneEl.addEventListener('click', (e) => {
      if (e.target.closest('#overlay') || this.spawned) return;

      const camRot = document.querySelector('#camera').object3D.rotation.y;
      const dist = 5.0;
      // カメラの正面座標を計算
      const x = -Math.sin(camRot) * dist;
      const z = -Math.cos(camRot) * dist;
      const y = -3.0;

      this.el.object3D.position.set(x, y, z);
      // キャラクターがこちらを向くように設定
      this.el.object3D.rotation.set(0, camRot + Math.PI, 0); 
      this.el.setAttribute('visible', 'true');
      this.spawned = true;
      document.getElementById('instruction').innerText = "DRAG TO MOVE";
    });

    document.getElementById('recenterBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.spawned = false;
      this.el.setAttribute('visible', 'false');
      document.getElementById('instruction').innerText = "TAP TO SPAWN";
    });
  }
});