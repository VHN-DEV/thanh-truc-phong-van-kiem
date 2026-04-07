const random = (min, max) => Math.random() * (max - min) + min;
const canvas = document.getElementById("c");
const enemyIcons = {};
const ctx = canvas.getContext("2d", { alpha: false });

let scaleFactor = 1;
let width, height;
let frameCount = 0;
let lastTime = performance.now();
let visualParticles = [];

function preloadEnemyIcons() {
    return Promise.all(
        CONFIG.ENEMY.ANIMALS.map(path => {
            return new Promise(resolve => {
                const img = new Image();
                img.src = path;
                const key = path.split('/').pop().split('.')[0];

                img.onload = () => {
                    enemyIcons[key] = img;
                    resolve();
                };

                img.onerror = () => {
                    console.error("Failed to load icon:", path);
                    resolve(); // Không chặn game
                };
            });
        })
    );
}

function showNotify(text, color) {
    let container = document.getElementById('game-notification');
    if (!container) {
        container = document.createElement('div');
        container.id = 'game-notification';
        document.body.appendChild(container);
    }

    // Giới hạn tối đa 3 thông báo cùng lúc để màn hình gọn gàng
    if (container.children.length > 2) {
        container.removeChild(container.firstChild);
    }

    const item = document.createElement('div');
    item.className = 'notify-item';
    item.innerText = text;
    item.style.color = color;
    item.style.borderLeft = `3px solid ${color}`; // Thêm vạch màu nhỏ bên trái cho tinh tế

    container.appendChild(item);

    // Xóa sau 2.5 giây (khớp với thời gian animation)
    setTimeout(() => {
        item.remove();
    }, 2500);
}

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    scaleFactor = width / CONFIG.CORE.BASE_WIDTH;
}
window.addEventListener("resize", resize);
resize();

const QUALITY_ORDER = ['LOW', 'MEDIUM', 'HIGH', 'SUPREME'];
const STONE_ORDER = ['SUPREME', 'HIGH', 'MEDIUM', 'LOW'];
const numberFormatter = new Intl.NumberFormat('vi-VN');
let ShopUI = null;
let InventoryUI = null;
let ProfileUI = null;
let SkillsUI = null;
let InsectBookUI = null;

function pickWeightedKey(rates, fallbackKey = null) {
    const entries = Object.entries(rates || {});
    if (!entries.length) return fallbackKey;

    const roll = Math.random();
    let cursor = 0;

    for (const [key, weight] of entries) {
        cursor += weight;
        if (roll <= cursor) return key;
    }

    return fallbackKey || entries[entries.length - 1][0];
}

