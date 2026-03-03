/**
 * 主应用逻辑 - Main App (本地存储版本)
 */

const app = {
    currentFilter: 'all',
    currentCategoryType: 'expense',

    init() {
        Auth.init();
        this.checkAuth();
        this.bindEvents();
    },

    checkAuth() {
        if (Auth.isLoggedIn()) {
            this.showMainPage();
        } else {
            this.showAuthPage();
        }
    },

    showAuthPage() {
        document.getElementById('authPage').classList.remove('hidden');
        document.getElementById('mainPage').classList.add('hidden');
    },

    showMainPage() {
        document.getElementById('authPage').classList.add('hidden');
        document.getElementById('mainPage').classList.remove('hidden');
        
        const user = Auth.getCurrentUser();
        document.getElementById('currentUser').textContent = user ? user.username : 'User';
        
        this.updateStats();
        this.renderRecords();
    },

    bindEvents() {
        // 登录/注册标签切换
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.tab;
                this.switchAuthTab(targetTab);
            });
        });

        // 登录表单
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // 注册表单
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // 筛选标签
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.switchFilter(filter);
            });
        });

        // 记账类型切换
        document.querySelectorAll('input[name="type"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                Categories.renderCategorySelector(e.target.value);
            });
        });

        // 添加记录表单
        document.getElementById('addForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddRecord();
        });

        // 分类管理标签
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.switchCategoryTab(type);
            });
        });
    },

    switchAuthTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        if (tab === 'login') {
            document.getElementById('loginForm').classList.remove('hidden');
            document.getElementById('registerForm').classList.add('hidden');
        } else {
            document.getElementById('loginForm').classList.add('hidden');
            document.getElementById('registerForm').classList.remove('hidden');
        }
    },

    handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        const result = Auth.login(email, password);
        
        if (result.success) {
            this.showMainPage();
            document.getElementById('loginForm').reset();
        } else {
            alert(result.message);
        }
    },

    handleRegister() {
        const email = document.getElementById('regEmail').value.trim();
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value;
        
        if (!username) {
            alert('请输入用户名');
            return;
        }
        
        const result = Auth.register(email, password, username);
        
        if (result.success) {
            alert(result.message);
            this.showMainPage();
            document.getElementById('registerForm').reset();
        } else {
            alert(result.message);
        }
    },

    logout() {
        if (confirm('确定要退出登录吗？')) {
            Auth.logout();
            this.showAuthPage();
        }
    },

    updateStats() {
        const stats = Storage.getStats();
        
        document.getElementById('monthIncome').textContent = `¥${stats.monthIncome.toFixed(2)}`;
        document.getElementById('monthExpense').textContent = `¥${stats.monthExpense.toFixed(2)}`;
        document.getElementById('monthBalance').textContent = `¥${stats.monthBalance.toFixed(2)}`;
    },

    switchFilter(filter) {
        this.currentFilter = filter;
        
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderRecords();
    },

    renderRecords() {
        const container = document.getElementById('recordsList');
        let records = Storage.getRecords();
        
        if (this.currentFilter !== 'all') {
            records = records.filter(r => r.type === this.currentFilter);
        }
        
        if (records.length === 0) {
            container.innerHTML = `
                \u003cdiv class="empty-state">
                    \u003cdiv class="empty-state-icon">📝\u003c/div>
                    \u003ch3>还没有记录\u003c/h3>
                    \u003cp>点击下方的按钮记一笔吧\u003c/p>
                \u003c/div>
            `;
            return;
        }
        
        container.innerHTML = records.map(record => {
            const icon = Categories.getIcon(record.category);
            const amountClass = record.type === 'income' ? 'income' : 'expense';
            const amountSign = record.type === 'income' ? '+' : '-';
            
            return `
                \u003cdiv class="record-item ${record.type}">
                    \u003cdiv class="record-icon">${icon}\u003c/div>
                    \u003cdiv class="record-info">
                        \u003cdiv class="record-category">${record.category}\u003c/div>
                        ${record.remark ? `\u003cdiv class="record-remark">${record.remark}\u003c/div>` : ''}
                        \u003cdiv class="record-date">${this.formatDate(record.date)}\u003c/div>
                    \u003c/div>
                    \u003cdiv class="record-amount ${amountClass}">
                        ${amountSign}¥${parseFloat(record.amount).toFixed(2)}
                    \u003c/div>
                    \u003cdiv class="record-actions">
                        \u003cbutton class="btn-delete" onclick="app.confirmDelete('${record.id}')">🗑️\u003c/button>
                    \u003c/div>
                \u003c/div>
            `;
        }).join('');
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return '今天';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return '昨天';
        } else {
            return `${date.getMonth() + 1}月${date.getDate()}日`;
        }
    },

    showAddModal(type) {
        document.getElementById('modalTitle').textContent = type === 'expense' ? '记支出' : '记收入';
        document.querySelector(`input[name="type"][value="${type}"]`).checked = true;
        Categories.renderCategorySelector(type);
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
        document.getElementById('amount').value = '';
        document.getElementById('remark').value = '';
        document.getElementById('addModal').classList.remove('hidden');
    },

    closeAddModal() {
        document.getElementById('addModal').classList.add('hidden');
    },

    handleAddRecord() {
        const type = document.querySelector('input[name="type"]:checked').value;
        const amount = document.getElementById('amount').value;
        const category = document.getElementById('category').value;
        const date = document.getElementById('date').value;
        const remark = document.getElementById('remark').value;
        
        if (!amount || amount <= 0) {
            alert('请输入有效金额');
            return;
        }
        
        const record = {
            type,
            amount: parseFloat(amount),
            category,
            date,
            remark
        };
        
        if (Storage.addRecord(record)) {
            this.closeAddModal();
            this.updateStats();
            this.renderRecords();
        } else {
            alert('保存失败，请重试');
        }
    },

    confirmDelete(id) {
        if (confirm('确定要删除这条记录吗？')) {
            Storage.deleteRecord(id);
            this.updateStats();
            this.renderRecords();
        }
    },

    showCategoryManager() {
        this.currentCategoryType = 'expense';
        this.renderCategoryTabs();
        Categories.renderCategoryList('expense');
        document.getElementById('categoryModal').classList.remove('hidden');
    },

    closeCategoryModal() {
        document.getElementById('categoryModal').classList.add('hidden');
    },

    switchCategoryTab(type) {
        this.currentCategoryType = type;
        this.renderCategoryTabs();
        Categories.renderCategoryList(type);
    },

    renderCategoryTabs() {
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.type === this.currentCategoryType) {
                tab.classList.add('active');
            }
        });
    },

    addCategory() {
        const name = document.getElementById('newCategoryName').value.trim();
        
        if (!name) {
            alert('请输入分类名称');
            return;
        }
        
        const result = Categories.add(this.currentCategoryType, name);
        
        if (result.success) {
            document.getElementById('newCategoryName').value = '';
            Categories.renderCategoryList(this.currentCategoryType);
        } else {
            alert(result.message);
        }
    },

    deleteCategory(type, name) {
        if (!confirm(`确定要删除分类"${name}"吗？`)) {
            return;
        }
        
        const result = Categories.remove(type, name);
        
        if (result.success) {
            Categories.renderCategoryList(type);
        } else {
            alert(result.message);
        }
    },

    showSettings() {
        document.getElementById('settingsModal').classList.remove('hidden');
    },

    closeSettingsModal() {
        document.getElementById('settingsModal').classList.add('hidden');
    },

    exportData() {
        Storage.exportData();
        this.closeSettingsModal();
    },

    importData(input) {
        const file = input.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            if (Storage.importData(e.target.result)) {
                alert('数据导入成功');
                this.updateStats();
                this.renderRecords();
                this.closeSettingsModal();
            } else {
                alert('数据导入失败，请检查文件格式');
            }
        };
        reader.readAsText(file);
        input.value = '';
    },

    clearAllData() {
        if (!confirm('警告：这将清除所有记账数据，不可恢复！\n\n确定要继续吗？')) {
            return;
        }
        
        if (!confirm('再次确认：真的要删除所有数据吗？')) {
            return;
        }
        
        Storage.clearAllData();
        this.updateStats();
        this.renderRecords();
        this.closeSettingsModal();
        alert('数据已清除');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
