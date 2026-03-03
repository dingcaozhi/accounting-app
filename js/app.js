/**
 * 主应用逻辑 - Main App
 */

const app = {
    currentFilter: 'all',
    currentCategoryType: 'expense',

    // 初始化
    async init() {
        // 等待 Supabase 加载
        await this.waitForSupabase();
        
        this.bindEvents();
        await this.checkAuth();
    },

    // 等待 Supabase 加载
    waitForSupabase() {
        return new Promise((resolve) => {
            const check = () => {
                if (window.supabase) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    },

    // 检查登录状态
    async checkAuth() {
        await Auth.init();
        
        if (Auth.isLoggedIn()) {
            await this.showMainPage();
        } else {
            this.showAuthPage();
        }
    },

    // 显示登录页
    showAuthPage() {
        document.getElementById('authPage').classList.remove('hidden');
        document.getElementById('mainPage').classList.add('hidden');
    },

    // 显示主页面
    async showMainPage() {
        document.getElementById('authPage').classList.add('hidden');
        document.getElementById('mainPage').classList.remove('hidden');
        
        const user = Auth.getCurrentUser();
        document.getElementById('currentUser').textContent = user ? user.username : 'User';
        
        await this.updateStats();
        await this.renderRecords();
    },

    // 认证状态变化回调
    async onAuthChange(isLoggedIn) {
        if (isLoggedIn) {
            await this.showMainPage();
        } else {
            this.showAuthPage();
        }
    },

    // 绑定事件
    bindEvents() {
        // 登录/注册标签切换
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.tab;
                this.switchAuthTab(targetTab);
            });
        });

        // 登录表单
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });

        // 注册表单
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleRegister();
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
        document.getElementById('addForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAddRecord();
        });

        // 分类管理标签
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.switchCategoryTab(type);
            });
        });
    },

    // 切换登录/注册标签
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

    // 处理登录
    async handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        const result = await Auth.login(email, password);
        
        if (result.success) {
            await this.showMainPage();
            document.getElementById('loginForm').reset();
        } else {
            alert(result.message);
        }
    },

    // 处理注册
    async handleRegister() {
        const email = document.getElementById('regEmail').value.trim();
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value;
        
        const result = await Auth.register(email, password, username);
        
        if (result.success) {
            alert(result.message);
            this.switchAuthTab('login');
            document.getElementById('registerForm').reset();
        } else {
            alert(result.message);
        }
    },

    // 退出登录
    async logout() {
        if (confirm('确定要退出登录吗？')) {
            await Auth.logout();
        }
    },

    // 更新统计数据
    async updateStats() {
        const stats = await Storage.getStats();
        
        document.getElementById('monthIncome').textContent = `¥${stats.monthIncome.toFixed(2)}`;
        document.getElementById('monthExpense').textContent = `¥${stats.monthExpense.toFixed(2)}`;
        document.getElementById('monthBalance').textContent = `¥${stats.monthBalance.toFixed(2)}`;
    },

    // 切换筛选
    switchFilter(filter) {
        this.currentFilter = filter;
        
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderRecords();
    },

    // 渲染记录列表
    async renderRecords() {
        const container = document.getElementById('recordsList');
        const records = await Storage.getRecords();
        
        // 筛选
        let filteredRecords = records;
        if (this.currentFilter !== 'all') {
            filteredRecords = records.filter(r => r.type === this.currentFilter);
        }
        
        if (filteredRecords.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <h3>还没有记录</h3>
                    <p>点击下方的按钮记一笔吧</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filteredRecords.map(record => {
            const icon = Categories.getIcon(record.category);
            const amountClass = record.type === 'income' ? 'income' : 'expense';
            const amountSign = record.type === 'income' ? '+' : '-';
            
            return `
                <div class="record-item ${record.type}">
                    <div class="record-icon">${icon}</div>
                    <div class="record-info">
                        <div class="record-category">${record.category}</div>
                        ${record.remark ? `<div class="record-remark">${record.remark}</div>` : ''}
                        <div class="record-date">${this.formatDate(record.date)}</div>
                    </div>
                    <div class="record-amount ${amountClass}">
                        ${amountSign}¥${parseFloat(record.amount).toFixed(2)}
                    </div>
                    <div class="record-actions">
                        <button class="btn-delete" onclick="app.confirmDelete('${record.id}')">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    // 格式化日期
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

    // 显示添加弹窗
    async showAddModal(type) {
        document.getElementById('modalTitle').textContent = type === 'expense' ? '记支出' : '记收入';
        
        // 设置类型
        document.querySelector(`input[name="type"][value="${type}"]`).checked = true;
        
        // 渲染分类
        await Categories.renderCategorySelector(type);
        
        // 设置默认日期为今天
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
        
        // 清空表单
        document.getElementById('amount').value = '';
        document.getElementById('remark').value = '';
        
        document.getElementById('addModal').classList.remove('hidden');
    },

    // 关闭添加弹窗
    closeAddModal() {
        document.getElementById('addModal').classList.add('hidden');
    },

    // 处理添加记录
    async handleAddRecord() {
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
        
        const success = await Storage.addRecord(record);
        
        if (success) {
            this.closeAddModal();
            await this.updateStats();
            await this.renderRecords();
        } else {
            alert('保存失败，请重试');
        }
    },

    // 确认删除
    async confirmDelete(id) {
        if (confirm('确定要删除这条记录吗？')) {
            await Storage.deleteRecord(id);
            await this.updateStats();
            await this.renderRecords();
        }
    },

    // 显示分类管理
    async showCategoryManager() {
        this.currentCategoryType = 'expense';
        this.renderCategoryTabs();
        await Categories.renderCategoryList('expense');
        document.getElementById('categoryModal').classList.remove('hidden');
    },

    // 关闭分类管理
    closeCategoryModal() {
        document.getElementById('categoryModal').classList.add('hidden');
    },

    // 切换分类标签
    switchCategoryTab(type) {
        this.currentCategoryType = type;
        this.renderCategoryTabs();
        Categories.renderCategoryList(type);
    },

    // 渲染分类标签
    renderCategoryTabs() {
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.type === this.currentCategoryType) {
                tab.classList.add('active');
            }
        });
    },

    // 添加分类
    async addCategory() {
        const name = document.getElementById('newCategoryName').value.trim();
        
        if (!name) {
            alert('请输入分类名称');
            return;
        }
        
        const result = await Categories.add(this.currentCategoryType, name);
        
        if (result.success) {
            document.getElementById('newCategoryName').value = '';
            await Categories.renderCategoryList(this.currentCategoryType);
        } else {
            alert(result.message);
        }
    },

    // 删除分类
    async deleteCategory(type, name) {
        if (!confirm(`确定要删除分类"${name}"吗？`)) {
            return;
        }
        
        const result = await Categories.remove(type, name);
        
        if (result.success) {
            await Categories.renderCategoryList(type);
        } else {
            alert(result.message);
        }
    },

    // 显示设置
    showSettings() {
        document.getElementById('settingsModal').classList.remove('hidden');
    },

    // 关闭设置
    closeSettingsModal() {
        document.getElementById('settingsModal').classList.add('hidden');
    },

    // 导出数据
    async exportData() {
        await Storage.exportData();
        this.closeSettingsModal();
    },

    // 导入数据
    async importData(input) {
        const file = input.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const success = await Storage.importData(e.target.result);
            if (success) {
                alert('数据导入成功');
                await this.updateStats();
                await this.renderRecords();
                this.closeSettingsModal();
            } else {
                alert('数据导入失败，请检查文件格式');
            }
        };
        reader.readAsText(file);
        input.value = '';
    },

    // 清除所有数据
    async clearAllData() {
        if (!confirm('警告：这将清除所有记账数据，不可恢复！\n\n确定要继续吗？')) {
            return;
        }
        
        if (!confirm('再次确认：真的要删除所有数据吗？')) {
            return;
        }
        
        await Storage.clearAllData();
        await this.updateStats();
        await this.renderRecords();
        this.closeSettingsModal();
        alert('数据已清除');
    }
};

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
