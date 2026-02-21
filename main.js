// iOSセンサー許可
window.addEventListener('touchstart', function() {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission().catch(console.error);
  }
}, { once: true });

window.addEventListener('click', function() {
  const instr = document.getElementById('instruction');
  if (instr && instr.innerText.includes("START")) { 
    instr.innerText = "TAP TO SPAWN"; 
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
      if (e.target.closest('#recenterBtn')) return;
      if (!this.el.getAttribute('visible')) return;
      this.active = true;
      this.startPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      this.currentPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      this.joyContainer.style.display = 'block';
    });

    window.addEventListener('touchmove', (e) => {
      if (!this.active) return;
      this.currentPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.active = false;
      this.joyContainer.style.display = 'none';
      this.setAnim('IDLE');
    });
  },

  setAnim(name) {
    if (this.currentAnim !== name) {
      this.currentAnim = name;
      const model = document.querySelector('#zunda_body');
      if (model) model.setAttribute('animation-mixer', {clip: name, loop: 'repeat'});
    }
  },

  tick(time, timeDelta) {
    if (!this.active) return;
    const dx = this.currentPos.x - this.startPos.x;
    const dy = this.currentPos.y - this.startPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    if (this.joyOrigin && this.joyPos) {
      this.joyOrigin.style.left = `${this.startPos.x}px`;
      this.joyOrigin.style.top = `${this.startPos.y}px`;
      const d = Math.min(distance, 40);
      this.joyPos.style.left = `${this.startPos.x + Math.cos(angle) * d}px`;
      this.joyPos.style.top = `${this.startPos.y + Math.sin(angle) * d}px`;
    }

    if (distance > 5) {
      const camRotY = this.camera.object3D.rotation.y;
      const moveAngle = angle - camRotY;
      const speed = 0.005;
      this.el.object3D.position.x += Math.cos(moveAngle) * speed * timeDelta;
      this.el.object3D.position.z += Math.sin(moveAngle) * speed * timeDelta;
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
    const instr = document.getElementById('instruction');

    this.el.sceneEl.addEventListener('click', (e) => {
      if (e.target.closest('#overlay') || this.spawned) return;
      const cam = document.querySelector('#camera').object3D;
      const dist = 3.0;
      this.el.object3D.position.set(
        cam.position.x - Math.sin(cam.rotation.y) * dist,
        -1.5,
        cam.position.z - Math.cos(cam.rotation.y) * dist
      );
      this.el.object3D.rotation.set(0, cam.rotation.y + Math.PI, 0); 
      this.el.setAttribute('visible', 'true');
      this.spawned = true;
      if (instr) instr.innerText = "DRAG TO MOVE";
    });

    const resetBtn = document.getElementById('recenterBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.spawned = false;
        this.el.setAttribute('visible', 'false');
        if (instr) instr.innerText = "TAP TO SPAWN";
      });
    }
  }
});