function formatNumber(value) {
    return numberFormatter.format(Math.floor(value));
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function hslaColor(h, s, l, a = 1) {
    return `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`;
}

function normalizeSearchText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function getQualityLabel(quality) {
    const labels = {
        LOW: 'Hạ phẩm',
        MEDIUM: 'Trung phẩm',
        HIGH: 'Thượng phẩm',
        SUPREME: 'Cực phẩm'
    };

    return labels[quality] || quality;
}

function getStartingSpiritStoneCounts() {
    const source = CONFIG.SPIRIT_STONE?.STARTING_COUNTS || {};

    return {
        LOW: Math.max(0, Math.floor(source.LOW || 0)),
        MEDIUM: Math.max(0, Math.floor(source.MEDIUM || 0)),
        HIGH: Math.max(0, Math.floor(source.HIGH || 0)),
        SUPREME: Math.max(0, Math.floor(source.SUPREME || 0))
    };
}

function buildPillVisualMarkup(item, qualityConfig) {
    const visualMap = {
        EXP: { className: 'is-exp', aura: 'rgba(105, 240, 203, 0.32)' },
        INSIGHT: { className: 'is-insight', aura: 'rgba(208, 255, 124, 0.34)' },
        BREAKTHROUGH: { className: 'is-breakthrough', aura: 'rgba(120, 168, 255, 0.32)' },
        ATTACK: { className: 'is-attack', aura: 'rgba(255, 160, 109, 0.34)' },
        SHIELD_BREAK: { className: 'is-shield-break', aura: 'rgba(111, 187, 255, 0.34)' },
        BERSERK: { className: 'is-berserk', aura: 'rgba(255, 75, 93, 0.34)' },
        RAGE: { className: 'is-rage', aura: 'rgba(255, 112, 70, 0.34)' },
        MANA: { className: 'is-mana', aura: 'rgba(87, 200, 255, 0.30)' },
        MAX_MANA: { className: 'is-max-mana', aura: 'rgba(164, 121, 255, 0.30)' },
        REGEN: { className: 'is-regen', aura: 'rgba(89, 226, 219, 0.30)' },
        SPEED: { className: 'is-speed', aura: 'rgba(149, 255, 186, 0.30)' },
        FORTUNE: { className: 'is-fortune', aura: 'rgba(255, 214, 102, 0.32)' },
        BAG: { className: 'is-bag', aura: 'rgba(151, 197, 255, 0.26)' },
        SWORD_ART: { className: 'is-sword-art', aura: 'rgba(121, 255, 212, 0.32)' },
        FLAME_ART: { className: 'is-flame-art', aura: 'rgba(104, 217, 255, 0.34)' },
        INSECT_SKILL: { className: 'is-insect-skill', aura: 'rgba(121, 255, 212, 0.32)' },
        INSECT_ARTIFACT: { className: 'is-insect-artifact', aura: 'rgba(255, 216, 113, 0.34)' },
        SPIRIT_BAG: { className: 'is-spirit-bag', aura: 'rgba(142, 191, 255, 0.30)' },
        CHUNG_CUC_DAO_NGUYEN_DAN: { className: 'is-special-rainbow', aura: 'rgba(255, 255, 255, 0.40)' },
        TAN_DAO_DIET_NGUYEN_DAN: { className: 'is-special-void', aura: 'rgba(84, 42, 115, 0.44)' }
    };

    const visualKey = item.specialKey || item.category;
    const visual = visualMap[visualKey] || visualMap.EXP;
    const centerMarkup = (visual.className === 'is-bag' || visual.className === 'is-spirit-bag')
        ? `
            <span class="pill-visual__core pill-visual__core--bag"></span>
            <img src="./assets/images/bag.svg" class="pill-visual__item-icon" alt="">
        `
        : visual.className === 'is-insect-skill'
            ? `
                <span class="pill-visual__core pill-visual__core--book"></span>
                <span class="pill-visual__book-mark"></span>
                <span class="pill-visual__cover-seal pill-visual__cover-seal--insect"></span>
            `
            : visual.className === 'is-sword-art'
                ? `
                    <span class="pill-visual__core pill-visual__core--book"></span>
                    <span class="pill-visual__book-mark"></span>
                    <span class="pill-visual__cover-seal pill-visual__cover-seal--sword"></span>
                `
            : visual.className === 'is-flame-art'
                ? `
                    <span class="pill-visual__core pill-visual__core--flame"></span>
                    <span class="pill-visual__flame-mark"></span>
                `
            : visual.className === 'is-insect-artifact'
                ? `
                    <span class="pill-visual__core pill-visual__core--book"></span>
                    <span class="pill-visual__book-mark"></span>
                `
        : `
            <span class="pill-visual__core"></span>
            <span class="pill-visual__sigil"></span>
        `;

    return `
        <div class="pill-visual ${visual.className}" style="--pill-accent:${qualityConfig.color};--pill-aura:${visual.aura}" aria-hidden="true">
            <span class="pill-visual__backdrop"></span>
            <span class="pill-visual__orbit pill-visual__orbit--outer"></span>
            <span class="pill-visual__orbit pill-visual__orbit--inner"></span>
            <span class="pill-visual__spark pill-visual__spark--1"></span>
            <span class="pill-visual__spark pill-visual__spark--2"></span>
            <span class="pill-visual__spark pill-visual__spark--3"></span>
            ${centerMarkup}
        </div>
    `;
}

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
    inventory: {},
    inventoryCapacity: Math.max(
        parseInt(CONFIG.ITEMS.INVENTORY_BASE_CAPACITY, 10) || 0,
        parseInt(CONFIG.ITEMS.INVENTORY_MIN_SLOTS, 10) || 16
    ),
    spiritStones: getStartingSpiritStoneCounts(),
    playerName: 'Thanh Trúc Kiếm Chủ',
    playerAvatarInitials: 'TT',
    attackMode: 'SWORD',
    selectedInventoryTab: 'items',
    uniquePurchases: {
        DAI_CANH_KIEM_TRAN: false,
        CAN_LAM_BANG_DIEM: false,
        KHU_TRUNG_THUAT: false,
        KY_TRUNG_BANG: false,
        LINH_THU_DAI: false
    },
    cultivationArts: {
        DAI_CANH_KIEM_TRAN: false,
        CAN_LAM_BANG_DIEM: false,
        KHU_TRUNG_THUAT: false
    },
    insectEggs: {},
    tamedInsects: {},
    discoveredInsects: {},
    beastBagCapacity: Math.max(1, parseInt(CONFIG.INSECT?.STARTING_BEAST_BAG_CAPACITY, 10) || 6),
    insectCombat: {
        lastHitAt: 0,
        visuals: []
    },
    moveJoystick: {
        active: false,
        pointerId: null,
        centerX: 0,
        centerY: 0,
        offsetX: 0,
        offsetY: 0,
        maxRadius: 32,
        deadZone: 10,
        aimDistance: 180,
        button: null
    },
    bonusStats: {
        attackPct: 0,
        maxManaFlat: 0,
        speedPct: 0,
        expGainPct: 0,
        manaRegenPct: 0,
        shieldBreakPct: 0,
        dropRatePct: 0
    },
    activeEffects: [],
    breakthroughBonus: 0,
    isReadyToBreak: false, // Thêm biến trạng thái này
    specialAuraMode: null,
    specialAuraExpiresAt: 0,
    temporaryAscensionOrigin: null,
    voidCollapseTimeoutId: null,
    isVoidCollapsed: false,
    combo: 0,
    rage: 0,
    maxRage: CONFIG.ULTIMATE.MAX_RAGE || 100,
    isUltMode: false, // Trạng thái tuyệt kỹ tối thượng
    ultTimeoutId: null,
    ultimatePhase: 'idle',
    ultimatePhaseStartedAt: 0,
    ultimateCoreIndex: -1,

    updateCombo(isReset = false) {
        if (isReset) {
            this.combo = 0;
            this.rage = 0;
        } else {
            this.combo++;
            // Tăng nộ: diệt càng nhanh nộ càng tăng mạnh
            const rageGain = Math.max(0, parseFloat(CONFIG.ULTIMATE.GAIN_PER_KILL) || 0);
            this.rage = Math.min(this.maxRage, this.rage + rageGain); 
        }
        this.renderRageUI();
    },

    renderRageUI() {
        const ultBtn = document.getElementById('btn-ultimate');
        const isUltimateBusy = this.isUltimateBusy();
        const isReady = this.rage >= this.maxRage && !isUltimateBusy;
        const safeMaxRage = Math.max(1, this.maxRage || 1);
        const percent = Math.max(0, Math.min(100, (this.rage / safeMaxRage) * 100));
        const chargeSteps = Math.max(1, parseInt(CONFIG.ULTIMATE.CHARGE_STEPS, 10) || 1);
        const snappedPercent = isUltimateBusy || isReady
            ? 100
            : Math.floor((percent / 100) * chargeSteps) * (100 / chargeSteps);
        const chargePercent = isUltimateBusy ? 100 : snappedPercent;
        const chargeRatio = Math.max(0, Math.min(1, chargePercent / 100));
        if (ultBtn) {
            ultBtn.style.display = 'flex';
            ultBtn.style.setProperty('--ult-charge', `${chargePercent}%`);
            ultBtn.style.setProperty('--ult-charge-ratio', chargeRatio.toFixed(2));
            ultBtn.classList.toggle('ready', isReady);
            ultBtn.classList.toggle('is-active', isUltimateBusy);
            ultBtn.classList.toggle('is-disabled', !isReady && !isUltimateBusy);
        }

        if (ultBtn) {
            if (this.ultimatePhase === 'merging') {
                ultBtn.title = 'Vạn kiếm đang hợp nhất';
            } else if (this.ultimatePhase === 'splitting') {
                ultBtn.title = 'Vạn kiếm đang tách trận';
            } else if (this.isUltMode) {
                ultBtn.title = 'Vạn kiếm hợp nhất đang kích hoạt';
            } else if (isReady) {
                ultBtn.title = `Nộ đầy ${Math.round(this.rage)}/${this.maxRage}`;
            } else {
                ultBtn.title = `Nộ ${Math.round(this.rage)}/${this.maxRage}`;
            }
            ultBtn.setAttribute('aria-label', ultBtn.title);
        }

        if (ProfileUI && typeof ProfileUI.isOpen === 'function' && ProfileUI.isOpen()) {
            ProfileUI.render();
        }
    },

    // Hàm mới để tính tổng % tỉ lệ đột phá từ đan dược
    isUltimateBusy() {
        return this.ultimatePhase !== 'idle';
    },

    getMaxRankIndex() {
        return Math.max(0, CONFIG.CULTIVATION.RANKS.length - 1);
    },

    setSpecialAura(mode, durationMs = null) {
        this.specialAuraMode = mode || null;
        if (!mode) {
            this.specialAuraExpiresAt = 0;
            return;
        }

        this.specialAuraExpiresAt = durationMs == null
            ? Number.POSITIVE_INFINITY
            : performance.now() + Math.max(0, durationMs);
    },

    clearSpecialPillState({ keepAura = false } = {}) {
        if (this.voidCollapseTimeoutId) {
            clearTimeout(this.voidCollapseTimeoutId);
            this.voidCollapseTimeoutId = null;
        }

        this.temporaryAscensionOrigin = null;
        this.isVoidCollapsed = false;

        if (!keepAura) {
            this.setSpecialAura(null);
        }
    },

    ascendToUltimateRank() {
        const maxRankIndex = this.getMaxRankIndex();
        const maxRank = CONFIG.CULTIVATION.RANKS[maxRankIndex];
        if (!maxRank) return null;

        this.rankIndex = maxRankIndex;
        this.exp = maxRank.exp;
        this.isReadyToBreak = false;
        this.breakthroughBonus = 0;
        this.syncDerivedStats();
        this.mana = this.maxMana;
        this.renderManaUI();
        this.renderExpUI();
        return maxRank;
    },

    applyChungCucDaoNguyenDan(item, qualityConfig) {
        this.clearSpecialPillState();
        const maxRank = this.ascendToUltimateRank();
        if (!maxRank) return false;

        this.setSpecialAura(qualityConfig.auraMode || 'rainbow');
        showNotify(`Dùng ${this.getItemDisplayName(item)}: trực tiếp bước vào ${maxRank.name}`, qualityConfig.color);
        return true;
    },

    enterVoidCollapse() {
        if (this.voidCollapseTimeoutId) {
            clearTimeout(this.voidCollapseTimeoutId);
            this.voidCollapseTimeoutId = null;
        }

        if (this.ultTimeoutId) {
            clearTimeout(this.ultTimeoutId);
            this.ultTimeoutId = null;
        }

        const origin = this.temporaryAscensionOrigin;
        if (origin) {
            this.rankIndex = origin.rankIndex;
            this.exp = origin.exp;
            this.isReadyToBreak = origin.isReadyToBreak;
            this.breakthroughBonus = origin.breakthroughBonus;
        }

        this.temporaryAscensionOrigin = null;
        this.isVoidCollapsed = true;
        this.isAttacking = false;
        this.stopMoveJoystick();
        this.activeEffects = [];
        this.isUltMode = false;
        this.ultimatePhase = 'idle';
        this.ultimatePhaseStartedAt = 0;
        this.ultimateCoreIndex = -1;
        this.rage = 0;
        this.mana = 0;
        this.setSpecialAura('void');
        this.syncDerivedStats();
        this.refreshResourceUI();
        this.renderManaUI();
        this.renderRageUI();
        showNotify('Tẫn Đạo Diệt Nguyên Đan phản phệ: thân thể tan vào hư vô, cần reload web để hồi phục', '#a778ff');
    },

    applyTanDaoDietNguyenDan(item, qualityConfig) {
        this.clearSpecialPillState();
        this.temporaryAscensionOrigin = {
            rankIndex: this.rankIndex,
            exp: this.exp,
            isReadyToBreak: this.isReadyToBreak,
            breakthroughBonus: this.breakthroughBonus
        };

        const maxRank = this.ascendToUltimateRank();
        if (!maxRank) return false;

        this.setSpecialAura(qualityConfig.auraMode || 'void', qualityConfig.durationMs || 1000);
        showNotify(`Dùng ${this.getItemDisplayName(item)}: cưỡng mở ${maxRank.name} trong ${Math.max(1, Math.round((qualityConfig.durationMs || 1000) / 1000))} giây`, qualityConfig.color);

        this.voidCollapseTimeoutId = setTimeout(() => {
            this.enterVoidCollapse();
        }, qualityConfig.durationMs || 1000);

        return true;
    },

    getUltimateTransitionDuration() {
        return Math.max(100, parseInt(CONFIG.ULTIMATE.TRANSITION_MS, 10) || 100);
    },

    getUltimateTransitionProgress() {
        if (this.ultimatePhase !== 'merging' && this.ultimatePhase !== 'splitting') {
            return this.isUltMode ? 1 : 0;
        }

        const elapsed = performance.now() - this.ultimatePhaseStartedAt;
        return Math.max(0, Math.min(1, elapsed / this.getUltimateTransitionDuration()));
    },

    getUltimateTransitionEase() {
        const t = this.getUltimateTransitionProgress();
        return (t < 0.5)
            ? 2 * t * t
            : 1 - Math.pow(-2 * t + 2, 2) / 2;
    },

    startUltimate() {
        if (this.isVoidCollapsed) {
            showNotify('Thân thể đã tan vào hư vô, hãy reload web để hồi phục', '#a778ff');
            return false;
        }

        if (this.isUltimateBusy() || this.rage < this.maxRage) return false;

        if (this.ultTimeoutId) {
            clearTimeout(this.ultTimeoutId);
            this.ultTimeoutId = null;
        }

        const coreIndex = swords.findIndex(sword => !sword.isDead);
        if (coreIndex === -1) return false;

        this.ultimateCoreIndex = coreIndex;
        this.ultimatePhase = 'merging';
        this.ultimatePhaseStartedAt = performance.now();
        this.isUltMode = false;
        this.rage = 0;

        swords.forEach(sword => {
            if (!sword.isDead) {
                sword.isStunned = false;
                sword.stunTimer = 0;
                sword.trail = [];
                sword.attackFrame = 0;
            }
        });

        showNotify("VẠN KIẾM QUY TÔNG!", "#00ffff");
        this.renderRageUI();
        return true;
    },

    startUltimateSplit() {
        if (this.ultTimeoutId) {
            clearTimeout(this.ultTimeoutId);
            this.ultTimeoutId = null;
        }

        this.isUltMode = false;
        this.ultimatePhase = 'splitting';
        this.ultimatePhaseStartedAt = performance.now();
        this.renderRageUI();
    },

    updateUltimateState() {
        if (this.ultimatePhase !== 'merging' && this.ultimatePhase !== 'splitting') return;
        if (this.getUltimateTransitionProgress() < 1) return;

        if (this.ultimatePhase === 'merging') {
            this.ultimatePhase = 'active';
            this.ultimatePhaseStartedAt = performance.now();
            this.isUltMode = true;
            this.renderRageUI();

            this.ultTimeoutId = setTimeout(() => {
                this.startUltimateSplit();
            }, CONFIG.ULTIMATE.DURATION_MS || 10000);
            return;
        }

        this.ultimatePhase = 'idle';
        this.ultimatePhaseStartedAt = 0;
        this.ultimateCoreIndex = -1;
        this.renderRageUI();
    },

    calculateTotalPillBoost() {
        const cfg = CONFIG.PILL.TYPES;
        // Tính tổng: (Số lượng x % cộng thêm) của từng loại
        const boost = (this.pills.LOW * cfg.LOW.boost) +
            (this.pills.MEDIUM * cfg.MEDIUM.boost) +
            (this.pills.HIGH * cfg.HIGH.boost);
        return boost;
    },

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
        if (this.isVoidCollapsed) return;

        const now = performance.now();
        const elapsed = now - this.lastManaRegenTick;

        if (elapsed >= CONFIG.MANA.REGEN_INTERVAL_MS) {
            // Tính toán số mana hồi dựa trên giây (hoặc chu kỳ MS)
            const ticks = Math.floor(elapsed / CONFIG.MANA.REGEN_INTERVAL_MS);

            if (ticks > 0) {
                // Sử dụng REGEN_PER_SEC thay vì REGEN_PER_MIN
                this.updateMana(ticks * CONFIG.MANA.REGEN_PER_SEC * this.getManaRegenMultiplier());
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
            text.innerText = `Linh lực: ${Math.round(this.mana)}/${this.maxMana}`;

            // Logic đổi màu khi mana thấp (đã khai báo trong SCSS)
            if (percentage < 20) {
                bar.classList.add('low-mana');
            } else {
                bar.classList.remove('low-mana');
            }
        }

        if (ProfileUI && typeof ProfileUI.isOpen === 'function' && ProfileUI.isOpen()) {
            ProfileUI.render();
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
        const currentRank = CONFIG.CULTIVATION.RANKS[this.rankIndex];
        if (!currentRank) return;

        // NGƯỠNG TRÀN: Ví dụ 120% của 5 exp là 6 exp
        const overflowLimit = currentRank.exp * (CONFIG.CULTIVATION.OVERFLOW_LIMIT || 1.2);

        if (!this.isReadyToBreak) {
            // Giai đoạn tích lũy bình thường
            this.exp += amount;
            
            // Chỉ khi EXP vượt ngưỡng mới xử lý thăng cấp/chờ đột phá
            if (this.exp >= currentRank.exp) {
                this.exp = currentRank.exp; // Chốt chặn để không vượt quá mức 100% khi chưa đột phá
                this.isReadyToBreak = true;
                showNotify("Linh khí tràn đầy, sẵn sàng đột phá!", "#00ffcc");
            }
        } else {
            // Giai đoạn đã đầy nhưng chưa đột phá (Tu vi tràn ra ngoài)
            if (this.exp < overflowLimit) {
                // Khi đã đầy, hấp thụ linh khí khó hơn (chỉ nhận 20% lượng exp từ quái)
                this.exp += amount * 0.2; 

                if (this.exp >= overflowLimit) {
                    this.exp = overflowLimit;
                    // Chỉ thông báo một lần duy nhất hoặc dùng setTimeout tránh lag
                    if(!this.forcedBreaking) { 
                        this.forcedBreaking = true;
                        showNotify("Linh lực quá tải, thiên đạo cưỡng ép đột phá!", "#ff4444");
                        setTimeout(() => {
                            this.executeBreakthrough(true);
                            this.forcedBreaking = false;
                        }, 1000);
                    }
                }
            }
        }
        this.renderExpUI(); // Cập nhật giao diện
    },
    
    checkLevelUp() {
        const currentRank = CONFIG.CULTIVATION.RANKS[this.rankIndex];
        if (!currentRank) return;

        if (this.exp >= currentRank.exp && !this.isReadyToBreak) {
            this.isReadyToBreak = true;
            showNotify("Linh khí tràn đầy, sẵn sàng đột phá!", "#00ffcc");
            // Không tự động đột phá nữa, chỉ bật cờ isReadyToBreak
        }
    },

    _useInventoryItemLegacyPhase1(itemKey) {
        const item = this.inventory[itemKey];
        if (!item || item.count <= 0) return false;

        if (this.isVoidCollapsed) {
            showNotify('Thân thể đã tan vào hư vô, cần reload web để hồi phục', '#a778ff');
            return false;
        }

        const qualityConfig = this.getItemQualityConfig(item);

        if (item.category === 'INSECT_ARTIFACT') {
            if (InsectBookUI && typeof InsectBookUI.open === 'function') {
                InsectBookUI.open();
                showNotify(`Mở ${this.getItemDisplayName(item)}`, qualityConfig.color || '#ffd871');
                return true;
            }
            return false;
        }

        if (item.category === 'SWORD_ART' && this.hasDaiCanhKiemTranUnlocked()) {
            showNotify(`${this.getItemDisplayName(item)} đã nhập tâm, không thể lĩnh ngộ thêm.`, qualityConfig.color || '#8fffe0');
            return false;
        }

        if (item.category === 'FLAME_ART' && this.hasCanLamBangDiemUnlocked()) {
            showNotify(`${this.getItemDisplayName(item)} đã được luyện hóa vào thần thức.`, qualityConfig.color || '#79d9ff');
            return false;
        }

        if (item.category === 'INSECT_SKILL' && this.hasKhuTrungThuatUnlocked()) {
            showNotify(`${this.getItemDisplayName(item)} đã lĩnh ngộ xong, không thể lĩnh ngộ thêm.`, qualityConfig.color || '#79ffd4');
            return false;
        }

        if (item.category === 'BREAKTHROUGH' && !this.isInventoryItemUsable(item)) {
            showNotify(`Đan này chỉ hợp để đột phá ${item.realmName}`, '#ffd36b');
            return false;
        }

        item.count--;
        if (item.count <= 0) delete this.inventory[itemKey];

        if (item.category === 'EXP') {
            const rank = this.getCurrentRank();
            if (!rank) return false;

            const expGain = Math.max(1, Math.round(rank.exp * qualityConfig.expFactor * this.getExpGainMultiplier()));
            this.updateExp(expGain);
            showNotify(`Dùng ${this.getItemDisplayName(item)}: +${formatNumber(expGain)} tu vi`, qualityConfig.color);
            this.refreshResourceUI();
            return true;
        }

        if (item.category === 'BREAKTHROUGH') {
            const rank = this.getCurrentRank();
            if (!rank) return false;

            const maxAllowed = CONFIG.CULTIVATION.MAX_BREAKTHROUGH_CHANCE || 0.99;
            const currentTotal = Math.min(maxAllowed, rank.chance + this.breakthroughBonus);
            const maxBonus = Math.max(0, maxAllowed - rank.chance);
            const nextBonus = Math.min(maxBonus, this.breakthroughBonus + qualityConfig.breakthroughBoost);
            const appliedBoost = Math.min(maxAllowed, rank.chance + nextBonus) - currentTotal;

            if (appliedBoost <= 0) {
                this.addInventoryItem(item, 1);
                showNotify('Dược lực đã chạm giới hạn đột phá', '#ffd36b');
                return false;
            }

            this.breakthroughBonus = nextBonus;
            showNotify(`Dùng ${this.getItemDisplayName(item)}: +${Math.round(appliedBoost * 100)}% tỉ lệ đột phá`, qualityConfig.color);
            this.refreshResourceUI();
            return true;
        }

        switch (item.category) {
            case 'SWORD_ART':
                this.unlockCultivationArt('DAI_CANH_KIEM_TRAN');
                syncSwordFormation();
                showNotify(`Lĩnh ngộ ${this.getItemDisplayName(item)}: kiếm trận đã triển khai ${formatNumber(this.getUnlockedSwordTargetCount())} kiếm.`, qualityConfig.color);
                this.refreshResourceUI();
                return true;
            case 'FLAME_ART':
                this.unlockCultivationArt('CAN_LAM_BANG_DIEM');
                showNotify(`Luyện hóa ${this.getItemDisplayName(item)}: lam diễm đã hiện nơi đầu niệm.`, qualityConfig.color);
                this.refreshResourceUI();
                return true;
            case 'INSECT_SKILL':
                this.unlockCultivationArt('KHU_TRUNG_THUAT');
                this.renderAttackModeUI();
                showNotify(`Lĩnh ngộ ${this.getItemDisplayName(item)}: có thể dùng linh trùng làm công sát mới.`, qualityConfig.color);
                this.refreshResourceUI();
                return true;
            case 'INSIGHT':
                this.bonusStats.expGainPct += qualityConfig.expGainPct || 0;
                showNotify(`Dùng ${this.getItemDisplayName(item)}: +${Math.round((qualityConfig.expGainPct || 0) * 100)}% tu vi thu hoạch`, qualityConfig.color);
                break;
            case 'ATTACK':
                this.bonusStats.attackPct += qualityConfig.attackPct || 0;
                showNotify(`Dùng ${this.getItemDisplayName(item)}: +${Math.round((qualityConfig.attackPct || 0) * 100)}% công kích`, qualityConfig.color);
                break;
            case 'SHIELD_BREAK':
                this.bonusStats.shieldBreakPct += qualityConfig.shieldBreakPct || 0;
                showNotify(`Dùng ${this.getItemDisplayName(item)}: +${Math.round((qualityConfig.shieldBreakPct || 0) * 100)}% phá khiên`, qualityConfig.color);
                break;
            case 'BERSERK':
                this.consumeBerserkPill(item, qualityConfig);
                break;
            case 'RAGE':
                this.addRage(qualityConfig.rageGain || 0);
                showNotify(`Dùng ${this.getItemDisplayName(item)}: +${Math.round(qualityConfig.rageGain || 0)} nộ`, qualityConfig.color);
                break;
            case 'MANA':
                this.updateMana(qualityConfig.manaRestore || 0);
                showNotify(`Dùng ${this.getItemDisplayName(item)}: hồi ${Math.round(qualityConfig.manaRestore || 0)} linh lực`, qualityConfig.color);
                break;
            case 'MAX_MANA':
                this.bonusStats.maxManaFlat += qualityConfig.maxManaFlat || 0;
                this.syncDerivedStats();
                this.updateMana(qualityConfig.maxManaFlat || 0);
                showNotify(`Dùng ${this.getItemDisplayName(item)}: +${Math.round(qualityConfig.maxManaFlat || 0)} giới hạn linh lực`, qualityConfig.color);
                break;
            case 'REGEN':
                this.bonusStats.manaRegenPct += qualityConfig.manaRegenPct || 0;
                showNotify(`Dùng ${this.getItemDisplayName(item)}: +${Math.round((qualityConfig.manaRegenPct || 0) * 100)}% hồi linh`, qualityConfig.color);
                break;
            case 'SPEED':
                this.bonusStats.speedPct += qualityConfig.speedPct || 0;
                showNotify(`Dùng ${this.getItemDisplayName(item)}: +${Math.round((qualityConfig.speedPct || 0) * 100)}% tốc độ`, qualityConfig.color);
                break;
            case 'FORTUNE':
                this.bonusStats.dropRatePct += qualityConfig.dropRatePct || 0;
                showNotify(`Dùng ${this.getItemDisplayName(item)}: +${Math.round((qualityConfig.dropRatePct || 0) * 100)}% vận khí`, qualityConfig.color);
                break;
            case 'SPECIAL':
                if (item.specialKey === 'CHUNG_CUC_DAO_NGUYEN_DAN') {
                    if (!this.applyChungCucDaoNguyenDan(item, qualityConfig)) {
                        this.addInventoryItem(item, 1);
                        return false;
                    }
                } else if (item.specialKey === 'TAN_DAO_DIET_NGUYEN_DAN') {
                    if (!this.applyTanDaoDietNguyenDan(item, qualityConfig)) {
                        this.addInventoryItem(item, 1);
                        return false;
                    }
                } else {
                    this.addInventoryItem(item, 1);
                    return false;
                }
                break;
            default:
                this.addInventoryItem(item, 1);
                return false;
        }

        this.refreshResourceUI();
        return true;
    },

    _useInventoryItemLegacyPhase2(itemKey) {
        const item = this.inventory[itemKey];
        if (!item || item.count <= 0) return false;

        if (this.isVoidCollapsed) {
            showNotify('Thân thể đã tan vào hư vô, cần reload web để hồi phục', '#a778ff');
            return false;
        }

        const qualityConfig = this.getItemQualityConfig(item);

        if (item.category === 'INSECT_ARTIFACT') {
            if (InsectBookUI && typeof InsectBookUI.open === 'function') {
                InsectBookUI.open();
                showNotify(`Mở ${this.getItemDisplayName(item)}`, qualityConfig.color || '#ffd871');
                return true;
            }
            return false;
        }

        if (item.category === 'SWORD_ART' && this.hasDaiCanhKiemTranUnlocked()) {
            showNotify(`${this.getItemDisplayName(item)} đã nhập tâm, không thể lĩnh ngộ thêm.`, qualityConfig.color || '#8fffe0');
            return false;
        }

        if (item.category === 'FLAME_ART' && this.hasCanLamBangDiemUnlocked()) {
            showNotify(`${this.getItemDisplayName(item)} đã được luyện hóa vào thần thức.`, qualityConfig.color || '#79d9ff');
            return false;
        }

        if (item.category === 'BREAKTHROUGH' && !this.isInventoryItemUsable(item)) {
            showNotify(`Đan này chỉ hợp để đột phá ${item.realmName}`, '#ffd36b');
            return false;
        }

        item.count--;
        if (item.count <= 0) delete this.inventory[itemKey];

        if (item.category === 'EXP') {
            const rank = this.getCurrentRank();
            if (!rank) return false;

            const expGain = Math.max(1, Math.round(rank.exp * qualityConfig.expFactor * this.getExpGainMultiplier()));
            this.updateExp(expGain);
            showNotify(`Dùng ${this.getItemDisplayName(item)}: +${formatNumber(expGain)} tu vi`, qualityConfig.color);
            this.refreshResourceUI();
            return true;
        }

        if (item.category === 'BREAKTHROUGH') {
            const rank = this.getCurrentRank();
            if (!rank) return false;

            const maxAllowed = CONFIG.CULTIVATION.MAX_BREAKTHROUGH_CHANCE || 0.99;
            const currentTotal = Math.min(maxAllowed, rank.chance + this.breakthroughBonus);
            const maxBonus = Math.max(0, maxAllowed - rank.chance);
            const nextBonus = Math.min(maxBonus, this.breakthroughBonus + qualityConfig.breakthroughBoost);
            const appliedBoost = Math.min(maxAllowed, rank.chance + nextBonus) - currentTotal;

            if (appliedBoost <= 0) {
                this.addInventoryItem(item, 1);
                showNotify('Dược lực đã chạm giới hạn đột phá', '#ffd36b');
                return false;
            }

            this.breakthroughBonus = nextBonus;
            showNotify(`Dùng ${this.getItemDisplayName(item)}: +${Math.round(appliedBoost * 100)}% tỉ lệ đột phá`, qualityConfig.color);
            this.refreshResourceUI();
            return true;
        }

        switch (item.category) {
            case 'SWORD_ART':
                this.unlockCultivationArt('DAI_CANH_KIEM_TRAN');
                syncSwordFormation();
                showNotify(`Lĩnh ngộ ${this.getItemDisplayName(item)}: kiếm trận đã triển khai ${formatNumber(this.getUnlockedSwordTargetCount())} kiếm.`, qualityConfig.color);
                this.refreshResourceUI();
                return true;
            case 'FLAME_ART':
                this.unlockCultivationArt('CAN_LAM_BANG_DIEM');
                showNotify(`Luyện hóa ${this.getItemDisplayName(item)}: lam diễm đã hiện nơi đầu niệm.`, qualityConfig.color);
                this.refreshResourceUI();
                return true;
            case 'INSIGHT':
                this.bonusStats.expGainPct += qualityConfig.expGainPct || 0;
                showNotify(`Dùng ${this.getItemDisplayName(item)}: +${Math.round((qualityConfig.expGainPct || 0) * 100)}% tu vi thu hoạch`, qualityConfig.color);
                break;
            case 'ATTACK':
                this.bonusStats.attackPct += qualityConfig.attackPct || 0;
                showNotify(`Dùng ${this.getItemDisplayName(item)}: +${Math.round((qualityConfig.attackPct || 0) * 100)}% công kích`, qualityConfig.color);
                break;
            case 'SHIELD_BREAK':
                this.bonusStats.shieldBreakPct += qualityConfig.shieldBreakPct || 0;
                showNotify(`Dùng ${this.getItemDisplayName(item)}: +${Math.round((qualityConfig.shieldBreakPct || 0) * 100)}% phá khiên`, qualityConfig.color);
                break;
            case 'BERSERK':
                this.consumeBerserkPill(item, qualityConfig);
                break;
            case 'RAGE':
                this.addRage(qualityConfig.rageGain || 0);
                showNotify(`Dùng ${this.getItemDisplayName(item)}: +${Math.round(qualityConfig.rageGain || 0)} nộ`, qualityConfig.color);
                break;
            case 'MANA':
                this.updateMana(qualityConfig.manaRestore || 0);
                showNotify(`Dùng ${this.getItemDisplayName(item)}: hồi ${Math.round(qualityConfig.manaRestore || 0)} linh lực`, qualityConfig.color);
                break;
            case 'MAX_MANA':
                this.bonusStats.maxManaFlat += qualityConfig.maxManaFlat || 0;
                this.syncDerivedStats();
                this.updateMana(qualityConfig.maxManaFlat || 0);
                showNotify(`Dùng ${this.getItemDisplayName(item)}: +${Math.round(qualityConfig.maxManaFlat || 0)} giới hạn linh lực`, qualityConfig.color);
                break;
            case 'REGEN':
                this.bonusStats.manaRegenPct += qualityConfig.manaRegenPct || 0;
                showNotify(`Dùng ${this.getItemDisplayName(item)}: +${Math.round((qualityConfig.manaRegenPct || 0) * 100)}% hồi linh`, qualityConfig.color);
                break;
            case 'SPEED':
                this.bonusStats.speedPct += qualityConfig.speedPct || 0;
                showNotify(`Dùng ${this.getItemDisplayName(item)}: +${Math.round((qualityConfig.speedPct || 0) * 100)}% tốc độ`, qualityConfig.color);
                break;
            case 'FORTUNE':
                this.bonusStats.dropRatePct += qualityConfig.dropRatePct || 0;
                showNotify(`Dùng ${this.getItemDisplayName(item)}: +${Math.round((qualityConfig.dropRatePct || 0) * 100)}% vận khí`, qualityConfig.color);
                break;
            case 'SPECIAL':
                if (item.specialKey === 'CHUNG_CUC_DAO_NGUYEN_DAN') {
                    if (!this.applyChungCucDaoNguyenDan(item, qualityConfig)) {
                        this.addInventoryItem(item, 1);
                        return false;
                    }
                } else if (item.specialKey === 'TAN_DAO_DIET_NGUYEN_DAN') {
                    if (!this.applyTanDaoDietNguyenDan(item, qualityConfig)) {
                        this.addInventoryItem(item, 1);
                        return false;
                    }
                } else {
                    this.addInventoryItem(item, 1);
                    return false;
                }
                break;
            default:
                this.addInventoryItem(item, 1);
                return false;
        }

        this.refreshResourceUI();
        return true;
    },

    executeBreakthrough(isForced = false) {
        const currentRank = CONFIG.CULTIVATION.RANKS[this.rankIndex];
        if (!currentRank) return;

        // 1. Tính tổng tỉ lệ
        const pillBoost = this.calculateTotalPillBoost();
        let totalChance = currentRank.chance + pillBoost;

        const maxAllowed = CONFIG.CULTIVATION.MAX_BREAKTHROUGH_CHANCE || 0.95;
        totalChance = Math.min(maxAllowed, totalChance);

        if (Math.random() <= totalChance) {
            // --- THÀNH CÔNG ---
            this.exp = 0;
            this.rankIndex++;
            this.isReadyToBreak = false;

            this.pills = { LOW: 0, MEDIUM: 0, HIGH: 0 };

            const nextRank = CONFIG.CULTIVATION.RANKS[this.rankIndex];
            if (nextRank) {
                if (nextRank.maxMana) this.maxMana = nextRank.maxMana;
                
                // --- LOGIC THAY ĐỔI Ở ĐÂY ---
                if (isForced) {
                    // Nếu bị cưỡng ép: Không hồi mana (giữ nguyên lượng mana hiện tại)
                    showNotify(`CƯỠNG ÉP ĐỘT PHÁ THÀNH CÔNG: ${nextRank.name.toUpperCase()}`, "#ff8800");
                } else {
                    // Nếu chủ động: Hồi đầy mana
                    this.mana = this.maxMana; 
                    showNotify(`ĐỘT PHÁ THÀNH CÔNG: ${nextRank.name.toUpperCase()}`, "#ffcc00");
                }
            }
            this.createLevelUpExplosion(this.x, this.y, nextRank?.color || currentRank.color);
        } else {
            // --- THẤT BẠI ---
            const penaltyFactor = CONFIG.CULTIVATION.BREAKTHROUGH_PENALTY_FACTOR; // Ví dụ: 0.4
            const penalty = Math.floor(this.exp * penaltyFactor);

            this.exp -= penalty;
            this.isReadyToBreak = false;

            // 2. Tính toán con số hiển thị (0.4 -> 40)
            const penaltyPercent = Math.round(penaltyFactor * 100);

            this.pills.LOW = Math.floor(this.pills.LOW / 2);
            this.pills.MEDIUM = Math.floor(this.pills.MEDIUM / 2);
            this.pills.HIGH = Math.floor(this.pills.HIGH / 2);

            // 3. Sử dụng Template Literals (dấu huyền ` `) để đưa biến vào chuỗi
            showNotify(`ĐỘT PHÁ THẤT BẠI! Tâm ma phản phệ (-${penaltyPercent}% tu vi)`, "#ff4444");

            this.triggerExpError();
        }

        this.renderExpUI();
        this.renderManaUI();
    },

    renderExpUI() {
        const rank = CONFIG.CULTIVATION.RANKS[this.rankIndex];
        if (!rank) return;

        if (rank.maxMana) this.maxMana = rank.maxMana;

        const barExp = document.getElementById('exp-bar');
        const textExp = document.getElementById('exp-text');
        const rankText = document.getElementById('cultivation-rank');
        const breakthroughGroup = document.querySelector('.breakthrough-group');

        // 1. Tính toán tỉ lệ hiển thị dựa trên 3 loại đan
        const pillBoost = this.calculateTotalPillBoost();
        const maxAllowed = CONFIG.CULTIVATION.MAX_BREAKTHROUGH_CHANCE || 0.99;
        const totalChance = Math.min(maxAllowed, rank.chance + pillBoost);

        const totalPercent = (totalChance * 100).toFixed(0);

        // Tổng số lượng đan dược để hiển thị
        const totalPills = this.pills.LOW + this.pills.MEDIUM + this.pills.HIGH;

        // 2. Cập nhật văn bản giao diện
        if (textExp) {
            let statusText = this.isReadyToBreak ?
                `<span style="color:#ffcc00; font-weight:bold;">SẴN SÀNG ĐỘT PHÁ</span>` :
                `Tu vi: ${Math.floor(this.exp)}/${rank.exp}`;

            textExp.innerHTML = `${statusText} | ` +
                `<span style="color:#00ffcc">Linh Đan: ${totalPills}</span> ` +
                `(<span style="color:#ffcc00">TL: ${totalPercent}%</span>)`;
        }

        // 3. Ẩn/Hiện nút đột phá
        if (breakthroughGroup) {
            if (this.isReadyToBreak && !this.isVoidCollapsed) breakthroughGroup.classList.add('is-active');
            else breakthroughGroup.classList.remove('is-active');
        }

        // 4. Cập nhật thanh EXP (màu sắc và hiệu ứng)
        const percentage = (this.exp / rank.exp) * 100;
        if (barExp) {
            barExp.style.width = Math.min(100, percentage) + '%';
            barExp.style.background = `linear-gradient(90deg, ${rank.lightColor}, ${rank.color})`;

            if (this.isReadyToBreak) {
                barExp.style.boxShadow = `0 0 15px #fff, 0 0 5px ${rank.color}`;
                barExp.classList.add('exp-full-glow');
            } else {
                barExp.style.boxShadow = `0 0 10px ${rank.lightColor}`;
                barExp.classList.remove('exp-full-glow');
            }
        }

        if (rankText) {
            rankText.innerText = `Cảnh giới: ${rank.name}`;
            rankText.style.color = rank.color;
        }
    },

    calculateTotalPillBoost() {
        return this.breakthroughBonus;
    },

    getCurrentRank() {
        return CONFIG.CULTIVATION.RANKS[this.rankIndex] || null;
    },

    getPlayerDisplayName() {
        return this.playerName || 'Thanh Trúc Kiếm Chủ';
    },

    getPlayerMonogram() {
        const custom = String(this.playerAvatarInitials || '').trim().slice(0, 2).toUpperCase();
        if (custom) return custom;

        const initials = this.getPlayerDisplayName()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(word => word.charAt(0).toUpperCase())
            .join('');

        return initials || 'TT';
    },

    getCurrentMajorRealmInfo() {
        const rank = this.getCurrentRank();
        if (!rank) return null;

        return CONFIG.CULTIVATION.MAJOR_REALMS.find(realm =>
            rank.id >= realm.startId && rank.id <= realm.endId
        ) || null;
    },

    getNextMajorRealmInfo() {
        const currentRealm = this.getCurrentMajorRealmInfo();
        if (!currentRealm || !currentRealm.nextKey || !currentRealm.nextName) return null;

        return {
            key: currentRealm.nextKey,
            name: currentRealm.nextName
        };
    },

    getCurrentBreakthroughChance() {
        const rank = this.getCurrentRank();
        if (!rank) return 0;

        const maxAllowed = CONFIG.CULTIVATION.MAX_BREAKTHROUGH_CHANCE || 0.99;
        return Math.max(0, Math.min(maxAllowed, rank.chance + this.calculateTotalPillBoost()));
    },

    getEffectiveAttackDamage() {
        const rank = this.getCurrentRank();
        const baseDamage = rank?.damage || 0;
        return Math.max(1, Math.ceil(baseDamage * this.getAttackMultiplier()));
    },

    getAliveSwordStats() {
        const total = Array.isArray(swords) ? swords.length : 0;
        const alive = Array.isArray(swords) ? swords.filter(sword => !sword.isDead).length : 0;

        return {
            alive,
            total,
            broken: Math.max(0, total - alive)
        };
    },

    getInventoryCapacity() {
        const baseCapacity = Math.max(
            parseInt(CONFIG.ITEMS.INVENTORY_BASE_CAPACITY, 10) || 0,
            parseInt(CONFIG.ITEMS.INVENTORY_MIN_SLOTS, 10) || 16
        );

        return Math.max(baseCapacity, Math.floor(this.inventoryCapacity || 0));
    },

    hasInventorySpaceForSpec(spec) {
        const itemKey = this.buildInventoryKey(spec);
        const existingItem = this.inventory[itemKey];

        if (existingItem && existingItem.count > 0) {
            return true;
        }

        return this.getInventoryEntries().length < this.getInventoryCapacity();
    },

    canUpgradeInventoryCapacity(item) {
        if (!item || item.category !== 'BAG') return false;

        const qualityConfig = this.getItemQualityConfig(item);
        return Math.floor(qualityConfig.capacity || 0) > this.getInventoryCapacity();
    },

    upgradeInventoryCapacity(nextCapacity) {
        const safeCapacity = Math.max(this.getInventoryCapacity(), Math.floor(nextCapacity || 0));
        if (safeCapacity <= this.getInventoryCapacity()) return false;

        this.inventoryCapacity = safeCapacity;
        return true;
    },

    getInventorySummary() {
        const entries = this.getInventoryEntries();
        const categories = entries.reduce((summary, item) => {
            summary[item.category] = (summary[item.category] || 0) + item.count;
            return summary;
        }, {});
        const uniqueCount = entries.length;
        const capacity = this.getInventoryCapacity();

        return {
            entries,
            totalCount: entries.reduce((total, item) => total + item.count, 0),
            uniqueCount,
            categories,
            capacity,
            freeSlots: Math.max(0, capacity - uniqueCount),
            usageRatio: capacity > 0 ? (uniqueCount / capacity) : 0
        };
    },

    getActiveEffectModifiers() {
        return this.activeEffects.reduce((acc, effect) => {
            acc.attackPct += effect.attackPct || 0;
            acc.speedPct += effect.speedPct || 0;
            acc.maxManaFlat += effect.maxManaFlat || 0;
            return acc;
        }, { attackPct: 0, speedPct: 0, maxManaFlat: 0 });
    },

    syncDerivedStats() {
        const rank = this.getCurrentRank();
        const baseMaxMana = rank?.maxMana || CONFIG.MANA.MAX || 100;
        const active = this.getActiveEffectModifiers();
        const prevMaxMana = this.maxMana;
        const prevMana = this.mana;
        const nextMaxMana = Math.max(1, Math.round(baseMaxMana + this.bonusStats.maxManaFlat + active.maxManaFlat));

        this.maxMana = nextMaxMana;
        this.mana = Math.max(0, Math.min(this.mana, this.maxMana));

        if ((prevMaxMana !== this.maxMana || prevMana !== this.mana) && typeof document !== 'undefined') {
            this.renderManaUI();
        }
    },

    updateActiveEffects() {
        if (!this.activeEffects.length) {
            this.syncDerivedStats();
            return;
        }

        const now = performance.now();
        const expired = [];
        this.activeEffects = this.activeEffects.filter(effect => {
            const isAlive = effect.expiresAt > now;
            if (!isAlive) expired.push(effect);
            return isAlive;
        });

        this.syncDerivedStats();

        expired.forEach(effect => {
            showNotify(`${effect.name} đã tan hết dược lực`, effect.endColor || "#ffd36b");
        });
    },

    getExpGainMultiplier() {
        if (this.isVoidCollapsed) return 0;
        return Math.max(0, 1 + this.bonusStats.expGainPct);
    },

    getManaRegenMultiplier() {
        if (this.isVoidCollapsed) return 0;
        return Math.max(0, 1 + this.bonusStats.manaRegenPct);
    },

    getShieldBreakMultiplier() {
        if (this.isVoidCollapsed) return 0;
        return Math.max(0, 1 + this.bonusStats.shieldBreakPct);
    },

    getDropRateMultiplier() {
        return Math.max(0, 1 + this.bonusStats.dropRatePct);
    },

    getAttackMultiplier() {
        if (this.isVoidCollapsed) return 0;
        const active = this.getActiveEffectModifiers();
        return Math.max(0.2, 1 + this.bonusStats.attackPct + active.attackPct);
    },

    getSpeedMultiplier() {
        if (this.isVoidCollapsed) return 0;
        const active = this.getActiveEffectModifiers();
        return Math.max(0.35, 1 + this.bonusStats.speedPct + active.speedPct);
    },

    updateMoveJoystickVisual() {
        const button = this.moveJoystick.button || document.getElementById('btn-move');
        if (!button) return;

        const distance = Math.hypot(this.moveJoystick.offsetX, this.moveJoystick.offsetY);
        const maxRadius = Math.max(1, this.moveJoystick.maxRadius || 1);
        const dragRatio = Math.max(0, Math.min(1, distance / maxRadius));

        button.style.setProperty('--move-stick-x', `${this.moveJoystick.offsetX}px`);
        button.style.setProperty('--move-stick-y', `${this.moveJoystick.offsetY}px`);
        button.style.setProperty('--move-drag-ratio', dragRatio.toFixed(3));
        button.classList.toggle('is-joystick-active', this.moveJoystick.active);
    },

    startMoveJoystick(pointerId, button, clientX, clientY) {
        if (!this.isTouchDevice || !button) return false;

        const rect = button.getBoundingClientRect();
        this.moveJoystick.active = true;
        this.moveJoystick.pointerId = pointerId;
        this.moveJoystick.centerX = rect.left + (rect.width / 2);
        this.moveJoystick.centerY = rect.top + (rect.height / 2);
        this.moveJoystick.maxRadius = Math.max(28, rect.width * 0.34);
        this.moveJoystick.button = button;

        this.updateMoveJoystick(clientX, clientY);
        return true;
    },

    updateMoveJoystick(clientX, clientY) {
        if (!this.moveJoystick.active) return;

        let offsetX = clientX - this.moveJoystick.centerX;
        let offsetY = clientY - this.moveJoystick.centerY;
        const distance = Math.hypot(offsetX, offsetY);
        const maxRadius = Math.max(1, this.moveJoystick.maxRadius || 1);

        if (distance > maxRadius) {
            const clampRatio = maxRadius / distance;
            offsetX *= clampRatio;
            offsetY *= clampRatio;
        }

        this.moveJoystick.offsetX = offsetX;
        this.moveJoystick.offsetY = offsetY;
        this.updateMoveJoystickVisual();
    },

    stopMoveJoystick(pointerId = null) {
        if (!this.moveJoystick.active) return;
        if (pointerId !== null && this.moveJoystick.pointerId !== pointerId) return;

        this.moveJoystick.active = false;
        this.moveJoystick.pointerId = null;
        this.moveJoystick.centerX = 0;
        this.moveJoystick.centerY = 0;
        this.moveJoystick.offsetX = 0;
        this.moveJoystick.offsetY = 0;
        this.moveJoystick.button = null;
        this.updateMoveJoystickVisual();
    },

    getMoveJoystickTarget() {
        if (!this.moveJoystick.active) return null;

        const distance = Math.hypot(this.moveJoystick.offsetX, this.moveJoystick.offsetY);
        const maxRadius = Math.max(1, this.moveJoystick.maxRadius || 1);
        const deadZone = Math.max(0, this.moveJoystick.deadZone || 0);
        const effectiveRatio = Math.max(0, Math.min(1, (distance - deadZone) / Math.max(1, maxRadius - deadZone)));

        if (effectiveRatio <= 0) {
            return { x: guardCenter.x, y: guardCenter.y };
        }

        const normX = this.moveJoystick.offsetX / distance;
        const normY = this.moveJoystick.offsetY / distance;
        const cursorSpeed = Math.max(0.2, parseFloat(CONFIG.INPUT.JOYSTICK_CURSOR_SPEED) || 1);
        const worldDistance = (this.moveJoystick.aimDistance * effectiveRatio * cursorSpeed) / Math.max(0.001, Camera.currentZoom || 1);

        return {
            x: guardCenter.x + (normX * worldDistance),
            y: guardCenter.y + (normY * worldDistance)
        };
    },

    getAuraPalette() {
        const now = performance.now();
        if (this.specialAuraMode && this.specialAuraExpiresAt !== Number.POSITIVE_INFINITY && this.specialAuraExpiresAt <= now) {
            this.setSpecialAura(null);
        }

        if (this.isVoidCollapsed || this.specialAuraMode === 'void') {
            return {
                shadowColor: "#2f103f",
                particleColor: "rgba(140, 92, 255, 0.42)",
                layers: [
                    { w: 15, h: 28, color: "rgba(8, 4, 16, 0.82)", f: 0.75 },
                    { w: 10, h: 19, color: "rgba(56, 17, 83, 0.92)", f: 1.1 },
                    { w: 6, h: 12, color: "rgba(26, 3, 35, 0.98)", f: 1.65 }
                ]
            };
        }

        if (this.specialAuraMode === 'rainbow') {
            const hue = (now * 0.06) % 360;
            return {
                shadowColor: hslaColor(hue, 100, 68, 1),
                particleColor: hslaColor((hue + 60) % 360, 100, 76, 0.56),
                layers: [
                    { w: 15, h: 28, color: hslaColor(hue, 100, 60, 0.30), f: 0.8 },
                    { w: 10, h: 20, color: hslaColor((hue + 120) % 360, 100, 64, 0.86), f: 1.2 },
                    { w: 6, h: 12, color: hslaColor((hue + 240) % 360, 100, 82, 0.96), f: 1.75 }
                ]
            };
        }

        const berserkEffect = this.activeEffects.find(effect => effect.auraMode === 'berserk');
        if (!berserkEffect) {
            return {
                shadowColor: "#00ffff",
                particleColor: "rgba(150, 255, 255, 0.5)",
                layers: [
                    { w: 12, h: 22, color: "rgba(0, 102, 255, 0.3)", f: 0.8 },
                    { w: 8, h: 16, color: "#00d9ff", f: 1.2 },
                    { w: 5, h: 10, color: "#e0ffff", f: 1.8 }
                ]
            };
        }

        return {
            shadowColor: "#ff4d4f",
            particleColor: "rgba(255, 180, 120, 0.65)",
            layers: [
                { w: 14, h: 26, color: "rgba(120, 0, 0, 0.28)", f: 0.8 },
                { w: 10, h: 19, color: "#ff5b47", f: 1.25 },
                { w: 6, h: 12, color: "#ffe5b4", f: 1.85 }
            ]
        };
    },

    addRage(amount) {
        const safeAmount = Math.max(0, Math.round(amount || 0));
        this.rage = Math.min(this.maxRage, this.rage + safeAmount);
        this.renderRageUI();
    },

    applyExpPenalty(ratio) {
        const safeRatio = Math.max(0, Math.min(1, ratio || 0));
        if (safeRatio <= 0) return 0;

        const loss = Math.floor(this.exp * safeRatio);
        this.exp = Math.max(0, this.exp - loss);
        if (this.getCurrentRank() && this.exp < this.getCurrentRank().exp) {
            this.isReadyToBreak = false;
        }
        return loss;
    },

    consumeBerserkPill(item, qualityConfig) {
        this.activeEffects = this.activeEffects.filter(effect => effect.group !== 'BERSERK');

        this.activeEffects.push({
            id: item.key,
            name: this.getItemDisplayName(item),
            group: 'BERSERK',
            expiresAt: performance.now() + (qualityConfig.durationMs || 10000),
            attackPct: qualityConfig.attackPct || 0,
            speedPct: qualityConfig.sideSpeedPct || 0,
            maxManaFlat: qualityConfig.sideMaxManaFlat || 0,
            auraMode: qualityConfig.auraMode || null,
            endColor: qualityConfig.color
        });

        const sideEffects = [];

        if (qualityConfig.sideManaLoss) {
            const manaLoss = Math.min(this.mana, qualityConfig.sideManaLoss);
            this.updateMana(-manaLoss);
            sideEffects.push(`hao ${formatNumber(manaLoss)} linh lực`);
        }

        if (qualityConfig.sideExpLossRatio) {
            const expLoss = this.applyExpPenalty(qualityConfig.sideExpLossRatio);
            if (expLoss > 0) sideEffects.push(`tổn ${formatNumber(expLoss)} tu vi`);
        }

        if (qualityConfig.sideMaxManaFlat) {
            sideEffects.push(`tạm giảm ${Math.abs(qualityConfig.sideMaxManaFlat)} giới hạn linh lực`);
        }

        if (qualityConfig.sideSpeedPct) {
            sideEffects.push(`tạm giảm ${Math.round(Math.abs(qualityConfig.sideSpeedPct) * 100)}% tốc độ`);
        }

        this.syncDerivedStats();

        const sideText = sideEffects.length ? `, đổi lại ${sideEffects.join(', ')}` : '';
        showNotify(`Dùng ${this.getItemDisplayName(item)}: cuồng hóa ${Math.round((qualityConfig.attackPct || 0) * 100)}%${sideText}`, qualityConfig.color);
    },

    getInsectSpeciesEntries() {
        return Object.entries(CONFIG.INSECT?.SPECIES || {});
    },

    getInsectSpecies(speciesKey) {
        return CONFIG.INSECT?.SPECIES?.[speciesKey] || null;
    },

    getInsectTierInfo(tierKey) {
        return CONFIG.INSECT?.TIERS?.[tierKey] || CONFIG.INSECT?.TIERS?.PHAM || { label: 'Ky trung', color: '#79ffd4', shortLabel: 'Trung' };
    },

    getBeastBagCapacity() {
        const baseCapacity = Math.max(1, parseInt(CONFIG.INSECT?.STARTING_BEAST_BAG_CAPACITY, 10) || 1);
        return Math.max(baseCapacity, Math.floor(this.beastBagCapacity || 0));
    },

    getTotalEggCount() {
        return Object.values(this.insectEggs || {}).reduce((total, count) => total + Math.max(0, Math.floor(count || 0)), 0);
    },

    getTotalTamedInsectCount() {
        return Object.values(this.tamedInsects || {}).reduce((total, count) => total + Math.max(0, Math.floor(count || 0)), 0);
    },

    getActiveInsectSpeciesKeys() {
        return Object.keys(this.tamedInsects || {}).filter(speciesKey => (this.tamedInsects[speciesKey] || 0) > 0);
    },

    getBeastSummary() {
        const totalEggs = this.getTotalEggCount();
        const totalBeasts = this.getTotalTamedInsectCount();
        const capacity = this.getBeastBagCapacity();
        const discoveredCount = Object.keys(this.discoveredInsects || {}).filter(key => this.discoveredInsects[key]).length;
        const speciesTotal = this.getInsectSpeciesEntries().length;

        return {
            totalEggs,
            totalBeasts,
            capacity,
            freeSlots: Math.max(0, capacity - totalBeasts),
            discoveredCount,
            speciesTotal,
            usageRatio: capacity > 0 ? (totalBeasts / capacity) : 0
        };
    },

    hasUniquePurchase(key) {
        return Boolean(this.uniquePurchases?.[key]);
    },

    markUniquePurchase(key) {
        if (!key) return false;
        if (!this.uniquePurchases) this.uniquePurchases = {};
        this.uniquePurchases[key] = true;
        return true;
    },

    hasCultivationArt(key) {
        return Boolean(this.cultivationArts?.[key]);
    },

    unlockCultivationArt(key) {
        if (!key) return false;
        if (!this.cultivationArts) this.cultivationArts = {};
        this.cultivationArts[key] = true;
        return true;
    },

    hasDaiCanhKiemTranUnlocked() {
        return this.hasCultivationArt('DAI_CANH_KIEM_TRAN');
    },

    hasCanLamBangDiemUnlocked() {
        return this.hasCultivationArt('CAN_LAM_BANG_DIEM');
    },

    getUnlockedSwordTargetCount() {
        return this.hasDaiCanhKiemTranUnlocked()
            ? getConfiguredSwordCount()
            : getBaseSwordCountBeforeFormation();
    },

    hasKhuTrungThuatUnlocked() {
        return this.hasCultivationArt('KHU_TRUNG_THUAT');
    },

    hasKyTrungBang() {
        return this.hasUniquePurchase('KY_TRUNG_BANG');
    },

    hasSpiritBeastBag() {
        return this.hasUniquePurchase('LINH_THU_DAI');
    },

    markDiscoveredInsect(speciesKey) {
        if (!this.getInsectSpecies(speciesKey)) return false;
        this.discoveredInsects[speciesKey] = true;
        return true;
    },

    hasUnlockedAttackSkill(mode) {
        if (mode === 'SWORD') return true;
        if (mode === 'INSECT') return this.hasKhuTrungThuatUnlocked();
        return false;
    },

    canUseInsectAttackMode() {
        return this.hasKhuTrungThuatUnlocked() && this.getTotalTamedInsectCount() > 0;
    },

    isInsectSwarmActive() {
        return this.attackMode === 'INSECT' && this.canUseInsectAttackMode() && !this.isUltMode && !this.isUltimateBusy();
    },

    _getAttackSkillListLegacy() {
        return [
            {
                key: 'SWORD',
                name: 'Thanh Trúc Kiếm Trận',
                description: 'Duy trì kiếm trận hộ thân, lấy kiếm quang làm công thủ chủ đạo.',
                unlocked: true,
                active: this.attackMode === 'SWORD',
                ready: true,
                accent: '#8fffe0',
                note: `${formatNumber(this.getAliveSwordStats().alive)} kiếm còn chiến lực`
            },
            {
                key: 'INSECT',
                name: 'Khu Trùng Thuật',
                description: 'Điều động linh trùng đã ấp nở thành trùng vân công sát bay quanh con trỏ.',
                unlocked: this.hasKhuTrungThuatUnlocked(),
                active: this.attackMode === 'INSECT',
                ready: this.canUseInsectAttackMode(),
                accent: '#79ffd4',
                note: this.hasKhuTrungThuatUnlocked()
                    ? `${formatNumber(this.getTotalTamedInsectCount())} linh trùng đã nở`
                    : 'Cần mua rồi lĩnh ngộ trong túi trữ vật'
            }
        ];
    },

    getAttackSkillList() {
        const formationUnlocked = this.hasDaiCanhKiemTranUnlocked();
        const swordStats = this.getAliveSwordStats();

        return [
            {
                key: 'SWORD',
                name: formationUnlocked ? 'Đại Canh Kiếm Trận' : 'Thanh Trúc Cô Kiếm',
                description: formationUnlocked
                    ? 'Triển khai kiếm trận hộ thân, lấy kiếm quang đại trận làm công thủ chủ đạo.'
                    : 'Chưa lĩnh ngộ kiếm trận, hiện chỉ vận dụng một thanh bản mệnh kiếm để hộ thân và công phạt.',
                unlocked: true,
                active: this.attackMode === 'SWORD',
                ready: true,
                accent: '#8fffe0',
                note: formationUnlocked
                    ? `${formatNumber(swordStats.alive)} kiếm còn chiến lực`
                    : `${formatNumber(swordStats.alive)} kiếm bản mệnh còn chiến lực`
            },
            {
                key: 'INSECT',
                name: 'Khu Trùng Thuật',
                description: 'Điều động linh trùng đã ấp nở thành trùng vân công sát bay quanh con trỏ.',
                unlocked: this.hasKhuTrungThuatUnlocked(),
                active: this.attackMode === 'INSECT',
                ready: this.canUseInsectAttackMode(),
                accent: '#79ffd4',
                note: this.hasKhuTrungThuatUnlocked()
                    ? `${formatNumber(this.getTotalTamedInsectCount())} linh trùng đã nở`
                    : 'Cần lĩnh ngộ trong cửa hàng'
            }
        ];
    },

    renderAttackModeUI() {
        const skillBtn = document.getElementById('btn-skill-list');
        if (skillBtn) {
            skillBtn.classList.toggle('is-active', this.attackMode === 'INSECT');
            skillBtn.classList.toggle('is-disabled', !this.hasKhuTrungThuatUnlocked());
            skillBtn.title = this.attackMode === 'INSECT'
                ? `Khu Trùng Thuật - ${formatNumber(this.getTotalTamedInsectCount())} linh trùng`
                : 'Bảng kỹ năng tấn công';
        }

        const swordCounter = document.getElementById('sword-counter');
        if (swordCounter) {
            swordCounter.classList.toggle('is-hidden', this.isInsectSwarmActive());
        }

        if (SkillsUI && typeof SkillsUI.render === 'function' && SkillsUI.isOpen()) {
            SkillsUI.render();
        }
    },

    ensureValidAttackMode() {
        if (this.attackMode === 'INSECT' && !this.canUseInsectAttackMode()) {
            this.attackMode = 'SWORD';
        }

        this.renderAttackModeUI();
    },

    setAttackMode(mode) {
        const nextMode = mode === 'INSECT' ? 'INSECT' : 'SWORD';

        if (!this.hasUnlockedAttackSkill(nextMode)) {
            showNotify('Chưa lĩnh ngộ kỹ năng này.', '#ffd36b');
            return false;
        }

        if (nextMode === 'INSECT' && !this.canUseInsectAttackMode()) {
            showNotify('Chưa có linh trùng đã ấp nở để bày trùng trận.', '#ffb26b');
            return false;
        }

        if (this.attackMode === nextMode) {
            this.renderAttackModeUI();
            return true;
        }

        this.attackMode = nextMode;
        this.renderAttackModeUI();
        showNotify(nextMode === 'INSECT' ? 'Đổi sang Khu Trùng Thuật' : 'Đổi về Thanh Trúc Kiếm Trận', nextMode === 'INSECT' ? '#79ffd4' : '#8fffe0');
        return true;
    },

    hasBeastCapacity(amount = 1) {
        const safeAmount = Math.max(0, Math.floor(amount || 0));
        return (this.getTotalTamedInsectCount() + safeAmount) <= this.getBeastBagCapacity();
    },

    addInsectEgg(speciesKey, count = 1) {
        const species = this.getInsectSpecies(speciesKey);
        const safeCount = Math.max(0, Math.floor(count || 0));
        if (!species || safeCount <= 0) return 0;

        this.insectEggs[speciesKey] = Math.max(0, Math.floor(this.insectEggs[speciesKey] || 0)) + safeCount;
        this.markDiscoveredInsect(speciesKey);
        return safeCount;
    },

    changeTamedInsects(speciesKey, delta = 0) {
        const species = this.getInsectSpecies(speciesKey);
        const safeDelta = Math.trunc(delta || 0);
        if (!species || safeDelta === 0) return 0;

        const currentCount = Math.max(0, Math.floor(this.tamedInsects[speciesKey] || 0));
        const nextCount = Math.max(0, currentCount + safeDelta);

        if (nextCount <= 0) {
            delete this.tamedInsects[speciesKey];
        } else {
            this.tamedInsects[speciesKey] = nextCount;
            this.markDiscoveredInsect(speciesKey);
        }

        this.ensureValidAttackMode();
        return nextCount - currentCount;
    },

    hatchInsectEgg(speciesKey, count = 1) {
        const species = this.getInsectSpecies(speciesKey);
        const availableEggs = Math.max(0, Math.floor(this.insectEggs[speciesKey] || 0));
        const safeCount = Math.max(1, Math.floor(count || 1));
        const freeSlots = Math.max(0, this.getBeastBagCapacity() - this.getTotalTamedInsectCount());
        const hatchCount = Math.min(safeCount, availableEggs, freeSlots);

        if (!species || availableEggs <= 0) {
            return { success: false, reason: 'no-egg', count: 0 };
        }

        if (hatchCount <= 0) {
            return { success: false, reason: 'full', count: 0 };
        }

        this.insectEggs[speciesKey] = availableEggs - hatchCount;
        if (this.insectEggs[speciesKey] <= 0) delete this.insectEggs[speciesKey];

        this.changeTamedInsects(speciesKey, hatchCount);
        showNotify(`Ấp nở ${formatNumber(hatchCount)} ${species.name}`, CONFIG.INSECT?.HATCH?.NOTIFY_COLOR || species.color);
        this.refreshResourceUI();
        return { success: true, reason: 'hatched', count: hatchCount };
    },

    loseRandomTamedInsect(baseChance = 0) {
        const chance = Math.max(0, Math.min(1, baseChance || 0));
        const candidates = this.getActiveInsectSpeciesKeys();

        if (!candidates.length || Math.random() >= chance) return null;

        const weighted = {};
        candidates.forEach(speciesKey => {
            const species = this.getInsectSpecies(speciesKey);
            const count = this.tamedInsects[speciesKey] || 0;
            weighted[speciesKey] = Math.max(0.05, count / Math.max(0.2, species?.vitality || 1));
        });

        const chosenKey = pickWeightedKey(weighted, candidates[0]);
        this.changeTamedInsects(chosenKey, -1);
        return chosenKey;
    },

    reproduceRandomInsect(baseChance = 0) {
        const chance = Math.max(0, Math.min(1, baseChance || 0));
        const candidates = this.getActiveInsectSpeciesKeys();

        if (!candidates.length || !this.hasBeastCapacity(1) || Math.random() >= chance) return null;

        const weighted = {};
        candidates.forEach(speciesKey => {
            const species = this.getInsectSpecies(speciesKey);
            const count = this.tamedInsects[speciesKey] || 0;
            weighted[speciesKey] = Math.max(0.05, count * Math.max(0.15, species?.fertility || 1));
        });

        const chosenKey = pickWeightedKey(weighted, candidates[0]);
        this.changeTamedInsects(chosenKey, 1);
        return chosenKey;
    },

    createRandomInsectEggDropSpec() {
        const speciesRates = this.getInsectSpeciesEntries().reduce((rates, [speciesKey, species]) => {
            rates[speciesKey] = Math.max(0.01, species.weight || 1);
            return rates;
        }, {});
        const speciesKey = pickWeightedKey(speciesRates, this.getInsectSpeciesEntries()[0]?.[0]);

        return {
            kind: 'INSECT_EGG',
            category: 'INSECT_EGG',
            quality: 'LOW',
            speciesKey
        };
    },

    getSpiritStoneType(quality) {
        return CONFIG.SPIRIT_STONE.TYPES[quality] || CONFIG.SPIRIT_STONE.TYPES.LOW;
    },

    getSpiritStoneCompactLabel(quality) {
        return {
            LOW: 'HP',
            MEDIUM: 'TrP',
            HIGH: 'ThP',
            SUPREME: 'CP'
        }[quality] || 'HP';
    },

    getSpiritStoneTotalValue() {
        return Object.entries(this.spiritStones).reduce((total, [quality, count]) => {
            return total + (count * this.getSpiritStoneType(quality).value);
        }, 0);
    },

    setSpiritStoneTotalValue(totalLowValue) {
        let remaining = Math.max(0, Math.floor(totalLowValue));
        const nextWallet = { LOW: 0, MEDIUM: 0, HIGH: 0, SUPREME: 0 };

        STONE_ORDER.forEach(quality => {
            const type = this.getSpiritStoneType(quality);
            nextWallet[quality] = Math.floor(remaining / type.value);
            remaining %= type.value;
        });

        this.spiritStones = nextWallet;
    },

    addSpiritStone(quality, count = 1) {
        const type = this.getSpiritStoneType(quality);
        this.setSpiritStoneTotalValue(this.getSpiritStoneTotalValue() + (type.value * count));
    },

    canAffordLowStoneCost(costLowStone) {
        return this.getSpiritStoneTotalValue() >= Math.max(0, costLowStone);
    },

    spendSpiritStones(costLowStone) {
        const safeCost = Math.max(0, Math.floor(costLowStone));
        if (!this.canAffordLowStoneCost(safeCost)) return false;

        this.setSpiritStoneTotalValue(this.getSpiritStoneTotalValue() - safeCost);
        return true;
    },

    getSpiritStoneBreakdown(totalLowValue) {
        let remaining = Math.max(0, Math.floor(totalLowValue));

        return STONE_ORDER.map(quality => {
            const type = this.getSpiritStoneType(quality);
            const count = Math.floor(remaining / type.value);
            remaining %= type.value;

            return {
                quality,
                count,
                type
            };
        });
    },

    renderSpiritStoneCostMarkup(totalLowValue) {
        const entries = this.getSpiritStoneBreakdown(totalLowValue)
            .filter(entry => entry.count > 0);

        if (!entries.length) {
            const fallback = this.getSpiritStoneType('LOW');
            entries.push({
                quality: 'LOW',
                count: 0,
                type: fallback
            });
        }

        return `
            <span class="stone-cost-list">
                ${entries.map(entry => `
                    <span class="stone-cost-chip" style="--stone-accent:${entry.type.color}" title="${escapeHtml(entry.type.label)}">
                        ${formatNumber(entry.count)} ${escapeHtml(this.getSpiritStoneCompactLabel(entry.quality))}
                    </span>
                `).join('')}
            </span>
        `;
    },

    buildInventoryKey(spec) {
        const parts = [
            spec.kind || 'PILL',
            spec.category || 'EXP',
            spec.quality || 'LOW'
        ];

        if (spec.specialKey) parts.push(spec.specialKey);
        if (spec.realmKey) parts.push(spec.realmKey);
        if (spec.uniqueKey) parts.push(spec.uniqueKey);
        if (spec.speciesKey) parts.push(spec.speciesKey);
        return parts.join('|');
    },

    getUniqueItemConfig(uniqueKey) {
        return CONFIG.SECRET_ARTS?.[uniqueKey]
            || CONFIG.INSECT?.UNIQUE_ITEMS?.[uniqueKey]
            || null;
    },

    getItemQualityConfig(item) {
        const categoryMap = {
            EXP: CONFIG.PILL.EXP_QUALITIES,
            INSIGHT: CONFIG.PILL.INSIGHT_QUALITIES,
            BREAKTHROUGH: CONFIG.PILL.BREAKTHROUGH_QUALITIES,
            ATTACK: CONFIG.PILL.ATTACK_QUALITIES,
            SHIELD_BREAK: CONFIG.PILL.SHIELD_BREAK_QUALITIES,
            BERSERK: CONFIG.PILL.BERSERK_QUALITIES,
            RAGE: CONFIG.PILL.RAGE_QUALITIES,
            MANA: CONFIG.PILL.MANA_QUALITIES,
            MAX_MANA: CONFIG.PILL.MAX_MANA_QUALITIES,
            REGEN: CONFIG.PILL.REGEN_QUALITIES,
            SPEED: CONFIG.PILL.SPEED_QUALITIES,
            FORTUNE: CONFIG.PILL.FORTUNE_QUALITIES,
            BAG: CONFIG.ITEMS.STORAGE_BAGS,
            SWORD_ART: CONFIG.SECRET_ARTS,
            FLAME_ART: CONFIG.SECRET_ARTS,
            INSECT_SKILL: CONFIG.INSECT.UNIQUE_ITEMS,
            INSECT_ARTIFACT: CONFIG.INSECT.UNIQUE_ITEMS,
            SPIRIT_BAG: { HIGH: CONFIG.INSECT.BEAST_BAG }
        };

        if (item.specialKey) {
            return CONFIG.PILL.SPECIAL_ITEMS[item.specialKey] || CONFIG.PILL.EXP_QUALITIES.LOW;
        }

        if (item.uniqueKey) {
            const uniqueConfig = this.getUniqueItemConfig(item.uniqueKey);
            if (uniqueConfig) return uniqueConfig;
        }

        if (item.category === 'SPIRIT_BAG') {
            return CONFIG.INSECT.BEAST_BAG;
        }

        const defs = categoryMap[item.category] || CONFIG.PILL.EXP_QUALITIES;
        return defs[item.quality] || defs.LOW;
    },

    getItemDisplayName(item) {
        const qualityConfig = this.getItemQualityConfig(item);
        if (item.specialKey) {
            return qualityConfig.fullName;
        }

        if (item.kind === 'INSECT_EGG' || item.category === 'INSECT_EGG') {
            const species = this.getInsectSpecies(item.speciesKey);
            return species ? `Trung ${species.name}` : 'Trung ky trung';
        }

        if (item.uniqueKey && qualityConfig.fullName) {
            return qualityConfig.fullName;
        }

        if (item.category === 'BREAKTHROUGH') {
            const realmName = item.realmName || this.getNextMajorRealmInfo()?.name || "đột phá";
            return `${qualityConfig.label} ${realmName} đan`;
        }

        if (item.category === 'BAG' || item.category === 'SPIRIT_BAG') {
            return qualityConfig.fullName;
        }

        return qualityConfig.fullName;
    },

    _getItemCategoryLabelLegacy(item) {
        const staticLabels = {
            BAG: 'Túi trữ vật',
            SPIRIT_BAG: 'Linh thú đại',
            INSECT_SKILL: 'Trùng đạo bí pháp',
            INSECT_ARTIFACT: 'Kỳ trùng bảo vật',
            INSECT_EGG: 'Trùng noãn'
        };
        if (staticLabels[item.category]) return staticLabels[item.category];
        if (item.category === 'BAG') return 'Túi trữ vật';

        const labels = {
            EXP: 'Tu vi',
            INSIGHT: 'Ngộ đạo',
            BREAKTHROUGH: 'Đột phá',
            ATTACK: 'Công phạt',
            SHIELD_BREAK: 'Phá khiên',
            BERSERK: 'Cuồng bạo',
            RAGE: 'Nộ',
            MANA: 'Hồi linh',
            MAX_MANA: 'Khai hải',
            REGEN: 'Hồi nguyên',
            SPEED: 'Thân pháp',
            FORTUNE: 'Vận khí',
            SPECIAL: 'Cấm kị'
        };

        return labels[item.category] || 'Đan dược';
    },

    getItemDescription(item) {
        const qualityConfig = this.getItemQualityConfig(item);
        if (item.specialKey === 'CHUNG_CUC_DAO_NGUYEN_DAN') {
            return 'Cực phẩm đạo đan bảy sắc, lập tức đưa tu vi lên cảnh giới cao nhất Chân tiên đại viên mãn và lưu lại hào quang 7 sắc.';
        }

        if (item.specialKey === 'TAN_DAO_DIET_NGUYEN_DAN') {
            return 'Cấm kị hắc đan, cưỡng ép bước vào Chân tiên đại viên mãn trong 1 giây rồi tan vào hư vô. Chỉ có thể hồi phục khi reload web.';
        }

        switch (item.category) {
            case 'BAG': {
                const targetCapacity = Math.max(0, Math.floor(qualityConfig.capacity || 0));
                const currentCapacity = this.getInventoryCapacity();
                const extraSlots = Math.max(0, targetCapacity - currentCapacity);

                if (extraSlots > 0) {
                    return `Mở rộng túi trữ vật lên ${formatNumber(targetCapacity)} ô, thêm ${formatNumber(extraSlots)} ô so với hiện tại.`;
                }

                return `Túi này chứa tối đa ${formatNumber(targetCapacity)} ô và cảnh giới chứa đồ của ngươi đã đạt đến mức này.`;
            }
            case 'SPIRIT_BAG': {
                const targetCapacity = Math.max(0, Math.floor(qualityConfig.capacity || 0));
                const currentCapacity = this.getBeastBagCapacity();
                const extraSlots = Math.max(0, targetCapacity - currentCapacity);

                if (extraSlots > 0) {
                    return `Mở rộng Linh Thú Đại lên ${formatNumber(targetCapacity)} ô, thu nạp thêm ${formatNumber(extraSlots)} linh trùng đã nở.`;
                }

                return `Linh Thú Đại hiện đã đủ sức chứa ${formatNumber(targetCapacity)} linh trùng trưởng thành.`;
            }
            case 'SWORD_ART':
                return 'Kiếm đạo bí pháp chỉ truyền một lần. Sau khi lĩnh ngộ mới từ một thanh bản mệnh kiếm hóa thành Đại Canh Kiếm Trận hộ thân như hiện tại.';
            case 'FLAME_ART':
                return 'Thiên địa linh hỏa Càn Lam Băng Diễm. Sau khi luyện hóa, con trỏ tâm niệm mới hiển hóa thành lam diễm, trước đó chỉ là một điểm sáng nhỏ.';
            case 'INSECT_SKILL':
                return 'Bí pháp điều động bầy linh trùng, cho phép thay kiếm trận bằng trùng vân công sát quanh con trỏ.';
            case 'INSECT_ARTIFACT':
                return 'Dị bảo ghi chép huyết mạch và năng lực các kỳ trùng. Thu được loài nào thì mục tương ứng sẽ sáng lên.';
            case 'INSECT_EGG': {
                const species = this.getInsectSpecies(item.speciesKey);
                const tier = this.getInsectTierInfo(species?.tier);
                return species
                    ? `${tier.label}: ${species.description}`
                    : 'Trứng kỳ trùng có thể ấp nở trong tab Linh thú.';
            }
            case 'INSIGHT':
                return `Tăng vĩnh viễn ${Math.round((qualityConfig.expGainPct || 0) * 100)}% tu vi nhận từ chiến đấu và đan tu vi.`;
            case 'BREAKTHROUGH': {
                const realmName = item.realmName || "cảnh giới kế tiếp";
                return `Tăng ${Math.round(qualityConfig.breakthroughBoost * 100)}% tỉ lệ đột phá tới ${realmName}.`;
            }
            case 'ATTACK':
                return `Tăng vĩnh viễn ${Math.round((qualityConfig.attackPct || 0) * 100)}% lực công kích.`;
            case 'SHIELD_BREAK':
                return `Tăng vĩnh viễn ${Math.round((qualityConfig.shieldBreakPct || 0) * 100)}% sát lực lên khiên địch.`;
            case 'BERSERK': {
                const sideEffects = [];
                if (qualityConfig.sideManaLoss) sideEffects.push(`hao ${qualityConfig.sideManaLoss} linh lực`);
                if (qualityConfig.sideMaxManaFlat) sideEffects.push(`giảm ${Math.abs(qualityConfig.sideMaxManaFlat)} giới hạn linh lực`);
                if (qualityConfig.sideSpeedPct) sideEffects.push(`giảm ${Math.round(Math.abs(qualityConfig.sideSpeedPct) * 100)}% tốc độ`);
                if (qualityConfig.sideExpLossRatio) sideEffects.push(`tổn ${Math.round(qualityConfig.sideExpLossRatio * 100)}% tu vi hiện có`);

                const sideText = sideEffects.length ? ` Tác dụng phụ: ${sideEffects.join(', ')}.` : '';
                return `Cuồng hóa ${Math.round((qualityConfig.attackPct || 0) * 100)}% lực công kích trong ${Math.round((qualityConfig.durationMs || 0) / 1000)} giây.${sideText}`;
            }
            case 'RAGE':
                return `Tăng ngay ${Math.round(qualityConfig.rageGain || 0)} nộ kiếm.`;
            case 'MANA':
                return `Hồi ngay ${Math.round(qualityConfig.manaRestore || 0)} linh lực.`;
            case 'MAX_MANA':
                return `Tăng vĩnh viễn ${Math.round(qualityConfig.maxManaFlat || 0)} giới hạn linh lực.`;
            case 'REGEN':
                return `Tăng vĩnh viễn ${Math.round((qualityConfig.manaRegenPct || 0) * 100)}% tốc độ hồi linh lực.`;
            case 'SPEED':
                return `Tăng vĩnh viễn ${Math.round((qualityConfig.speedPct || 0) * 100)}% tốc độ vận chuyển kiếm trận.`;
            case 'FORTUNE':
                return `Tăng vĩnh viễn ${Math.round((qualityConfig.dropRatePct || 0) * 100)}% tỉ lệ rơi đan dược và linh thạch.`;
            case 'EXP':
            default:
                return `Tăng ${Math.round(qualityConfig.expFactor * 100)}% tu vi của cảnh giới hiện tại.`;
        }
    },

    getItemDescriptionMarkup(item) {
        const description = this.getItemDescription(item);
        const sideEffectMarker = 'Tác dụng phụ:';
        const markerIndex = description.indexOf(sideEffectMarker);

        if (markerIndex === -1) {
            return escapeHtml(description);
        }

        const mainText = description.slice(0, markerIndex).trim();
        const sideText = description.slice(markerIndex + sideEffectMarker.length).trim();

        return `
            ${escapeHtml(mainText)}
            <span class="item-description__side-effect">
                <span class="item-description__side-label">${escapeHtml(sideEffectMarker)}</span>
                ${escapeHtml(sideText)}
            </span>
        `.trim();
    },

    getItemCategoryLabel(item) {
        const staticLabels = {
            BAG: 'Túi trữ vật',
            SPIRIT_BAG: 'Linh thú đại',
            SWORD_ART: 'Kiếm đạo bí pháp',
            FLAME_ART: 'Thiên địa linh hỏa',
            INSECT_SKILL: 'Trùng đạo bí pháp',
            INSECT_ARTIFACT: 'Kỳ trùng bảo vật',
            INSECT_EGG: 'Trùng noãn'
        };

        if (staticLabels[item.category]) return staticLabels[item.category];

        const labels = {
            EXP: 'Tu vi',
            INSIGHT: 'Ngộ đạo',
            BREAKTHROUGH: 'Đột phá',
            ATTACK: 'Công phạt',
            SHIELD_BREAK: 'Phá khiên',
            BERSERK: 'Cuồng bạo',
            RAGE: 'Nộ',
            MANA: 'Hồi linh',
            MAX_MANA: 'Khai hải',
            REGEN: 'Hồi nguyên',
            SPEED: 'Thân pháp',
            FORTUNE: 'Vận khí',
            SPECIAL: 'Cấm kỵ'
        };

        return labels[item.category] || 'Đan dược';
    },

    _getItemDescriptionLegacy(item) {
        const qualityConfig = this.getItemQualityConfig(item);
        if (item.specialKey === 'CHUNG_CUC_DAO_NGUYEN_DAN') {
            return 'Cực phẩm đạo đan bảy sắc, lập tức đưa tu vi lên cảnh giới cao nhất Chân tiên đại viên mãn và lưu lại hào quang 7 sắc.';
        }

        if (item.specialKey === 'TAN_DAO_DIET_NGUYEN_DAN') {
            return 'Cấm kỵ hắc đan, cưỡng ép bước vào Chân tiên đại viên mãn trong 1 giây rồi tan vào hư vô. Chỉ có thể hồi phục khi reload web.';
        }

        switch (item.category) {
            case 'BAG': {
                const targetCapacity = Math.max(0, Math.floor(qualityConfig.capacity || 0));
                const currentCapacity = this.getInventoryCapacity();
                const extraSlots = Math.max(0, targetCapacity - currentCapacity);

                if (extraSlots > 0) {
                    return `Mở rộng túi trữ vật lên ${formatNumber(targetCapacity)} ô, thêm ${formatNumber(extraSlots)} ô so với hiện tại.`;
                }

                return `Túi này chứa tối đa ${formatNumber(targetCapacity)} ô và cảnh giới chứa đồ của ngươi đã đạt đến mức này.`;
            }
            case 'SPIRIT_BAG': {
                const targetCapacity = Math.max(0, Math.floor(qualityConfig.capacity || 0));
                const currentCapacity = this.getBeastBagCapacity();
                const extraSlots = Math.max(0, targetCapacity - currentCapacity);

                if (extraSlots > 0) {
                    return `Mở rộng Linh Thú Đại lên ${formatNumber(targetCapacity)} ô, thu nạp thêm ${formatNumber(extraSlots)} linh trùng đã nở.`;
                }

                return `Linh Thú Đại hiện đã đủ sức chứa ${formatNumber(targetCapacity)} linh trùng trưởng thành.`;
            }
            case 'SWORD_ART':
                return 'Kiếm đạo bí pháp chỉ truyền một lần. Sau khi lĩnh ngộ mới từ một thanh bản mệnh kiếm hóa thành Đại Canh Kiếm Trận như hiện tại.';
            case 'FLAME_ART':
                return 'Thiên địa linh hỏa Càn Lam Băng Diễm. Sau khi luyện hóa, con trỏ tâm niệm mới hiển hóa thành lam diễm, trước đó chỉ là một điểm sáng nhỏ.';
            case 'INSECT_SKILL':
                return 'Bí pháp điều động bầy linh trùng, cho phép thay kiếm trận bằng trùng vân công sát quanh con trỏ.';
            case 'INSECT_ARTIFACT':
                return 'Dị bảo ghi chép huyết mạch và năng lực các kỳ trùng. Thu được loài nào thì mục tương ứng sẽ sáng lên.';
            case 'INSECT_EGG': {
                const species = this.getInsectSpecies(item.speciesKey);
                const tier = this.getInsectTierInfo(species?.tier);
                return species
                    ? `${tier.label}: ${species.description}`
                    : 'Trứng kỳ trùng có thể ấp nở trong tab Linh thú.';
            }
            case 'INSIGHT':
                return `Tăng vĩnh viễn ${Math.round((qualityConfig.expGainPct || 0) * 100)}% tu vi nhận từ chiến đấu và đan tu vi.`;
            case 'BREAKTHROUGH': {
                const realmName = item.realmName || 'cảnh giới kế tiếp';
                return `Tăng ${Math.round(qualityConfig.breakthroughBoost * 100)}% tỉ lệ đột phá tới ${realmName}.`;
            }
            case 'ATTACK':
                return `Tăng vĩnh viễn ${Math.round((qualityConfig.attackPct || 0) * 100)}% lực công kích.`;
            case 'SHIELD_BREAK':
                return `Tăng vĩnh viễn ${Math.round((qualityConfig.shieldBreakPct || 0) * 100)}% sát lực lên khiên địch.`;
            case 'BERSERK': {
                const sideEffects = [];
                if (qualityConfig.sideManaLoss) sideEffects.push(`hao ${qualityConfig.sideManaLoss} linh lực`);
                if (qualityConfig.sideMaxManaFlat) sideEffects.push(`giảm ${Math.abs(qualityConfig.sideMaxManaFlat)} giới hạn linh lực`);
                if (qualityConfig.sideSpeedPct) sideEffects.push(`giảm ${Math.round(Math.abs(qualityConfig.sideSpeedPct) * 100)}% tốc độ`);
                if (qualityConfig.sideExpLossRatio) sideEffects.push(`tổn ${Math.round(qualityConfig.sideExpLossRatio * 100)}% tu vi hiện có`);

                const sideText = sideEffects.length ? ` Tác dụng phụ: ${sideEffects.join(', ')}.` : '';
                return `Cuồng hóa ${Math.round((qualityConfig.attackPct || 0) * 100)}% lực công kích trong ${Math.round((qualityConfig.durationMs || 0) / 1000)} giây.${sideText}`;
            }
            case 'RAGE':
                return `Tăng ngay ${Math.round(qualityConfig.rageGain || 0)} nộ kiếm.`;
            case 'MANA':
                return `Hồi ngay ${Math.round(qualityConfig.manaRestore || 0)} linh lực.`;
            case 'MAX_MANA':
                return `Tăng vĩnh viễn ${Math.round(qualityConfig.maxManaFlat || 0)} giới hạn linh lực.`;
            case 'REGEN':
                return `Tăng vĩnh viễn ${Math.round((qualityConfig.manaRegenPct || 0) * 100)}% tốc độ hồi linh lực.`;
            case 'SPEED':
                return `Tăng vĩnh viễn ${Math.round((qualityConfig.speedPct || 0) * 100)}% tốc độ vận chuyển kiếm trận.`;
            case 'FORTUNE':
                return `Tăng vĩnh viễn ${Math.round((qualityConfig.dropRatePct || 0) * 100)}% tỉ lệ rơi đan dược và linh thạch.`;
            case 'EXP':
            default:
                return `Tăng ${Math.round(qualityConfig.expFactor * 100)}% tu vi của cảnh giới hiện tại.`;
        }
    },

    addInventoryItem(spec, count = 1) {
        const itemKey = this.buildInventoryKey(spec);
        if (!this.inventory[itemKey] && !this.hasInventorySpaceForSpec(spec)) {
            return null;
        }

        if (!this.inventory[itemKey]) {
            this.inventory[itemKey] = {
                key: itemKey,
                kind: spec.kind || 'PILL',
                category: spec.category || 'EXP',
                quality: spec.quality || 'LOW',
                specialKey: spec.specialKey || null,
                realmKey: spec.realmKey || null,
                realmName: spec.realmName || null,
                uniqueKey: spec.uniqueKey || null,
                speciesKey: spec.speciesKey || null,
                count: 0
            };
        }

        this.inventory[itemKey].count += count;
        return this.inventory[itemKey];
    },

    getInventoryEntries() {
        const categoryOrder = CONFIG.PILL.CATEGORY_SORT || {};

        return Object.values(this.inventory)
            .filter(item => item.count > 0)
            .sort((a, b) => {
                const categoryDiff = (categoryOrder[a.category] ?? 99) - (categoryOrder[b.category] ?? 99);
                if (categoryDiff !== 0) return categoryDiff;

                const qualityDiff = QUALITY_ORDER.indexOf(b.quality) - QUALITY_ORDER.indexOf(a.quality);
                if (qualityDiff !== 0) return qualityDiff;

                return (a.realmName || '').localeCompare(b.realmName || '', 'vi');
            });
    },

    isInventoryItemUsable(item) {
        if (this.isVoidCollapsed) return false;
        if (item.category === 'EXP') return true;
        if (item.category !== 'BREAKTHROUGH') return true;

        const nextRealm = this.getNextMajorRealmInfo();
        return Boolean(nextRealm && item.realmKey === nextRealm.key);
    },

    createRandomPillDropSpec(isElite = false) {
        const categoryRates = CONFIG.PILL.CATEGORY_RATES[isElite ? 'ELITE' : 'NORMAL'];
        const qualityRates = CONFIG.PILL.QUALITY_RATES[isElite ? 'ELITE' : 'NORMAL'];
        let category = pickWeightedKey(categoryRates, 'EXP');
        const quality = pickWeightedKey(qualityRates, 'LOW');

        if (category === 'BREAKTHROUGH') {
            const nextRealm = this.getNextMajorRealmInfo();
            if (!nextRealm) category = 'EXP';
            else {
                return {
                    kind: 'PILL',
                    category,
                    quality,
                    realmKey: nextRealm.key,
                    realmName: nextRealm.name
                };
            }
        }

        return {
            kind: 'PILL',
            category,
            quality
        };
    },

    createRandomSpiritStoneDropSpec(isElite = false) {
        const qualityRates = CONFIG.SPIRIT_STONE.QUALITY_RATES[isElite ? 'ELITE' : 'NORMAL'];
        return {
            kind: 'STONE',
            quality: pickWeightedKey(qualityRates, 'LOW')
        };
    },

    getShopItems() {
        const shopCategories = ['EXP', 'INSIGHT', 'ATTACK', 'SHIELD_BREAK', 'BERSERK', 'RAGE', 'MANA', 'MAX_MANA', 'REGEN', 'SPEED', 'FORTUNE'];
        const items = [];

        shopCategories.forEach(category => {
            QUALITY_ORDER.forEach(quality => {
                const qualityConfig = this.getItemQualityConfig({ category, quality });
                items.push({
                    id: `${category}:${quality}`,
                    kind: 'PILL',
                    category,
                    quality,
                    priceLowStone: qualityConfig.buyPriceLowStone
                });
            });
        });

        const nextRealm = this.getNextMajorRealmInfo();
        if (nextRealm) {
            QUALITY_ORDER.forEach(quality => {
                items.push({
                    id: `BREAKTHROUGH:${quality}:${nextRealm.key}`,
                    kind: 'PILL',
                    category: 'BREAKTHROUGH',
                    quality,
                    realmKey: nextRealm.key,
                    realmName: nextRealm.name,
                    priceLowStone: CONFIG.PILL.BREAKTHROUGH_QUALITIES[quality].buyPriceLowStone
                });
            });
        }

        Object.entries(CONFIG.PILL.SPECIAL_ITEMS || {}).forEach(([specialKey, specialConfig]) => {
            items.push({
                id: `SPECIAL:${specialKey}`,
                kind: 'PILL',
                category: 'SPECIAL',
                quality: specialConfig.quality || 'SUPREME',
                specialKey,
                priceLowStone: specialConfig.buyPriceLowStone || 0
            });
        });

        Object.entries(CONFIG.SECRET_ARTS || {}).forEach(([uniqueKey, artConfig]) => {
            items.push({
                id: `SECRET_ART:${uniqueKey}`,
                kind: 'UNIQUE',
                category: uniqueKey === 'DAI_CANH_KIEM_TRAN' ? 'SWORD_ART' : 'FLAME_ART',
                quality: artConfig.quality || 'SUPREME',
                uniqueKey,
                priceLowStone: artConfig.buyPriceLowStone || 0,
                isOneTime: true
            });
        });

        QUALITY_ORDER.forEach(quality => {
            const bagConfig = CONFIG.ITEMS.STORAGE_BAGS?.[quality];
            if (!bagConfig) return;

            items.push({
                id: `BAG:${quality}`,
                kind: 'UPGRADE',
                category: 'BAG',
                quality,
                priceLowStone: bagConfig.buyPriceLowStone || 0
            });
        });

        Object.entries(CONFIG.INSECT?.UNIQUE_ITEMS || {}).forEach(([uniqueKey, uniqueConfig]) => {
            items.push({
                id: `UNIQUE:${uniqueKey}`,
                kind: 'UNIQUE',
                category: uniqueKey === 'KHU_TRUNG_THUAT' ? 'INSECT_SKILL' : 'INSECT_ARTIFACT',
                quality: uniqueConfig.quality || 'HIGH',
                uniqueKey,
                priceLowStone: uniqueConfig.buyPriceLowStone || 0,
                isOneTime: true
            });
        });

        if (CONFIG.INSECT?.BEAST_BAG) {
            items.push({
                id: 'UNIQUE:LINH_THU_DAI',
                kind: 'UNIQUE',
                category: 'SPIRIT_BAG',
                quality: CONFIG.INSECT.BEAST_BAG.quality || 'HIGH',
                uniqueKey: 'LINH_THU_DAI',
                priceLowStone: CONFIG.INSECT.BEAST_BAG.buyPriceLowStone || 0,
                isOneTime: true
            });
        }

        const shopOrder = {
            SWORD_ART: -5,
            FLAME_ART: -4,
            INSECT_SKILL: -3,
            INSECT_ARTIFACT: -2,
            SPIRIT_BAG: -1.5,
            BAG: -1,
            EXP: 0,
            INSIGHT: 1,
            ATTACK: 2,
            SHIELD_BREAK: 3,
            BERSERK: 4,
            RAGE: 5,
            MANA: 6,
            MAX_MANA: 7,
            REGEN: 8,
            SPEED: 9,
            FORTUNE: 10,
            BREAKTHROUGH: 11,
            SPECIAL: 12
        };

        return items.sort((a, b) => {
            const categoryDiff = (shopOrder[a.category] ?? 99) - (shopOrder[b.category] ?? 99);
            if (categoryDiff !== 0) return categoryDiff;

            return QUALITY_ORDER.indexOf(a.quality) - QUALITY_ORDER.indexOf(b.quality);
        });
    },

    collectDrop(dropSpec) {
        if (!dropSpec) return;

        if (dropSpec.kind === 'STONE') {
            const stoneType = this.getSpiritStoneType(dropSpec.quality);
            this.addSpiritStone(dropSpec.quality, 1);
            showNotify(`+1 ${stoneType.label}`, stoneType.color);
        } else if (dropSpec.kind === 'INSECT_EGG') {
            const species = this.getInsectSpecies(dropSpec.speciesKey);
            this.addInsectEgg(dropSpec.speciesKey, 1);
            showNotify(`+1 Trung ${species?.name || 'ky trung'}`, species?.eggColor || species?.color || '#79ffd4');
        } else {
            if (!this.hasInventorySpaceForSpec(dropSpec)) {
                const qualityConfig = this.getItemQualityConfig(dropSpec);
                showNotify('Túi trữ vật đã đầy, hãy mở rộng thêm dung tích.', qualityConfig.color || '#ff8a80');
                return;
            }

            const item = this.addInventoryItem(dropSpec, 1);
            const qualityConfig = this.getItemQualityConfig(item);
            showNotify(`+1 ${this.getItemDisplayName(item)}`, qualityConfig.color);
        }

        this.refreshResourceUI();
    },

    refreshResourceUI() {
        this.renderExpUI();

        if (ShopUI && typeof ShopUI.render === 'function') {
            ShopUI.render();
        }

        if (InventoryUI && typeof InventoryUI.render === 'function') {
            InventoryUI.render();
        }

        if (ProfileUI && typeof ProfileUI.render === 'function') {
            ProfileUI.render();
        }

        if (SkillsUI && typeof SkillsUI.isOpen === 'function' && SkillsUI.isOpen()) {
            SkillsUI.render();
        }

        if (InsectBookUI && typeof InsectBookUI.isOpen === 'function' && InsectBookUI.isOpen()) {
            InsectBookUI.render();
        }

        this.renderAttackModeUI();
    },

    buyShopItem(itemId) {
        if (this.isVoidCollapsed) {
            showNotify('Thân thể đã tan vào hư vô, cần reload web để hồi phục', '#a778ff');
            return false;
        }

        const item = this.getShopItems().find(entry => entry.id === itemId);
        if (!item) return false;
        const qualityConfig = this.getItemQualityConfig(item);

        if (item.isOneTime && item.uniqueKey && this.hasUniquePurchase(item.uniqueKey)) {
            showNotify('Vật phẩm này chỉ có thể mua một lần.', qualityConfig.color || '#ffd36b');
            return false;
        }

        if (item.category === 'BAG' && !this.canUpgradeInventoryCapacity(item)) {
            showNotify('Túi hiện tại của ngươi đã rộng hơn hoặc bằng loại này.', '#ffd36b');
            return false;
        }

        if (item.category === 'SPIRIT_BAG' && Math.floor((qualityConfig.capacity || 0)) <= this.getBeastBagCapacity()) {
            showNotify('Linh Thú Đại hiện tại đã đạt mức này hoặc hơn.', qualityConfig.color || '#ffd36b');
            return false;
        }

        const requiresInventorySpace = !['BAG', 'SPIRIT_BAG'].includes(item.category);
        if (requiresInventorySpace && !this.hasInventorySpaceForSpec(item)) {
            showNotify('Túi trữ vật đã đầy, không thể mua thêm vật phẩm mới.', '#ff8a80');
            return false;
        }

        if (!this.spendSpiritStones(item.priceLowStone)) {
            showNotify("Linh thạch không đủ để giao dịch", "#ff8a80");
            return false;
        }

        if (item.category === 'BAG') {
            const qualityConfig = this.getItemQualityConfig(item);
            const previousCapacity = this.getInventoryCapacity();
            this.upgradeInventoryCapacity(qualityConfig.capacity || previousCapacity);

            showNotify(
                `Túi trữ vật mở rộng lên ${formatNumber(this.getInventoryCapacity())} ô (+${formatNumber(Math.max(0, this.getInventoryCapacity() - previousCapacity))} ô)`,
                qualityConfig.color
            );
            this.refreshResourceUI();
            return true;
        }

        if (item.category === 'SPIRIT_BAG') {
            const previousCapacity = this.getBeastBagCapacity();
            this.beastBagCapacity = Math.max(previousCapacity, Math.floor(qualityConfig.capacity || previousCapacity));
            if (item.uniqueKey) this.markUniquePurchase(item.uniqueKey);

            showNotify(
                `Linh Thú Đại mở rộng lên ${formatNumber(this.getBeastBagCapacity())} ô (+${formatNumber(Math.max(0, this.getBeastBagCapacity() - previousCapacity))} ô)`,
                qualityConfig.color
            );
            this.refreshResourceUI();
            return true;
        }

        const addedItem = this.addInventoryItem(item, 1);
        if (item.isOneTime && item.uniqueKey) {
            this.markUniquePurchase(item.uniqueKey);
        }
        showNotify(`Đã mua ${this.getItemDisplayName(addedItem)}`, this.getItemQualityConfig(addedItem).color);
        this.refreshResourceUI();
        return true;
    },

    getInventorySellPrice(item) {
        if (!item) return 0;
        if (['INSECT_ARTIFACT', 'INSECT_SKILL', 'SWORD_ART', 'FLAME_ART'].includes(item.category)) return 0;

        const qualityConfig = this.getItemQualityConfig(item);
        const buyPrice = Math.max(0, qualityConfig.buyPriceLowStone || 0);
        const ratio = Math.max(0, parseFloat(CONFIG.ITEMS.SELLBACK_RATIO) || 0);

        return Math.max(1, Math.floor(buyPrice * ratio));
    },

    sellInventoryItem(itemKey) {
        const item = this.inventory[itemKey];
        if (!item || item.count <= 0) return false;

        const sellPrice = this.getInventorySellPrice(item);
        if (sellPrice <= 0) return false;

        item.count--;
        if (item.count <= 0) delete this.inventory[itemKey];

        this.setSpiritStoneTotalValue(this.getSpiritStoneTotalValue() + sellPrice);
        showNotify(`Bán ${this.getItemDisplayName(item)}: +${formatNumber(sellPrice)} hạ phẩm linh thạch`, this.getItemQualityConfig(item).color);
        this.refreshResourceUI();
        return true;
    },

    useInventoryItem(itemKey) {
        const item = this.inventory[itemKey];
        if (!item || item.count <= 0) return false;

        if (this.isVoidCollapsed) {
            showNotify('Thân thể đã tan vào hư vô, cần reload web để hồi phục', '#a778ff');
            return false;
        }

        const qualityConfig = this.getItemQualityConfig(item);

        if (item.category === 'INSECT_ARTIFACT') {
            if (InsectBookUI && typeof InsectBookUI.open === 'function') {
                InsectBookUI.open();
                showNotify(`Mở ${this.getItemDisplayName(item)}`, qualityConfig.color || '#ffd871');
                return true;
            }
            return false;
        }

        if (item.category === 'SWORD_ART' && this.hasDaiCanhKiemTranUnlocked()) {
            showNotify(`${this.getItemDisplayName(item)} đã nhập tâm, không thể lĩnh ngộ thêm.`, qualityConfig.color || '#8fffe0');
            return false;
        }

        if (item.category === 'FLAME_ART' && this.hasCanLamBangDiemUnlocked()) {
            showNotify(`${this.getItemDisplayName(item)} đã được luyện hóa vào thần thức.`, qualityConfig.color || '#79d9ff');
            return false;
        }

        if (item.category === 'INSECT_SKILL' && this.hasKhuTrungThuatUnlocked()) {
            showNotify(`${this.getItemDisplayName(item)} đã lĩnh ngộ xong, không thể lĩnh ngộ thêm.`, qualityConfig.color || '#79ffd4');
            return false;
        }

        if (item.category === 'BREAKTHROUGH' && !this.isInventoryItemUsable(item)) {
            showNotify(`Đan này chỉ hợp để đột phá ${item.realmName}`, "#ffd36b");
            return false;
        }

        item.count--;
        if (item.count <= 0) delete this.inventory[itemKey];

        if (item.category === 'EXP') {
            const rank = this.getCurrentRank();
            if (!rank) return false;

            const expGain = Math.max(1, Math.round(rank.exp * qualityConfig.expFactor * this.getExpGainMultiplier()));
            this.updateExp(expGain);
            showNotify(`Dùng ${this.getItemDisplayName(item)}: +${formatNumber(expGain)} tu vi`, qualityConfig.color);
            this.refreshResourceUI();
            return true;
        }

        if (item.category === 'BREAKTHROUGH') {
            const rank = this.getCurrentRank();
            if (!rank) return false;

            const maxAllowed = CONFIG.CULTIVATION.MAX_BREAKTHROUGH_CHANCE || 0.99;
            const currentTotal = Math.min(maxAllowed, rank.chance + this.breakthroughBonus);
            const maxBonus = Math.max(0, maxAllowed - rank.chance);
            const nextBonus = Math.min(maxBonus, this.breakthroughBonus + qualityConfig.breakthroughBoost);
            const appliedBoost = Math.min(maxAllowed, rank.chance + nextBonus) - currentTotal;

            if (appliedBoost <= 0) {
                this.addInventoryItem(item, 1);
                showNotify("Dược lực đã chạm giới hạn đột phá", "#ffd36b");
                return false;
            }

            this.breakthroughBonus = nextBonus;
            showNotify(`Dùng ${this.getItemDisplayName(item)}: +${Math.round(appliedBoost * 100)}% tỉ lệ đột phá`, qualityConfig.color);
            this.refreshResourceUI();
            return true;
        }

        switch (item.category) {
            case 'SWORD_ART':
                this.unlockCultivationArt('DAI_CANH_KIEM_TRAN');
                syncSwordFormation();
                showNotify(`Lĩnh ngộ ${this.getItemDisplayName(item)}: kiếm trận đã triển khai ${formatNumber(this.getUnlockedSwordTargetCount())} kiếm.`, qualityConfig.color);
                this.refreshResourceUI();
                return true;
            case 'FLAME_ART':
                this.unlockCultivationArt('CAN_LAM_BANG_DIEM');
                showNotify(`Luyện hóa ${this.getItemDisplayName(item)}: lam diễm đã hiện nơi đầu niệm.`, qualityConfig.color);
                this.refreshResourceUI();
                return true;
            case 'INSECT_SKILL':
                this.unlockCultivationArt('KHU_TRUNG_THUAT');
                this.renderAttackModeUI();
                showNotify(`Lĩnh ngộ ${this.getItemDisplayName(item)}: có thể dùng linh trùng làm công sát mới.`, qualityConfig.color);
                this.refreshResourceUI();
                return true;
            case 'INSIGHT':
                this.bonusStats.expGainPct += qualityConfig.expGainPct || 0;
                showNotify(`Dùng ${this.getItemDisplayName(item)}: +${Math.round((qualityConfig.expGainPct || 0) * 100)}% tu vi thu hoạch`, qualityConfig.color);
                break;
            case 'ATTACK':
                this.bonusStats.attackPct += qualityConfig.attackPct || 0;
                showNotify(`Dùng ${this.getItemDisplayName(item)}: +${Math.round((qualityConfig.attackPct || 0) * 100)}% công kích`, qualityConfig.color);
                break;
            case 'SHIELD_BREAK':
                this.bonusStats.shieldBreakPct += qualityConfig.shieldBreakPct || 0;
                showNotify(`Dùng ${this.getItemDisplayName(item)}: +${Math.round((qualityConfig.shieldBreakPct || 0) * 100)}% phá khiên`, qualityConfig.color);
                break;
            case 'BERSERK':
                this.consumeBerserkPill(item, qualityConfig);
                break;
            case 'RAGE':
                this.addRage(qualityConfig.rageGain || 0);
                showNotify(`Dùng ${this.getItemDisplayName(item)}: +${Math.round(qualityConfig.rageGain || 0)} nộ`, qualityConfig.color);
                break;
            case 'MANA':
                this.updateMana(qualityConfig.manaRestore || 0);
                showNotify(`Dùng ${this.getItemDisplayName(item)}: hồi ${Math.round(qualityConfig.manaRestore || 0)} linh lực`, qualityConfig.color);
                break;
            case 'MAX_MANA':
                this.bonusStats.maxManaFlat += qualityConfig.maxManaFlat || 0;
                this.syncDerivedStats();
                this.updateMana(qualityConfig.maxManaFlat || 0);
                showNotify(`Dùng ${this.getItemDisplayName(item)}: +${Math.round(qualityConfig.maxManaFlat || 0)} giới hạn linh lực`, qualityConfig.color);
                break;
            case 'REGEN':
                this.bonusStats.manaRegenPct += qualityConfig.manaRegenPct || 0;
                showNotify(`Dùng ${this.getItemDisplayName(item)}: +${Math.round((qualityConfig.manaRegenPct || 0) * 100)}% hồi linh`, qualityConfig.color);
                break;
            case 'SPEED':
                this.bonusStats.speedPct += qualityConfig.speedPct || 0;
                showNotify(`Dùng ${this.getItemDisplayName(item)}: +${Math.round((qualityConfig.speedPct || 0) * 100)}% tốc độ`, qualityConfig.color);
                break;
            case 'FORTUNE':
                this.bonusStats.dropRatePct += qualityConfig.dropRatePct || 0;
                showNotify(`Dùng ${this.getItemDisplayName(item)}: +${Math.round((qualityConfig.dropRatePct || 0) * 100)}% vận khí`, qualityConfig.color);
                break;
            case 'SPECIAL':
                if (item.specialKey === 'CHUNG_CUC_DAO_NGUYEN_DAN') {
                    if (!this.applyChungCucDaoNguyenDan(item, qualityConfig)) {
                        this.addInventoryItem(item, 1);
                        return false;
                    }
                } else if (item.specialKey === 'TAN_DAO_DIET_NGUYEN_DAN') {
                    if (!this.applyTanDaoDietNguyenDan(item, qualityConfig)) {
                        this.addInventoryItem(item, 1);
                        return false;
                    }
                } else {
                    this.addInventoryItem(item, 1);
                    return false;
                }
                break;
            default:
                this.addInventoryItem(item, 1);
                return false;
        }

        this.refreshResourceUI();
        return true;
    },

    executeBreakthrough(isForced = false) {
        if (this.isVoidCollapsed) {
            showNotify('Thân thể đã tan vào hư vô, cần reload web để hồi phục', '#a778ff');
            return;
        }

        const currentRank = this.getCurrentRank();
        if (!currentRank) return;

        const pillBoost = this.calculateTotalPillBoost();
        let totalChance = currentRank.chance + pillBoost;

        const maxAllowed = CONFIG.CULTIVATION.MAX_BREAKTHROUGH_CHANCE || 0.95;
        totalChance = Math.min(maxAllowed, totalChance);

        if (Math.random() <= totalChance) {
            this.exp = 0;
            this.rankIndex++;
            this.isReadyToBreak = false;
            this.breakthroughBonus = 0;

            const nextRank = CONFIG.CULTIVATION.RANKS[this.rankIndex];
            if (nextRank) {
                this.syncDerivedStats();

                if (isForced) {
                    showNotify(`CƯỜNG ÉP ĐỘT PHÁ THÀNH CÔNG: ${nextRank.name.toUpperCase()}`, "#ff8800");
                } else {
                    this.mana = this.maxMana;
                    showNotify(`ĐỘT PHÁ THÀNH CÔNG: ${nextRank.name.toUpperCase()}`, "#ffcc00");
                }
            }
            this.createLevelUpExplosion(this.x, this.y, nextRank?.color || currentRank.color);
        } else {
            const penaltyFactor = CONFIG.CULTIVATION.BREAKTHROUGH_PENALTY_FACTOR;
            const penalty = Math.floor(this.exp * penaltyFactor);

            this.exp -= penalty;
            this.isReadyToBreak = false;
            this.breakthroughBonus *= 0.5;

            const penaltyPercent = Math.round(penaltyFactor * 100);
            showNotify(`ĐỘT PHÁ THẤT BẠI! Tâm ma phản phệ (-${penaltyPercent}% tu vi)`, "#ff4444");
            this.triggerExpError();
        }

        this.refreshResourceUI();
        this.renderManaUI();
    },

    renderExpUI() {
        const rank = this.getCurrentRank();
        if (!rank) return;

        this.syncDerivedStats();

        const barExp = document.getElementById('exp-bar');
        const textExp = document.getElementById('exp-text');
        const rankText = document.getElementById('cultivation-rank');
        const breakthroughGroup = document.querySelector('.breakthrough-group');

        const pillBoost = this.calculateTotalPillBoost();
        const maxAllowed = CONFIG.CULTIVATION.MAX_BREAKTHROUGH_CHANCE || 0.99;
        const totalChance = Math.min(maxAllowed, rank.chance + pillBoost);
        const basePercent = Math.round(rank.chance * 100);
        const bonusPercent = Math.round(pillBoost * 100);
        const totalPercent = Math.round(totalChance * 100);

        if (textExp) {
            const statusText = this.isVoidCollapsed
                ? `<span style="color:#b48cff; font-weight:bold;">THÂN THỂ ĐÃ TAN VÀO HƯ VÔ - RELOAD WEB ĐỂ HỒI PHỤC</span>`
                : this.isReadyToBreak ?
                `<span style="color:#ffcc00; font-weight:bold;">SẴN SÀNG ĐỘT PHÁ</span>` :
                `Tu vi: ${formatNumber(this.exp)}/${formatNumber(rank.exp)}`;

            textExp.innerHTML = `${statusText} | ` +
                `<span style="color:#86fff0">Cơ sở: ${basePercent}%</span> | ` +
                `<span style="color:#ffd36b">Đan trợ lực: +${bonusPercent}%</span> | ` +
                `<span style="color:#ff9ef7">Tổng TL: ${totalPercent}%</span>`;
        }

        if (breakthroughGroup) {
            if (this.isReadyToBreak) breakthroughGroup.classList.add('is-active');
            else breakthroughGroup.classList.remove('is-active');
        }

        const percentage = (this.exp / rank.exp) * 100;
        if (barExp) {
            barExp.style.width = Math.min(100, percentage) + '%';
            barExp.style.background = `linear-gradient(90deg, ${rank.lightColor}, ${rank.color})`;

            if (this.isReadyToBreak) {
                barExp.style.boxShadow = `0 0 15px #fff, 0 0 5px ${rank.color}`;
                barExp.classList.add('exp-full-glow');
            } else {
                barExp.style.boxShadow = `0 0 10px ${rank.lightColor}`;
                barExp.classList.remove('exp-full-glow');
            }
        }

        if (rankText) {
            rankText.innerText = `Cảnh giới: ${rank.name}`;
            rankText.style.color = rank.color;
        }
        if (ProfileUI && typeof ProfileUI.isOpen === 'function' && ProfileUI.isOpen()) {
            ProfileUI.render();
        }
    },

    triggerExpError() {
        const el = document.getElementById('exp-container');
        el.classList.add('shake-red');
        setTimeout(() => el.classList.remove('shake-red'), 500);
    },

    update(dt) { // Nhận thêm tham số dt
        this.updateUltimateState();
        this.updateActiveEffects();

        if (this.isVoidCollapsed) {
            this.isAttacking = false;
            this.stopMoveJoystick();
            return;
        }

        const joystickTarget = this.getMoveJoystickTarget();
        if (joystickTarget) {
            this.x = joystickTarget.x;
            this.y = joystickTarget.y;
        } else if (this.isTouchDevice) {
            this.x = guardCenter.x;
            this.y = guardCenter.y;
        } else {
            const worldPos = Camera.screenToWorld(this.screenX, this.screenY);
            this.x = worldPos.x;
            this.y = worldPos.y;
        }

        // Tính tốc độ di chuyển của con trỏ/ngón tay
        this.speed = Math.hypot(this.x - this.px, this.y - this.py);
        this.px = this.x; this.py = this.y;

        this.ensureValidAttackMode();

        // Gọi hàm xử lý tiêu hao mana
        this.processActiveConsumption(dt);
    },

    handleMove(e) {
        if (this.isVoidCollapsed) return;
        if (this.isTouchDevice) return;
        if (e.target.closest('.btn')) return;

        // Pointermove hoạt động cho cả chuột và touch di chuyển
        const p = e.touches ? e.touches[0] : e;
        this.screenX = p.clientX;
        this.screenY = p.clientY;
    },

    handleDown(e) {
        if (this.isVoidCollapsed) return;
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
        if (this.isVoidCollapsed) return;
        // Chỉ xử lý handleUp cho chuột trên desktop
        if (!this.isTouchDevice) {
            this.isAttacking = false;
            clearTimeout(this.attackTimer);
        }
    },

    handleWheel(e) {
        const delta = -e.deltaY * CONFIG.ZOOM.SENSITIVITY;
        Camera.adjustZoom(delta);
    },

    getSwarmVisualCount() {
        return Math.max(0, Math.min(Math.floor(CONFIG.INSECT?.ATTACK?.VISUAL_LIMIT || 0), this.getTotalTamedInsectCount()));
    },

    pickOwnedInsectSpeciesKey() {
        const weighted = this.getActiveInsectSpeciesKeys().reduce((rates, speciesKey) => {
            rates[speciesKey] = Math.max(0.05, this.tamedInsects[speciesKey] || 0);
            return rates;
        }, {});

        return pickWeightedKey(weighted, this.getActiveInsectSpeciesKeys()[0] || null);
    },

    updateInsectSwarm(dt, enemies, scaleFactor) {
        const cfg = CONFIG.INSECT?.ATTACK || {};
        const shouldRender = this.attackMode === 'INSECT' && this.canUseInsectAttackMode() && !this.isUltMode && !this.isUltimateBusy();

        if (!shouldRender) {
            this.insectCombat.visuals = [];
            return;
        }

        const visualCount = this.getSwarmVisualCount();
        const centerX = this.x;
        const centerY = this.y;
        const visuals = this.insectCombat.visuals || [];
        const minRadius = Math.max(8, cfg.VISUAL_MIN_RADIUS || 18) * scaleFactor;
        const maxRadius = Math.max(minRadius + 4, cfg.VISUAL_MAX_RADIUS || 70) * scaleFactor;
        const jitter = Math.max(2, cfg.VISUAL_JITTER || 10) * scaleFactor;

        while (visuals.length < visualCount) {
            const speciesKey = this.pickOwnedInsectSpeciesKey();
            const species = this.getInsectSpecies(speciesKey);

            visuals.push({
                speciesKey,
                angle: Math.random() * Math.PI * 2,
                radius: random(minRadius, maxRadius),
                targetRadius: random(minRadius, maxRadius),
                speed: random(1.4, 3.2),
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: random(1.2, 2.8),
                size: random(2, 3.8) * (species?.tier === 'DE' ? 1.18 : 1),
                x: centerX,
                y: centerY
            });
        }

        if (visuals.length > visualCount) {
            visuals.length = visualCount;
        }

        visuals.forEach(node => {
            if (!this.tamedInsects[node.speciesKey]) {
                node.speciesKey = this.pickOwnedInsectSpeciesKey() || node.speciesKey;
            }

            node.angle += dt * node.speed * (this.isAttacking ? 2.6 : 1.6);
            node.wobble += dt * node.wobbleSpeed;
            node.targetRadius += random(-8, 8) * dt * 10;
            node.targetRadius = Math.max(minRadius, Math.min(maxRadius, node.targetRadius));
            node.radius += (node.targetRadius - node.radius) * 0.08;

            const swirlX = Math.cos(node.angle) * node.radius;
            const swirlY = Math.sin(node.angle * 1.18 + node.wobble) * (node.radius * 0.72);
            const chaosX = Math.cos(node.wobble * 1.7 + node.angle * 0.45) * jitter;
            const chaosY = Math.sin(node.wobble * 1.35 - node.angle * 0.4) * jitter;

            node.x = centerX + swirlX + chaosX;
            node.y = centerY + swirlY + chaosY;
        });

        this.insectCombat.visuals = visuals;

        if (!this.isAttacking) return;

        const now = performance.now();
        const hitInterval = Math.max(60, cfg.HIT_INTERVAL_MS || 220);
        if (now - (this.insectCombat.lastHitAt || 0) < hitInterval) return;

        this.insectCombat.lastHitAt = now;

        const totalInsects = Math.max(1, this.getTotalTamedInsectCount());
        const targetRange = Math.max(60, cfg.TARGET_RANGE || 220);
        const damageFactor = Math.max(
            0.18,
            (cfg.BASE_DAMAGE_FACTOR || 0.45) + (Math.floor(totalInsects / 5) * (cfg.BONUS_DAMAGE_PER_5 || 0.08))
        );
        const targetCount = Math.max(1, Math.min(4, Math.ceil(totalInsects / 10)));
        const targets = enemies
            .filter(enemy => Math.hypot(enemy.x - centerX, enemy.y - centerY) <= targetRange)
            .sort((a, b) => Math.hypot(a.x - centerX, a.y - centerY) - Math.hypot(b.x - centerX, b.y - centerY))
            .slice(0, targetCount);

        if (!targets.length) return;

        const pseudoSwarm = {
            getDamageMultiplier: () => damageFactor,
            powerPenalty: damageFactor
        };

        let shieldHits = 0;
        let killCount = 0;

        targets.forEach(target => {
            const result = target.hit(pseudoSwarm);

            if (result === 'shielded') shieldHits++;
            if (result === 'killed') killCount++;

            if (result === 'hit' || result === 'killed' || result === 'shielded') {
                this.createAttackBurst?.(target.x, target.y, result === 'shielded' ? '#ffb26b' : '#79ffd4');
            }
        });

        const casualtyKey = shieldHits > 0
            ? this.loseRandomTamedInsect(1 - Math.pow(1 - Math.max(0, Math.min(1, cfg.DEATH_ON_SHIELD_CHANCE || 0)), shieldHits))
            : this.loseRandomTamedInsect(cfg.DEATH_ON_HIT_CHANCE || 0);

        if (casualtyKey) {
            const species = this.getInsectSpecies(casualtyKey);
            showNotify(`1 ${species?.name || 'linh trùng'} tan lạc trong giao tranh`, species?.color || '#ff8a80');
            this.refreshResourceUI();
        }

        if (killCount > 0) {
            let bornCount = 0;
            for (let i = 0; i < killCount; i++) {
                if (this.reproduceRandomInsect(cfg.REPRODUCE_ON_KILL_CHANCE || 0)) {
                    bornCount++;
                }
            }

            if (bornCount > 0) {
                showNotify(`Đàn trùng sinh sôi thêm ${formatNumber(bornCount)} con`, '#79ffd4');
                this.refreshResourceUI();
            }
        }
    },

    drawInsectSwarm(ctx, scaleFactor) {
        if (!this.insectCombat.visuals?.length) return;

        ctx.save();
        ctx.lineWidth = 1;

        this.insectCombat.visuals.forEach((node, index) => {
            const species = this.getInsectSpecies(node.speciesKey);
            const color = species?.color || '#79ffd4';
            const size = Math.max(1.8, node.size * scaleFactor);

            if (index > 0) {
                const prev = this.insectCombat.visuals[index - 1];
                ctx.beginPath();
                ctx.strokeStyle = `${color}22`;
                ctx.moveTo(prev.x, prev.y);
                ctx.lineTo(node.x, node.y);
                ctx.stroke();
            }

            ctx.beginPath();
            ctx.shadowBlur = 14;
            ctx.shadowColor = color;
            ctx.fillStyle = color;
            ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    },

    // Hàm tạo hiệu ứng hạt bùng nổ
    createLevelUpExplosion(x, y, color) {
        const accent = color || "#78f2ff";
        const palette = [accent, "#ffffff", "#8df6ff", "#ffe39b", "#7ad7ff"];

        visualParticles.push(
            {
                type: 'ring',
                x,
                y,
                radius: 14,
                radialVelocity: 4.4,
                lineWidth: 3.4,
                life: 1,
                decay: 0.038,
                opacity: 0.9,
                color: accent,
                glow: 18
            },
            {
                type: 'ring',
                x,
                y,
                radius: 28,
                radialVelocity: 5.9,
                lineWidth: 2.4,
                life: 0.92,
                decay: 0.034,
                opacity: 0.72,
                color: "#ffe39b",
                glow: 16
            },
            {
                type: 'glow',
                x,
                y,
                size: 20,
                sizeVelocity: 0.9,
                life: 0.72,
                decay: 0.06,
                opacity: 0.3,
                color: accent,
                glow: 24
            }
        );

        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            visualParticles.push({
                type: 'ray',
                x,
                y,
                angle,
                radius: random(4, 12),
                radialVelocity: random(2.8, 4.6),
                length: random(14, 30),
                lengthVelocity: random(0.1, 0.4),
                lineWidth: random(1.5, 2.8),
                life: 0.86,
                decay: random(0.045, 0.06),
                opacity: 0.88,
                color: palette[i % palette.length],
                glow: 14
            });
        }

        for (let i = 0; i < 30; i++) {
            const angle = random(0, Math.PI * 2);
            const speed = random(2.5, 8.4);
            visualParticles.push({
                type: i % 5 === 0 ? 'square' : 'spark',
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - random(0.4, 1.6),
                gravity: 0.05,
                friction: 0.97,
                size: random(2.4, 5.6),
                sizeVelocity: -0.03,
                life: 1,
                decay: random(0.018, 0.032),
                opacity: 0.94,
                color: palette[i % palette.length],
                glow: 12,
                rotation: angle,
                rotationSpeed: random(-0.16, 0.16)
            });
        }

        return;
    },

    createAttackBurst(x, y, color = "#ffcc00") {
        const palette = [color, "#fff1a8", "#ffd36b", "#ff9d4d"];

        visualParticles.push({
            type: 'ring',
            x,
            y,
            radius: 8,
            radialVelocity: 3.8,
            lineWidth: 2.2,
            life: 0.9,
            decay: 0.1,
            opacity: 0.82,
            color,
            glow: 12
        });

        for (let i = 0; i < 14; i++) {
            const angle = (Math.PI * 2 * i) / 14 + random(-0.12, 0.12);
            const speed = random(2.4, 5.8);
            visualParticles.push({
                type: i % 4 === 0 ? 'square' : 'spark',
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: random(2, 4.8),
                sizeVelocity: -0.04,
                friction: 0.95,
                life: 0.85,
                decay: random(0.055, 0.085),
                color: palette[i % palette.length],
                glow: 10,
                rotation: angle,
                rotationSpeed: random(-0.14, 0.14)
            });
        }
    },

    drawCursorSeed(ctx, scaleFactor) {
        const cursorConfig = CONFIG.CURSOR || {};
        const dotRadius = Math.max(1, (cursorConfig.BASE_DOT_RADIUS || 3.2) * scaleFactor);
        const ringRadius = Math.max(dotRadius + (2 * scaleFactor), (cursorConfig.BASE_RING_RADIUS || 7.5) * scaleFactor);

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.shadowBlur = (cursorConfig.BASE_GLOW_BLUR || 10) * scaleFactor;
        ctx.shadowColor = cursorConfig.BASE_GLOW_COLOR || 'rgba(143, 255, 224, 0.42)';

        ctx.beginPath();
        ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = cursorConfig.BASE_RING_COLOR || 'rgba(143, 255, 224, 0.32)';
        ctx.lineWidth = Math.max(1, scaleFactor);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = cursorConfig.BASE_DOT_COLOR || '#f3fffd';
        ctx.arc(0, 0, dotRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    drawCursor(ctx, scaleFactor) {
        if (this.hasCanLamBangDiemUnlocked()) {
            this.drawFlame(ctx, scaleFactor);
            return;
        }

        this.drawCursorSeed(ctx, scaleFactor);
    },

    drawFlame(ctx, scaleFactor) {
        const time = performance.now() * 0.003;
        const aura = this.getAuraPalette();
        ctx.save();
        ctx.translate(this.x, this.y);

        // 1. Quầng sáng lạnh (Aura Băng Diễm)
        // Càng Lam Băng Diễm có đặc điểm tỏa ra hàn khí màu xanh lam nhạt
        ctx.shadowBlur = 20 * scaleFactor;
        ctx.shadowColor = aura.shadowColor;

        // 2. Định nghĩa các lớp màu "Càng Lam"
        // Lớp 1: Lam đậm (viền ngoài)
        // Lớp 2: Lam băng (thân lửa)
        // Lớp 3: Thiên lam trắng (lõi hỏa rực cháy)
        const layers = aura.layers;

        layers.forEach((layer, i) => {
            const flicker = Math.sin(time * layer.f + i) * 3;
            const w = (layer.w + flicker/2) * scaleFactor;
            const h = (layer.h + flicker) * scaleFactor;

            ctx.beginPath();
            ctx.fillStyle = layer.color;
            
            // Vẽ dáng lửa hơi nhọn và mảnh hơn (nhìn sắc lạnh hơn)
            ctx.moveTo(0, 0); 
            ctx.bezierCurveTo(-w, 0, -w/2, -h * 0.6, 0, -h); 
            ctx.bezierCurveTo(w/2, -h * 0.6, w, 0, 0, 0);    
            ctx.fill();
        });

        // 3. Hàn khí (Các đốm sáng nhỏ li ti bay lên)
        for (let j = 0; j < 4; j++) {
            const pOffset = (time * 0.8 + j * 0.4) % 1.2;
            const px = Math.sin(time * 1.5 + j) * 8 * scaleFactor;
            const py = -pOffset * 25 * scaleFactor;
            const pr = (1.8 * (1.2 - pOffset)) * scaleFactor;

            ctx.beginPath();
            ctx.arc(px, py, Math.max(0, pr), 0, Math.PI * 2);
            ctx.fillStyle = aura.particleColor;
            ctx.fill();
        }

        ctx.restore();
    },
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

    if (e.key.toLowerCase() === 'p') {
        CONFIG.SWORD.IS_PAUSED = !CONFIG.SWORD.IS_PAUSED;
        console.log("Trạng thái tạm dừng xoay:", CONFIG.SWORD.IS_PAUSED);
    }
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

const SettingsUI = {
    overlay: document.getElementById('settings-popup'),
    btnOpen: document.getElementById('btn-settings'),
    btnClose: document.getElementById('close-settings'),
    btnSave: document.getElementById('save-settings'),
    btnReset: document.getElementById('reset-settings'),

    init() {
        if (!this.overlay || !this.btnOpen) return;

        // Tải dữ liệu đã lưu từ trước khi khởi tạo UI
        this.load();

        // 1. Mở popup
        this.btnOpen.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            this.open();
        });

        // 2. Cho phép tương tác với nội dung bên trong popup
        const content = this.overlay.querySelector('.popup-content');
        if (content) {
            content.addEventListener('pointerdown', (e) => {
                e.stopPropagation(); 
            });
        }

        // 3. Nút đóng
        if (this.btnClose) {
            this.btnClose.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                this.close();
            });
        }

        // 4. Nút lưu
        if (this.btnSave) {
            this.btnSave.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                this.save();
            });
        }
        
        // 5. Đóng khi nhấn ra ngoài vùng trống (overlay)
        this.overlay.addEventListener('pointerdown', (e) => {
            if (e.target === this.overlay) {
                e.stopPropagation();
                this.close();
            }
        });

        // 6. Sự kiện nút Khôi Phục
        if (this.btnReset) {
            this.btnReset.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                if (confirm("Ngươi chắc chắn muốn khôi phục toàn bộ quy tắc Thiên Đạo về mặc định?")) {
                    this.reset();
                }
            });
        }
    },

    /**
     * Tải cấu hình từ LocalStorage và áp dụng vào object CONFIG toàn cục
     */
    load() {
        const savedData = localStorage.getItem('thanh_truc_settings');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed?.SWORD?.REGEN_INTERVAL_MS !== undefined && parsed?.MANA?.REGEN_INTERVAL_MS === undefined) {
                    parsed.MANA = parsed.MANA || {};
                    parsed.MANA.REGEN_INTERVAL_MS = parsed.SWORD.REGEN_INTERVAL_MS;
                }
                // Sử dụng đệ quy nhẹ hoặc gán tay để đảm bảo không làm mất các reference gốc
                // Ở đây gán trực tiếp các nhánh chính của CONFIG
                if (parsed.BG) Object.assign(CONFIG.BG, parsed.BG);
                if (parsed.ZOOM) Object.assign(CONFIG.ZOOM, parsed.ZOOM);
                if (parsed.COLORS) Object.assign(CONFIG.COLORS, parsed.COLORS);
                if (parsed.SWORD) Object.assign(CONFIG.SWORD, parsed.SWORD);
                if (parsed.ENEMY) Object.assign(CONFIG.ENEMY, parsed.ENEMY);
                if (parsed.MANA) Object.assign(CONFIG.MANA, parsed.MANA);
                if (parsed.ITEMS) Object.assign(CONFIG.ITEMS, parsed.ITEMS);
                if (parsed.PILL) Object.assign(CONFIG.PILL, parsed.PILL);
                if (parsed.SPIRIT_STONE) Object.assign(CONFIG.SPIRIT_STONE, parsed.SPIRIT_STONE);
                if (parsed.ULTIMATE) Object.assign(CONFIG.ULTIMATE, parsed.ULTIMATE);
                if (parsed.CULTIVATION) Object.assign(CONFIG.CULTIVATION, parsed.CULTIVATION);

                Input.maxRage = Math.max(1, parseInt(CONFIG.ULTIMATE.MAX_RAGE, 10) || 100);
                Input.rage = Math.min(Input.rage, Input.maxRage);
                Input.syncDerivedStats();
                Input.renderManaUI();
                Input.renderRageUI();
                
                console.log("Thiên Thư đã được phục hồi từ LocalStorage.");
            } catch (err) {
                console.error("Lỗi đọc Thiên Thư:", err);
            }
        }
    },

    close() {
        this.overlay.classList.remove('show');
        setTimeout(() => {
            if (!this.overlay.classList.contains('show')) {
                this.overlay.style.display = 'none';
            }
        }, 300);
        document.body.style.cursor = 'none';
    },

    open() {
        document.body.style.cursor = 'default';
        
        // Cập nhật giá trị hiện tại của CONFIG vào các ô input trong HTML
        const mapping = {
            'cfg-bg-star-count': CONFIG.BG.STAR_COUNT,
            'cfg-bg-star-min': CONFIG.BG.STAR_SIZE.MIN,
            'cfg-bg-star-twinkle': CONFIG.BG.STAR_TWINKLE_SPEED,
            'cfg-zoom-smooth': CONFIG.ZOOM.SMOOTH,
            'cfg-zoom-sens': CONFIG.ZOOM.SENSITIVITY,
            'cfg-col-bg-fade': CONFIG.COLORS.BG_FADE,
            
            'cfg-sw-count': CONFIG.SWORD.COUNT,
            'cfg-sw-radius': CONFIG.SWORD.BASE_RADIUS,
            'cfg-sw-spacing': CONFIG.SWORD.LAYER_SPACING,
            'cfg-sw-spin': CONFIG.SWORD.SPIN_SPEED_BASE,
            'cfg-sw-speed-mult': CONFIG.SWORD.SPEED_MULT,
            'cfg-sw-trail': CONFIG.SWORD.TRAIL_LENGTH,
            'cfg-sw-size': CONFIG.SWORD.SIZE,
            'cfg-sw-respawn': CONFIG.SWORD.RESPAWN_DELAY_MS,
            'cfg-sw-death-wait': CONFIG.SWORD.DEATH_WAIT_MS,
            'cfg-sw-breath': CONFIG.SWORD.BREATH_SPEED.MIN,
            'cfg-sw-stun': CONFIG.SWORD.STUN_DURATION_MS,
            'cfg-sw-paused': CONFIG.SWORD.IS_PAUSED ? 1 : 0,

            'cfg-en-spawn': CONFIG.ENEMY.SPAWN_COUNT,
            'cfg-en-elite': CONFIG.ENEMY.ELITE_CHANCE,
            'cfg-en-shield-ch': CONFIG.ENEMY.SHIELD_CHANCE,
            'cfg-en-shield-hp': CONFIG.ENEMY.SHIELD_HP_RATIO,
            'cfg-en-debris': CONFIG.ENEMY.DEBRIS.COUNT,

            'cfg-ma-regen': CONFIG.MANA.REGEN_PER_SEC,
            'cfg-ma-interval': CONFIG.MANA.REGEN_INTERVAL_MS,
            'cfg-ma-atk': CONFIG.MANA.COST_ATTACK_PER_SEC,
            'cfg-ma-move': CONFIG.MANA.COST_MOVE_PER_SEC,
            'cfg-ma-res-cost': Math.abs(CONFIG.MANA.COST_RESPAWN),
            'cfg-sw-change-form': CONFIG.MANA.COST_CHANGE_FORM,
            'cfg-sw-gain-kill': CONFIG.MANA.GAIN_KILL,

            'cfg-pi-chance': CONFIG.PILL.CHANCE,
            'cfg-st-chance': CONFIG.SPIRIT_STONE.CHANCE,
            'cfg-pi-magnet': CONFIG.PILL.MAGNET_SPEED,
            'cfg-pi-trail': CONFIG.PILL.TRAIL_LENGTH,
            'cfg-ul-max-rage': CONFIG.ULTIMATE.MAX_RAGE,
            'cfg-ul-gain-kill': CONFIG.ULTIMATE.GAIN_PER_KILL,
            'cfg-ul-duration': CONFIG.ULTIMATE.DURATION_MS,
            'cfg-ul-transition': CONFIG.ULTIMATE.TRANSITION_MS,
            'cfg-ul-steps': CONFIG.ULTIMATE.CHARGE_STEPS,
            'cfg-cu-penalty': CONFIG.CULTIVATION.BREAKTHROUGH_PENALTY_FACTOR,
            'cfg-cu-max-chance': CONFIG.CULTIVATION.MAX_BREAKTHROUGH_CHANCE
        };

        for (let id in mapping) {
            let el = document.getElementById(id);
            if (el) {
                const value = mapping[id];
                if (el.type === 'checkbox') {
                    el.checked = Boolean(value);
                } else {
                    el.value = (value !== undefined) ? value : "";
                }
            }
        }

        this.overlay.style.display = 'flex';
        setTimeout(() => this.overlay.classList.add('show'), 10);
    },

    save() {
        try {
            // 1. Cập nhật các giá trị từ UI vào object CONFIG
            CONFIG.BG.STAR_COUNT = parseInt(document.getElementById('cfg-bg-star-count').value);
            CONFIG.BG.STAR_SIZE.MIN = parseFloat(document.getElementById('cfg-bg-star-min').value);
            CONFIG.BG.STAR_TWINKLE_SPEED = parseFloat(document.getElementById('cfg-bg-star-twinkle').value);
            CONFIG.ZOOM.SMOOTH = parseFloat(document.getElementById('cfg-zoom-smooth').value);
            CONFIG.ZOOM.SENSITIVITY = parseFloat(document.getElementById('cfg-zoom-sens').value);
            CONFIG.COLORS.BG_FADE = document.getElementById('cfg-col-bg-fade').value;

            CONFIG.SWORD.COUNT = parseInt(document.getElementById('cfg-sw-count').value);
            CONFIG.SWORD.BASE_RADIUS = parseInt(document.getElementById('cfg-sw-radius').value);
            CONFIG.SWORD.LAYER_SPACING = parseInt(document.getElementById('cfg-sw-spacing').value);
            CONFIG.SWORD.SPIN_SPEED_BASE = parseFloat(document.getElementById('cfg-sw-spin').value);
            CONFIG.SWORD.SPEED_MULT = parseFloat(document.getElementById('cfg-sw-speed-mult').value);
            CONFIG.SWORD.TRAIL_LENGTH = parseInt(document.getElementById('cfg-sw-trail').value);
            CONFIG.SWORD.SIZE = parseInt(document.getElementById('cfg-sw-size').value);
            CONFIG.SWORD.RESPAWN_DELAY_MS = parseInt(document.getElementById('cfg-sw-respawn').value);
            CONFIG.SWORD.DEATH_WAIT_MS = parseInt(document.getElementById('cfg-sw-death-wait').value);
            CONFIG.SWORD.STUN_DURATION_MS = parseInt(document.getElementById('cfg-sw-stun').value);
            CONFIG.SWORD.IS_PAUSED = document.getElementById('cfg-sw-paused').checked;

            CONFIG.ENEMY.SPAWN_COUNT = parseInt(document.getElementById('cfg-en-spawn').value);
            CONFIG.ENEMY.ELITE_CHANCE = parseFloat(document.getElementById('cfg-en-elite').value);
            CONFIG.ENEMY.SHIELD_CHANCE = parseFloat(document.getElementById('cfg-en-shield-ch').value);
            CONFIG.ENEMY.SHIELD_HP_RATIO = parseFloat(document.getElementById('cfg-en-shield-hp').value);
            CONFIG.ENEMY.DEBRIS.COUNT = parseInt(document.getElementById('cfg-en-debris').value);

            CONFIG.MANA.REGEN_PER_SEC = parseFloat(document.getElementById('cfg-ma-regen').value);
            CONFIG.MANA.REGEN_INTERVAL_MS = parseInt(document.getElementById('cfg-ma-interval').value);
            CONFIG.MANA.COST_ATTACK_PER_SEC = parseFloat(document.getElementById('cfg-ma-atk').value);
            CONFIG.MANA.COST_MOVE_PER_SEC = parseFloat(document.getElementById('cfg-ma-move').value);
            CONFIG.MANA.COST_RESPAWN = -Math.abs(parseFloat(document.getElementById('cfg-ma-res-cost').value));
            CONFIG.MANA.COST_CHANGE_FORM = parseFloat(document.getElementById('cfg-sw-change-form').value);
            CONFIG.MANA.GAIN_KILL = parseFloat(document.getElementById('cfg-sw-gain-kill').value);
            
            CONFIG.PILL.CHANCE = parseFloat(document.getElementById('cfg-pi-chance').value);
            CONFIG.SPIRIT_STONE.CHANCE = parseFloat(document.getElementById('cfg-st-chance').value);
            CONFIG.PILL.MAGNET_SPEED = parseInt(document.getElementById('cfg-pi-magnet').value);
            CONFIG.PILL.TRAIL_LENGTH = parseInt(document.getElementById('cfg-pi-trail').value);
            CONFIG.ULTIMATE.MAX_RAGE = Math.max(1, parseInt(document.getElementById('cfg-ul-max-rage').value, 10) || 1);
            CONFIG.ULTIMATE.GAIN_PER_KILL = Math.max(0, parseFloat(document.getElementById('cfg-ul-gain-kill').value) || 0);
            CONFIG.ULTIMATE.DURATION_MS = Math.max(100, parseInt(document.getElementById('cfg-ul-duration').value, 10) || 100);
            CONFIG.ULTIMATE.TRANSITION_MS = Math.max(100, parseInt(document.getElementById('cfg-ul-transition').value, 10) || 100);
            CONFIG.ULTIMATE.CHARGE_STEPS = Math.max(1, parseInt(document.getElementById('cfg-ul-steps').value, 10) || 1);
            CONFIG.CULTIVATION.BREAKTHROUGH_PENALTY_FACTOR = parseFloat(document.getElementById('cfg-cu-penalty').value);
            CONFIG.CULTIVATION.MAX_BREAKTHROUGH_CHANCE = parseFloat(document.getElementById('cfg-cu-max-chance').value);

            Input.maxRage = CONFIG.ULTIMATE.MAX_RAGE;
            Input.rage = Math.min(Input.rage, Input.maxRage);
            Input.renderRageUI();

            // --- 2. Lưu vào LocalStorage để không bị mất khi load lại trang ---
            localStorage.setItem('thanh_truc_settings', JSON.stringify(CONFIG));

            // --- 3. QUAN TRỌNG: KHỞI TẠO LẠI TRẬN PHÁP ---
            // Xóa sạch các mảng hiện tại
            swords.length = 0;
            enemies.length = 0;
            visualParticles.length = 0;

            // Tạo lại các đối tượng theo CONFIG mới
            for (let i = 0; i < CONFIG.SWORD.COUNT; i++) {
                swords.push(new Sword(i, scaleFactor));
            }
            syncSwordFormation({ rebuildAll: true });
            for (let i = 0; i < CONFIG.ENEMY.SPAWN_COUNT; i++) {
                enemies.push(new Enemy());
            }
            // Tạo lại bầu trời sao nếu số lượng sao thay đổi
            starField = new StarField(CONFIG.BG.STAR_COUNT, width, height);

            showNotify("Trận pháp đã được tái thiết!", "#8fffe0");
            this.close();
        } catch (e) {
            console.error("Lỗi khi ghi chép Thiên Thư:", e);
        }
    },

    reset() {
        localStorage.removeItem('thanh_truc_settings');
        showNotify("Thiên đạo đã quy hồi nguyên trạng!", "#ffcc00");
        this.close();
        location.reload();
    }
};

