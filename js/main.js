/**
 * ====================================================================
 * SYSTEM, CAMERA & INPUT
 * ====================================================================
 */
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d", { alpha: false });

let scaleFactor = 1;
let width, height;

const Camera = {
    currentZoom: 1,
    targetZoom: 1,
    update() {
        this.currentZoom += (this.targetZoom - this.currentZoom) * CONFIG.ZOOM.SMOOTH;
    },
    adjustZoom(amount) {
        this.targetZoom = Math.max(CONFIG.ZOOM.MIN, Math.min(CONFIG.ZOOM.MAX, this.targetZoom + amount));
    },
    screenToWorld(screenX, screenY) {
        const centerX = width / 2;
        const centerY = height / 2;
        return {
            x: (screenX - centerX) / this.currentZoom + centerX,
            y: (screenY - centerY) / this.currentZoom + centerY
        };
    }
};

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    scaleFactor = width / CONFIG.CORE.BASE_WIDTH;
}
window.addEventListener("resize", resize);
resize();

const Input = {
    screenX: width / 2, screenY: height / 2,
    x: width / 2, y: height / 2,
    px: 0, py: 0,
    speed: 0,
    isAttacking: false,
    guardForm: 1,
    attackTimer: null,

    update() {
        const worldPos = Camera.screenToWorld(this.screenX, this.screenY);
        this.x = worldPos.x;
        this.y = worldPos.y;
        this.speed = Math.hypot(this.x - this.px, this.y - this.py);
        this.px = this.x; this.py = this.y;
    },

    handleMove(e) {
        // Ngăn điều khiển tâm nếu đang thao tác trên nút UI
        if (e.target.closest('.btn')) return;

        e.preventDefault();
        const p = e.touches ? e.touches[0] : e;
        this.screenX = p.clientX;
        this.screenY = p.clientY;
    },

    handleDown(e) {
        // Nếu nhấn trúng nút UI thì không xử lý tấn công màn hình
        if (e.target.closest('.btn')) return;

        e.preventDefault();
        // Giữ logic delay nhẹ để tạo cảm giác tụ lực khi nhấn màn hình
        this.attackTimer = setTimeout(() => { 
            this.isAttacking = true; 
        }, CONFIG.SWORD.ATTACK_DELAY_MS);
    },

    handleUp(e) {
        this.isAttacking = false;
        clearTimeout(this.attackTimer);
    },

    handleWheel(e) {
        const delta = -e.deltaY * CONFIG.ZOOM.SENSITIVITY;
        Camera.adjustZoom(delta);
    }
};

// Đăng ký sự kiện Hệ thống (Gộp Pointer Events để tối ưu)
window.addEventListener('pointermove', e => Input.handleMove(e), { passive: false });
window.addEventListener('pointerdown', e => Input.handleDown(e), { passive: false });
window.addEventListener('pointerup', e => Input.handleUp(e));
window.addEventListener('wheel', e => Input.handleWheel(e), { passive: false });

/**
 * XỬ LÝ GIAO DIỆN (UI CONTROLS)
 */

// 1. Nút Zoom
document.getElementById('btn-zoom-in').addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    Camera.adjustZoom(CONFIG.ZOOM.STEP);
});

document.getElementById('btn-zoom-out').addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    Camera.adjustZoom(-CONFIG.ZOOM.STEP);
});

// 2. Nút Đổi Hình Thái (Change Form)
document.getElementById('btn-form').addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Đổi trạng thái Form
    Input.guardForm = (Input.guardForm === 1) ? 2 : 1;
    
    // Hiệu ứng xoay icon cho mượt mà
    const icon = e.currentTarget.querySelector('.icon-form');
    if (icon) {
        icon.style.transform = `rotate(${Input.guardForm === 1 ? -15 : 165}deg)`;
    }
});

// 3. Nút Tấn công
const attackBtn = document.getElementById('btn-attack');

const startAttack = (e) => {
    e.stopPropagation();
    e.preventDefault();
    Input.isAttacking = true;
};

const stopAttack = (e) => {
    e.stopPropagation();
    e.preventDefault();
    Input.isAttacking = false;
};

// Đăng ký sự kiện nút Attack (Đồng bộ đa nền tảng)
attackBtn.addEventListener('pointerdown', startAttack);
attackBtn.addEventListener('pointerup', stopAttack);
attackBtn.addEventListener('pointerleave', stopAttack); 

/**
 * ====================================================================
 * MAIN MANAGER
 * ====================================================================
 */
const enemies = [];
const swords = [];
let starField;
const guardCenter = { x: width/2, y: height/2, vx: 0, vy: 0 };

function init() {
    starField = new StarField(250, width, height);
    for (let i = 0; i < CONFIG.ENEMY.SPAWN_COUNT; i++) enemies.push(new Enemy());
    for (let i = 0; i < CONFIG.SWORD.COUNT; i++) swords.push(new Sword(i, scaleFactor));
}

function updatePhysics() {
    Camera.update();
    Input.update();
    let dx = Input.x - guardCenter.x;
    let dy = Input.y - guardCenter.y;
    guardCenter.vx += dx * 0.04; 
    guardCenter.vy += dy * 0.04;
    guardCenter.vx *= 0.82;
    guardCenter.vy *= 0.82;
    guardCenter.x += guardCenter.vx; 
    guardCenter.y += guardCenter.vy;
}

function renderCursor() {
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#6fffe0";
    ctx.beginPath();
    ctx.arc(Input.x, Input.y, 4 * scaleFactor, 0, Math.PI * 2);
    ctx.fillStyle = "#6fffe0";
    ctx.fill();
    ctx.shadowBlur = 0;
}

function animate() {
    ctx.fillStyle = CONFIG.COLORS.BG_FADE;
    ctx.fillRect(0, 0, width, height);

    updatePhysics();

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(Camera.currentZoom, Camera.currentZoom);
    ctx.translate(-width / 2, -height / 2);

    starField.draw(ctx, scaleFactor);
    
    ctx.save();
    ctx.translate(guardCenter.x, guardCenter.y);
    ctx.rotate(performance.now() * 0.0002);
    ctx.strokeStyle = "rgba(120,255,210,0.1)";
    ctx.lineWidth = 1.5 * scaleFactor;
    ctx.beginPath();
    ctx.arc(0, 0, 50 * scaleFactor, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    enemies.forEach(e => e.draw(ctx, scaleFactor));
    swords.forEach(s => {
        s.update(guardCenter, enemies, Input, scaleFactor);
        s.draw(ctx, scaleFactor);
    });
    renderCursor();

    ctx.restore();
    requestAnimationFrame(animate);
}

init();
animate();