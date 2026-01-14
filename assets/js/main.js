/**
 * ====================================================================
 * SYSTEM, CAMERA & INPUT
 * ====================================================================
 */
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d", { alpha: false });

let scaleFactor = 1;
let width, height;
let frameCount = 0;
let lastTime = performance.now();

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
    // Kiểm tra xem thiết bị có hỗ trợ cảm ứng không
    isTouchDevice: ('ontouchstart' in window) || (navigator.maxTouchPoints > 0),
    mana: CONFIG.MANA.START || 100,
    maxMana: CONFIG.MANA.MAX || 100,
    lastManaRegenTick: performance.now(),
    initialPinchDist: 0,
    lastFrameTime: performance.now(),
    exp: 0,
    rankIndex: 0, // Vị trí hiện tại trong mảng RANKS

    processActiveConsumption(dt) {
        // dt là thời gian trôi qua tính bằng giây (seconds)

        let costTick = 0;

        // 1. TÍNH TOÁN CHI PHÍ DI CHUYỂN
        // Nếu tốc độ > 1 (tránh nhiễu khi chuột rung nhẹ)
        if (this.speed > 1) {
            costTick += CONFIG.MANA.COST_MOVE_PER_SEC * dt;
        }

        // 2. TÍNH TOÁN CHI PHÍ TẤN CÔNG
        if (this.isAttacking) {
            costTick += CONFIG.MANA.COST_ATTACK_PER_SEC * dt;
        }

        // 3. THỰC HIỆN TRỪ MANA
        if (costTick > 0) {
            if (this.mana > 0) {
                // Trừ mana (dùng số thực để mượt, nhưng UI sẽ làm tròn)
                this.updateMana(-costTick);
            } else {
                // HẾT MANA:
                // Ngắt trạng thái tấn công ngay lập tức
                if (this.isAttacking) {
                    this.isAttacking = false;
                    this.triggerManaShake();
                }

                // (Tùy chọn) Ngắt di chuyển? 
                // Thường game sẽ cho di chuyển chậm lại hoặc không cho dash, 
                // nhưng ở đây ta chỉ cần báo hiệu hết mana.
            }
        }
    },

    updateMana(amount) {
        this.mana = Math.max(0, Math.min(this.maxMana, this.mana + amount));
        this.renderManaUI();
    },

    regenMana() {
        const now = performance.now();
        const elapsed = now - this.lastManaRegenTick;

        // Kiểm tra nếu đã trôi qua ít nhất 1 khoảng REGEN_INTERVAL_MS
        if (elapsed >= CONFIG.MANA.REGEN_INTERVAL_MS) {
            // Tính xem đã trôi qua bao nhiêu lần "1 phút"
            const manaToAdd = Math.floor(elapsed / CONFIG.MANA.REGEN_INTERVAL_MS);

            if (manaToAdd > 0) {
                this.updateMana(manaToAdd * CONFIG.MANA.REGEN_PER_MIN);
                // Cập nhật lại mốc thời gian, giữ lại phần dư (ms) để không bị mất giây
                this.lastManaRegenTick = now - (elapsed % CONFIG.MANA.REGEN_INTERVAL_MS);
            }
        }
    },

    renderManaUI() {
        const bar = document.getElementById('mana-bar');
        const text = document.getElementById('mana-text');
        if (bar && text) {
            const percentage = (this.mana / this.maxMana) * 100;
            bar.style.width = percentage + '%';
            text.innerText = `Linh lực: ${Math.floor(this.mana)}/${this.maxMana}`;

            // Logic đổi màu khi mana thấp (đã khai báo trong SCSS)
            if (percentage < 20) {
                bar.classList.add('low-mana');
            } else {
                bar.classList.remove('low-mana');
            }
        }
    },

    triggerManaShake() {
        const el = document.getElementById('mana-container');
        el.classList.remove('mana-shake', 'mana-empty-error');

        void el.offsetWidth; // Trigger reflow để restart animation

        el.classList.add('mana-shake', 'mana-empty-error');

        // Xóa màu đỏ sau 500ms (hoặc giữ nguyên tùy bạn, ở đây tôi xóa sau khi rung xong)
        setTimeout(() => {
            el.classList.remove('mana-shake', 'mana-empty-error');
        }, 500);
    },

    updateExp(amount) {
        this.exp += amount;
        this.checkLevelUp();
        this.renderExpUI();
    },

    checkLevelUp() {
        const currentRank = CONFIG.CULTIVATION.RANKS[this.rankIndex];
        if (!currentRank) return;

        if (this.exp >= currentRank.exp) {
            // Thử đột phá
            const roll = Math.random();
            if (roll <= currentRank.chance) {
                // Đột phá thành công
                this.exp -= currentRank.exp;
                if (currentRank.bonus) this.exp += currentRank.bonus; // Thưởng exp khi qua đại cảnh giới
                this.rankIndex++;
                console.log("Đột phá thành công: " + CONFIG.CULTIVATION.RANKS[this.rankIndex].name);
            } else {
                // Đột phá thất bại: Trừ 10% exp hiện tại làm hình phạt
                this.exp = Math.max(0, this.exp - Math.floor(currentRank.exp * 0.1));
                this.triggerExpError(); // Hiệu ứng rung thanh EXP
            }
        }
    },

    renderExpUI() {
        const rank = CONFIG.CULTIVATION.RANKS[this.rankIndex];
        if (!rank) return;

        // Lấy các phần tử UI
        const barExp = document.getElementById('exp-bar');
        const textExp = document.getElementById('exp-text'); // Cần cái này để hiện số
        const barMana = document.getElementById('mana-bar');
        const manaBg = document.getElementById('mana-bar-bg');
        const rankText = document.getElementById('cultivation-rank');

        // 1. Cập nhật nội dung chữ (Phần đạo hữu bị thiếu)
        if (textExp) {
            textExp.innerText = `Kinh nghiệm: ${Math.floor(this.exp)}/${rank.exp}`;
        }
        if (rankText) {
            rankText.innerText = rank.name;
        }

        // 2. Cập nhật độ dài thanh EXP
        const percentage = (this.exp / rank.exp) * 100;
        if (barExp) {
            barExp.style.width = Math.min(100, percentage) + '%';
            
            // Cập nhật màu sắc cho thanh EXP (Màu nhạt chuyển sang màu đậm)
            barExp.style.background = `linear-gradient(90deg, ${rank.lightColor}, ${rank.color})`;
            barExp.style.boxShadow = `0 0 10px ${rank.lightColor}`;
        }

        // 3. Cập nhật màu sắc chủ đạo cho hệ thống (Mana & Rank Name)
        if (barMana) {
            barMana.style.backgroundColor = rank.color;
            barMana.style.boxShadow = `0 0 15px ${rank.color}`;
        }
        if (manaBg) {
            manaBg.style.borderColor = rank.color;
        }
        if (rankText) {
            rankText.style.color = rank.color;
            rankText.style.textShadow = `0 0 8px ${rank.color}80`;
        }
    },

    triggerExpError() {
        const el = document.getElementById('exp-container');
        el.classList.add('shake-red');
        setTimeout(() => el.classList.remove('shake-red'), 500);
    },

    update(dt) { // Nhận thêm tham số dt
        const worldPos = Camera.screenToWorld(this.screenX, this.screenY);
        this.x = worldPos.x;
        this.y = worldPos.y;

        // Tính tốc độ di chuyển của con trỏ/ngón tay
        this.speed = Math.hypot(this.x - this.px, this.y - this.py);
        this.px = this.x; this.py = this.y;

        // Gọi hàm xử lý tiêu hao mana
        this.processActiveConsumption(dt);
    },

    handleMove(e) {
        if (e.target.closest('.btn')) return;

        // Pointermove hoạt động cho cả chuột và touch di chuyển
        const p = e.touches ? e.touches[0] : e;
        this.screenX = p.clientX;
        this.screenY = p.clientY;
    },

    handleDown(e) {
        if (e.target.closest('.btn')) return;

        // LOGIC MỚI: Nếu là mobile, chạm màn hình KHÔNG kích hoạt tấn công
        if (this.isTouchDevice) return;

        // Nếu là Desktop (chuột), vẫn giữ logic nhấn giữ để tấn công
        e.preventDefault();
        this.attackTimer = setTimeout(() => {
            this.isAttacking = true;
        }, CONFIG.SWORD.ATTACK_DELAY_MS);
    },

    handleUp(e) {
        // Chỉ xử lý handleUp cho chuột trên desktop
        if (!this.isTouchDevice) {
            this.isAttacking = false;
            clearTimeout(this.attackTimer);
        }
    },

    handleWheel(e) {
        const delta = -e.deltaY * CONFIG.ZOOM.SENSITIVITY;
        Camera.adjustZoom(delta);
    }
};

