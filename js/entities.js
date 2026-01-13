const random = (min, max) => Math.random() * (max - min) + min;

class Enemy {
    constructor() {
        this.particles = []; 
        this.respawn();
    }

    respawn() {
        const margin = 500;
        this.x = random(-margin, window.innerWidth + margin);
        this.y = random(-margin, window.innerHeight + margin);
        this.r = (10 + Math.pow(Math.random(), 1.5) * 50) * (window.innerWidth / 1920);
        this.maxHp = 1 + Math.floor(Math.random() * 100);
        this.hp = this.maxHp;

        this.hasShield = Math.random() < CONFIG.ENEMY.SHIELD_CHANCE;
        this.maxShieldHp = 80; 
        this.shieldHp = this.hasShield ? this.maxShieldHp : 0;
        
        this.cracks = []; // Lưu các đoạn thẳng
        this.shieldLevel = 0; 
        
        this.colors = CONFIG.ENEMY.PALETTES[Math.floor(Math.random() * CONFIG.ENEMY.PALETTES.length)];
    }

    // Tạo vết nứt "mạng nhện" dày đặc và đẹp mắt
    generateCracks(level) {
        const shieldR = this.r + 10;
        // Mỗi level sẽ thêm một bộ nứt mới bao quanh một góc ngẫu nhiên hoặc cố định
        const baseAngle = Math.random() * Math.PI * 2;
        
        // 1. Tạo các nhánh xuyên tâm (Radial Cracks)
        const numRadial = 5 + level * 2;
        const radialPoints = [];

        for (let i = 0; i < numRadial; i++) {
            const angle = baseAngle + (i * Math.PI * 2) / numRadial;
            const points = [];
            const steps = 4;
            
            for (let j = 0; j <= steps; j++) {
                const dist = (shieldR * j) / steps;
                // Thêm độ lệch nhỏ để đường nứt trông tự nhiên hơn
                const jitter = j === 0 ? 0 : (Math.random() - 0.5) * 0.2;
                points.push({
                    x: Math.cos(angle + jitter) * dist,
                    y: Math.sin(angle + jitter) * dist
                });
            }
            this.cracks.push(points);
            radialPoints.push(points);
        }

        // 2. Tạo các đường vòng nối (Concentric Cracks) - Tạo hiệu ứng vỡ vụn i chang ảnh
        const numRings = 2 + level;
        for (let r = 1; r <= numRings; r++) {
            const ringDistIdx = Math.floor((radialPoints[0].length - 1) * (r / (numRings + 1)));
            
            for (let i = 0; i < radialPoints.length; i++) {
                // Nối điểm trên nhánh này với nhánh bên cạnh
                const nextIdx = (i + 1) % radialPoints.length;
                const p1 = radialPoints[i][ringDistIdx];
                const p2 = radialPoints[nextIdx][ringDistIdx];
                
                // Đôi khi bỏ qua một số đoạn nối để nhìn không quá "đều", giống vết vỡ thật
                if (Math.random() > 0.2) {
                    this.cracks.push([p1, p2]);
                }
            }
        }
    }

    hit(sword) {
        if (this.hasShield && this.shieldHp > 0) {
            this.shieldHp--;

            let currentLevel = Math.floor((this.maxShieldHp - this.shieldHp) / 20);
            
            if (currentLevel > this.shieldLevel) {
                this.shieldLevel = currentLevel;
                this.generateCracks(this.shieldLevel);
            }

            if (this.shieldHp <= 0) {
                this.hasShield = false;
                this.createShieldDebris();
            }
            return "shielded";
        }

        this.hp--;
        if (this.hp <= 0) { this.respawn(); return "killed"; }
        return "hit";
    }

    drawShield(ctx, scaleFactor) {
        const shieldR = (this.r + 10) * scaleFactor;
        const shieldAlpha = this.shieldHp / this.maxShieldHp;

        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, shieldR, 0, Math.PI * 2);
        ctx.clip(); 

