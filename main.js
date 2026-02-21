// センサー・オーディオ許可
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
        
        // カメラの水平方向の向きを取得
        const rotation = cameraEl.getAttribute('rotation');
        const angleY = rotation.y * (Math.PI / 180);

        // 出現位置：6メートル前方（近すぎて消えるのを防ぐ）
        const dist = 6.0; 
        const spawnPosX = -Math.sin(angleY) * dist;
        const spawnPosZ = -Math.cos(angleY) * dist;
        
        // 床の高さ：-3.0m
        const spawnPosY = -3.0; 

        // 位置と向きを設定
        this.el.object3D.position.set(spawnPosX, spawnPosY, spawnPosZ);
        this.el.object3D.rotation.set(0, angleY + Math.PI, 0); 
        
        // 表示をONにし、アニメーションを確実に開始
        this.el.setAttribute('visible', 'true');
        if (this.el.components['animation-mixer']) {
          this.el.components['animation-mixer'].play();
        }
        
        this.spawned = true;
        document.getElementById('instruction').innerText = "DRAG TO MOVE";
        
        console.log("Character Spawned at distance 6.0m");
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
      const camRot = this.camera.getAttribute('rotation');
      const camY = camRot.y * (Math.PI / 180);
      const moveAngle = angle - camY;
      const speed = 0.005;
      
      this.el.object3D.position.x += Math.cos(moveAngle) * speed * timeDelta;
      this.el.object3D.position.z += Math.sin(moveAngle) * speed * timeDelta;
      this.el.object3D.position.y = -3.0; // 床の高さ固定

      this.el.object3D.rotation.y = -moveAngle + Math.PI / 2;
      this.el.setAttribute('animation-mixer', {clip: 'WALK', loop: 'repeat'});
    }
  }
});