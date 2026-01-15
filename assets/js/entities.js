const random = (min, max) => Math.random() * (max - min) + min;

class Enemy {
    constructor() {
        this.particles = [];
        this.respawn();
    }

    respawn() {
        const zoom = Camera.currentZoom;
        const visibleWidth = window.innerWidth / zoom;
        const visibleHeight = window.innerHeight / zoom;
        const startX = (window.innerWidth / 2) - (visibleWidth / 2);
        const startY = (window.innerHeight / 2) - (visibleHeight / 2);
        const padding = CONFIG.ENEMY.SPAWN_PADDING;
        this.x = random(startX + padding, startX + visibleWidth - padding);
        this.y = random(startY + padding, startY + visibleHeight - padding);
        this.particles = [];
        this.cracks = [];
        this.shieldLevel = 0;
        // 1. Tính hệ số mạnh dần theo cấp độ người chơi
        const scaling = 1 + (Input.rankIndex * CONFIG.ENEMY.SCALING_FACTOR);
        // 2. Tính kích thước quái (giữ nguyên công thức cũ nhưng gán lại biến r)
        const sizeBase = CONFIG.ENEMY.BASE_SIZE.MIN;
        const sizeVar = CONFIG.ENEMY.BASE_SIZE.VAR;
        this.r = (sizeBase + Math.pow(Math.random(), 1.5) * sizeVar) * (window.innerWidth / CONFIG.CORE.BASE_WIDTH);
        // 3. Máu quái: Nhân thêm với hệ số scaling
        this.maxHp = Math.floor((CONFIG.ENEMY.HP.BASE + Math.random() * CONFIG.ENEMY.HP.VAR) * scaling);
        this.hp = this.maxHp;
        // 4. Khiên: Cũng nhân thêm với hệ số scaling nếu có khiên
        this.hasShield = Math.random() < CONFIG.ENEMY.SHIELD_CHANCE;
        this.shieldHp = this.hasShield ? Math.floor(CONFIG.ENEMY.SHIELD_MAX_HP * scaling) : 0;
        this.maxShieldHp = this.shieldHp; // Cập nhật lại maxShieldHp để tính toán vết nứt
        // 5. Màu sắc (Giữ nguyên)
        this.colors = CONFIG.ENEMY.PALETTES[Math.floor(Math.random() * CONFIG.ENEMY.PALETTES.length)];
    }

    generateCracks(level) {
        const shieldR = this.r + 10;
        const baseAngle = Math.random() * Math.PI * 2;
        const numRadial = 5 + level * 2;
        const radialPoints = [];

        for (let i = 0; i < numRadial; i++) {
            const angle = baseAngle + (i * Math.PI * 2) / numRadial;
            const points = [];
            const steps = 4;

            for (let j = 0; j <= steps; j++) {
                const dist = (shieldR * j) / steps;
                const jitter = j === 0 ? 0 : (Math.random() - 0.5) * 0.2;
                points.push({
                    x: Math.cos(angle + jitter) * dist,
                    y: Math.sin(angle + jitter) * dist
                });
            }
            this.cracks.push(points);
            radialPoints.push(points);
        }

        const numRings = 2 + level;
        for (let r = 1; r <= numRings; r++) {
            const ringDistIdx = Math.floor((radialPoints[0].length - 1) * (r / (numRings + 1)));

            for (let i = 0; i < radialPoints.length; i++) {
                const nextIdx = (i + 1) % radialPoints.length;
                const p1 = radialPoints[i][ringDistIdx];
                const p2 = radialPoints[nextIdx][ringDistIdx];

                if (Math.random() > 0.2) {
                    this.cracks.push([p1, p2]);
                }
            }
        }
    }

