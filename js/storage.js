/**
 * 数据存储模块 - Storage Module
 * 使用 LocalStorage 存储数据，支持多用户隔离
 */

const Storage = {
    // 获取当前用户的数据命名空间
    getNamespace() {
        const userId = Auth.getUserId();
        return userId ? `accounting_${userId}` : 'accounting_guest';
    },

    // 获取完整的数据结构
    getData() {
        const namespace = this.getNamespace();
        const defaultData = {
            records: [],
            categories: {
                expense: ['餐饮', '交通', '购物', '娱乐', '居住', '医疗', '教育', '其他'],
                income: ['工资', '奖金', '投资', '兼职', '红包', '其他']
            },
            settings: {
                currency: 'CNY',
                theme: 'light'
            }
        };
        
        try {
            const data = localStorage.getItem(namespace);
            return data ? JSON.parse(data) : defaultData;
        } catch (e) {
            console.error('Storage getData error:', e);
            return defaultData;
        }
    },

    // 保存数据
    saveData(data) {
        const namespace = this.getNamespace();
        try {
            localStorage.setItem(namespace, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Storage saveData error:', e);
            return false;
        }
    },

    // 获取所有记录
    getRecords() {
        return this.getData().records;
    },

    // 添加记录
    addRecord(record) {
        const data = this.getData();
        record.id = Date.now().toString();
        record.createdAt = new Date().toISOString();
        data.records.unshift(record); // 新记录在前面
        return this.saveData(data);
    },

    // 删除记录
    deleteRecord(id) {
        const data = this.getData();
        data.records = data.records.filter(r => r.id !== id);
        return this.saveData(data);
    },

    // 更新记录
    updateRecord(id, updates) {
        const data = this.getData();
        const index = data.records.findIndex(r => r.id === id);
        if (index !== -1) {
            data.records[index] = { ...data.records[index], ...updates };
            return this.saveData(data);
        }
        return false;
    },

    // 获取分类
    getCategories(type) {
        const data = this.getData();
        return type ? data.categories[type] : data.categories;
    },

    // 添加分类
    addCategory(type, name) {
        const data = this.getData();
        if (!data.categories[type].includes(name)) {
            data.categories[type].push(name);
            return this.saveData(data);
        }
        return false;
    },

    // 删除分类
    deleteCategory(type, name) {
        const data = this.getData();
        data.categories[type] = data.categories[type].filter(c => c !== name);
        return this.saveData(data);
    },

    // 获取统计数据
    getStats() {
        const records = this.getRecords();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        let monthIncome = 0;
        let monthExpense = 0;
        
        records.forEach(record => {
            const date = new Date(record.date);
            if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                if (record.type === 'income') {
                    monthIncome += parseFloat(record.amount);
                } else {
                    monthExpense += parseFloat(record.amount);
                }
            }
        });
        
        return {
            monthIncome,
            monthExpense,
            monthBalance: monthIncome - monthExpense,
            totalRecords: records.length
        };
    },

    // 导出数据为JSON文件
    exportData() {
        const data = this.getData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `accounting_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return true;
    },

    // 从JSON文件导入数据
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.records && data.categories) {
                return this.saveData(data);
            }
            return false;
        } catch (e) {
            console.error('Import error:', e);
            return false;
        }
    },

    // 清除所有数据
    clearAllData() {
        const namespace = this.getNamespace();
        localStorage.removeItem(namespace);
        return true;
    },

    // 获取用户的所有数据（用于迁移/备份）
    getAllUserData() {
        const users = Auth.getAllUsers();
        const allData = {};
        users.forEach(user => {
            const data = localStorage.getItem(`accounting_${user.username}`);
            if (data) {
                allData[user.username] = JSON.parse(data);
            }
        });
        return allData;
    }
};