// 2. Nút Đổi Hình Thái (Change Form)
function buildWalletMarkup() {
    const totalLowValue = Input.getSpiritStoneTotalValue();
    const rows = STONE_ORDER.map(quality => {
        const stoneType = Input.getSpiritStoneType(quality);
        const count = Input.spiritStones[quality] || 0;

        return `
            <div class="wallet-chip" style="--wallet-accent:${stoneType.color}">
                <span>${escapeHtml(stoneType.label)}</span>
                <strong>${formatNumber(count)}</strong>
            </div>
        `;
    }).join('');

    return `
        <div class="resource-wallet">
            <div class="wallet-total">
                <span>Tổng quy đổi</span>
                <strong>${formatNumber(totalLowValue)} hạ phẩm linh thạch</strong>
            </div>
            <div class="wallet-grid">${rows}</div>
        </div>
    `;
}

function buildInventoryCapacityMarkup() {
    const summary = Input.getInventorySummary();
    const usagePct = Math.max(0, Math.min(100, Math.round((summary.usageRatio || 0) * 100)));

    return `
        <div class="inventory-capacity-card">
            <div class="inventory-capacity-card__row">
                <span class="inventory-capacity-card__label">Túi trữ vật</span>
                <strong class="inventory-capacity-card__value">${formatNumber(summary.uniqueCount)}/${formatNumber(summary.capacity)} ô</strong>
            </div>
            <div class="inventory-capacity-card__track">
                <span style="width:${usagePct}%"></span>
            </div>
            <div class="inventory-capacity-card__meta">
                <span>Còn trống ${formatNumber(summary.freeSlots)} ô</span>
                <span>${summary.freeSlots > 0 ? 'Có thể nhận thêm vật phẩm mới' : 'Túi đã đầy'}</span>
            </div>
        </div>
    `;
}

