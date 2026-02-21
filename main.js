// センサー許可のトリガー
window.addEventListener('click', () => {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission().catch(console.error);
  }
  const instr = document.getElementById('instruction');
  if(instr && instr.innerText.includes("START")) instr.innerText = "TAP TO SPAWN";
}, { once: false });

AFRAME.registerComponent('character-recenter', {
  init() {
    this.spawned = false;
    // シーン全体のクリックを監視
    this.el.sceneEl.addEventListener('mousedown', (e) => {
      if (e.target.closest('#overlay')) return;

      if (!this.spawned) {
        const cameraEl = document.querySelector('#camera');
        const rotation = cameraEl.getAttribute('rotation');
        const angleY = rotation.y * (Math.PI / 180);

        // 出現距離を「少し離れた5m」に設定（近すぎて頭が消えるのを防ぐ）
        const dist = 5.0; 
        const x = -Math.sin(angleY) * dist;
        const z = -Math.cos(angleY) * dist;
        const y = -3.0; // 身長180cmを想定した地面の高さ

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

// 移動コンポーネント
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
    const angle = Math.atan2(dy, dx); // スティックが指す画面上の角度

    this.joystickOrigin.style.left = `${this.startPos.x}px`;
    this.joystickOrigin.style.top = `${this.startPos.y}px`;
    this.joystickPosition.style.left = `${this.startPos.x + Math.cos(angle) * Math.min(distance, 50)}px`;
    this.joystickPosition.style.top = `${this.startPos.y + Math.sin(angle) * Math.min(distance, 50)}px`;

    if (distance > 5) {
      // カメラの向き（Y軸回転）を取得
      const camY = this.camera.object3D.rotation.y;
      
      // 【修正ポイント】移動方向の計算
      // 逆方向に動く場合は、ここの符号 (+ / -) を調整します
      const moveAngle = angle + camY + Math.PI / 2;
      
      const speed = 0.005;
      
      // 座標の更新
      this.el.object3D.position.x += Math.cos(moveAngle) * speed * timeDelta;
      this.el.object3D.position.z += Math.sin(moveAngle) * speed * timeDelta;
      this.el.object3D.position.y = -3.0; 

      // 【修正ポイント】体の向き
      // 進んでいる方向を向くように調整
      this.el.object3D.rotation.y = -moveAngle + Math.PI;
      
      this.el.setAttribute('animation-mixer', {clip: 'WALK', loop: 'repeat'});
    }
  }
});