        // Hiệu ứng phát sáng nền khiên
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, shieldR);
        grad.addColorStop(0, "rgba(255, 255, 255, 0)");
        grad.addColorStop(0.8, "rgba(100, 200, 255, 0.1)");
        grad.addColorStop(1, "rgba(150, 230, 255, 0.3)");
        
        ctx.fillStyle = grad;
        ctx.fill();

        // Vẽ vết nứt i chang ảnh (màu trắng sáng, nét mảnh nhưng sắc)
        if (this.cracks.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + (this.shieldLevel * 0.1)})`;
            ctx.lineWidth = (0.8 + this.shieldLevel * 0.3) * scaleFactor;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            this.cracks.forEach(pts => {
                ctx.moveTo(pts[0].x * scaleFactor, pts[0].y * scaleFactor);
                for(let i = 1; i < pts.length; i++) {
                    ctx.lineTo(pts[i].x * scaleFactor, pts[i].y * scaleFactor);
                }
            });
            ctx.stroke();

            // Thêm hiệu ứng Bloom (phát sáng) cho vết nứt ở level cao
            if (this.shieldLevel >= 3) {
                ctx.globalAlpha = 0.3;
                ctx.lineWidth = 3 * scaleFactor;
                ctx.stroke();
            }
        }
        ctx.restore();

        // Viền khiên sáng xanh (Cyan) như trong ảnh
        ctx.beginPath();
        ctx.arc(0, 0, shieldR, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(140, 240, 255, 0.8)";
        ctx.lineWidth = 2 * scaleFactor;
        ctx.stroke();
    }

    createShieldDebris() {
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = random(4, 12);
            this.particles.push({
                x: 0, y: 0,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                size: random(2, 5), life: 1.0,
                rotation: Math.random() * Math.PI * 2, spin: random(-0.5, 0.5)
            });
        }
    }

    draw(ctx, scaleFactor) {
        ctx.save();
        ctx.translate(this.x, this.y);
        this.drawParticles(ctx, scaleFactor);
        if (this.hasShield) this.drawShield(ctx, scaleFactor);
        this.drawBody(ctx, scaleFactor);
        ctx.restore();
    }

    drawParticles(ctx, scaleFactor) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.life -= 0.025;
            if (p.life <= 0) { this.particles.splice(i, 1); continue; }
            ctx.save();
            ctx.translate(p.x * scaleFactor, p.y * scaleFactor);
            ctx.rotate(p.rotation += p.spin);
            ctx.globalAlpha = p.life;
            ctx.fillStyle = "#8cf0ff";
            const s = p.size * scaleFactor;
            ctx.fillRect(-s/2, -s/2, s, s);
            ctx.restore();
        }
    }

    drawBody(ctx, scaleFactor) {
        ctx.globalAlpha = 1.0;
        const g = ctx.createRadialGradient(0, 0, this.r * 0.2, 0, 0, this.r);
        g.addColorStop(0, this.colors[0]); g.addColorStop(1, this.colors[1]);
        ctx.beginPath();
        ctx.arc(0, 0, this.r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.shadowColor = this.colors[1];
        ctx.shadowBlur = 15 * scaleFactor;
        ctx.fill();
    }
}

class Sword {
    constructor(index, scaleFactor) {
        this.index = index;
        this.layer = Math.floor(index / 24); 
        this.baseAngle = (Math.PI * 2 / 24) * (index % 24);
        this.spinAngle = 0;
        this.spinSpeed = (CONFIG.SWORD.SPIN_SPEED_BASE / (this.layer + 1)) * (this.layer % 2 ? -1 : 1);
        this.radius = (CONFIG.SWORD.BASE_RADIUS + this.layer * CONFIG.SWORD.LAYER_SPACING) * scaleFactor;
        this.x = window.innerWidth / 2; this.y = window.innerHeight / 2;
        this.vx = 0; this.vy = 0;
        this.drawAngle = 0;
        this.trail = [];
        this.breath = random(0, Math.PI * 2);
        this.breathSpeed = random(0.015, 0.025);
        this.attackDelay = this.layer * 6 + random(0, 10);
        this.attackFrame = 0;
        this.flowNoise = Math.random() * Math.PI * 2;
        this.flowOffsetAngle = (Math.PI * 2 / 72) * index;
        this.flowOffsetRadius = (40 + Math.random() * 60) * scaleFactor;
        this.isStunned = false;
        this.stunTimer = 0;
    }

    update(guardCenter, enemies, Input, scaleFactor) {
        // Luôn cập nhật spinAngle để giữ vị trí mục tiêu trong đội hình luôn đúng
        this.spinAngle += this.spinSpeed;

        // Nếu đang bị văng (Stunned)
        if (this.isStunned) {
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.95; 
            this.vy *= 0.95;
            this.drawAngle += 0.2; 

            // FIX: Cập nhật vệt sáng ngay cả khi bị văng
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > CONFIG.SWORD.TRAIL_LENGTH) this.trail.shift();
            
            if (performance.now() > this.stunTimer) {
                this.isStunned = false;
                // Triệt tiêu lực văng để bắt đầu quay về mượt mà
                this.vx *= 0.2;
                this.vy *= 0.2;
            }
            return; 
        }

        this.breath += this.breathSpeed;
        const currentRadius = this.radius + Math.sin(this.breath) * 8 * scaleFactor;

        if (!Input.isAttacking) {
            this.updateGuardMode(guardCenter, currentRadius, Input, scaleFactor);
        } else {
            this.updateAttackMode(enemies, Input, scaleFactor);
        }
    }

    // Hàm hỗ trợ xoay mượt mà không bị giật góc
    smoothRotate(target, speed) {
        let diff = target - this.drawAngle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.drawAngle += diff * speed;
    }

    updateGuardMode(guardCenter, r, Input, scaleFactor) {
        this.spinAngle += this.spinSpeed;
        const a = this.baseAngle + this.spinAngle;
        const tx = guardCenter.x + Math.cos(a) * r;
        const ty = guardCenter.y + Math.sin(a) * r;

        if (Input.speed > 1.5) {
            const dx = tx - this.x;
            const dy = ty - this.y;
            const d = Math.hypot(dx, dy) || 1;

            this.vx += (dx / d) * Math.min(d * 0.05, 4 * scaleFactor);
            this.vy += (dy / d) * Math.min(d * 0.05, 4 * scaleFactor);
            
            this.vx *= 0.85; 
            this.vy *= 0.85;
            
            this.x += this.vx; 
            this.y += this.vy;

            this.drawAngle = Math.atan2(this.vy, this.vx) + Math.PI / 2;
        } else {
            const dx = tx - this.x;
            const dy = ty - this.y;
            
            this.x += dx * 0.12; 
            this.y += dy * 0.12;
            
            this.vx *= 0.5; 
            this.vy *= 0.5;

            let targetAngle = (Input.guardForm === 1) 
                ? a + Math.PI / 2 
                : Math.atan2(ty - this.y, tx - this.x) + Math.PI / 2;

            let diff = targetAngle - this.drawAngle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.drawAngle += diff * 0.15;
        }

        // if (Input.speed > 1.5) {
        //     this.flowNoise += 0.04;
        //     const fx = Input.x + Math.cos(this.flowOffsetAngle + this.flowNoise) * this.flowOffsetRadius;
        //     const fy = Input.y + Math.sin(this.flowOffsetAngle + this.flowNoise) * this.flowOffsetRadius;
        //     const dx = fx - this.x;
        //     const dy = fy - this.y;
        //     const d = Math.hypot(dx, dy) || 1;
        //     this.vx += (dx / d) * Math.min(d * 0.04, 3 * scaleFactor);
        //     this.vy += (dy / d) * Math.min(d * 0.04, 3 * scaleFactor);
        //     this.vx *= 0.9; this.vy *= 0.9;
        //     this.x += this.vx; this.y += this.vy;
        //     this.drawAngle = Math.atan2(this.vy, this.vx) + Math.PI / 2;
        // } else {
        //     const dx = tx - this.x;
        //     const dy = ty - this.y;
        //     this.x += dx * 0.12; this.y += dy * 0.12;
        //     this.vx *= 0.5; this.vy *= 0.5;
        //     let targetAngle = (Input.guardForm === 1) ? a + Math.PI / 2 : Math.atan2(ty - this.y, tx - this.x) + Math.PI / 2;
        //     let diff = targetAngle - this.drawAngle;
        //     while (diff < -Math.PI) diff += Math.PI * 2;
        //     while (diff > Math.PI) diff -= Math.PI * 2;
        //     this.drawAngle += diff * 0.15;
        // }
        this.attackFrame = 0;
        this.trail = []; 
    }

    updateAttackMode(enemies, Input, scaleFactor) {
        this.attackFrame++;
        if (this.attackFrame < this.attackDelay) return;

        let target = null, minStartDist = Infinity;
        for (const e of enemies) {
            const d = Math.hypot(e.x - Input.x, e.y - Input.y);
            if (d < minStartDist) { minStartDist = d; target = e; }
        }

        if (target) {
            const dx = target.x - this.x, dy = target.y - this.y;
            const d = Math.hypot(dx, dy) || 1;
            
            this.vx += (dx / d) * 10 * scaleFactor;
            this.vy += (dy / d) * 10 * scaleFactor;
            this.vx *= 0.92; this.vy *= 0.92;
            this.x += this.vx; this.y += this.vy;
            this.drawAngle = Math.atan2(this.vy, this.vx) + Math.PI / 2;

            // Xử lý va chạm
            if (Math.hypot(this.x - target.x, this.y - target.y) < target.r + (target.hasShield ? 10 : 0)) {
                const result = target.hit(this);
                
                if (result === "shielded") {
                    // KIẾM BỊ VĂNG RA
                    this.isStunned = true;
                    this.stunTimer = performance.now() + CONFIG.SWORD.STUN_DURATION_MS;
                    // Đẩy ngược kiếm ra xa với vận tốc lớn
                    this.vx = -this.vx * 1.5 + (Math.random() - 0.5) * 10;
                    this.vy = -this.vy * 1.5 + (Math.random() - 0.5) * 10;
                }
            }
            
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > CONFIG.SWORD.TRAIL_LENGTH) this.trail.shift();
        }
    }

    draw(ctx, scaleFactor) {
        if (this.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) ctx.lineTo(this.trail[i].x, this.trail[i].y);
            ctx.strokeStyle = CONFIG.COLORS.SWORD_TRAIL;
            ctx.lineWidth = 2 * scaleFactor;
            ctx.stroke();
        }
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.drawAngle);
        this.drawAura(ctx, scaleFactor);
        this.drawBlade(ctx, scaleFactor);
        ctx.restore();
    }

    drawAura(ctx, scaleFactor) {
        const auraCount = Math.floor(random(2, 4));
        ctx.shadowColor = "#fffaa0";
        ctx.shadowBlur = 8 * scaleFactor;
        for (let i = 0; i < auraCount; i++) {
            ctx.beginPath();
            let py = -random(0, CONFIG.SWORD.SIZE * scaleFactor);
            let px = random(-3, 3) * scaleFactor;
            ctx.moveTo(px, py);
            for (let s = 0; s < 3; s++) {
                px += random(-4, 4) * scaleFactor;
                py += random(-3, 3) * scaleFactor;
                ctx.lineTo(px, py);
            }
            ctx.strokeStyle = `rgba(255,255,180,${random(0.3, 0.6)})`;
            ctx.lineWidth = 1.5 * scaleFactor;
            ctx.stroke();
        }
    }

    drawBlade(ctx, scaleFactor) {
        const sLen = CONFIG.SWORD.SIZE * scaleFactor;
        const sWid = 4 * scaleFactor;
        ctx.shadowColor = "#8fffe0";
        ctx.shadowBlur = 15 * scaleFactor;
        const g = ctx.createLinearGradient(0, -sLen, 0, 0);
        g.addColorStop(0, CONFIG.COLORS.SWORD_BLADE[0]);
        g.addColorStop(0.5, CONFIG.COLORS.SWORD_BLADE[1]);
        g.addColorStop(1, CONFIG.COLORS.SWORD_BLADE[2]);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(-sWid / 2, 0);
        ctx.lineTo(-sWid / 2, -sLen);
        ctx.quadraticCurveTo(0, -sLen - 10 * scaleFactor, sWid / 2, -sLen);
        ctx.lineTo(sWid / 2, 0);
        ctx.fill();
        ctx.shadowColor = "#9fffe6";
        ctx.fillStyle = "#4fcfb2";
        ctx.beginPath();
        ctx.roundRect(-7*scaleFactor, -1.2*scaleFactor, 14*scaleFactor, 2.4*scaleFactor, 2.4*scaleFactor);
        ctx.fill();
        ctx.fillStyle = "#2f7f68";
        ctx.beginPath();
        ctx.moveTo(-3 * scaleFactor, 0);
        ctx.lineTo(-2 * scaleFactor, 14 * scaleFactor);
        ctx.lineTo(2 * scaleFactor, 14 * scaleFactor);
        ctx.lineTo(3 * scaleFactor, 0);
        ctx.fill();
    }
}

class StarField {
    constructor(count, width, height) {
        this.stars = [];
        for(let i=0; i<count; i++) {
            this.stars.push({
                x: random(-width, width * 2), 
                y: random(-height, height * 2),
                r: random(0.5, 2),
                alpha: random(0.2, 1)
            });
        }
    }
    draw(ctx, scaleFactor) {
        ctx.shadowBlur = 0;
        for (const s of this.stars) {
            s.alpha += random(-0.01, 0.01);
            if (s.alpha > 1) s.alpha = 1; else if (s.alpha < 0.2) s.alpha = 0.2;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r * scaleFactor, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
            ctx.fill();
        }
    }
}