function buildBeastWalletMarkup() {
    const summary = Input.getBeastSummary();
    const usagePct = Math.max(0, Math.min(100, Math.round((summary.usageRatio || 0) * 100)));

    return `
        <div class="beast-wallet">
            <div class="beast-wallet__header">
                <div>
                    <span class="beast-wallet__eyebrow">Linh Thú Đại</span>
                    <strong>${formatNumber(summary.totalBeasts)}/${formatNumber(summary.capacity)} linh trùng đã nở</strong>
                </div>
                <div class="beast-wallet__meta">
                    <span>${formatNumber(summary.totalEggs)} trứng noãn</span>
                    <span>${formatNumber(summary.discoveredCount)}/${formatNumber(summary.speciesTotal)} loài đã mở</span>
                </div>
            </div>
            <div class="inventory-capacity-card__track beast-wallet__track">
                <span style="width:${usagePct}%"></span>
            </div>
            <div class="beast-wallet__footer">
                <span>${summary.freeSlots > 0 ? `Còn ${formatNumber(summary.freeSlots)} ô cho linh trùng mới` : 'Linh Thú Đại đã đầy'}</span>
                <span>${Input.hasKhuTrungThuatUnlocked() ? 'Đã lĩnh ngộ Khu Trùng Thuật' : 'Chưa lĩnh ngộ Khu Trùng Thuật'}</span>
            </div>
        </div>
    `;
}

