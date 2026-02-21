// 1. センサー許可
window.addEventListener('click', () => {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission().catch(console.error);
  }
  const instr = document.getElementById('instruction');
  if(instr && instr.innerText.includes("START")) instr.innerText = "TAP TO SPAWN";
}, { once: false });

// 2. スポーン制御
AFRAME.registerComponent('character-recenter', {
  init() {
    this.spawned = false;
    this.el.sceneEl.addEventListener('mousedown', (e) => {
      if (e.target.closest('#overlay')) return;

      if (!this.spawned) {
        const cameraEl = document.querySelector('#camera');
        const rotation = cameraEl.getAttribute('rotation');
        const angleY = rotation.y * (Math.PI / 180);

        const dist = 5.0; 
        const x = -Math.sin(angleY) * dist;
        const z = -Math.cos(angleY) * dist;
        const y = -3.0; 

        this.el.object3D.position.set(x, y, z);
        this.el.object3D.rotation.set(0, angleY + Math.PI, 0); 
        this.el.setAttribute('visible', 'true');
        this.spawned = true;
        
        const instr = document.getElementById('instruction');
        if(instr) instr.innerText = "DRAG TO MOVE";
      }
    });

    document.getElementById('recenterBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.spawned = false;
      this.el.setAttribute('visible', 'false');
      const instr = document.getElementById('instruction');
      if(instr) instr.innerText = "TAP TO SPAWN";
    });
  }
});

// 3. 移動・アニメーション制御
AFRAME.registerComponent('character-move', {
  init() {
    this.camera = document.querySelector('#camera');
    this.active = false;
    this.currentAnim = "IDLE"; 
    this.startPos = { x: 0, y: 0 };
    this.currentPos = { x: 0, y: 0 };
    
    // ジョイスティック生成
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
      this.setAnimation("IDLE");
    });
  },

  // アニメーションの重複命令を防止する関数
  setAnimation(animName) {
    if (this.currentAnim !== animName) {
      this.currentAnim = animName;
      // 子要素のa-entity（モデル本体）に対してアニメーションを設定
      const model = this.el.querySelector('[gltf-model]');
      model.setAttribute('animation-mixer', {clip: animName, loop: 'repeat'});
    }
  },

  tick(time, timeDelta) {
    if (!this.active) return;
    const dx = this.currentPos.x - this.startPos.x;
    const dy = this.currentPos.y - this.startPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    this.joystickOrigin.style.left = `${this.startPos.x}px`;
    this.joystickOrigin.style.top = `${this.startPos.y}px`;
    this.joystickPosition.style.left = `${this.startPos.x + Math.cos(angle) * Math.min(distance, 50)}px`;
    this.joystickPosition.style.top = `${this.startPos.y + Math.sin(angle) * Math.min(distance, 50)}px`;

    if (distance > 5) {
      const camY = this.camera.object3D.rotation.y;
      
      // 移動方向の修正
      const moveAngle = angle + camY + Math.PI / 2;
      const speed = 0.005;
      
      this.el.object3D.position.x += Math.cos(moveAngle) * speed * timeDelta;
      this.el.object3D.position.z += Math.sin(moveAngle) * speed * timeDelta;
      this.el.object3D.position.y = -3.0;

      // 体の向き
      this.el.object3D.rotation.y = -moveAngle + Math.PI;

      this.setAnimation("WALK");
    } else {
      this.setAnimation("IDLE");
    }
  }
});