// Đăng ký sự kiện Hệ thống (Gộp Pointer Events để tối ưu)
window.addEventListener('pointermove', e => { if (!e.touches) Input.handleMove(e); });
window.addEventListener('pointerdown', e => Input.handleDown(e));
window.addEventListener('pointerup', e => Input.handleUp(e));
window.addEventListener('wheel', e => {
    Camera.adjustZoom(-e.deltaY * CONFIG.ZOOM.SENSITIVITY);
}, { passive: false });

window.addEventListener('keydown', e => {
    if (e.key === '+' || e.key === '=') Camera.adjustZoom(CONFIG.ZOOM.STEP);
    if (e.key === '-' || e.key === '_') Camera.adjustZoom(-CONFIG.ZOOM.STEP);
});

// 2. Touch Events (Mobile - Pinch to Zoom)
window.addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
        Input.initialPinchDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
    }
}, { passive: false });

window.addEventListener('touchmove', e => {
    if (e.touches.length === 2) {
        e.preventDefault();
        const currentDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        const delta = (currentDist - Input.initialPinchDist) * 0.01;
        Camera.adjustZoom(delta);
        Input.initialPinchDist = currentDist;
    } else {
        Input.handleMove(e);
    }
}, { passive: false });

/**
 * XỬ LÝ GIAO DIỆN (UI CONTROLS)
 */