function buildInsectEggCardMarkup(speciesKey, count) {
    const species = Input.getInsectSpecies(speciesKey);
    if (!species) return '';
    const tier = Input.getInsectTierInfo(species.tier);

    return `
        <article class="inventory-slot beast-slot egg-slot" style="--slot-accent:${species.eggColor || species.color}">
            <div class="slot-badge">${escapeHtml(tier.label)}</div>
            <div class="beast-card-visual beast-card-visual--egg" style="--beast-accent:${species.eggColor || species.color}"></div>
            <h4>Trứng ${escapeHtml(species.name)}</h4>
            <p>${escapeHtml(species.description)}</p>
            <div class="slot-count">${formatNumber(count)}</div>
            <div class="slot-actions">
                <button class="btn-slot-action" data-beast-action="hatch" data-species-key="${escapeHtml(speciesKey)}">Ấp nở</button>
            </div>
        </article>
    `;
}

function buildTamedInsectCardMarkup(speciesKey, count) {
    const species = Input.getInsectSpecies(speciesKey);
    if (!species) return '';
    const tier = Input.getInsectTierInfo(species.tier);
    const attackPct = Math.round((species.attackFactor || 1) * 100);

    return `
        <article class="inventory-slot beast-slot" style="--slot-accent:${species.color}">
            <div class="slot-badge">${escapeHtml(tier.label)}</div>
            <div class="beast-card-visual" style="--beast-accent:${species.color}"></div>
            <h4>${escapeHtml(species.name)}</h4>
            <p>${escapeHtml(species.description)}</p>
            <div class="beast-slot__stats">
                <span>Công sát ${attackPct}%</span>
                <span>Đàn trùng ${formatNumber(count)}</span>
            </div>
            <div class="slot-count">${formatNumber(count)}</div>
        </article>
    `;
}

