// 1. iOSセンサー許可
window.addEventListener('click', function requestAccess() {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission().catch(console.error);
  }
  const instr = document.getElementById('instruction');
  if (instr && instr.innerText.includes("START")) { instr.innerText = "TAP TO SPAWN"; }
}, { once: true });

// 2. 移動ロジック (できていた時の書き方)
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

  // ★重要：アニメが固まらないように、切り替え時だけsetAttributeする
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

    // ジョイスティックUI更新
    this.joyOrigin.style.left = `${this.startPos.x}px`;
    this.joyOrigin.style.top = `${this.startPos.y}px`;
    const clampedDist = Math.min(distance, 40);
    this.joyPos.style.left = `${this.startPos.x + Math.cos(angle) * clampedDist}px`;
    this.joyPos.style.top = `${this.startPos.y + Math.sin(angle) * clampedDist}px`;

    if (distance > 5) {
      // --- 「できていた時」の計算式を再現 ---
      const camRotation = this.camera.getAttribute('rotation');
      const camYRad = camRotation.y * (Math.PI / 180); // 度をラジアンに
      const moveAngle = angle - camYRad;
      const speed = 0.005;

      this.el.object3D.position.x += Math.cos(moveAngle) * speed * timeDelta;
      this.el.object3D.position.z += Math.sin(moveAngle) * speed * timeDelta;
      this.el.object3D.position.y = -3.0; // 高さを固定

      // 体の向き (進行方向を向くように調整)
      this.el.object3D.rotation.y = -moveAngle + Math.PI / 2;
      // ------------------------------------

      this.setAnim('WALK');
    } else {
      this.setAnim('IDLE');
    }
  }
});

// 3. スポーン & リセンター
AFRAME.registerComponent('character-recenter', {
  init() {
    this.spawned = false;
    this.el.sceneEl.addEventListener('click', (e) => {
      if (e.target.closest('#overlay') || this.spawned) return;

      const camRotation = document.querySelector('#camera').getAttribute('rotation');
      const angleY = camRotation.y * (Math.PI / 180);

      // 前方5m、地面3m下に配置
      const dist = 5.0;
      const x = -Math.sin(angleY) * dist;
      const z = -Math.cos(angleY) * dist;
      const y = -3.0;

      this.el.object3D.position.set(x, y, z);
      this.el.object3D.rotation.set(0, angleY + Math.PI, 0); 
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