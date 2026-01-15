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

        // 1. XÁC ĐỊNH TINH ANH & CẢNH GIỚI (Sử dụng CONFIG.CULTIVATION.RANKS)
        const playerRank = Input.rankIndex || 0;
        this.isElite = Math.random() < 0.05; // Tỉ lệ 5%

        let enemyRankIndex;
        if (this.isElite) {
            // Tinh anh vượt cấp: dựa trên bảng Rank
            enemyRankIndex = Math.min(
                CONFIG.CULTIVATION.RANKS.length - 1, 
                playerRank + 2 // Tinh anh mặc định mạnh hơn 2 bậc
            );
        } else {
            // Quái thường xoay quanh người chơi
            enemyRankIndex = Math.max(0, Math.min(
                CONFIG.CULTIVATION.RANKS.length - 1, 
                playerRank + Math.floor(Math.random() * 3) - 1
            ));
        }
        
        this.rankData = CONFIG.CULTIVATION.RANKS[enemyRankIndex];
        this.rankName = (this.isElite ? "★ TINH ANH ★ " : "") + this.rankData.name;
        
        // Màu sắc từ bảng CONFIG COLORS hoặc RankData
        this.colors = this.isElite ? ["#ffffff", "#ff3300"] : [this.rankData.lightColor, this.rankData.color];

        // 2. TÍNH HP (Sử dụng CONFIG.ENEMY.HP và CONFIG.ENEMY.SCALING_FACTOR)
        // Công thức: HP = (Gốc + Random) * (1 + Hệ số tăng trưởng * Cấp độ)
        const baseHP = CONFIG.ENEMY.HP.BASE + Math.random() * CONFIG.ENEMY.HP.VAR;
        const growth = 1 + (enemyRankIndex * CONFIG.ENEMY.SCALING_FACTOR);
        const eliteMult = this.isElite ? 4.0 : 1.0; // Tinh anh trâu gấp 4 lần
        
        this.maxHp = Math.floor(baseHP * growth * eliteMult);
        this.hp = this.maxHp;

        // 3. TÍNH KÍCH THƯỚC (Sử dụng CONFIG.ENEMY.BASE_SIZE)
        const eliteSizeMult = this.isElite ? 1.8 : 1.0;
        this.r = (CONFIG.ENEMY.BASE_SIZE.MIN + Math.random() * CONFIG.ENEMY.BASE_SIZE.VAR) * eliteSizeMult;

        // 4. KHIÊN (Sử dụng CONFIG.ENEMY.SHIELD_CHANCE)
        this.hasShield = Math.random() < (CONFIG.ENEMY.SHIELD_CHANCE + (this.isElite ? 0.4 : 0));
        this.shieldHp = this.hasShield ? Math.floor(this.hp * 0.5) : 0;
        this.maxShieldHp = this.shieldHp;

        // 5. ICON (Sử dụng CONFIG.ENEMY.ANIMALS)
        const animalPaths = CONFIG.ENEMY.ANIMALS;
        const randomPath = animalPaths[Math.floor(Math.random() * animalPaths.length)];
        const iconKey = randomPath.split('/').pop().split('.')[0];
        this.icon = enemyIcons[iconKey];
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
        const baseDamage = currentRank ? currentRank.damage : 1;

        // Áp dụng hệ số độ bền của kiếm
        const damage = Math.ceil(baseDamage * (sword?.powerPenalty || 1));

        if (this.hasShield && this.shieldHp > 0) {
            this.shieldHp -= damage;
            let currentLevel = Math.floor((this.maxShieldHp - this.shieldHp) / 20);
            if (currentLevel > this.shieldLevel) {
                this.shieldLevel = currentLevel;
                this.cracks = []; // RESET mảng trước khi tạo vết nứt mới để tránh tràn bộ nhớ
                this.generateCracks(this.shieldLevel);
            }
            if (this.shieldHp <= 0) {
                this.hasShield = false;
                this.createShieldDebris();
            }
            return "shielded";
        }

        this.hp -= damage;

        if (this.hp <= 0) {
            // 1. Tính toán phần thưởng EXP và Mana
            let expGain = Math.ceil(5 * (1 + Input.rankIndex * 1.5));
            let manaGain = CONFIG.MANA.GAIN_KILL;
            const pillCfg = CONFIG.PILL;
            const chance = this.isElite ? pillCfg.ELITE_CHANCE : pillCfg.CHANCE;

            if (this.isElite) {
                expGain *= 10;
                manaGain *= 5;
                showNotify("DIỆT TINH ANH: THU HOẠCH LỚN!", "#ffcc00");
            }

            // 2. Cộng EXP và Mana ngay lập tức
            Input.updateExp(expGain);
            Input.updateMana(manaGain);

            // 3. XỬ LÝ RƠI LINH ĐAN THEO PHẨM CẤP
            if (Math.random() < chance) {
                // Lấy cấu hình rơi dựa trên loại quái
                const rates = this.isElite ? pillCfg.DROP_RATES.ELITE : pillCfg.DROP_RATES.NORMAL;
                const count = this.isElite ? pillCfg.DROP_COUNT.ELITE : pillCfg.DROP_COUNT.NORMAL;

                for (let i = 0; i < count; i++) {
                    let typeKey = 'LOW';
                    const rand = Math.random();

                    // Logic chọn loại đan dựa trên DROP_RATES trong Config
                    if (rand < rates.HIGH) {
                        typeKey = 'HIGH';
                    } else if (rand < rates.HIGH + rates.MEDIUM) {
                        typeKey = 'MEDIUM';
                    } else {
                        typeKey = 'LOW';
                    }

                    pills.push(new Pill(this.x, this.y, typeKey));
                }
                
                showNotify(this.isElite ? "Đại cơ duyên! Linh Đan xuất thế!" : "Thu hoạch Linh Đan", 
                        this.isElite ? "#ffcc00" : "#00ffcc");
            }

            this.respawn();
            return "killed";
        }
        return "hit";
    }

    drawShield(ctx, scaleFactor) {
        const shieldR = (this.r + 10) * scaleFactor;
        const pulse = Math.sin(Date.now() * 0.006) * 0.1 + 0.9; // Giảm biên độ pulse

        ctx.save();
        // Vẽ vòng ngoài khiên (Bỏ shadowBlur, thay bằng lineWidth dày hơn)
        ctx.beginPath();
        ctx.arc(0, 0, shieldR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(140, 245, 255, ${0.5 * pulse})`; 
        ctx.lineWidth = 2 * scaleFactor;
        ctx.stroke();

        // Chỉ vẽ cracks nếu có
        if (this.cracks.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
            ctx.lineWidth = 1 * scaleFactor;
            this.cracks.forEach(pts => {
                if (pts.length < 2) return;
                ctx.moveTo(pts[0].x * scaleFactor, pts[0].y * scaleFactor);
                for (let i = 1; i < pts.length; i++) {
                    ctx.lineTo(pts[i].x * scaleFactor, pts[i].y * scaleFactor);
                }
            });
            ctx.stroke();
        }
        ctx.restore();
    }

    createShieldDebris() {
        const conf = CONFIG.ENEMY.DEBRIS;
        for (let i = 0; i < conf.COUNT; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = random(conf.SPEED.MIN, conf.SPEED.MAX);
            
            // Đẩy thẳng vào mảng global để class Enemy không phải xử lý drawParticles nữa
            visualParticles.push({
                x: this.x, 
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: random(conf.SIZE.MIN, conf.SIZE.MAX),
                life: 1.0,
                color: CONFIG.COLORS.ENEMY_PARTICLE,
                type: 'square' // Thêm flag để hàm animate biết cách vẽ hình vuông
            });
        }
    }

    draw(ctx, scaleFactor) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        this.drawParticles(ctx, scaleFactor);
        if (this.hasShield) this.drawShield(ctx, scaleFactor);
        this.drawBody(ctx, scaleFactor);

        // Vẽ tên cảnh giới
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.font = `bold ${11 * scaleFactor}px "Segoe UI", Arial`;
        ctx.textAlign = "center";
        const textY = -this.r - (this.hasShield ? 15 : 10) * scaleFactor;
        ctx.fillText(this.rankName, 0, textY);

        // VẼ THANH MÁU NHỎ PHÍA DƯỚI TÊN
        const barWidth = this.r * 1.5 * scaleFactor;
        const barHeight = 4 * scaleFactor;
        const barY = textY + 5 * scaleFactor;

        // Nền thanh máu (màu đen mờ)
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(-barWidth/2, barY, barWidth, barHeight);

        // Máu còn lại (màu xanh lá chuyển dần sang đỏ)
        const hpRatio = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = hpRatio > 0.5 ? "#2ecc71" : (hpRatio > 0.2 ? "#f1c40f" : "#e74c3c");
        ctx.fillRect(-barWidth/2, barY, barWidth * hpRatio, barHeight);
        
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
        if (!this.r || isNaN(this.r)) return; // Dòng bảo vệ: Nếu r lỗi thì không vẽ để tránh crash
        
        ctx.save();

        // --- HIỆU ỨNG PHÁT SÁNG CHO TINH ANH ---
        if (this.isElite) {
            ctx.shadowColor = "#ff3300";
            ctx.shadowBlur = 20 * scaleFactor;
            // Làm quái hơi rung rinh một chút
            ctx.translate((Math.random()-0.5)*2, (Math.random()-0.5)*2);
        }
        
        // 1. Vẽ hào quang (glow) quanh quái vật (Dùng màu Cảnh giới)
        const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.r * 1.3);
        glowGrad.addColorStop(0, this.colors[1] + "55"); // Màu rank mờ
        glowGrad.addColorStop(1, "transparent");
        
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, 0, this.r * 1.3, 0, Math.PI * 2);
        ctx.fill();

        // 2. Vẽ Icon SVG
        // Kiểm tra an toàn: icon tồn tại, đã tải xong (complete) và không lỗi (naturalWidth > 0)
        if (this.icon && this.icon.complete && this.icon.naturalWidth > 0) {
            const drawSize = this.r * 2 * scaleFactor;
            
            // Thêm hiệu ứng phát sáng nhẹ cho icon trắng
            ctx.shadowColor = this.colors[1];
            ctx.shadowBlur = 10 * scaleFactor;
            
            ctx.drawImage(
                this.icon, 
                -drawSize / 2, 
                -drawSize / 2, 
                drawSize, 
                drawSize
            );
        } else {
            // Backup: Nếu ảnh hỏng/chưa load kịp thì vẽ hình tròn đặc để không lỗi game
            ctx.beginPath();
            ctx.arc(0, 0, this.r * scaleFactor, 0, Math.PI * 2);
            ctx.fillStyle = this.colors[1];
            ctx.fill();
        }
        
        ctx.restore();
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
        const rankData = CONFIG.CULTIVATION.RANKS[Input.rankIndex] || CONFIG.CULTIVATION.RANKS[0];
        this.maxHp = rankData.swordDurability;
        this.hp = this.maxHp;
        this.isDead = false;
        this.respawnTimer = 0;
        this.fragments = [];
        this.deathTime = 0;
        this.powerPenalty = 1; // hệ số sát thương theo độ bền
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
        const rankData = CONFIG.CULTIVATION.RANKS[Input.rankIndex] || CONFIG.CULTIVATION.RANKS[0];
        this.maxHp = rankData.swordDurability;
        this.hp = this.maxHp;
        this.isDead = false;
        this.x = Input.x;
        this.y = Input.y;
        this.vx = 0; 
        this.vy = 0;
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

        // --- GIẢM SÁT THƯƠNG KHI KIẾM GẦN VỠ ---
        const durabilityRate = this.hp / this.maxHp; // 1 → mới, 0 → sắp gãy
        this.powerPenalty = 0.6 + durabilityRate * 0.4;
        // 100% HP → 1.0 | 0 HP → 0.6

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
                    this.hp -= target.isElite ? 3 : 1;

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

class Pill {
    constructor(x, y, typeKey = 'LOW') {
        this.x = x;
        this.y = y;
        this.typeKey = typeKey; // Lưu lại để khi thu thập biết là loại nào
        
        const typeData = CONFIG.PILL.TYPES[typeKey];
        this.r = typeData.radius;
        this.color = typeData.color;
        
        this.state = 0; 
        this.velocity = { x: (Math.random() - 0.5) * 12, y: (Math.random() - 0.5) * 12 };
        this.friction = 0.96;
        this.spawnTime = Date.now();
        this.history = []; 
        this.maxHistory = CONFIG.PILL.TRAIL_LENGTH;
    }

    update(playerX, playerY) {
        const cfg = CONFIG.PILL;
        this.history.push({x: this.x, y: this.y});
        if (this.history.length > this.maxHistory) this.history.shift();

        if (this.state === 0) {
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.velocity.x *= this.friction;
            this.velocity.y *= this.friction;
            
            if (Date.now() - this.spawnTime > cfg.COLLECT_DELAY_MS) this.state = 1;
        } else {
            const dx = playerX - this.x;
            const dy = playerY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Dùng tốc độ từ CONFIG
            this.x += (dx / dist) * cfg.MAGNET_SPEED;
            this.y += (dy / dist) * cfg.MAGNET_SPEED;
            
            if (dist < 20) return true; 
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        
        // 1. VẼ VỆT SÁNG (TRAIL)
        if (this.history.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.history[0].x, this.history[0].y);
            for (let i = 1; i < this.history.length; i++) {
                ctx.lineTo(this.history[i].x, this.history[i].y);
            }
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.r * 0.8;
            ctx.lineCap = "round";
            ctx.globalAlpha = 0.3; // Đuôi mờ dần
            ctx.stroke();
        }

        // 2. VẼ VIÊN LINH ĐAN
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
        grad.addColorStop(0, "#fff");
        grad.addColorStop(1, this.color);
        
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
    }
}
// <!-- Create By: Vũ Hoài Nam -->