function openPopup(overlay) {
    if (!overlay) return;
    document.body.style.cursor = 'default';
    overlay.style.display = 'flex';
    setTimeout(() => overlay.classList.add('show'), 10);
}

function closePopup(overlay) {
    if (!overlay) return;
    overlay.classList.remove('show');
    setTimeout(() => {
        if (!overlay.classList.contains('show')) {
            overlay.style.display = 'none';
        }
    }, 300);
    document.body.style.cursor = 'none';
}

ShopUI = {
    overlay: document.getElementById('shop-popup'),
    btnOpen: document.getElementById('btn-shop'),
    btnClose: document.getElementById('close-shop'),
    list: document.getElementById('shop-items'),
    wallet: document.getElementById('shop-wallet'),
    toolbar: document.getElementById('shop-toolbar'),
    pagination: document.getElementById('shop-pagination'),
    searchQuery: '',
    categoryFilter: 'ALL',
    qualityFilter: 'ALL',
    currentPage: 1,
    lastPageSize: 0,

    init() {
        if (!this.overlay || !this.btnOpen) return;

        const content = this.overlay.querySelector('.popup-content');
        if (content) {
            content.addEventListener('pointerdown', (e) => e.stopPropagation());
        }

        this.btnOpen.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            this.open();
        });

        if (this.btnClose) {
            this.btnClose.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                this.close();
            });
        }

        if (this.list) {
            this.list.addEventListener('pointerdown', (e) => {
                const actionBtn = e.target.closest('[data-shop-id]');
                if (!actionBtn) return;

                e.stopPropagation();
                Input.buyShopItem(actionBtn.getAttribute('data-shop-id'));
            });
        }

        this.overlay.addEventListener('input', (e) => {
            if (e.target.id !== 'shop-search') return;

            e.stopPropagation();
            this.searchQuery = e.target.value || '';
            this.currentPage = 1;
            this.render();
        });

        this.overlay.addEventListener('change', (e) => {
            if (e.target.id === 'shop-filter-category') {
                this.categoryFilter = e.target.value || 'ALL';
                this.currentPage = 1;
                this.render();
                return;
            }

            if (e.target.id === 'shop-filter-quality') {
                this.qualityFilter = e.target.value || 'ALL';
                this.currentPage = 1;
                this.render();
            }
        });

        if (this.pagination) {
            this.pagination.addEventListener('pointerdown', (e) => {
                const pageBtn = e.target.closest('[data-shop-page-target]');
                if (!pageBtn) return;

                e.stopPropagation();
                const targetPage = parseInt(pageBtn.getAttribute('data-shop-page-target'), 10);
                if (!Number.isNaN(targetPage)) {
                    this.currentPage = targetPage;
                    this.render();
                }
            });
        }

        if (this.toolbar) {
            this.toolbar.addEventListener('pointerdown', (e) => {
                const resetBtn = e.target.closest('[data-shop-action="reset-filters"]');
                if (!resetBtn) return;

                e.stopPropagation();
                this.searchQuery = '';
                this.categoryFilter = 'ALL';
                this.qualityFilter = 'ALL';
                this.currentPage = 1;
                this.render();
            });
        }

        this.overlay.addEventListener('pointerdown', (e) => {
            if (e.target === this.overlay) this.close();
        });

        window.addEventListener('resize', () => {
            if (!this.overlay.classList.contains('show')) return;

            const nextPageSize = this.getPageSize();
            if (nextPageSize !== this.lastPageSize) {
                this.render();
            }
        });
    },

    getPageSize() {
        return window.innerWidth <= 720 ? 4 : 8;
    },

    getCategoryOptions() {
        return ['ALL', 'SWORD_ART', 'FLAME_ART', 'INSECT_SKILL', 'INSECT_ARTIFACT', 'SPIRIT_BAG', 'EXP', 'INSIGHT', 'ATTACK', 'SHIELD_BREAK', 'BERSERK', 'RAGE', 'MANA', 'MAX_MANA', 'REGEN', 'SPEED', 'FORTUNE', 'BREAKTHROUGH', 'BAG', 'SPECIAL'];
    },

    ensureToolbar() {
        if (!this.toolbar || this.toolbar.dataset.ready === 'true') return;

        const categoryOptions = this.getCategoryOptions().map(category => {
            const label = category === 'ALL' ? 'Tất cả loại' : Input.getItemCategoryLabel({ category });
            return `<option value="${category}">${escapeHtml(label)}</option>`;
        }).join('');

        const qualityOptions = ['ALL', ...QUALITY_ORDER].map(quality => {
            const label = quality === 'ALL' ? 'Tất cả phẩm chất' : getQualityLabel(quality);
            return `<option value="${quality}">${escapeHtml(label)}</option>`;
        }).join('');

        this.toolbar.innerHTML = `
            <div class="shop-tip" id="shop-tip"></div>
            <div class="shop-toolbar-row">
                <label class="shop-field shop-field-search">
                    <span>Tìm kiếm</span>
                    <input id="shop-search" class="shop-control-input" type="search" placeholder="Tên đan, túi, công dụng, phẩm chất...">
                </label>
                <div class="shop-filter-group">
                    <label class="shop-field">
                        <span>Loại</span>
                        <select id="shop-filter-category" class="shop-control-input">${categoryOptions}</select>
                    </label>
                    <label class="shop-field">
                        <span>Phẩm chất</span>
                        <select id="shop-filter-quality" class="shop-control-input">${qualityOptions}</select>
                    </label>
                </div>
            </div>
            <div class="shop-toolbar-meta">
                <div id="shop-summary" class="shop-summary"></div>
                <button type="button" class="btn-shop-reset" data-shop-action="reset-filters">Xóa lọc</button>
            </div>
        `;

        this.toolbar.dataset.ready = 'true';
    },

    syncToolbar(totalCount, filteredCount) {
        if (!this.toolbar) return;

        const nextRealm = Input.getNextMajorRealmInfo();
        const tip = nextRealm
            ? `Đang bày bán đủ loại đan tu vi, cường hóa, vận khí và cả ${escapeHtml(nextRealm.name)} đan cho lần đột phá kế tiếp.`
            : 'Đã ở cảnh giới tối cao, cửa hàng vẫn còn nhiều đan cường hóa và hai viên cấm kị đặc biệt.';

        const tipEl = this.toolbar.querySelector('#shop-tip');
        const searchEl = this.toolbar.querySelector('#shop-search');
        const categoryEl = this.toolbar.querySelector('#shop-filter-category');
        const qualityEl = this.toolbar.querySelector('#shop-filter-quality');
        const summaryEl = this.toolbar.querySelector('#shop-summary');
        const resetBtn = this.toolbar.querySelector('[data-shop-action="reset-filters"]');

        if (tipEl) tipEl.innerHTML = tip;
        if (searchEl && searchEl.value !== this.searchQuery) searchEl.value = this.searchQuery;
        if (categoryEl && categoryEl.value !== this.categoryFilter) categoryEl.value = this.categoryFilter;
        if (qualityEl && qualityEl.value !== this.qualityFilter) qualityEl.value = this.qualityFilter;
        if (summaryEl) {
            summaryEl.innerHTML = `Hiển thị <strong>${formatNumber(filteredCount)}</strong> / ${formatNumber(totalCount)} vật phẩm`;
        }
        if (resetBtn) {
            resetBtn.disabled = !this.searchQuery && this.categoryFilter === 'ALL' && this.qualityFilter === 'ALL';
        }
    },

    filterItems(items) {
        const query = normalizeSearchText(this.searchQuery);

        return items.filter(item => {
            if (this.categoryFilter !== 'ALL' && item.category !== this.categoryFilter) {
                return false;
            }

            if (this.qualityFilter !== 'ALL' && item.quality !== this.qualityFilter) {
                return false;
            }

            if (!query) return true;

            const haystack = normalizeSearchText([
                Input.getItemDisplayName(item),
                Input.getItemDescription(item),
                Input.getItemCategoryLabel(item),
                getQualityLabel(item.quality),
                item.realmName || ''
            ].join(' '));

            return haystack.includes(query);
        });
    },

    buildPaginationTargets(totalPages) {
        const pages = [];

        for (let page = 1; page <= totalPages; page++) {
            const isEdge = page === 1 || page === totalPages;
            const isNearCurrent = Math.abs(page - this.currentPage) <= 1;
            if (totalPages <= 5 || isEdge || isNearCurrent) {
                pages.push(page);
            }
        }

        return pages.filter((page, index) => pages.indexOf(page) === index)
            .sort((a, b) => a - b);
    },

    renderPagination(totalItems, totalPages) {
        if (!this.pagination) return;

        if (!totalItems) {
            this.pagination.innerHTML = '';
            return;
        }

        const pages = this.buildPaginationTargets(totalPages);
        const pageButtons = [];

        pages.forEach((page, index) => {
            const prevPage = pages[index - 1];
            if (index > 0 && page - prevPage > 1) {
                pageButtons.push('<span class="shop-page-gap">...</span>');
            }

            pageButtons.push(`
                <button
                    type="button"
                    class="btn-shop-page ${page === this.currentPage ? 'is-active' : ''}"
                    data-shop-page-target="${page}"
                    ${page === this.currentPage ? 'disabled' : ''}
                >${page}</button>
            `);
        });

        this.pagination.innerHTML = `
            <button
                type="button"
                class="btn-shop-page btn-shop-page-nav"
                data-shop-page-target="${Math.max(1, this.currentPage - 1)}"
                ${this.currentPage === 1 ? 'disabled' : ''}
            >Trước</button>
            <div class="shop-page-list">${pageButtons.join('')}</div>
            <div class="shop-page-status">Trang ${this.currentPage}/${totalPages}</div>
            <button
                type="button"
                class="btn-shop-page btn-shop-page-nav"
                data-shop-page-target="${Math.min(totalPages, this.currentPage + 1)}"
                ${this.currentPage === totalPages ? 'disabled' : ''}
            >Sau</button>
        `;
    },

    renderItems(items) {
        if (!this.list) return;

        if (!items.length) {
            this.list.innerHTML = '<div class="shop-empty">Không tìm thấy vật phẩm phù hợp với bộ lọc hiện tại.</div>';
            return;
        }

        const cards = items.map(item => {
            const qualityConfig = Input.getItemQualityConfig(item);
            const isOwnedUnique = Boolean(item.isOneTime && item.uniqueKey && Input.hasUniquePurchase(item.uniqueKey));
            const canStoreOrUpgrade = item.category === 'BAG'
                ? Input.canUpgradeInventoryCapacity(item)
                : item.category === 'SPIRIT_BAG'
                    ? (Math.floor(qualityConfig.capacity || 0) > Input.getBeastBagCapacity() && !isOwnedUnique)
                    : (!isOwnedUnique && Input.hasInventorySpaceForSpec(item));
            const canAfford = !Input.isVoidCollapsed && canStoreOrUpgrade && Input.canAffordLowStoneCost(item.priceLowStone);
            const priceMarkup = Input.renderSpiritStoneCostMarkup(item.priceLowStone);
            let actionLabel = item.category === 'BAG'
                ? (canStoreOrUpgrade ? 'Mở rộng' : 'Đã mở')
                : (canStoreOrUpgrade ? 'Mua' : 'Túi đầy');

            if (item.category === 'SWORD_ART' || item.category === 'FLAME_ART') {
                actionLabel = isOwnedUnique ? 'Đã mua' : (canStoreOrUpgrade ? 'Mua' : 'Túi đầy');
            } else if (item.category === 'SPIRIT_BAG') {
                actionLabel = canStoreOrUpgrade ? 'Mua' : 'Đã mở';
            } else if (item.category === 'INSECT_SKILL') {
                actionLabel = isOwnedUnique ? 'Đã mua' : (canStoreOrUpgrade ? (CONFIG.INSECT?.UNIQUE_ITEMS?.KHU_TRUNG_THUAT?.buttonLabel || 'Mua') : 'Túi đầy');
            } else if (item.category === 'INSECT_ARTIFACT') {
                actionLabel = isOwnedUnique ? 'Đã sở hữu' : (canStoreOrUpgrade ? 'Mua' : 'Túi đầy');
            }

            return `
                <article class="shop-card has-pill-art" style="--slot-accent:${qualityConfig.color}">
                    <div class="slot-badge">${escapeHtml(Input.getItemCategoryLabel(item))}</div>
                    ${buildPillVisualMarkup(item, qualityConfig)}
                    <h4>${escapeHtml(Input.getItemDisplayName(item))}</h4>
                    <p class="item-description">${Input.getItemDescriptionMarkup(item)}</p>
                    <div class="slot-meta">Giá: ${formatNumber(item.priceLowStone)} hạ phẩm linh thạch</div>
                    <div class="slot-meta slot-meta-price">
                        <span class="slot-meta-title">Giá</span>
                        ${priceMarkup}
                    </div>
                    <button class="btn-slot-action" data-shop-id="${escapeHtml(item.id)}" ${canAfford ? '' : 'disabled'}>${escapeHtml(actionLabel)}</button>
                </article>
            `;
        }).join('');

        this.list.innerHTML = cards;
    },

    render() {
        if (!this.wallet || !this.list || !this.toolbar || !this.pagination) return;

        this.wallet.innerHTML = buildWalletMarkup();
        this.ensureToolbar();

        const allItems = Input.getShopItems();
        const filteredItems = this.filterItems(allItems);
        const pageSize = this.getPageSize();
        const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

        this.lastPageSize = pageSize;
        this.currentPage = Math.min(Math.max(1, this.currentPage), totalPages);

        const startIndex = (this.currentPage - 1) * pageSize;
        const pagedItems = filteredItems.slice(startIndex, startIndex + pageSize);

        this.syncToolbar(allItems.length, filteredItems.length);
        this.renderItems(pagedItems);
        this.renderPagination(filteredItems.length, totalPages);
    },

    open() {
        this.render();
        openPopup(this.overlay);
    },

    close() {
        closePopup(this.overlay);
    }
};

