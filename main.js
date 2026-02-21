// 1. iOS許可 & 初期表示
window.addEventListener('click', function requestAccess() {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission().catch(console.error);
  }
  const instr = document.getElementById('instruction');
  if (instr && instr.innerText.includes("START")) { 
    instr.innerText = "TAP GROUND TO SPAWN"; 
  }
}, { once: true });

// 2. 移動 & アニメーション
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

  // ★アニメーション連打防止
  setAnim(name) {
    if (this.currentAnim !== name) {
      this.currentAnim = name;
      // gltf-modelが付いている要素に適用
      const model = document.querySelector('#zunda_body');
      model.setAttribute('animation-mixer', {clip: name, loop: 'repeat'});
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
    this.joyPos.style.left = `${this.startPos.x + Math.cos(angle) * Math.min(distance, 40)}px`;
    this.joyPos.style.top = `${this.startPos.y + Math.sin(angle) * Math.min(distance, 40)}px`;

    if (distance > 5) {
      // --- 参考コードの正しい移動ロジック ---
      const camY = this.camera.object3D.rotation.y;
      const moveAngle = angle - camY;
      const speed = 0.005;

      this.el.object3D.position.x += Math.cos(moveAngle) * speed * timeDelta;
      this.el.object3D.position.z += Math.sin(moveAngle) * speed * timeDelta;
      this.el.object3D.position.y = -1.5;

      // 体の向き（進行方向を向く）
      this.el.object3D.rotation.y = -moveAngle - Math.PI / 2;
      // ------------------------------------

      this.setAnim('WALK');
    } else {
      this.setAnim('IDLE');
    }
  }
});

// 3. スポーン
AFRAME.registerComponent('character-recenter', {
  init() {
    this.spawned = false;
    this.el.sceneEl.addEventListener('click', (e) => {
      if (e.target.closest('#overlay') || this.spawned) return;
      const intersection = e.detail.intersection;
      if (intersection) {
        const p = intersection.point;
        this.el.object3D.position.set(p.x, p.y, p.z);
        this.el.setAttribute('visible', 'true');
        this.spawned = true;
        document.getElementById('instruction').innerText = "DRAG TO MOVE";
        // 初期アニメ設定
        this.el.components['character-move'].setAnim('IDLE');
      }
    });

    document.getElementById('recenterBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.spawned = false;
      this.el.setAttribute('visible', 'false');
      document.getElementById('instruction').innerText = "TAP GROUND TO SPAWN";
    });
  }
});