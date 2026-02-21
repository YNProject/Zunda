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
      // オーバーレイのクリックは無視
      if (e.target.closest('#overlay')) return;

      if (!this.spawned) {
        // カメラに固定されているので、visibleをtrueにするだけで決まった位置に出ます
        this.el.setAttribute('visible', 'true');
        this.spawned = true;
        document.getElementById('instruction').innerText = "SPAWNED";
      }
    });

    // リセットボタンの処理
    document.getElementById('recenterBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.spawned = false;
      this.el.setAttribute('visible', 'false');
      document.getElementById('instruction').innerText = "TAP TO SPAWN";
    });
  }
});