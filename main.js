// A-Frame コンポーネント
AFRAME.registerComponent('character-move', {
  init() {
    this.camera = document.querySelector('#camera');
    this.active = false;
    this.startPos = { x: 0, y: 0 };
    this.currentPos = { x: 0, y: 0 };

    // ジョイスティックUI
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
      // IDLEアニメーションに戻す (大文字固定)
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

    // UI更新
    this.joystickOrigin.style.left = `${this.startPos.x}px`;
    this.joystickOrigin.style.top = `${this.startPos.y}px`;
    this.joystickPosition.style.left = `${this.startPos.x + Math.cos(angle) * clampedDist}px`;
    this.joystickPosition.style.top = `${this.startPos.y + Math.sin(angle) * clampedDist}px`;

    if (distance > 5) {
      const camY = this.camera.object3D.rotation.y;
      const moveAngle = angle - camY;
      const speed = 0.005;

      // 移動
      this.el.object3D.position.x += Math.cos(moveAngle) * speed * timeDelta;
      this.el.object3D.position.z += Math.sin(moveAngle) * speed * timeDelta;
      
      // 【修正ポイント】回転方向の反転
      // もしこれでも逆なら、 + Math.PI / 2 を - Math.PI / 2 に変えてみてください
      this.el.object3D.rotation.y = -moveAngle + Math.PI / 2;

      // WALKアニメーション
      this.el.setAttribute('animation-mixer', {clip: 'WALK', loop: 'repeat'});
    }
  }
});

AFRAME.registerComponent('character-recenter', {
  init() {
    const btn = document.getElementById('recenterBtn');
    btn.addEventListener('click', () => {
      this.el.object3D.position.set(0, 0, -3); // カメラの少し前に戻す
      btn.style.transform = 'scale(0.8)';
      setTimeout(() => btn.style.transform = 'scale(1)', 100);
    });
  }
});