InventoryUI = {
    overlay: document.getElementById('inventory-popup'),
    btnOpen: document.getElementById('btn-inventory'),
    btnClose: document.getElementById('close-inventory'),
    wallet: document.getElementById('inventory-wallet'),
    tabs: document.getElementById('inventory-tabs'),
    itemPanel: document.getElementById('inventory-panel-items'),
    stonePanel: document.getElementById('inventory-panel-stones'),
    beastPanel: document.getElementById('inventory-panel-beasts'),
    pillGrid: document.getElementById('inventory-pill-grid'),
    stoneGrid: document.getElementById('inventory-stone-grid'),
    beastWallet: document.getElementById('inventory-beast-wallet'),
    eggGrid: document.getElementById('inventory-egg-grid'),
    beastGrid: document.getElementById('inventory-beast-grid'),
    currentTab: 'items',

    init() {
        if (!this.overlay || !this.btnOpen) return;

        const content = this.overlay.querySelector('.popup-content');
        if (content) {
            content.addEventListener('pointerdown', (e) => e.stopPropagation());
        }

        this.btnOpen.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            this.open();
        });

        if (this.btnClose) {
            this.btnClose.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                this.close();
            });
        }

        if (this.pillGrid) {
            this.pillGrid.addEventListener('pointerdown', (e) => {
                const actionBtn = e.target.closest('[data-item-key]');
                if (!actionBtn) return;

                e.stopPropagation();
                const itemKey = actionBtn.getAttribute('data-item-key');
                const action = actionBtn.getAttribute('data-action') || 'use';

                if (action === 'sell') {
                    Input.sellInventoryItem(itemKey);
                } else {
                    Input.useInventoryItem(itemKey);
                }
            });
        }

        if (this.tabs) {
            this.tabs.addEventListener('pointerdown', (e) => {
                const tabBtn = e.target.closest('[data-inventory-tab]');
                if (!tabBtn) return;

                e.stopPropagation();
                this.currentTab = tabBtn.getAttribute('data-inventory-tab') || 'items';
                Input.selectedInventoryTab = this.currentTab;
                this.render();
            });
        }

        if (this.eggGrid) {
            this.eggGrid.addEventListener('pointerdown', (e) => {
                const hatchBtn = e.target.closest('[data-beast-action="hatch"]');
                if (!hatchBtn) return;

                e.stopPropagation();
                const speciesKey = hatchBtn.getAttribute('data-species-key');
                if (speciesKey) {
                Input.hatchInsectEgg(speciesKey, 1);
            }
        });
        }

        this.overlay.addEventListener('pointerdown', (e) => {
            if (e.target === this.overlay) this.close();
        });
    },

    render() {
        if (!this.wallet || !this.pillGrid || !this.stoneGrid || !this.beastWallet || !this.eggGrid || !this.beastGrid) return;

        this.currentTab = Input.selectedInventoryTab || this.currentTab || 'items';
        this.wallet.innerHTML = buildWalletMarkup() + buildInventoryCapacityMarkup();

        if (this.tabs) {
            this.tabs.querySelectorAll('[data-inventory-tab]').forEach(tabBtn => {
                tabBtn.classList.toggle('is-active', tabBtn.getAttribute('data-inventory-tab') === this.currentTab);
            });
        }

        [
            { panel: this.itemPanel, key: 'items' },
            { panel: this.stonePanel, key: 'stones' },
            { panel: this.beastPanel, key: 'beasts' }
        ].forEach(entry => {
            if (!entry.panel) return;
            entry.panel.classList.toggle('is-active', entry.key === this.currentTab);
        });

        const inventorySummary = Input.getInventorySummary();
        const entries = inventorySummary.entries;
        const cards = entries.map(item => {
            const qualityConfig = Input.getItemQualityConfig(item);
            const usable = Input.isInventoryItemUsable(item);
            const sellPrice = Input.getInventorySellPrice(item);
            const sellPriceMarkup = Input.renderSpiritStoneCostMarkup(sellPrice);
            const isArtifactBook = item.category === 'INSECT_ARTIFACT';
            const inventoryActionLabel = item.category === 'SWORD_ART'
                ? (CONFIG.SECRET_ARTS?.DAI_CANH_KIEM_TRAN?.inventoryActionLabel || 'Lĩnh ngộ')
                : item.category === 'FLAME_ART'
                    ? (CONFIG.SECRET_ARTS?.CAN_LAM_BANG_DIEM?.inventoryActionLabel || 'Luyện hóa')
                    : item.category === 'INSECT_SKILL'
                        ? (CONFIG.INSECT?.UNIQUE_ITEMS?.KHU_TRUNG_THUAT?.inventoryActionLabel || 'Lĩnh ngộ')
                    : null;
            const label = item.category === 'BREAKTHROUGH' && !usable
                ? `Chờ ${item.realmName}`
                : 'Dùng';

            return `
                <article class="inventory-slot has-pill-art" style="--slot-accent:${qualityConfig.color}">
                    <div class="slot-badge">${formatNumber(item.count)}x</div>
                    ${buildPillVisualMarkup(item, qualityConfig)}
                    <h4>${escapeHtml(Input.getItemDisplayName(item))}</h4>
                    <p class="item-description">${Input.getItemDescriptionMarkup(item)}</p>
                    <div class="slot-meta">Bán lại: ${formatNumber(sellPrice)} hạ phẩm linh thạch</div>
                    <div class="slot-meta slot-meta-price">
                        <span class="slot-meta-title">Bán lại</span>
                        ${sellPriceMarkup}
                    </div>
                    <div class="slot-actions">
                        <button class="btn-slot-action" data-action="use" data-item-key="${escapeHtml(item.key)}" ${usable ? '' : 'disabled'}>${escapeHtml(isArtifactBook ? 'Xem' : (inventoryActionLabel || label))}</button>
                        <button class="btn-slot-action is-secondary" data-action="sell" data-item-key="${escapeHtml(item.key)}" ${sellPrice > 0 ? '' : 'disabled'}>Bán</button>
                    </div>
                </article>
            `;
        });

        const emptySlotCount = Math.max(0, CONFIG.ITEMS.INVENTORY_MIN_SLOTS - cards.length);
        for (let i = 0; i < emptySlotCount; i++) {
            cards.push(`<article class="inventory-slot is-empty"><span>Ô trống</span></article>`);
        }
        this.pillGrid.innerHTML = cards.join('');

        this.stoneGrid.innerHTML = STONE_ORDER.map(quality => {
            const stoneType = Input.getSpiritStoneType(quality);

            return `
                <article class="inventory-slot stone-slot" style="--slot-accent:${stoneType.color}">
                    <div class="slot-badge">Linh thạch</div>
                    <h4>${escapeHtml(stoneType.label)}</h4>
                    <p>Quy đổi: ${formatNumber(stoneType.value)} hạ phẩm linh thạch.</p>
                    <div class="slot-count">${formatNumber(Input.spiritStones[quality] || 0)}</div>
                </article>
            `;
        }).join('');

        this.beastWallet.innerHTML = buildBeastWalletMarkup();

        const eggCards = Input.getInsectSpeciesEntries()
            .filter(([speciesKey]) => (Input.insectEggs[speciesKey] || 0) > 0)
            .map(([speciesKey]) => buildInsectEggCardMarkup(speciesKey, Input.insectEggs[speciesKey]));
        this.eggGrid.innerHTML = eggCards.length
            ? eggCards.join('')
            : '<article class="inventory-slot is-empty"><span>Chưa có trứng kỳ trùng.</span></article>';

        const beastCards = Input.getInsectSpeciesEntries()
            .filter(([speciesKey]) => (Input.tamedInsects[speciesKey] || 0) > 0)
            .map(([speciesKey]) => buildTamedInsectCardMarkup(speciesKey, Input.tamedInsects[speciesKey]));
        this.beastGrid.innerHTML = beastCards.length
            ? beastCards.join('')
            : '<article class="inventory-slot is-empty"><span>Chưa có linh trùng đã nở.</span></article>';
    },

    open() {
        this.render();
        openPopup(this.overlay);
    },

    close() {
        closePopup(this.overlay);
    }
};

SkillsUI = {
    overlay: document.getElementById('skills-popup'),
    btnOpen: document.getElementById('btn-skill-list'),
    btnClose: document.getElementById('close-skills'),
    list: document.getElementById('attack-skill-list'),

    isOpen() {
        return Boolean(this.overlay && this.overlay.classList.contains('show'));
    },

    init() {
        if (!this.overlay || !this.btnOpen || !this.list) return;

        const content = this.overlay.querySelector('.popup-content');
        if (content) {
            content.addEventListener('pointerdown', (e) => e.stopPropagation());
        }

        this.btnOpen.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            this.open();
        });

        if (this.btnClose) {
            this.btnClose.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                this.close();
            });
        }

        this.list.addEventListener('pointerdown', (e) => {
            const skillBtn = e.target.closest('[data-attack-skill]');
            if (!skillBtn) return;

            e.stopPropagation();
            const skillKey = skillBtn.getAttribute('data-attack-skill');
            if (Input.setAttackMode(skillKey)) {
                this.render();
                this.close();
            }
        });

        this.overlay.addEventListener('pointerdown', (e) => {
            if (e.target === this.overlay) this.close();
        });
    },

    render() {
        if (!this.list) return;

        this.list.innerHTML = Input.getAttackSkillList().map(skill => `
            <article class="attack-skill-card ${skill.active ? 'is-active' : ''} ${!skill.unlocked || !skill.ready ? 'is-disabled' : ''}" style="--skill-accent:${skill.accent}">
                <div class="attack-skill-card__head">
                    <div>
                        <h4>${escapeHtml(skill.name)}</h4>
                        <p>${escapeHtml(skill.description)}</p>
                    </div>
                    <span class="attack-skill-card__tag">${skill.active ? 'Đang dùng' : (skill.unlocked ? 'Đã học' : 'Chưa học')}</span>
                </div>
                <div class="attack-skill-card__foot">
                    <span>${escapeHtml(skill.note)}</span>
                    <button class="btn-slot-action" type="button" data-attack-skill="${escapeHtml(skill.key)}" ${skill.unlocked && skill.ready ? '' : 'disabled'}>
                        ${skill.active ? 'Đã chọn' : 'Chọn'}
                    </button>
                </div>
            </article>
        `).join('');
    },

    open() {
        this.render();
        openPopup(this.overlay);
    },

    close() {
        closePopup(this.overlay);
    }
};

