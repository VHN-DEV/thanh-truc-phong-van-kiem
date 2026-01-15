const CONFIG = {
    CORE: { 
        BASE_WIDTH: 1920        // Chiều rộng cơ sở để tính toán tỉ lệ scale trên các màn hình khác nhau
    },
    ZOOM: {
        MIN: 0.5,               // Mức thu nhỏ tối đa
        MAX: 5.0,               // Mức phóng to tối đa
        SENSITIVITY: 0.001,     // Độ nhạy của con lăn chuột
        STEP: 0.2,              // Khoảng cách zoom mỗi lần nhấn phím +/-
        SMOOTH: 0.1             // Độ mượt khi chuyển đổi zoom (càng nhỏ càng chậm)
    },
    BG: {
        STAR_COUNT: 1000,       // Tổng số lượng sao trên nền trời
        STAR_SIZE: { MIN: 0.5, MAX: 2 },        // Kích thước ngẫu nhiên của hạt sao
        STAR_ALPHA: { MIN: 0.2, MAX: 1 },       // Độ trong suốt ngẫu nhiên của sao
        STAR_TWINKLE_SPEED: 0.01                // Tốc độ nhấp nháy của sao
    },
    SWORD: {
        COUNT: 72,              // Tổng số lượng kiếm tối đa
        BASE_RADIUS: 130,       // Khoảng cách từ tâm đến lớp kiếm đầu tiên
        LAYER_SPACING: 70,      // Khoảng cách giữa các lớp kiếm (vòng trong - vòng ngoài)
        SPIN_SPEED_BASE: 0.07,  // Tốc độ quay cơ bản của vòng kiếm
        ATTACK_DELAY_MS: 180,   // Thời gian chờ để kích hoạt trạng thái tấn công khi nhấn giữ
        TRAIL_LENGTH: 6,        // Độ dài bóng ma (trail) của thanh kiếm
        SIZE: 70,               // Kích thước (chiều dài) hiển thị của thanh kiếm
        STUN_DURATION_MS: 1000, // Thời gian mục tiêu bị khựng khi trúng kiếm
        RESPAWN_DELAY_MS: 1500, // Thời gian hồi phục sau khi kiếm bị vỡ
        DEATH_WAIT_MS: 2000,    // Thời gian thanh kiếm nằm lại hiện trường trước khi biến mất hẳn
        SPEED_MULT: 90,        // Hệ số nhân tốc độ quay chung toàn hệ thống
        
        BREATH_SPEED: { MIN: 0.015, MAX: 0.025 }, // Tốc độ hiệu ứng "nhịp thở" (co giãn vòng kiếm)
        FLOW_OFFSET: { MIN: 40, MAX: 100 },       // Biên độ dao động xa gần của kiếm khi bay
        ATTACK_DELAY_VAR: { BASE: 6, RAND: 10 },  // Độ trễ ngẫu nhiên giữa các lần phóng kiếm

        FRAGMENTS: {            // Hiệu ứng mảnh vỡ khi kiếm gãy
            LIFE_TIME: 2000,    // Thời gian tồn tại của mảnh vỡ
            FADE_TIME: 1000      // Thời gian mờ dần trước khi mất tích
        }
    },
    INPUT: { 
        DOUBLE_TAP_DELAY: 300   // Khoảng cách tối đa giữa 2 lần chạm để tính là double tap
    },
    COLORS: {
        BG_FADE: "rgba(0, 0, 8, 0.25)",         // Màu nền phủ (tạo hiệu ứng lưu ảnh/motion blur)
        SWORD_BLADE: ["#d0fff5", "#7fdcc0", "#3fa78a"], // Gradient màu lưỡi kiếm
        SWORD_TRAIL: "rgba(120, 255, 210, 0.3)",// Màu vệt sáng phía sau kiếm
        
        SWORD_HANDLE: "#2f7f68",        // Màu chuôi kiếm
        SWORD_GLOW_OUTER: "#8fffe0",    // Màu hào quang vòng ngoài
        SWORD_GLOW_INNER: "#9fffe6",    // Màu hào quang lõi kiếm
        SWORD_FRAGMENT: "#2a5a4d",      // Màu các mảnh vỡ
        SWORD_AURA_SHADOW: "#fffaa0",   // Màu bóng đổ của linh khí
        
        ENEMY_PARTICLE: "#8cf0ff",      // Màu hạt hiệu ứng từ quái vật
        ENEMY_SHADOW_SHIELD: "#00ffff", // Màu bóng của khiên bảo vệ quái
        SHIELD_GLOW: "rgba(0, 255, 255, 0.8)",  // Độ rực sáng của khiên
        SHIELD_RING_PULSE: "rgba(140, 245, 255, 1)", // Màu vòng xung lực khi khiên bị đánh
        SHIELD_RING_OUTER: "rgba(140, 245, 255, 0.2)", // Màu viền ngoài của khiên
    },
    ENEMY: {
        SPAWN_COUNT: 8,         // Số lượng quái xuất hiện cùng lúc
        SPAWN_PADDING: 50,      // Khoảng cách an toàn từ mép màn hình khi quái xuất hiện
        ELITE_CHANCE: 0.05,      // Tỉ lệ quái tinh anh xuất hiện (5%)
        BASE_SIZE: { MIN: 10, VAR: 50 }, // Công thức kích thước: r = MIN + random^1.5 * VAR
        HP: { BASE: 1, VAR: 100 },       // Máu cơ bản ban đầu
        USE_PLAYER_RANK_SCALING: false, // true = spam quái có cấp độ xoay quanh người chơi | false = spam quái có cấp độ theo ID cấu hình SPAWN_RANK_RANGE
        SPAWN_RANK_RANGE: {
            MIN_ID: 1,
            MAX_ID: 45
        },
        SHIELD_CHANCE: 0.3,     // Tỉ lệ quái sinh ra có khiên (0.3 = 30%)
        SHIELD_COLOR: "rgba(100, 200, 255, 0.4)", // Màu lõi khiên
        SHIELD_LINE: "#80dfff", // Màu nét vẽ vết nứt khiên
        
        DEBRIS: {               // Mảnh vỡ khi quái chết
            COUNT: 10,          // Số lượng mảnh bắn ra
            SPEED: { MIN: 4, MAX: 12 }, // Tốc độ bắn mảnh vỡ
            SIZE: { MIN: 1, MAX: 3 },   // Kích thước mảnh vỡ
            LIFE_DECAY: 0.025   // Tốc độ biến mất của mảnh vỡ mỗi frame
        },

        PALETTES: [             // Danh sách các bộ màu ngẫu nhiên cho quái
            ["#ff9999", "#cc3333"], ["#99ccff", "#3366cc"],
            ["#99ff99", "#33cc33"], ["#ffcc99", "#cc6600"],
            ["#ff99ff", "#cc33cc"], ["#ffff99", "#cccc33"]
        ],
        HP: { BASE: 20, VAR: 30 },      // Máu cơ bản của quái
        SCALING_FACTOR: 0.4,    // Hệ số tăng chỉ số theo cấp độ người chơi (40% mỗi cấp)
        PILL_CHANCE: 0.15,      // Tỉ lệ rơi ra Đan dược khi quái chết
        ANIMALS: [
            "./assets/images/animals/ammonite.svg",
            "./assets/images/animals/angel-wings.svg",
            "./assets/images/animals/angler-fish.svg",
            "./assets/images/animals/angular-spider.svg",
            "./assets/images/animals/animal-skull.svg",
            "./assets/images/animals/ant.svg",
            "./assets/images/animals/bear.svg",
            "./assets/images/animals/bee.svg",
            "./assets/images/animals/cat-kitty.svg",
            "./assets/images/animals/cat.svg",
            "./assets/images/animals/crab.svg",
            "./assets/images/animals/crocodile.svg",
            "./assets/images/animals/deer.svg",
            "./assets/images/animals/double-dragon.svg",
            "./assets/images/animals/dragon.svg",
            "./assets/images/animals/elephant.svg",
            "./assets/images/animals/fish-seafood.svg",
            "./assets/images/animals/flying-dragon.svg",
            "./assets/images/animals/fox.svg",
            "./assets/images/animals/gorilla.svg",
            "./assets/images/animals/hydra.svg",
            "./assets/images/animals/jelly-fish.svg",
            "./assets/images/animals/lion.svg",
            "./assets/images/animals/maggot.svg",
            "./assets/images/animals/minotaur.svg",
            "./assets/images/animals/monkey.svg",
            "./assets/images/animals/octopus.svg",
            "./assets/images/animals/perana.svg",
            "./assets/images/animals/rabbit.svg",
            "./assets/images/animals/shark.svg",
            "./assets/images/animals/snail-crawl.svg",
            "./assets/images/animals/squid.svg",
            "./assets/images/animals/squirrel.svg",
            "./assets/images/animals/tapir.svg",
            "./assets/images/animals/three-headed-dragon.svg",
            "./assets/images/animals/tiger.svg",
            "./assets/images/animals/turtle.svg",
            "./assets/images/animals/whale-tail.svg",
            "./assets/images/animals/whale.svg",
            "./assets/images/animals/wolf.svg",
        ]
    },
    ITEMS: {
        PILL_BOOST: 0.05        // Mỗi viên Đan dược cộng thêm 5% tỉ lệ đột phá thành công
    },
    MANA: {
        // Lưu ý: MAX giờ đây sẽ được ghi đè bởi giá trị trong CULTIVATION.RANKS
        MAX: 100,               // Giới hạn Linh lực mặc định
        START: 100,             // Linh lực khi bắt đầu game
        REGEN_PER_SEC: 1,       // Tốc độ hồi phục Linh lực mỗi giây
        REGEN_INTERVAL_MS: 1000, // Chu kỳ hồi phục (1000ms = 1 giây một lần)
        COST_RESPAWN: -3,       // Chi phí Mana để hồi phục một thanh kiếm bị vỡ
        GAIN_KILL: 0,           // Lượng Mana nhận lại khi tiêu diệt một quái vật
        COST_MOVE_PER_SEC: 0.5, // Tiêu hao Mana mỗi giây khi di chuyển
        COST_ATTACK_PER_SEC: 1, // Tiêu hao Mana mỗi giây khi đang ở trạng thái tấn công
        COST_CHANGE_FORM: 1     // Chi phí Mana mỗi lần chuyển đổi hình thái (vòng bảo vệ)
    },
    CULTIVATION: {
        MAX_BREAKTHROUGH_CHANCE : 0.99, // Tỉ lệ đột phá tối đa tôi đang để là 99% (luôn có 1% rủi ro để tăng độ kịch tính)
        BREAKTHROUGH_PENALTY_FACTOR: 0.4, // Hệ số mất tu vi khi đột phá thất bại (40%)
        RANKS: [
            // --- NHÂN GIỚI ---
            // Luyện Khí Kỳ (Xanh lá)
            { id: 1, name: "Luyện khí sơ kỳ (Tầng 1)", exp: 5, chance: 1, swordDurability: 3, damage: 1, maxMana: 10, color: "#4CAF50", lightColor: "#A5D6A7" },
            { id: 2, name: "Luyện khí sơ kỳ (Tầng 2)", exp: 6, chance: 0.95, swordDurability: 4, damage: 2, maxMana: 15, color: "#4CAF50", lightColor: "#A5D6A7" },
            { id: 3, name: "Luyện khí sơ kỳ (Tầng 3)", exp: 7, chance: 0.95, swordDurability: 5, damage: 3, maxMana: 20, color: "#4CAF50", lightColor: "#A5D6A7" },
            { id: 4, name: "Luyện khí sơ kỳ (Tầng 4)", exp: 9, chance: 0.95, swordDurability: 6, damage: 4, maxMana: 25, color: "#4CAF50", lightColor: "#A5D6A7" },
            { id: 5, name: "Luyện khí trung kỳ (Tầng 5)", exp: 12, chance: 0.9, swordDurability: 7, damage: 5, maxMana: 30, color: "#43A047", lightColor: "#C8E6C9" },
            { id: 6, name: "Luyện khí trung kỳ (Tầng 6)", exp: 16, chance: 0.9, swordDurability: 8, damage: 6, maxMana: 35, color: "#43A047", lightColor: "#C8E6C9" },
            { id: 7, name: "Luyện khí trung kỳ (Tầng 7)", exp: 21, chance: 0.9, swordDurability: 9, damage: 7, maxMana: 40, color: "#43A047", lightColor: "#C8E6C9" },
            { id: 8, name: "Luyện khí trung kỳ (Tầng 8)", exp: 27, chance: 0.9, swordDurability: 10, damage: 8, maxMana: 45, color: "#43A047", lightColor: "#C8E6C9" },
            { id: 9, name: "Luyện khí hậu kỳ (Tầng 9)", exp: 35, chance: 0.85, swordDurability: 11, damage: 9, maxMana: 50, color: "#2E7D32", lightColor: "#E8F5E9" },
            { id: 10, name: "Luyện khí hậu kỳ (Tầng 10)", exp: 45, chance: 0.85, swordDurability: 12, damage: 10, maxMana: 55, color: "#2E7D32", lightColor: "#E8F5E9" },
            { id: 11, name: "Luyện khí hậu kỳ (Tầng 11)", exp: 58, chance: 0.85, swordDurability: 13, damage: 11, maxMana: 60, color: "#2E7D32", lightColor: "#E8F5E9" },
            { id: 12, name: "Luyện khí hậu kỳ (Tầng 12)", exp: 75, chance: 0.8, swordDurability: 14, damage: 12, maxMana: 65, color: "#2E7D32", lightColor: "#E8F5E9" },
            { id: 13, name: "Luyện khí đại viên mãn (Tầng 13)", exp: 100, chance: 0.75, swordDurability: 15, damage: 13, maxMana: 70, bonus: 100, color: "#1B5E20", lightColor: "#FFFFFF" },

            // Trúc Cơ Kỳ (Xanh dương)
            { id: 14, name: "Trúc cơ sơ kỳ", exp: 120, chance: 0.7, swordDurability: 16, damage: 14, maxMana: 75, color: "#2196F3", lightColor: "#90CAF9" },
            { id: 15, name: "Trúc cơ trung kỳ", exp: 180, chance: 0.65, swordDurability: 17, damage: 15, maxMana: 80, color: "#1E88E5", lightColor: "#BBDEFB" },
            { id: 16, name: "Trúc cơ hậu kỳ", exp: 270, chance: 0.6, swordDurability: 18, damage: 16, maxMana: 85, color: "#1565C0", lightColor: "#E3F2FD" },
            { id: 17, name: "Trúc cơ đại viên mãn", exp: 400, chance: 0.55, swordDurability: 19, damage: 17, maxMana: 90, bonus: 300, color: "#0D47A1", lightColor: "#FFFFFF" },

            // Kết Đan Kỳ (Cam)
            { id: 18, name: "Kết đan sơ kỳ", exp: 600, chance: 0.5, swordDurability: 20, damage: 18, maxMana: 95, color: "#FF9800", lightColor: "#FFCC80" },
            { id: 19, name: "Kết đan trung kỳ", exp: 900, chance: 0.45, swordDurability: 21, damage: 19, maxMana: 100, color: "#FB8C00", lightColor: "#FFE0B2" },
            { id: 20, name: "Kết đan hậu kỳ", exp: 1400, chance: 0.4, swordDurability: 22, damage: 20, maxMana: 105, color: "#EF6C00", lightColor: "#FFF3E0" },
            { id: 21, name: "Kết đan đại viên mãn", exp: 2000, chance: 0.35, swordDurability: 23, damage: 21, maxMana: 110, bonus: 1500, color: "#E65100", lightColor: "#FFFFFF" },

            // Nguyên Anh Kỳ (Hồng)
            { id: 22, name: "Nguyên anh sơ kỳ", exp: 3000, chance: 0.35, swordDurability: 24, damage: 22, maxMana: 105, color: "#E91E63", lightColor: "#F48FB1" },
            { id: 23, name: "Nguyên anh trung kỳ", exp: 5000, chance: 0.3, swordDurability: 25, damage: 23, maxMana: 120, color: "#D81B60", lightColor: "#F8BBD0" },
            { id: 24, name: "Nguyên anh hậu kỳ", exp: 8000, chance: 0.25, swordDurability: 26, damage: 24, maxMana: 125, color: "#C2185B", lightColor: "#FCE4EC" },
            { id: 25, name: "Nguyên anh đại viên mãn", exp: 12000, chance: 0.2, swordDurability: 27, damage: 25, maxMana: 130, bonus: 8000, color: "#880E4F", lightColor: "#FFFFFF" },

            // Hóa Thần Kỳ (Tím)
            { id: 26, name: "Hóa thần sơ kỳ", exp: 18000, chance: 0.2, swordDurability: 28, damage: 26, maxMana: 135, color: "#9C27B0", lightColor: "#CE93D8" },
            { id: 27, name: "Hóa thần trung kỳ", exp: 25000, chance: 0.18, swordDurability: 29, damage: 27, maxMana: 140, color: "#8E24AA", lightColor: "#E1BEE7" },
            { id: 28, name: "Hóa thần hậu kỳ", exp: 35000, chance: 0.15, swordDurability: 30, damage: 28, maxMana: 145, color: "#7B1FA2", lightColor: "#F3E5F5" },
            { id: 29, name: "Hóa thần đại viên mãn", exp: 50000, chance: 0.12, swordDurability: 31, damage: 29, maxMana: 150, bonus: 25000, color: "#4A148C", lightColor: "#FFFFFF" },

            // --- LINH GIỚI ---
            // Luyện Hư Kỳ (Chàm)
            { id: 30, name: "Luyện hư sơ kỳ", exp: 60000, chance: 0.12, swordDurability: 32, damage: 30, maxMana: 155, color: "#3F51B5", lightColor: "#9FA8DA" },
            { id: 31, name: "Luyện hư trung kỳ", exp: 80000, chance: 0.1, swordDurability: 33, damage: 31, maxMana: 160, color: "#3949AB", lightColor: "#C5CAE9" },
            { id: 32, name: "Luyện hư hậu kỳ", exp: 110000, chance: 0.09, swordDurability: 34, damage: 32, maxMana: 165, color: "#303F9F", lightColor: "#E8EAF6" },
            { id: 33, name: "Luyện hư đại viên mãn", exp: 150000, chance: 0.08, swordDurability: 35, damage: 33, maxMana: 170, bonus: 30000, color: "#1A237E", lightColor: "#FFFFFF" },

            // Hợp Thể Kỳ (Xanh ngọc)
            { id: 34, name: "Hợp thể sơ kỳ", exp: 140000, chance: 0.08, swordDurability: 36, damage: 34, maxMana: 175, color: "#00BCD4", lightColor: "#80DEEA" },
            { id: 35, name: "Hợp thể trung kỳ", exp: 180000, chance: 0.07, swordDurability: 37, damage: 35, maxMana: 180, color: "#00ACC1", lightColor: "#B2EBF2" },
            { id: 36, name: "Hợp thể hậu kỳ", exp: 230000, chance: 0.06, swordDurability: 38, damage: 36, maxMana: 185, color: "#0097A7", lightColor: "#E0F7FA" },
            { id: 37, name: "Hợp thể đại viên mãn", exp: 300000, chance: 0.05, swordDurability: 39, damage: 37, maxMana: 190, bonus: 50000, color: "#006064", lightColor: "#FFFFFF" },

            // Đại Thừa Kỳ (Đỏ)
            { id: 38, name: "Đại thừa sơ kỳ", exp: 300000, chance: 0.05, swordDurability: 40, damage: 38, maxMana: 195, color: "#F44336", lightColor: "#EF9A9A" },
            { id: 39, name: "Đại thừa trung kỳ", exp: 380000, chance: 0.04, swordDurability: 41, damage: 39, maxMana: 200, color: "#E53935", lightColor: "#FFCDD2" },
            { id: 40, name: "Đại thừa hậu kỳ", exp: 480000, chance: 0.03, swordDurability: 42, damage: 40, maxMana: 205, color: "#D32F2F", lightColor: "#FFEBEE" },
            { id: 41, name: "Đại thừa đại viên mãn", exp: 600000, chance: 0.02, swordDurability: 43, damage: 41, maxMana: 210, bonus: 80000, color: "#B71C1C", lightColor: "#FFFFFF" },

            // --- TIÊN GIỚI ---
            // Chân Tiên (Vàng kim)
            { id: 42, name: "Chân tiên sơ kỳ", exp: 600000, chance: 0.02, swordDurability: 44, damage: 42, maxMana: 215, color: "#FFD700", lightColor: "#FFF59D" },
            { id: 43, name: "Chân tiên trung kỳ", exp: 750000, chance: 0.015, swordDurability: 49, damage: 43, maxMana: 220, color: "#FFC107", lightColor: "#FFF9C4" },
            { id: 44, name: "Chân tiên hậu kỳ", exp: 950000, chance: 0.01, swordDurability: 46, damage: 44, maxMana: 225, color: "#FFA000", lightColor: "#FFFDE7" },
            { id: 45, name: "Chân tiên đại viên mãn", exp: 999999999, chance: 0, swordDurability: 9999, damage: 9999, maxMana: 9999, color: "#FF8F00", lightColor: "#FFFFFF" }
        ]
    },
    PILL: {
        CHANCE: 0.15,               // Tỉ lệ rơi mặc định (15%)
        ELITE_CHANCE: 1.0,          // Tỉ lệ rơi của quái Tinh Anh (100%)
        COLLECT_DELAY_MS: 600,      // Thời gian chờ trước khi bay về người chơi
        MAGNET_SPEED: 14,           // Tốc độ bay về phía người chơi
        TRAIL_LENGTH: 15,           // Độ dài vệt sáng (số lượng node)
        DROP_RATES: {
            NORMAL: { LOW: 0.85, MEDIUM: 0.10, HIGH: 0.05 },  // Quái thường: 85% Hạ, 10% Trung, 5% Thượng
            ELITE:  { LOW: 0.10,  MEDIUM: 0.60, HIGH: 0.30 }   // Tinh Anh: 10% Hạ, 60% Trung, 30% Thượng
        },
        DROP_COUNT: {
            NORMAL: 1,  // Quái thường rơi 1 viên
            ELITE: 3    // Tinh Anh rơi 3 viên
        },

        TYPES: {
            LOW:    { name: "Hạ phẩm", boost: 0.02, color: "#00ffcc", radius: 4 },   
            MEDIUM: { name: "Trung phẩm", boost: 0.05, color: "#00aaff", radius: 5.5 }, 
            HIGH:   { name: "Thượng phẩm", boost: 0.12, color: "#ffcc00", radius: 7.5 } 
        },
    },
};
// <!-- Create By: Vũ Hoài Nam -->