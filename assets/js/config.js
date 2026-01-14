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
        REGEN_INTERVAL_MS: 3000,   // 10 giây hồi 1 mana
        COST_RESPAWN: -1,           // Tốn 1 mana khi tái sinh
        GAIN_KILL: 1,                // Nhận 1 mana khi diệt địch
        COST_MOVE_PER_SEC: 1,   // Trừ 1 mana/giây khi di chuyển
        COST_ATTACK_PER_SEC: 1, // Trừ 1 mana/giây khi giữ tấn công
        COST_CHANGE_FORM: 1     // Trừ 1 mana mỗi lần đổi dạng

    },
    CULTIVATION: {
        RANKS: [
            // --- NHÂN GIỚI ---
            // Luyện Khí Kỳ (Xanh lá)
            { name: "Luyện Khí sơ kỳ (Tầng 1)", exp: 5, chance: 1, damage: 1, color: "#4CAF50", lightColor: "#A5D6A7" },
            { name: "Luyện Khí sơ kỳ (Tầng 2)", exp: 6, chance: 0.95, damage: 1, color: "#4CAF50", lightColor: "#A5D6A7" },
            { name: "Luyện Khí sơ kỳ (Tầng 3)", exp: 7, chance: 0.95, damage: 1, color: "#4CAF50", lightColor: "#A5D6A7" },
            { name: "Luyện Khí sơ kỳ (Tầng 4)", exp: 9, chance: 0.95, damage: 1, color: "#4CAF50", lightColor: "#A5D6A7" },
            { name: "Luyện Khí trung kỳ (Tầng 5)", exp: 12, chance: 0.9, damage: 1, color: "#43A047", lightColor: "#C8E6C9" },
            { name: "Luyện Khí trung kỳ (Tầng 6)", exp: 16, chance: 0.9, damage: 1, color: "#43A047", lightColor: "#C8E6C9" },
            { name: "Luyện Khí trung kỳ (Tầng 7)", exp: 21, chance: 0.9, damage: 1, color: "#43A047", lightColor: "#C8E6C9" },
            { name: "Luyện Khí trung kỳ (Tầng 8)", exp: 27, chance: 0.9, damage: 1, color: "#43A047", lightColor: "#C8E6C9" },
            { name: "Luyện Khí hậu kỳ (Tầng 9)", exp: 35, chance: 0.85, damage: 1, color: "#2E7D32", lightColor: "#E8F5E9" },
            { name: "Luyện Khí hậu kỳ (Tầng 10)", exp: 45, chance: 0.85, damage: 1, color: "#2E7D32", lightColor: "#E8F5E9" },
            { name: "Luyện Khí hậu kỳ (Tầng 11)", exp: 58, chance: 0.85, damage: 1, color: "#2E7D32", lightColor: "#E8F5E9" },
            { name: "Luyện Khí hậu kỳ (Tầng 12)", exp: 75, chance: 0.8, damage: 1, color: "#2E7D32", lightColor: "#E8F5E9" },
            { name: "Luyện Khí đại viên mãn (Tầng 13)", exp: 100, chance: 0.75, damage: 1, bonus: 100, color: "#1B5E20", lightColor: "#FFFFFF" },

            // Trúc Cơ Kỳ (Xanh dương)
            { name: "Trúc Cơ sơ kỳ", exp: 120, chance: 0.7, damage: 2, color: "#2196F3", lightColor: "#90CAF9" },
            { name: "Trúc Cơ trung kỳ", exp: 180, chance: 0.65, damage: 2, color: "#1E88E5", lightColor: "#BBDEFB" },
            { name: "Trúc Cơ hậu kỳ", exp: 270, chance: 0.6, damage: 2, color: "#1565C0", lightColor: "#E3F2FD" },
            { name: "Trúc Cơ đại viên mãn", exp: 400, chance: 0.55, damage: 2, bonus: 300, color: "#0D47A1", lightColor: "#FFFFFF" },

            // Kết Đan Kỳ (Cam)
            { name: "Kết Đan sơ kỳ", exp: 600, chance: 0.5, damage: 3, color: "#FF9800", lightColor: "#FFCC80" },
            { name: "Kết Đan trung kỳ", exp: 900, chance: 0.45, damage: 3, color: "#FB8C00", lightColor: "#FFE0B2" },
            { name: "Kết Đan hậu kỳ", exp: 1400, chance: 0.4, damage: 3, color: "#EF6C00", lightColor: "#FFF3E0" },
            { name: "Kết Đan đại viên mãn", exp: 2000, chance: 0.35, damage: 3, bonus: 1500, color: "#E65100", lightColor: "#FFFFFF" },

            // Nguyên Anh Kỳ (Hồng)
            { name: "Nguyên Anh sơ kỳ", exp: 3000, chance: 0.35, damage: 4, color: "#E91E63", lightColor: "#F48FB1" },
            { name: "Nguyên Anh trung kỳ", exp: 5000, chance: 0.3, damage: 4, color: "#D81B60", lightColor: "#F8BBD0" },
            { name: "Nguyên Anh hậu kỳ", exp: 8000, chance: 0.25, damage: 4, color: "#C2185B", lightColor: "#FCE4EC" },
            { name: "Nguyên Anh đại viên mãn", exp: 12000, chance: 0.2, damage: 4, bonus: 8000, color: "#880E4F", lightColor: "#FFFFFF" },

            // Hóa Thần Kỳ (Tím)
            { name: "Hóa Thần sơ kỳ", exp: 18000, chance: 0.2, damage: 5, color: "#9C27B0", lightColor: "#CE93D8" },
            { name: "Hóa Thần trung kỳ", exp: 25000, chance: 0.18, damage: 5, color: "#8E24AA", lightColor: "#E1BEE7" },
            { name: "Hóa Thần hậu kỳ", exp: 35000, chance: 0.15, damage: 5, color: "#7B1FA2", lightColor: "#F3E5F5" },
            { name: "Hóa Thần đại viên mãn", exp: 50000, chance: 0.12, damage: 5, bonus: 25000, color: "#4A148C", lightColor: "#FFFFFF" },

            // --- LINH GIỚI ---
            // Luyện Hư Kỳ (Chàm)
            { name: "Luyện Hư sơ kỳ", exp: 60000, chance: 0.12, damage: 6, color: "#3F51B5", lightColor: "#9FA8DA" },
            { name: "Luyện Hư trung kỳ", exp: 80000, chance: 0.1, damage: 6, color: "#3949AB", lightColor: "#C5CAE9" },
            { name: "Luyện Hư hậu kỳ", exp: 110000, chance: 0.09, damage: 6, color: "#303F9F", lightColor: "#E8EAF6" },
            { name: "Luyện Hư đại viên mãn", exp: 150000, chance: 0.08, damage: 6, bonus: 30000, color: "#1A237E", lightColor: "#FFFFFF" },

            // Hợp Thể Kỳ (Xanh ngọc)
            { name: "Hợp Thể sơ kỳ", exp: 140000, chance: 0.08, damage: 7, color: "#00BCD4", lightColor: "#80DEEA" },
            { name: "Hợp Thể trung kỳ", exp: 180000, chance: 0.07, damage: 7, color: "#00ACC1", lightColor: "#B2EBF2" },
            { name: "Hợp Thể hậu kỳ", exp: 230000, chance: 0.06, damage: 7, color: "#0097A7", lightColor: "#E0F7FA" },
            { name: "Hợp Thể đại viên mãn", exp: 300000, chance: 0.05, damage: 7, bonus: 50000, color: "#006064", lightColor: "#FFFFFF" },

            // Đại Thừa Kỳ (Đỏ)
            { name: "Đại Thừa sơ kỳ", exp: 300000, chance: 0.05, damage: 8, color: "#F44336", lightColor: "#EF9A9A" },
            { name: "Đại Thừa trung kỳ", exp: 380000, chance: 0.04, damage: 8, color: "#E53935", lightColor: "#FFCDD2" },
            { name: "Đại Thừa hậu kỳ", exp: 480000, chance: 0.03, damage: 8, color: "#D32F2F", lightColor: "#FFEBEE" },
            { name: "Đại Thừa đại viên mãn", exp: 600000, chance: 0.02, damage: 8, bonus: 80000, color: "#B71C1C", lightColor: "#FFFFFF" },

            // --- TIÊN GIỚI ---
            // Chân Tiên (Vàng kim)
            { name: "Chân Tiên sơ kỳ", exp: 600000, chance: 0.02, damage: 9, color: "#FFD700", lightColor: "#FFF59D" },
            { name: "Chân Tiên trung kỳ", exp: 750000, chance: 0.015, damage: 9, color: "#FFC107", lightColor: "#FFF9C4" },
            { name: "Chân Tiên hậu kỳ", exp: 950000, chance: 0.01, damage: 9, color: "#FFA000", lightColor: "#FFFDE7" },
            { name: "Chân Tiên đại viên mãn", exp: 999999999, chance: 0, damage: 10, color: "#FF8F00", lightColor: "#FFFFFF" }
        ]
    }
};
// <!-- Create By: Vũ Hoài Nam -->