    // Tìm hàm hit(sword) trong entities.js và thay thế đoạn cuối (phần xử lý khi hp <= 0)
    hit(sword) {
        const currentRank = CONFIG.CULTIVATION.RANKS[Input.rankIndex];
        const damage = currentRank ? currentRank.damage : 1;

        if (this.hasShield && this.shieldHp > 0) {
            this.shieldHp -= damage;
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

        this.hp -= damage;
        
        // --- ĐOẠN CẦN THAY THẾ/BỔ SUNG TỪ ĐÂY ---
        if (this.hp <= 0) {
            const sizeRatio = Math.max(1, this.r / (15 * (window.innerWidth / CONFIG.CORE.BASE_WIDTH)));
            
            // 1. Tăng EXP tỷ lệ thuận với Cảnh giới (RankIndex)
            const rankBonus = 1 + (Input.rankIndex * 2); 
            const expGain = Math.ceil(2 * sizeRatio * rankBonus);
            Input.updateExp(expGain);

            // 2. Hồi Mana khi tiêu diệt quái
            Input.updateMana(Math.ceil(CONFIG.MANA.GAIN_KILL * sizeRatio));

            // 3. Logic rơi Đan dược (Mới)
            if (Math.random() < CONFIG.ENEMY.PILL_CHANCE) {
                Input.pillCount++;
                showNotify("+1 Linh Đan (Tăng tỉ lệ đột phá)", "#00ffcc");
                // Tạo hiệu ứng hạt màu lục đặc biệt tại vị trí quái chết
                Input.createLevelUpExplosion(this.x, this.y, "#00ffcc"); 
            }

            this.respawn();
            return "killed";
        }
        return "hit";
    }

    drawShield(ctx, scaleFactor) {
        const shieldR = (this.r + 10) * scaleFactor;

        const pulse = Math.sin(Date.now() * 0.006) * 0.15 + 0.85;

        ctx.save();

        ctx.beginPath();
        ctx.arc(0, 0, shieldR, 0, Math.PI * 2);
        ctx.clip();

        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, shieldR);
        grad.addColorStop(0, "rgba(255, 255, 255, 0)");
        grad.addColorStop(0.7, "rgba(100, 210, 255, 0.15)");
        grad.addColorStop(1, `rgba(150, 240, 255, ${0.3 * pulse})`);

        ctx.fillStyle = grad;
        ctx.fill();

        if (this.cracks.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 + (this.shieldLevel * 0.1)})`;
            ctx.lineWidth = (1.2 + this.shieldLevel * 0.4) * scaleFactor;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            this.cracks.forEach(pts => {
                ctx.moveTo(pts[0].x * scaleFactor, pts[0].y * scaleFactor);
                for (let i = 1; i < pts.length; i++) {
                    ctx.lineTo(pts[i].x * scaleFactor, pts[i].y * scaleFactor);
                }
            });
            ctx.stroke();

            if (this.shieldLevel >= 2) {
                ctx.globalAlpha = 0.4;
                ctx.shadowBlur = 10 * scaleFactor;
                ctx.shadowColor = "#ffffff";
                ctx.lineWidth = 2.5 * scaleFactor;
                ctx.stroke();
            }
        }
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, shieldR, 0, Math.PI * 2);

        ctx.shadowBlur = 15 * scaleFactor;
        ctx.shadowColor = CONFIG.COLORS.SHIELD_GLOW;

        ctx.strokeStyle = `rgba(140, 245, 255, ${pulse})`; 
        
        ctx.lineWidth = 3.5 * scaleFactor;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, shieldR + 3 * scaleFactor, 0, Math.PI * 2);
        ctx.strokeStyle = CONFIG.COLORS.SHIELD_RING_OUTER;
        ctx.lineWidth = 1 * scaleFactor;
        ctx.stroke();
        ctx.restore();
    }

    createShieldDebris() {
        const conf = CONFIG.ENEMY.DEBRIS;
        for (let i = 0; i < conf.COUNT; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = random(conf.SPEED.MIN, conf.SPEED.MAX);
            this.particles.push({
                x: 0, y: 0,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                size: random(conf.SIZE.MIN, conf.SIZE.MAX), 
                life: 1.0,
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
        const decay = CONFIG.ENEMY.DEBRIS.LIFE_DECAY;
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.life -= decay;
            if (p.life <= 0) { this.particles.splice(i, 1); continue; }
            ctx.save();
            ctx.translate(p.x * scaleFactor, p.y * scaleFactor);
            ctx.rotate(p.rotation += p.spin);
            ctx.globalAlpha = p.life;
            ctx.fillStyle = CONFIG.COLORS.ENEMY_PARTICLE;
            const s = p.size * scaleFactor;
            ctx.fillRect(-s / 2, -s / 2, s, s);
            ctx.restore();
        }
    }

    drawBody(ctx, scaleFactor) {
        ctx.globalAlpha = 1.0;
        const g = ctx.createRadialGradient(0, 0, this.r * 0.2, 0, 0, this.r);
        g.addColorStop(0, this.colors[0]);
        g.addColorStop(1, this.colors[1]);

        ctx.beginPath();
        ctx.arc(0, 0, this.r, 0, Math.PI * 2);
        ctx.fillStyle = g;

        if (this.hasShield) {
            ctx.shadowColor = CONFIG.COLORS.ENEMY_SHADOW_SHIELD;
            ctx.shadowBlur = 30 * scaleFactor;

            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            ctx.lineWidth = 3 * scaleFactor;
            ctx.stroke();
        } else {
            ctx.shadowColor = this.colors[1];
            ctx.shadowBlur = 15 * scaleFactor;
        }

        ctx.fill();
        ctx.shadowBlur = 0;
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
        this.x = window.innerWidth / 2;
        this.y = window.innerHeight / 2;
        this.vx = 0; this.vy = 0;
        this.drawAngle = 0;
        this.trail = [];
        this.breath = random(0, Math.PI * 2);
        this.breathSpeed = random(CONFIG.SWORD.BREATH_SPEED.MIN, CONFIG.SWORD.BREATH_SPEED.MAX);
        this.attackDelay = this.layer * CONFIG.SWORD.ATTACK_DELAY_VAR.BASE + random(0, CONFIG.SWORD.ATTACK_DELAY_VAR.RAND);
        this.attackFrame = 0;
        this.flowNoise = Math.random() * Math.PI * 2;
        this.flowOffsetAngle = (Math.PI * 2 / 72) * index;
        this.flowOffsetRadius = (CONFIG.SWORD.FLOW_OFFSET.MIN + Math.random() * (CONFIG.SWORD.FLOW_OFFSET.MAX - CONFIG.SWORD.FLOW_OFFSET.MIN)) * scaleFactor;
        this.isStunned = false;
        this.stunTimer = 0;
        this.maxHp = CONFIG.SWORD.DURABILITY || 3;
        this.hp = this.maxHp;
        this.isDead = false;
        this.respawnTimer = 0;
        this.fragments = [];
        this.deathTime = 0;
    }

    update(guardCenter, enemies, Input, scaleFactor) {
        if (this.isDead) {
            const now = performance.now();
            if (now > this.respawnTimer) {
                // KIỂM TRA MANA TRƯỚC KHI HỒI SINH
                if (Input.mana >= Math.abs(CONFIG.MANA.COST_RESPAWN)) {
                    Input.updateMana(CONFIG.MANA.COST_RESPAWN); // TRỪ 1 MANA KHI TÁI SINH
                    this.respawn(Input);
                } else {
                    // Nếu không đủ mana, trì hoãn việc hồi sinh thêm 1 giây để kiểm tra lại sau
                    this.respawnTimer = now + 1000;
                }
            }
            return;
        }

        if (this.isStunned) {
            this.handleStun(scaleFactor);
            return;
        }

        this.breath += this.breathSpeed;
        this.breathSpeed = random(CONFIG.SWORD.BREATH_SPEED.MIN, CONFIG.SWORD.BREATH_SPEED.MAX);
        const currentRadius = this.radius + Math.sin(this.breath) * 8 * scaleFactor;

        if (!Input.isAttacking) {
            this.updateGuardMode(guardCenter, currentRadius, Input, scaleFactor);
        } else {
            this.updateAttackMode(enemies, Input, scaleFactor);
        }
    }

    handleStun(scaleFactor) {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.drawAngle += 0.2;

        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > CONFIG.SWORD.TRAIL_LENGTH) this.trail.shift();

        if (performance.now() > this.stunTimer) {
            this.isStunned = false;
            this.vx *= 0.2;
            this.vy *= 0.2;
        }
    }

    respawn(Input) {
        this.isDead = false;
        this.hp = this.maxHp;
        this.x = Input.x;
        this.y = Input.y;
        this.vx = 0; this.vy = 0;
        this.isStunned = false;
        this.trail = [];
        this.fragments = [];
    }

    updateGuardMode(guardCenter, r, Input, scaleFactor) {
        const globalRotation = (performance.now() / 1000) * this.spinSpeed * (CONFIG.SWORD.SPEED_MULT || 100);
        const a = this.baseAngle + globalRotation; 
        
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

            if (Math.hypot(dx, dy) < 0.5) {
                this.x = tx;
                this.y = ty;
            }

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
            if (Math.hypot(this.x - target.x, this.y - target.y) < target.r + (target.hasShield ? 10 : 0)) {
                const result = target.hit(this);

                if (result === "shielded") {
                    this.hp--;

                    if (this.hp <= 0) {
                        this.breakSword(scaleFactor);
                    } else {
                        this.isStunned = true;
                        this.stunTimer = performance.now() + CONFIG.SWORD.STUN_DURATION_MS;
                        this.vx = -this.vx * 1.5 + (Math.random() - 0.5) * 10;
                        this.vy = -this.vy * 1.5 + (Math.random() - 0.5) * 10;
                    }
                }
            }

            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > CONFIG.SWORD.TRAIL_LENGTH) this.trail.shift();
        }
    }

    breakSword(scaleFactor) {
        this.isDead = true;
        this.deathTime = performance.now();
        this.respawnTimer = this.deathTime + CONFIG.SWORD.DEATH_WAIT_MS + CONFIG.SWORD.RESPAWN_DELAY_MS;

        const sLen = CONFIG.SWORD.SIZE * scaleFactor;
        const cos = Math.cos(this.drawAngle);
        const sin = Math.sin(this.drawAngle);

        this.fragments.push({
            type: 'handle',
            x: this.x,
            y: this.y,
            vx: -this.vx * 0.2 + random(-1, 1),
            vy: -this.vy * 0.2 + random(-1, 1),
            angle: this.drawAngle,
            va: random(-0.1, 0.1)
        });

        this.fragments.push({
            type: 'mid',
            x: this.x + cos * (sLen * 0.4) + sin * (sLen * 0.4),
            y: this.y + sin * (sLen * 0.4) - cos * (sLen * 0.4),
            vx: -this.vx * 0.4 + random(-2, 2),
            vy: -this.vy * 0.4 + random(-2, 2),
            angle: this.drawAngle + random(-0.2, 0.2),
            va: random(-0.2, 0.2)
        });

        this.fragments.push({
            type: 'tip',
            x: this.x + cos * (sLen * 0.8) + sin * (sLen * 0.8),
            y: this.y + sin * (sLen * 0.8) - cos * (sLen * 0.8),
            vx: -this.vx * 0.6 + random(-3, 3),
            vy: -this.vy * 0.6 + random(-3, 3),
            angle: this.drawAngle + random(-0.5, 0.5),
            va: random(-0.4, 0.4)
        });
    }

    draw(ctx, scaleFactor) {
        if (this.isDead) {
            if (this.fragments.length > 0) {
                const age = performance.now() - this.deathTime;
                const lifeTime = CONFIG.SWORD.FRAGMENTS.LIFE_TIME;
                const fadeTime = CONFIG.SWORD.FRAGMENTS.FADE_TIME;
                
                const alpha = age > lifeTime ? 1 - ((age - lifeTime) / fadeTime) : 1;

                ctx.save();
                ctx.globalAlpha = alpha;
                this.drawFragments(ctx, scaleFactor);
                ctx.restore();
            }
            return;
        }

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

    drawFragments(ctx, scaleFactor) {
        const sLen = CONFIG.SWORD.SIZE * scaleFactor;
        const sWid = 4 * scaleFactor;

        this.fragments.forEach(f => {
            f.x += f.vx;
            f.y += f.vy;
            f.angle += f.va;

            ctx.save();
            ctx.translate(f.x, f.y);
            ctx.rotate(f.angle);

            ctx.shadowBlur = 0;
            ctx.shadowColor = "transparent";

            ctx.beginPath();
            if (f.type === 'handle') {
                ctx.fillStyle = CONFIG.COLORS.SWORD_HANDLE;
                ctx.fillRect(-3 * scaleFactor, 0, 6 * scaleFactor, 14 * scaleFactor);
                
                ctx.fillStyle = CONFIG.COLORS.SWORD_BLADE[2]; 
                ctx.moveTo(-sWid / 2, 0);
                ctx.lineTo(sWid / 2, 0);
                ctx.lineTo(sWid / 2, -sLen * 0.3);
                ctx.lineTo(0, -sLen * 0.2);
                ctx.lineTo(-sWid / 2, -sLen * 0.35);
                ctx.fill();
            }
            else if (f.type === 'mid') {
                ctx.fillStyle = CONFIG.COLORS.SWORD_BLADE[1];
                ctx.moveTo(-sWid / 2, 0);
                ctx.lineTo(sWid / 2, 0);
                ctx.lineTo(sWid / 2, -sLen * 0.3);
                ctx.lineTo(-sWid / 2, -sLen * 0.25);
                ctx.fill();
            }
            else if (f.type === 'tip') {
                ctx.fillStyle = CONFIG.COLORS.SWORD_BLADE[0];
                ctx.moveTo(-sWid / 2, 0);
                ctx.lineTo(sWid / 2, 0);
                ctx.lineTo(0, -sLen * 0.4);
                ctx.fill();
            }
            ctx.restore();
        });
    }

    drawAura(ctx, scaleFactor) {
        const auraCount = Math.floor(random(2, 4));
        ctx.shadowColor = CONFIG.COLORS.SWORD_AURA_SHADOW;
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
        ctx.shadowColor = CONFIG.COLORS.SWORD_GLOW_OUTER;
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
        ctx.shadowColor = CONFIG.COLORS.SWORD_GLOW_INNER;
        ctx.fillStyle = CONFIG.COLORS.SWORD_FRAGMENT;
        ctx.beginPath();
        ctx.roundRect(-7 * scaleFactor, -1.2 * scaleFactor, 14 * scaleFactor, 2.4 * scaleFactor, 2.4 * scaleFactor);
        ctx.fill();
        ctx.fillStyle = CONFIG.COLORS.SWORD_HANDLE;
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
        const totalStars = CONFIG.BG.STAR_COUNT || count;
        
        for (let i = 0; i < totalStars; i++) {
            this.stars.push({
                x: random(-width, width * 2),
                y: random(-height, height * 2),
                r: random(CONFIG.BG.STAR_SIZE.MIN, CONFIG.BG.STAR_SIZE.MAX),
                alpha: random(CONFIG.BG.STAR_ALPHA.MIN, CONFIG.BG.STAR_ALPHA.MAX)
            });
        }
    }
    draw(ctx, scaleFactor) {
        ctx.shadowBlur = 0;
        const speed = CONFIG.BG.STAR_TWINKLE_SPEED;
        
        for (const s of this.stars) {
            s.alpha += random(-speed, speed);
            if (s.alpha > CONFIG.BG.STAR_ALPHA.MAX) s.alpha = CONFIG.BG.STAR_ALPHA.MAX;
            else if (s.alpha < CONFIG.BG.STAR_ALPHA.MIN) s.alpha = CONFIG.BG.STAR_ALPHA.MIN;
            
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r * scaleFactor, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
            ctx.fill();
        }
    }
}
// <!-- Create By: Vũ Hoài Nam -->