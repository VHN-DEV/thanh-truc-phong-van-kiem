const CONFIG = {
    CORE: { BASE_WIDTH: 1920 },
    ZOOM: {
        MIN: 0.5,           // Thu nhỏ tối đa
        MAX: 3.0,           // Phóng to tối đa
        SENSITIVITY: 0.001, // Độ nhạy khi lăn chuột
        STEP: 0.2,          // Độ nhảy zoom mỗi lần bấm nút
        SMOOTH: 0.1         // Độ mượt (0.1 = chậm, 1 = tức thì)
    },
    SWORD: {
        COUNT: 72,
        BASE_RADIUS: 130,
        LAYER_SPACING: 70,
        SPIN_SPEED_BASE: 0.07,
        ATTACK_DELAY_MS: 180,
        TRAIL_LENGTH: 6,
        SIZE: 70,
    },
    INPUT: { DOUBLE_TAP_DELAY: 300 },
    COLORS: {
        BG_FADE: "rgba(0, 0, 8, 0.25)",
        SWORD_BLADE: ["#d0fff5", "#7fdcc0", "#3fa78a"],
        SWORD_TRAIL: "rgba(120, 255, 210, 0.3)",
    },
    ENEMY: {
        SPAWN_COUNT: 6,
        PALETTES: [
            ["#ff9999", "#cc3333"], ["#99ccff", "#3366cc"],
            ["#99ff99", "#33cc33"], ["#ffcc99", "#cc6600"],
            ["#ff99ff", "#cc33cc"], ["#ffff99", "#cccc33"]
        ]
    }
};