// 1. Nút Zoom
// document.getElementById('btn-zoom-in').addEventListener('pointerdown', (e) => {
//     e.stopPropagation();
//     Camera.adjustZoom(CONFIG.ZOOM.STEP);
// });

// document.getElementById('btn-zoom-out').addEventListener('pointerdown', (e) => {
//     e.stopPropagation();
//     Camera.adjustZoom(-CONFIG.ZOOM.STEP);
// });

// 2. Nút Đổi Hình Thái (Change Form)
document.getElementById('btn-form').addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    e.preventDefault();

    // --- LOGIC MỚI: KIỂM TRA MANA ---
    const cost = CONFIG.MANA.COST_CHANGE_FORM;

    if (Input.mana >= cost) {
        // Đủ Mana: Trừ mana và đổi dạng
        Input.updateMana(-cost);

        Input.guardForm = (Input.guardForm === 1) ? 2 : 1;

        const icon = e.currentTarget.querySelector('.icon-form');
        if (icon) {
            icon.style.transform = `rotate(${Input.guardForm === 1 ? -15 : 165}deg)`;
        }
    } else {
        // Không đủ Mana: Rung UI cảnh báo
        Input.triggerManaShake();
    }
});

const attackBtn = document.getElementById('btn-attack');

// Xử lý riêng cho nút bấm để không bị ảnh hưởng bởi logic handleDown của hệ thống
const startAttack = (e) => {
    e.stopPropagation();
    e.preventDefault();

    // 1. Kiểm tra xem còn thanh kiếm nào còn sống (hp > 0) không
    const aliveSwords = swords.filter(s => !s.isDead).length;

    // 2. Nếu mana = 0 VÀ không còn kiếm nào sống
    if (Input.mana <= 0 && aliveSwords === 0) {
        Input.triggerManaShake();
        Input.isAttacking = false; // Không cho phép tấn công
        return;
    }

    Input.isAttacking = true;
};

const stopAttack = (e) => {
    e.stopPropagation();
    e.preventDefault();
    Input.isAttacking = false;
    if (Input.attackTimer) clearTimeout(Input.attackTimer);
};

// Sử dụng pointerdown/up để nhạy nhất trên cả mobile và desktop
attackBtn.addEventListener('pointerdown', startAttack);
attackBtn.addEventListener('pointerup', stopAttack);
attackBtn.addEventListener('pointerleave', stopAttack); // Khi kéo ngón tay ra khỏi nút

/**
 * ====================================================================
 * MAIN MANAGER
 * ====================================================================
 */
const enemies = [];
const swords = [];
let starField;
const guardCenter = { x: width / 2, y: height / 2, vx: 0, vy: 0 };

function init() {
    Input.renderManaUI();
    Input.renderExpUI();
    starField = new StarField(250, width, height);
    for (let i = 0; i < CONFIG.ENEMY.SPAWN_COUNT; i++) enemies.push(new Enemy());
    for (let i = 0; i < CONFIG.SWORD.COUNT; i++) swords.push(new Sword(i, scaleFactor));
}

function updateSwordCounter(swords) {
    const aliveSwords = swords.filter(s => !s.isDead).length;
    const totalSwords = swords.length;
    const display = document.getElementById('sword-count-text');

    if (display) {
        display.innerText = `${aliveSwords}/${totalSwords}`;

        // Hiệu ứng đổi màu nếu số lượng kiếm quá thấp (tùy chọn)
        if (aliveSwords < totalSwords * 0.3) {
            display.style.color = "#ff4444";
        } else {
            display.style.color = "#fff";
        }
    }
}

function updatePhysics(dt) {
    Camera.update();
    Input.update(dt);
    Input.regenMana();
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
    // 1. Tính Delta Time (dt) tính bằng giây
    const now = performance.now();
    const dt = (now - lastTime) / 1000; // Chia 1000 để ra giây
    lastTime = now;

    frameCount++;

    ctx.fillStyle = CONFIG.COLORS.BG_FADE;
    ctx.fillRect(0, 0, width, height);

    // 2. Truyền dt vào updatePhysics
    updatePhysics(dt);

    if (frameCount % 10 === 0) {
        updateSwordCounter(swords);
    }

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
// <!-- Create By: Vũ Hoài Nam -->