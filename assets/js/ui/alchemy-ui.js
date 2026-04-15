AlchemyUI = {
    overlay: document.getElementById('alchemy-popup'),
    btnOpen: document.getElementById('btn-alchemy-lab'),
    btnClose: document.getElementById('close-alchemy'),
    status: document.getElementById('alchemy-status'),
    recipeGrid: document.getElementById('alchemy-recipe-grid'),

    init() {
        this.overlay = document.getElementById('alchemy-popup') || this.overlay;
        this.btnOpen = document.getElementById('btn-alchemy-lab') || this.btnOpen;
        this.btnClose = document.getElementById('close-alchemy') || this.btnClose;
        this.status = document.getElementById('alchemy-status') || this.status;
        this.recipeGrid = document.getElementById('alchemy-recipe-grid') || this.recipeGrid;

        if (this.btnOpen) {
            this.btnOpen.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (this.btnOpen.classList.contains('is-hidden')) return;
                this.open();
            });
        }

        if (!this.overlay) return;

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

        if (this.recipeGrid) {
            this.recipeGrid.addEventListener('pointerdown', (e) => {
                const craftBtn = e.target.closest('[data-alchemy-recipe]');
                if (!craftBtn) return;
                e.stopPropagation();
                const recipeKey = craftBtn.getAttribute('data-alchemy-recipe') || '';
                if (!recipeKey || typeof Input.craftAlchemyRecipe !== 'function') return;
                Input.craftAlchemyRecipe(recipeKey);
                this.render();
            });
        }
    },

    isOpen() {
        return Boolean(this.overlay && this.overlay.classList.contains('show'));
    },

    getRecipeModels() {
        const recipeDefs = CONFIG.ALCHEMY?.RECIPES || {};
        return Object.entries(recipeDefs)
            .map(([recipeKey, recipe]) => {
                const outputSpec = {
                    kind: 'PILL',
                    category: recipe?.output?.category || 'EXP',
                    quality: recipe?.output?.quality || 'LOW'
                };
                const outputName = Input.getItemDisplayName(outputSpec);
                const requirements = Array.isArray(recipe.ingredients)
                    ? recipe.ingredients.map(ingredient => {
                        const need = Math.max(1, Math.floor(Number(ingredient.count) || 0));
                        const owned = typeof Input.getRecipeOwnedIngredientCount === 'function'
                            ? Input.getRecipeOwnedIngredientCount(ingredient.materialKey)
                            : 0;
                        const materialConfig = Input.getMaterialConfig(ingredient.materialKey) || {};
                        return {
                            key: ingredient.materialKey,
                            name: materialConfig.fullName || ingredient.materialKey,
                            need,
                            owned,
                            ok: owned >= need
                        };
                    })
                    : [];

                return {
                    key: recipeKey,
                    name: recipe?.name || recipeKey,
                    tier: recipe?.realmTier || 'Đan',
                    outputName,
                    canCraft: requirements.every(req => req.ok),
                    requirements
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    },

    render() {
        if (!this.overlay || !this.status || !this.recipeGrid) return;

        const hasHuThienPurchased = Input.hasArtifactPurchased('HU_THIEN_DINH') || Input.hasArtifactUnlocked('HU_THIEN_DINH');
        const canUseDing = typeof Input.canUseHuThienDinhForAlchemy === 'function' && Input.canUseHuThienDinhForAlchemy();

        if (!hasHuThienPurchased) {
            this.status.innerHTML = '<div class="profile-empty">Chưa kết duyên Hư Thiên Đỉnh. Hãy mua pháp bảo này ở Linh Thị để mở Đan Lô.</div>';
            this.recipeGrid.innerHTML = '';
            return;
        }

        if (!canUseDing) {
            this.status.innerHTML = '<div class="profile-empty">Đã có Hư Thiên Đỉnh nhưng chưa triển khai. Hãy vào Bảng Bí Pháp triển khai Hư Thiên Đỉnh để bắt đầu luyện đan.</div>';
        } else {
            this.status.innerHTML = '<div class="profile-empty">Hư Thiên Đỉnh đã khai đỉnh. Chọn đan phương bên dưới để luyện đan.</div>';
        }

        const recipes = this.getRecipeModels();
        if (!recipes.length) {
            this.recipeGrid.innerHTML = '<article class="inventory-slot is-empty"><span>Chưa có đan phương nào khả dụng.</span></article>';
            return;
        }

        this.recipeGrid.innerHTML = recipes.map(recipe => {
            const reqMarkup = recipe.requirements.map(req => `
                <li>${escapeHtml(req.name)}: <strong style="color:${req.ok ? '#8fffcf' : '#ff8a80'}">${formatNumber(req.owned)}/${formatNumber(req.need)}</strong></li>
            `).join('');

            return `
                <article class="inventory-slot has-pill-art" style="--slot-accent:${recipe.canCraft ? '#8fffcf' : '#7aa3b7'}">
                    <div class="slot-badge">${escapeHtml(recipe.tier)}</div>
                    <h4>${escapeHtml(recipe.name)}</h4>
                    <p>Thành đan: ${escapeHtml(recipe.outputName)}</p>
                    <ul class="slot-meta" style="padding-left:16px; margin:4px 0 8px;">${reqMarkup}</ul>
                    <div class="slot-actions">
                        <button
                            class="btn-slot-action"
                            data-alchemy-recipe="${escapeHtml(recipe.key)}"
                            ${recipe.canCraft && canUseDing ? '' : 'disabled'}
                        >Luyện đan</button>
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
