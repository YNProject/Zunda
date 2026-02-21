window.addEventListener('click', function requestAccess() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().catch(console.error);
    }
    const instr = document.getElementById('instruction');
    if (instr.innerText.includes("START")) { instr.innerText = "TAP TO SPAWN"; }
}, { once: false });

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
            this.joystickParent.classList.add('visible');
        });
        window.addEventListener('touchmove', (e) => {
            if (!this.active) return;
            this.currentPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        });
        window.addEventListener('touchend', () => {
            this.active = false;
            this.joystickParent.classList.remove('visible');
            this.el.setAttribute('animation-mixer', { clip: 'IDLE', loop: 'repeat' });
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
            const camY = this.camera.object3D.rotation.y;
            const moveAngle = angle - camY;
            const speed = 0.005;
            this.el.object3D.position.x += Math.cos(moveAngle) * speed * timeDelta;
            this.el.object3D.position.z += Math.sin(moveAngle) * speed * timeDelta;

            this.el.object3D.position.y = -3.0; // 高さを固定

            this.el.object3D.rotation.y = -moveAngle + Math.PI / 2;
            this.el.setAttribute('animation-mixer', { clip: 'WALK', loop: 'repeat' });
        }
    }
});

AFRAME.registerComponent('character-recenter', {
    init() {
        this.spawned = false;
        const scene = this.el.sceneEl;

        scene.addEventListener('click', (e) => {
            if (e.target.closest('#overlay')) return;

            if (!this.spawned) {
                const cameraEl = document.querySelector('#camera');
                const camObject = cameraEl.object3D;

                // 現在のカメラの向き（Quaternion: 回転情報）から「真下」を計算
                const forward = new THREE.Vector3(0, 0, -1);
                forward.applyQuaternion(camObject.quaternion);

                // 【重要】カメラの角度に関わらず、水平面(Y=0)との交点を計算するのではなく、
                // 「今自分が見ている方向の数メートル先」の「絶対的な高さ -3m」に置く
                const camRotation = cameraEl.getAttribute('rotation');
                const angleY = camRotation.y * (Math.PI / 180);

                // あなたの身長(180cm)とスマホの位置を考慮
                const distance = 4.0;
                const spawnPosX = camObject.position.x - Math.sin(angleY) * distance;
                const spawnPosZ = camObject.position.z - Math.cos(angleY) * distance;

                // 青い床が上すぎたので、さらに下げて設定します
                const spawnPosY = -4.5;

                this.el.object3D.position.set(spawnPosX, spawnPosY, spawnPosZ);
                this.el.object3D.rotation.set(0, angleY + Math.PI, 0);

                this.el.setAttribute('visible', 'true');
                this.spawned = true;
                document.getElementById('instruction').innerText = "DRAG TO MOVE";

                // 青いデバッグ床も、ずんだもんと同じ高さに移動させる
                const floor = document.querySelector('#dummy-floor');
                if (floor) floor.setAttribute('position', `0 ${spawnPosY} 0`);
            }
        });
    }
});