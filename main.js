window.addEventListener('click', function requestAccess() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().catch(console.error);
    }
    const instr = document.getElementById('instruction');
    if (instr && instr.innerText.includes("START")) { instr.innerText = "TAP TO SPAWN"; }
}, { once: false });

AFRAME.registerComponent('character-move', {
    init() {
        this.camera = document.querySelector('#camera');
        this.active = false;
        this.currentAnim = ""; // 現在の状態を保持
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
            this.updateAnim('IDLE');
        });
    },

    // アニメーションが重複してリセットされないようにするガード
    updateAnim(name) {
        if (this.currentAnim !== name) {
            this.currentAnim = name;
            // モデル本体に確実にアニメーションを適用
            this.el.setAttribute('animation-mixer', { clip: name, loop: 'repeat', crossFadeDuration: 0.4 });
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
            // 移動計算（参考コードの通り）
            const camY = this.camera.object3D.rotation.y;
            const moveAngle = angle - camY;
            const speed = 0.005;
            
            this.el.object3D.position.x += Math.cos(moveAngle) * speed * timeDelta;
            this.el.object3D.position.z += Math.sin(moveAngle) * speed * timeDelta;
            this.el.object3D.position.y = -3.0;

            // 【向きの修正】
            // 進んでいる方向（moveAngle）に対して、モデルが正面を向くように調整
            // 多くのモデルは -moveAngle - Math.PI / 2 で正面を向きます
            this.el.object3D.rotation.y = -moveAngle - Math.PI / 2;

            this.updateAnim('WALK');
        } else {
            this.updateAnim('IDLE');
        }
    }
});

AFRAME.registerComponent('character-recenter', {
    init() {
        this.spawned = false;
        this.el.sceneEl.addEventListener('click', (e) => {
            if (e.target.closest('#overlay') || this.spawned) return;

            const camRotation = document.querySelector('#camera').getAttribute('rotation');
            const angleY = camRotation.y * (Math.PI / 180);
            const dist = 5.0;
            const x = -Math.sin(angleY) * dist;
            const z = -Math.cos(angleY) * dist;
            const y = -3.0;

            this.el.object3D.position.set(x, y, z);
            this.el.object3D.rotation.set(0, angleY + Math.PI, 0); 
            this.el.setAttribute('visible', 'true');
            this.spawned = true;
            
            // 初回表示時にアニメーションを強制起動
            this.el.components['character-move'].updateAnim('IDLE');
            
            const instr = document.getElementById('instruction');
            if (instr) instr.innerText = "DRAG TO MOVE";
        });
    }
});