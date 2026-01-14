const CONFIG = {
    CORE: { BASE_WIDTH: 1920 },
    ZOOM: {
        MIN: 0.5,
        MAX: 5.0,
        SENSITIVITY: 0.001,
        STEP: 0.2,
        SMOOTH: 0.1,
    },
    BG: {
        STAR_COUNT: 1000,      // Số lượng sao (nếu muốn chỉnh từ config)
        STAR_SIZE: { MIN: 0.5, MAX: 2 },
        STAR_ALPHA: { MIN: 0.2, MAX: 1 },
        STAR_TWINKLE_SPEED: 0.01
    },
    SWORD: {
        COUNT: 72,
        BASE_RADIUS: 130,
        LAYER_SPACING: 70,
        SPIN_SPEED_BASE: 0.07,
        ATTACK_DELAY_MS: 180,
        TRAIL_LENGTH: 6,
        SIZE: 70,
        STUN_DURATION_MS: 1000,
        DURABILITY: 10,
        RESPAWN_DELAY_MS: 1000,
        DEATH_WAIT_MS: 2000, // Thời gian kiếm nằm chờ trước khi biến mất
        SPEED_MULT: 100, // Hệ số điều chỉnh tốc độ quay chung
        
        // Các thông số hành vi mới được tách ra
        BREATH_SPEED: { MIN: 0.015, MAX: 0.025 },
        FLOW_OFFSET: { MIN: 40, MAX: 100 }, // Radius dao động
        ATTACK_DELAY_VAR: { BASE: 6, RAND: 10 }, // Công thức delay
        
        // Phân mảnh khi vỡ
        FRAGMENTS: {
            LIFE_TIME: 1500,
            FADE_TIME: 500
        }
    },
    INPUT: { DOUBLE_TAP_DELAY: 300 },
    COLORS: {
        BG_FADE: "rgba(0, 0, 8, 0.25)",
        SWORD_BLADE: ["#d0fff5", "#7fdcc0", "#3fa78a"],
        SWORD_TRAIL: "rgba(120, 255, 210, 0.3)",
        
        // Màu mới tách ra
        SWORD_HANDLE: "#2f7f68",
        SWORD_GLOW_OUTER: "#8fffe0",
        SWORD_GLOW_INNER: "#9fffe6",
        SWORD_FRAGMENT: "#2a5a4d",
        SWORD_AURA_SHADOW: "#fffaa0",
        
        ENEMY_PARTICLE: "#8cf0ff",
        ENEMY_SHADOW_SHIELD: "#00ffff",
        SHIELD_GLOW: "rgba(0, 255, 255, 0.8)",
        SHIELD_RING_PULSE: "rgba(140, 245, 255, 1)", // Alpha sẽ được tính toán
        SHIELD_RING_OUTER: "rgba(140, 245, 255, 0.2)",
    },
    ENEMY: {
        SPAWN_COUNT: 6,
        SPAWN_PADDING: 50,
        
        // Chỉ số quái
        BASE_SIZE: { MIN: 10, VAR: 50 }, // r = 10 + random^1.5 * 50
        HP: { BASE: 1, VAR: 100 },
        
        // Khiên
        SHIELD_CHANCE: 0.3,
        SHIELD_MAX_HP: 80,
        SHIELD_COLOR: "rgba(100, 200, 255, 0.4)",
        SHIELD_LINE: "#80dfff",
        
        // Mảnh vỡ khiên (Debris)
        DEBRIS: {
            COUNT: 50,
            SPEED: { MIN: 4, MAX: 12 },
            SIZE: { MIN: 2, MAX: 5 },
            LIFE_DECAY: 0.025
        },

        PALETTES: [
            ["#ff9999", "#cc3333"], ["#99ccff", "#3366cc"],
            ["#99ff99", "#33cc33"], ["#ffcc99", "#cc6600"],
            ["#ff99ff", "#cc33cc"], ["#ffff99", "#cccc33"]
        ]
    },
    MANA: {
        MAX: 100,
        START: 100,
        REGEN_PER_MIN: 1,           // 1 phút hồi 1 mana
        REGEN_INTERVAL_MS: 10000,   // 10 giây hồi 1 mana
        COST_RESPAWN: -1,           // Tốn 1 mana khi tái sinh
        GAIN_KILL: 1                // Nhận 1 mana khi diệt địch
    },
};