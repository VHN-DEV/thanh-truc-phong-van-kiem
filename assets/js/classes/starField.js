class StarField {
    constructor(count, width, height) {
        this.width = width;
        this.height = height;
        this.stars = [];
        this.nebulae = [];
        this.sparkStreams = [];
        this.rotationAngle = 0;
        this.rotationVelocity = 0;
        this.lastDrawTime = performance.now();
        this.giantStar = {
            x: width * 0.5,
            y: height * 0.5,
            radius: Math.max(120, Math.min(width, height) * 0.12),
            phase: random(0, Math.PI * 2)
        };
        this.starRingNodes = [];

        const totalStars = CONFIG.BG.STAR_COUNT || count;

        for (let i = 0; i < totalStars; i++) {
            const depth = random(0.2, 1);
            this.stars.push({
                x: random(-width, width * 2),
                y: random(-height, height * 2),
                depth,
                r: random(CONFIG.BG.STAR_SIZE.MIN, CONFIG.BG.STAR_SIZE.MAX) * (0.5 + depth),
                alpha: random(CONFIG.BG.STAR_ALPHA.MIN, CONFIG.BG.STAR_ALPHA.MAX),
                phase: random(0, Math.PI * 2)
            });
        }

        const nebulaCount = 18;
        for (let i = 0; i < nebulaCount; i++) {
            this.nebulae.push({
                x: random(-width * 0.5, width * 1.5),
                y: random(-height * 0.5, height * 1.5),
                depth: random(0.2, 0.9),
                radius: random(120, 320),
                phase: random(0, Math.PI * 2),
                hue: random(170, 220)
            });
        }

        for (let i = 0; i < 8; i++) {
            this.sparkStreams.push({
                active: false,
                timer: 0,
                x: 0,
                y: 0,
                angle: 0,
                length: 0
            });
        }

        const ringNodeCount = 160;
        for (let i = 0; i < ringNodeCount; i++) {
            const angle = (i / ringNodeCount) * Math.PI * 2;
            this.starRingNodes.push({
                angle,
                radiusOffset: random(-16, 16),
                size: random(1.4, 3.2),
                alpha: random(0.2, 0.65)
            });
        }
    }

    drawNebulae(ctx, scaleFactor, timeSec) {
        for (let i = 0; i < this.nebulae.length; i++) {
            const cloud = this.nebulae[i];
            const pulse = 0.75 + Math.sin(timeSec * 0.2 + cloud.phase) * 0.2;
            const radius = cloud.radius * pulse * scaleFactor;
            const driftX = Math.cos(timeSec * 0.08 + cloud.phase) * 28 * cloud.depth;
            const driftY = Math.sin(timeSec * 0.06 + cloud.phase) * 18 * cloud.depth;

            const gradient = ctx.createRadialGradient(
                cloud.x + driftX,
                cloud.y + driftY,
                0,
                cloud.x + driftX,
                cloud.y + driftY,
                radius
            );
            gradient.addColorStop(0, `hsla(${cloud.hue}, 85%, 65%, ${0.12 * cloud.depth})`);
            gradient.addColorStop(0.4, `hsla(${cloud.hue + 12}, 90%, 40%, ${0.08 * cloud.depth})`);
            gradient.addColorStop(1, `hsla(${cloud.hue + 24}, 90%, 18%, 0)`);

            ctx.beginPath();
            ctx.fillStyle = gradient;
            ctx.arc(cloud.x + driftX, cloud.y + driftY, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawStars(ctx, scaleFactor, timeSec) {
        const twinkleSpeed = CONFIG.BG.STAR_TWINKLE_SPEED;

        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i];
            const depthDriftX = Math.cos(timeSec * (0.08 + star.depth * 0.2) + star.phase) * 1.8 * (1 - star.depth);
            const depthDriftY = Math.sin(timeSec * (0.09 + star.depth * 0.2) + star.phase) * 1.2 * (1 - star.depth);

            star.alpha += random(-twinkleSpeed, twinkleSpeed);
            if (star.alpha > CONFIG.BG.STAR_ALPHA.MAX) star.alpha = CONFIG.BG.STAR_ALPHA.MAX;
            else if (star.alpha < CONFIG.BG.STAR_ALPHA.MIN) star.alpha = CONFIG.BG.STAR_ALPHA.MIN;

            const glowAlpha = star.alpha * (0.25 + star.depth * 0.75);
            const renderSize = star.r * scaleFactor;

            ctx.beginPath();
            ctx.arc(star.x + depthDriftX, star.y + depthDriftY, renderSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(190,245,255,${glowAlpha})`;
            ctx.fill();
        }
    }

    drawSparkStreams(ctx, scaleFactor) {
        const canvasWidth = ctx.canvas?.width || this.width;
        const canvasHeight = ctx.canvas?.height || this.height;
        for (let i = 0; i < this.sparkStreams.length; i++) {
            const stream = this.sparkStreams[i];

            if (!stream.active && Math.random() < 0.012) {
                stream.active = true;
                stream.timer = 1;
                stream.x = random(-canvasWidth * 0.2, canvasWidth * 1.2);
                stream.y = random(-canvasHeight * 0.2, canvasHeight * 1.2);
                stream.angle = random(-Math.PI, Math.PI);
                stream.length = random(80, 180);
            }

            if (!stream.active) continue;

            stream.timer -= 0.06;
            if (stream.timer <= 0) {
                stream.active = false;
                continue;
            }

            const endX = stream.x + Math.cos(stream.angle) * stream.length * scaleFactor;
            const endY = stream.y + Math.sin(stream.angle) * stream.length * scaleFactor;
            const grad = ctx.createLinearGradient(stream.x, stream.y, endX, endY);
            grad.addColorStop(0, `rgba(160,255,255,${stream.timer * 0.5})`);
            grad.addColorStop(1, 'rgba(80,180,255,0)');

            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.2 * scaleFactor;
            ctx.beginPath();
            ctx.moveTo(stream.x, stream.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
    }

    drawGiantStar(ctx, scaleFactor, timeSec, pivotX, pivotY) {
        const driftX = Math.cos(timeSec * 0.22 + this.giantStar.phase) * 24;
        const driftY = Math.sin(timeSec * 0.17 + this.giantStar.phase) * 16;
        const x = pivotX + driftX;
        const y = pivotY + driftY;
        const baseRadius = this.giantStar.radius * scaleFactor;
        const pulse = 1 + Math.sin(timeSec * 0.8 + this.giantStar.phase) * 0.08;
        const radius = baseRadius * pulse;

        const corona = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.9);
        corona.addColorStop(0, 'rgba(130,255,238,0.58)');
        corona.addColorStop(0.28, 'rgba(82,188,255,0.24)');
        corona.addColorStop(0.7, 'rgba(42,88,190,0.1)');
        corona.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.fillStyle = corona;
        ctx.arc(x, y, radius * 2.9, 0, Math.PI * 2);
        ctx.fill();

        const core = ctx.createRadialGradient(x - radius * 0.2, y - radius * 0.2, radius * 0.1, x, y, radius);
        core.addColorStop(0, 'rgba(226,255,246,0.95)');
        core.addColorStop(0.45, 'rgba(118,245,224,0.88)');
        core.addColorStop(1, 'rgba(35,150,160,0.72)');
        ctx.beginPath();
        ctx.fillStyle = core;
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        const ringTiltY = 0.44;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.sin(timeSec * 0.18) * 0.22);
        ctx.scale(1, ringTiltY);

        for (let i = 0; i < this.starRingNodes.length; i++) {
            const node = this.starRingNodes[i];
            const orbitR = radius * 1.45 + node.radiusOffset * scaleFactor;
            const angle = node.angle + timeSec * 0.3;
            const px = Math.cos(angle) * orbitR;
            const py = Math.sin(angle) * orbitR;
            const isFrontSide = py > 0;

            ctx.beginPath();
            ctx.fillStyle = `rgba(145,242,255,${node.alpha * (isFrontSide ? 0.95 : 0.45)})`;
            ctx.arc(px, py, node.size * scaleFactor * (isFrontSide ? 1 : 0.8), 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.lineWidth = 2.2 * scaleFactor;
        ctx.strokeStyle = 'rgba(142,239,255,0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 1.6, radius * 1.6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    draw(ctx, scaleFactor) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowBlur = 0;

        const now = performance.now();
        const timeSec = now * 0.001;
        const dt = Math.min(0.05, Math.max(0.001, (now - this.lastDrawTime) * 0.001));
        this.lastDrawTime = now;

        const pivotX = (typeof Input !== 'undefined' && Number.isFinite(Input?.x)) ? Input.x : (ctx.canvas?.width || this.width) * 0.5;
        const pivotY = (typeof Input !== 'undefined' && Number.isFinite(Input?.y)) ? Input.y : (ctx.canvas?.height || this.height) * 0.5;
        const canvasCenterX = (ctx.canvas?.width || this.width) * 0.5;
        const canvasCenterY = (ctx.canvas?.height || this.height) * 0.5;
        const dx = pivotX - canvasCenterX;
        const dy = pivotY - canvasCenterY;
        const distNorm = Math.min(1, Math.hypot(dx, dy) / Math.max(1, Math.min(canvasCenterX, canvasCenterY)));
        const baseOrbitSpeed = 0.035;
        const targetVelocity = (baseOrbitSpeed + distNorm * 0.08) * (dx >= 0 ? 1 : -1);

        this.rotationVelocity += (targetVelocity - this.rotationVelocity) * Math.min(1, dt * 3.4);
        this.rotationAngle += this.rotationVelocity * dt;

        ctx.translate(pivotX, pivotY);
        ctx.rotate(this.rotationAngle);
        ctx.translate(-pivotX, -pivotY);

        this.drawGiantStar(ctx, scaleFactor, timeSec, pivotX, pivotY);
        this.drawNebulae(ctx, scaleFactor, timeSec);
        this.drawStars(ctx, scaleFactor, timeSec);
        this.drawSparkStreams(ctx, scaleFactor);

        ctx.restore();
    }

    drawSparkStreams(ctx, scaleFactor) {
        const canvasWidth = ctx.canvas?.width || this.width;
        const canvasHeight = ctx.canvas?.height || this.height;
        for (let i = 0; i < this.sparkStreams.length; i++) {
            const stream = this.sparkStreams[i];

            if (!stream.active && Math.random() < 0.012) {
                stream.active = true;
                stream.timer = 1;
                stream.x = random(-canvasWidth * 0.2, canvasWidth * 1.2);
                stream.y = random(-canvasHeight * 0.2, canvasHeight * 1.2);
                stream.angle = random(-Math.PI, Math.PI);
                stream.length = random(80, 180);
            }

            if (!stream.active) continue;

            stream.timer -= 0.06;
            if (stream.timer <= 0) {
                stream.active = false;
                continue;
            }

            const endX = stream.x + Math.cos(stream.angle) * stream.length * scaleFactor;
            const endY = stream.y + Math.sin(stream.angle) * stream.length * scaleFactor;
            const grad = ctx.createLinearGradient(stream.x, stream.y, endX, endY);
            grad.addColorStop(0, `rgba(160,255,255,${stream.timer * 0.5})`);
            grad.addColorStop(1, 'rgba(80,180,255,0)');

            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.2 * scaleFactor;
            ctx.beginPath();
            ctx.moveTo(stream.x, stream.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
    }

    draw(ctx, scaleFactor) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowBlur = 0;

        const timeSec = performance.now() * 0.001;
        this.drawNebulae(ctx, scaleFactor, timeSec);
        this.drawStars(ctx, scaleFactor, timeSec);
        this.drawSparkStreams(ctx, scaleFactor);

        ctx.restore();
    }
}