InsectBookUI = {
    overlay: document.getElementById('insect-book-popup'),
    btnClose: document.getElementById('close-insect-book'),
    summary: document.getElementById('insect-book-summary'),
    grid: document.getElementById('insect-book-grid'),

    isOpen() {
        return Boolean(this.overlay && this.overlay.classList.contains('show'));
    },

    init() {
        if (!this.overlay || !this.grid) return;

        const content = this.overlay.querySelector('.popup-content');
        if (content) {
            content.addEventListener('pointerdown', (e) => e.stopPropagation());
        }

        if (this.btnClose) {
            this.btnClose.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                this.close();
            });
        }

        this.overlay.addEventListener('pointerdown', (e) => {
            if (e.target === this.overlay) this.close();
        });
    },

    render() {
        if (!this.summary || !this.grid) return;

        const beastSummary = Input.getBeastSummary();
        this.summary.innerHTML = `
            <div class="book-summary">
                <div class="book-summary__card">
                    <span>Đã mở</span>
                    <strong>${formatNumber(beastSummary.discoveredCount)}/${formatNumber(beastSummary.speciesTotal)} mục</strong>
                </div>
                <div class="book-summary__card">
                    <span>Trứng noãn</span>
                    <strong>${formatNumber(beastSummary.totalEggs)}</strong>
                </div>
                <div class="book-summary__card">
                    <span>Linh trùng</span>
                    <strong>${formatNumber(beastSummary.totalBeasts)}/${formatNumber(beastSummary.capacity)}</strong>
                </div>
            </div>
        `;

        this.grid.innerHTML = Input.getInsectSpeciesEntries().map(([speciesKey, species]) => {
            const discovered = Boolean(Input.discoveredInsects[speciesKey]);
            const tier = Input.getInsectTierInfo(species.tier);
            const eggCount = Input.insectEggs[speciesKey] || 0;
            const beastCount = Input.tamedInsects[speciesKey] || 0;

            return `
                <article class="insect-book-card ${discovered ? 'is-discovered' : 'is-locked'}" style="--book-accent:${species.color}">
                    <div class="insect-book-card__image-wrap">
                        <img src="${escapeHtml(species.image || CONFIG.INSECT?.PLACEHOLDER_IMAGE || './assets/images/image.jpg')}" alt="${escapeHtml(species.name)}" class="insect-book-card__image">
                        <span class="insect-book-card__tier">${escapeHtml(tier.label)}</span>
                        ${discovered ? '' : '<span class="insect-book-card__veil">Chưa thu thập</span>'}
                    </div>
                    <div class="insect-book-card__body">
                        <h4>${escapeHtml(species.name)}</h4>
                        <p>${escapeHtml(species.description)}</p>
                        <div class="insect-book-card__meta">
                            <span>Trứng ${formatNumber(eggCount)}</span>
                            <span>Đã nở ${formatNumber(beastCount)}</span>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    },

    open() {
        this.render();
        openPopup(this.overlay);
    },

    close() {
        closePopup(this.overlay);
    }
};

ProfileUI = {
    overlay: document.getElementById('profile-popup'),
    btnOpen: document.getElementById('btn-profile'),
    btnClose: document.getElementById('close-profile'),
    overview: document.getElementById('profile-overview'),
    statsGrid: document.getElementById('profile-stats-grid'),
    wallet: document.getElementById('profile-wallet'),
    pills: document.getElementById('profile-pills'),

    isOpen() {
        return Boolean(this.overlay && this.overlay.classList.contains('show'));
    },

    init() {
        if (!this.overlay || !this.btnOpen) return;

        const content = this.overlay.querySelector('.popup-content');
        if (content) {
            content.addEventListener('pointerdown', (e) => e.stopPropagation());
        }

        this.btnOpen.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            this.open();
        });

        if (this.btnClose) {
            this.btnClose.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                this.close();
            });
        }

        this.overlay.addEventListener('pointerdown', (e) => {
            if (e.target === this.overlay) this.close();
        });

        this.render();
    },

    render() {
        if (!this.overview || !this.statsGrid || !this.wallet || !this.pills) return;

        const rank = Input.getCurrentRank();
        const majorRealm = Input.getCurrentMajorRealmInfo();
        const breakthroughChance = Input.getCurrentBreakthroughChance();
        const swordStats = Input.getAliveSwordStats();
        const inventorySummary = Input.getInventorySummary();
        const displayName = Input.getPlayerDisplayName();
        const accent = rank?.color || '#8fffe0';
        const accentLight = rank?.lightColor || '#ffffff';
        const combatPillCount = (inventorySummary.categories.ATTACK || 0)
            + (inventorySummary.categories.SHIELD_BREAK || 0)
            + (inventorySummary.categories.BERSERK || 0)
            + (inventorySummary.categories.RAGE || 0);
        const supportPillCount = (inventorySummary.categories.MANA || 0)
            + (inventorySummary.categories.MAX_MANA || 0)
            + (inventorySummary.categories.REGEN || 0)
            + (inventorySummary.categories.SPEED || 0)
            + (inventorySummary.categories.FORTUNE || 0)
            + (inventorySummary.categories.INSIGHT || 0)
            + (inventorySummary.categories.EXP || 0);
        const beastSummary = Input.getBeastSummary();

        this.btnOpen.setAttribute('title', `${displayName} - ${rank?.name || 'Chưa nhập đạo'}`);
        this.btnOpen.setAttribute('aria-label', `Mở hồ sơ của ${displayName}`);

        this.overview.innerHTML = `
            <article class="profile-hero__card is-accent" style="--profile-accent:${accent};--profile-light:${accentLight}">
                <div class="profile-hero__identity">
                    <div class="profile-hero__avatar" aria-hidden="true">
                        <img class="profile-hero__avatar-icon" src="./assets/images/sword-light.svg" alt="">
                    </div>
                    <div>
                        <div class="profile-hero__eyebrow">Đạo hiệu</div>
                        <h4 class="profile-hero__title">${escapeHtml(displayName)}</h4>
                        <div class="profile-hero__subtitle">${escapeHtml(majorRealm?.name || 'Phàm giới')} • ${escapeHtml(rank?.name || 'Chưa nhập đạo')}</div>
                    </div>
                </div>
                <div class="profile-hero__chips">
                    <span class="profile-chip">Tu vi<strong>${formatNumber(Input.exp)}/${formatNumber(rank?.exp || 0)}</strong></span>
                    <span class="profile-chip">Đột phá<strong>${Math.round(breakthroughChance * 100)}%</strong></span>
                    <span class="profile-chip">Kiếm trận<strong>${swordStats.alive}/${swordStats.total}</strong></span>
                    <span class="profile-chip">Linh trùng<strong>${formatNumber(beastSummary.totalBeasts)}</strong></span>
                </div>
            </article>
            <article class="profile-hero__card">
                <div class="profile-hero__eyebrow">Tình trạng hiện tại</div>
                <div class="profile-hero__chips">
                    <span class="profile-chip is-soft">Linh lực<strong>${formatNumber(Input.mana)}/${formatNumber(Input.maxMana)}</strong></span>
                    <span class="profile-chip is-soft">Nộ kiếm<strong>${formatNumber(Input.rage)}/${formatNumber(Input.maxRage)}</strong></span>
                    <span class="profile-chip is-soft">Sát thương<strong>${formatNumber(Input.getEffectiveAttackDamage())}</strong></span>
                    <span class="profile-chip is-soft">Linh thạch<strong>${formatNumber(Input.getSpiritStoneTotalValue())}</strong></span>
                    <span class="profile-chip is-soft">Kỹ năng<strong>${escapeHtml(Input.attackMode === 'INSECT' ? 'Khu Trùng Thuật' : 'Kiếm trận')}</strong></span>
                </div>
            </article>
        `;

        const stats = [
            { label: 'Cảnh giới', value: rank?.name || 'Chưa nhập đạo' },
            { label: 'Đại cảnh giới', value: majorRealm?.name || 'Phàm giới' },
            { label: 'Tu vi', value: `${formatNumber(Input.exp)}/${formatNumber(rank?.exp || 0)}` },
            { label: 'Linh lực', value: `${formatNumber(Input.mana)}/${formatNumber(Input.maxMana)}` },
            { label: 'Nộ kiếm', value: `${formatNumber(Input.rage)}/${formatNumber(Input.maxRage)}` },
            { label: 'Sát thương', value: `≈ ${formatNumber(Input.getEffectiveAttackDamage())}` },
            { label: 'Công lực', value: `+${Math.round((Input.getAttackMultiplier() - 1) * 100)}%` },
            { label: 'Phá khiên', value: `+${Math.round((Input.getShieldBreakMultiplier() - 1) * 100)}%` },
            { label: 'Tốc độ', value: `+${Math.round((Input.getSpeedMultiplier() - 1) * 100)}%` },
            { label: 'Hồi linh', value: `+${Math.round((Input.getManaRegenMultiplier() - 1) * 100)}%` },
            { label: 'Vận khí', value: `+${Math.round((Input.getDropRateMultiplier() - 1) * 100)}%` },
            { label: 'Tỉ lệ đột phá', value: `${Math.round(breakthroughChance * 100)}%` },
            { label: 'Kiếm trận', value: `${swordStats.alive}/${swordStats.total}` },
            { label: 'Kiếm hỏng', value: `${swordStats.broken}` },
            { label: 'Linh trùng', value: `${formatNumber(beastSummary.totalBeasts)}/${formatNumber(beastSummary.capacity)}` },
            { label: 'Trứng noãn', value: `${formatNumber(beastSummary.totalEggs)}` },
            { label: 'Kỳ trùng đã mở', value: `${formatNumber(beastSummary.discoveredCount)}/${formatNumber(beastSummary.speciesTotal)}` },
            { label: 'Túi trữ vật', value: `${formatNumber(inventorySummary.uniqueCount)}/${formatNumber(inventorySummary.capacity)} ô` },
            { label: 'Ô trống', value: `${formatNumber(inventorySummary.freeSlots)}` }
        ];

        this.statsGrid.innerHTML = stats.map(stat => `
            <article class="profile-stat-card" style="--profile-accent:${accent}">
                <span class="profile-stat-label">${escapeHtml(stat.label)}</span>
                <strong class="profile-stat-value">${escapeHtml(stat.value)}</strong>
            </article>
        `).join('');

        this.wallet.innerHTML = buildWalletMarkup();

        if (!inventorySummary.entries.length) {
            this.pills.innerHTML = '<div class="profile-empty">Túi đan dược còn trống, chỉ mới tích lũy linh thạch và khí tức nền tảng.</div>';
            return;
        }

        const categoryOrder = Object.keys(CONFIG.PILL.CATEGORY_SORT || {});
        const categoryMarkup = Object.entries(inventorySummary.categories)
            .sort((a, b) => {
                const aIndex = categoryOrder.indexOf(a[0]);
                const bIndex = categoryOrder.indexOf(b[0]);
                return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
            })
            .map(([category, count]) => `
                <span class="profile-chip is-soft">
                    ${escapeHtml(Input.getItemCategoryLabel({ category }))}
                    <strong>${formatNumber(count)}</strong>
                </span>
            `)
            .join('');

        const featuredMarkup = inventorySummary.entries.slice(0, 4).map(item => `
            <div class="profile-pill-entry">
                <span>${escapeHtml(Input.getItemDisplayName(item))}</span>
                <strong>${formatNumber(item.count)}x</strong>
            </div>
        `).join('');

        this.pills.innerHTML = `
            <div class="profile-pill-summary">
                <article class="profile-stat-card" style="--profile-accent:${accent}">
                    <span class="profile-stat-label">Tổng đan</span>
                    <strong class="profile-stat-value">${formatNumber(inventorySummary.totalCount)}</strong>
                </article>
                <article class="profile-stat-card" style="--profile-accent:${accent}">
                    <span class="profile-stat-label">Số loại</span>
                    <strong class="profile-stat-value">${formatNumber(inventorySummary.uniqueCount)}</strong>
                </article>
                <article class="profile-stat-card" style="--profile-accent:${accent}">
                    <span class="profile-stat-label">Đan chiến đấu</span>
                    <strong class="profile-stat-value">${formatNumber(combatPillCount)}</strong>
                </article>
                <article class="profile-stat-card" style="--profile-accent:${accent}">
                    <span class="profile-stat-label">Đan hỗ trợ</span>
                    <strong class="profile-stat-value">${formatNumber(supportPillCount)}</strong>
                </article>
            </div>
            <div class="profile-chip-grid">${categoryMarkup}</div>
            <div class="profile-pill-list">${featuredMarkup}</div>
        `;
    },

    open() {
        this.render();
        openPopup(this.overlay);
    },

    close() {
        closePopup(this.overlay);
    }
};

document.getElementById('btn-form').addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (Input.isVoidCollapsed) {
        showNotify('Thân thể đã tan vào hư vô, cần reload web để hồi phục', '#a778ff');
        return;
    }

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

document.getElementById('btn-breakthrough').addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    // Gọi hàm thực hiện đột phá mà chúng ta đã viết ở bước trước
    Input.executeBreakthrough();
});

document.getElementById('btn-ultimate').addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    e.preventDefault();
    Input.startUltimate();
});

const moveBtn = document.getElementById('btn-move');
const attackBtn = document.getElementById('btn-attack');

const startMoveJoystick = (e) => {
    if (!moveBtn || !Input.isTouchDevice || e.pointerType === 'mouse') return false;

    e.stopPropagation();
    e.preventDefault();

    if (Input.isVoidCollapsed) return false;

    if (moveBtn.setPointerCapture) {
        moveBtn.setPointerCapture(e.pointerId);
    }

    return Input.startMoveJoystick(e.pointerId, moveBtn, e.clientX, e.clientY);
};

const stopMoveJoystick = (e) => {
    if (!moveBtn || !Input.moveJoystick.active || Input.moveJoystick.pointerId !== e.pointerId) return;

    e.stopPropagation();
    e.preventDefault();

    if (moveBtn.hasPointerCapture && moveBtn.hasPointerCapture(e.pointerId)) {
        moveBtn.releasePointerCapture(e.pointerId);
    }

    Input.stopMoveJoystick(e.pointerId);
};

// Xử lý riêng cho nút bấm để không bị ảnh hưởng bởi logic handleDown của hệ thống
const startAttack = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (Input.isVoidCollapsed) {
        showNotify('Thân thể đã tan vào hư vô, cần reload web để hồi phục', '#a778ff');
        Input.isAttacking = false;
        return false;
    }

    // 1. Kiểm tra xem còn thanh kiếm nào còn sống (hp > 0) không
    const aliveSwords = swords.filter(s => !s.isDead).length;

    // 2. Nếu đang dùng Khu Trùng Thuật thì chỉ cần còn mana
    if (Input.isInsectSwarmActive() && Input.mana <= 0) {
        Input.triggerManaShake();
        Input.isAttacking = false;
        return false;
    }

    // 3. Nếu mana = 0 VÀ không còn kiếm nào sống
    if (!Input.isInsectSwarmActive() && Input.mana <= 0 && aliveSwords === 0) {
        Input.triggerManaShake();
        Input.isAttacking = false; // Không cho phép tấn công
        return false;
    }

    Input.isAttacking = true;
    return true;
};

const stopAttack = (e) => {
    e.stopPropagation();
    e.preventDefault();
    Input.isAttacking = false;
    if (Input.attackTimer) clearTimeout(Input.attackTimer);
};

if (moveBtn) {
    moveBtn.addEventListener('pointerdown', (e) => {
        startMoveJoystick(e);
    });

    moveBtn.addEventListener('pointermove', (e) => {
        if (!Input.moveJoystick.active || Input.moveJoystick.pointerId !== e.pointerId) return;

        e.stopPropagation();
        e.preventDefault();
        Input.updateMoveJoystick(e.clientX, e.clientY);
    });

    moveBtn.addEventListener('pointerup', stopMoveJoystick);
    moveBtn.addEventListener('pointercancel', stopMoveJoystick);
    moveBtn.addEventListener('lostpointercapture', (e) => Input.stopMoveJoystick(e.pointerId));
}

// Sử dụng pointerdown/up để nhạy nhất trên cả mobile và desktop
attackBtn.addEventListener('pointerdown', (e) => {
    if (Input.isTouchDevice && e.pointerType !== 'mouse') {
        if (!startAttack(e)) return;

        if (attackBtn.setPointerCapture) {
            attackBtn.setPointerCapture(e.pointerId);
        }

        return;
    }

    startAttack(e);
});

attackBtn.addEventListener('pointerup', (e) => {
    if (attackBtn.hasPointerCapture && attackBtn.hasPointerCapture(e.pointerId)) {
        attackBtn.releasePointerCapture(e.pointerId);
    }

    stopAttack(e);
});

attackBtn.addEventListener('pointercancel', (e) => {
    if (attackBtn.hasPointerCapture && attackBtn.hasPointerCapture(e.pointerId)) {
        attackBtn.releasePointerCapture(e.pointerId);
    }

    stopAttack(e);
});

attackBtn.addEventListener('lostpointercapture', () => {
    Input.isAttacking = false;
    if (Input.attackTimer) clearTimeout(Input.attackTimer);
});

attackBtn.addEventListener('pointerleave', (e) => {
    if (Input.isTouchDevice && e.pointerType !== 'mouse') return;
    stopAttack(e);
}); // Khi kéo ngón tay ra khỏi nút

/**
 * ====================================================================
 * MAIN MANAGER
 * ====================================================================
 */
const enemies = [];
let pills = [];
const swords = [];
let starField;
const guardCenter = { x: width / 2, y: height / 2, vx: 0, vy: 0 };

function getConfiguredSwordCount() {
    return Math.max(1, parseInt(CONFIG.SWORD.COUNT, 10) || 1);
}

function getBaseSwordCountBeforeFormation() {
    const configuredBase = Math.max(1, parseInt(CONFIG.SWORD.STARTING_COUNT_BEFORE_FORMATION, 10) || 1);
    return Math.min(configuredBase, getConfiguredSwordCount());
}

function getDesiredSwordCount() {
    return Input.hasDaiCanhKiemTranUnlocked()
        ? getConfiguredSwordCount()
        : getBaseSwordCountBeforeFormation();
}

function syncSwordFormation(options = {}) {
    const { rebuildAll = false } = options;
    const targetCount = getDesiredSwordCount();

    if (rebuildAll) {
        swords.length = 0;
    }

    if (swords.length > targetCount) {
        swords.length = targetCount;
    }

    for (let i = 0; i < targetCount; i++) {
        if (!swords[i]) {
            const sword = new Sword(i, scaleFactor);
            sword.x = guardCenter.x;
            sword.y = guardCenter.y;
            swords[i] = sword;
        }
    }

    updateSwordCounter(swords);
    if (typeof Input?.renderAttackModeUI === 'function') {
        Input.renderAttackModeUI();
    }

    return swords.length;
}

function init() {
    // Khởi tạo thông số theo rank đầu tiên
    const startingRank = CONFIG.CULTIVATION.RANKS[Input.rankIndex];
    Input.maxMana = startingRank.maxMana || CONFIG.MANA.MAX;
    Input.mana = Input.maxMana;
    Input.syncDerivedStats();

    document.body.classList.toggle('is-touch-device', Input.isTouchDevice);

    SettingsUI.init();
    Input.spiritStones = getStartingSpiritStoneCounts();
    Input.renderManaUI();
    Input.renderExpUI();
    Input.renderRageUI();
    if (ShopUI) ShopUI.init();
    if (InventoryUI) InventoryUI.init();
    if (SkillsUI) SkillsUI.init();
    if (InsectBookUI) InsectBookUI.init();
    if (ProfileUI) ProfileUI.init();
    Input.renderAttackModeUI();
    starField = new StarField(CONFIG.BG.STAR_COUNT, width, height);
    for (let i = 0; i < CONFIG.ENEMY.SPAWN_COUNT; i++) enemies.push(new Enemy());
    syncSwordFormation({ rebuildAll: true });
    updateSwordCounter(swords);
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
    const speedMult = Input.getSpeedMultiplier();
    let dx = Input.x - guardCenter.x;
    let dy = Input.y - guardCenter.y;
    guardCenter.vx += dx * 0.04 * speedMult;
    guardCenter.vy += dy * 0.04 * speedMult;
    guardCenter.vx *= 0.82;
    guardCenter.vy *= 0.82;
    guardCenter.x += guardCenter.vx;
    guardCenter.y += guardCenter.vy;
}

function renderCursor() {
    // Không dùng shadow của canvas cũ để tránh bị đè màu
    ctx.shadowBlur = 0; 
    
    // Gọi trực tiếp Băng Diễm từ Input
    Input.drawCursor(ctx, scaleFactor);
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
    pills = pills.filter(pill => {
        const collected = pill.update(guardCenter.x, guardCenter.y);

        if (collected) {
            Input.collectDrop(collected);
            return false;
            // Cộng vào đúng loại đan trong Input
            Input.pills[pill.typeKey]++;

            const typeName = CONFIG.PILL.TYPES[pill.typeKey].name;
            showNotify(`+1 ${typeName}`, pill.color);

            Input.renderExpUI(); // Cập nhật lại giao diện ngay khi nhặt được
            return false;
        }

        pill.draw(ctx);
        return true;
    });

    const renderSwarm = Input.attackMode === 'INSECT' && Input.canUseInsectAttackMode() && !Input.isUltMode && !Input.isUltimateBusy();
    Input.updateInsectSwarm(dt, enemies, scaleFactor);

    const swordInput = renderSwarm
        ? { ...Input, isAttacking: false, isUltMode: false, ultimatePhase: 'idle', attackMode: 'SWORD' }
        : Input;

    swords.forEach(s => {
        s.update(guardCenter, enemies, swordInput, scaleFactor);
        if (!renderSwarm) {
            s.draw(ctx, scaleFactor);
        }
    });

    if (renderSwarm) {
        Input.drawInsectSwarm(ctx, scaleFactor);
    }

    renderCursor();

    // Vẽ và cập nhật hạt hiệu ứng
    for (let i = visualParticles.length - 1; i >= 0; i--) {
        const p = visualParticles[i];
        const friction = p.friction ?? 1;
        const nextVx = (p.vx || 0) * friction;
        const nextVy = ((p.vy || 0) + (p.gravity || 0)) * friction;
        p.vx = nextVx;
        p.vy = nextVy;
        p.x += nextVx;
        p.y += nextVy;

        if (typeof p.radialVelocity === 'number') {
            p.radius = (p.radius || 0) + p.radialVelocity;
        }

        if (typeof p.sizeVelocity === 'number') {
            p.size = Math.max(0, (p.size || 0) + p.sizeVelocity);
        }

        if (typeof p.lengthVelocity === 'number') {
            p.length = Math.max(0, (p.length || 0) + p.lengthVelocity);
        }

        if (typeof p.rotationSpeed === 'number') {
            p.rotation = (p.rotation || 0) + p.rotationSpeed;
        }

        p.life -= p.decay ?? 0.02;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life) * (p.opacity ?? 1);
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;
        ctx.shadowBlur = p.glow || 0;
        ctx.shadowColor = p.color;

        if (p.type === 'square') {
            const size = p.size || 0;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation || 0);
            ctx.fillRect(-size / 2, -size / 2, size, size);
        } else if (p.type === 'ring') {
            ctx.lineWidth = Math.max(0.6, (p.lineWidth || 2) * Math.max(0.35, p.life));
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0, p.radius || 0), 0, Math.PI * 2);
            ctx.stroke();
        } else if (p.type === 'ray') {
            const angle = p.angle || 0;
            const startRadius = p.radius || 0;
            const endRadius = startRadius + (p.length || 0);
            ctx.lineWidth = Math.max(0.8, (p.lineWidth || 2) * Math.max(0.35, p.life));
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(
                p.x + (Math.cos(angle) * startRadius),
                p.y + (Math.sin(angle) * startRadius)
            );
            ctx.lineTo(
                p.x + (Math.cos(angle) * endRadius),
                p.y + (Math.sin(angle) * endRadius)
            );
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0, p.size || 0), 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
        if (p.life <= 0) visualParticles.splice(i, 1);
    }
    ctx.globalAlpha = 1;

    ctx.restore();
    requestAnimationFrame(animate);
}

(async function boot() {
    await preloadEnemyIcons();
    init();
    animate();
})();
// <!-- Create By: Vũ Hoài Nam -->
