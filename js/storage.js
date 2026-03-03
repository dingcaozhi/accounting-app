/**
 * Supabase 云端存储模块
 */

const Storage = {
    // 获取当前用户ID
    getUserId() {
        return Auth.getUserId();
    },

    // 获取 Supabase 客户端
    db() {
        return getSupabase();
    },

    // ========== 记录操作 ==========
    
    // 获取所有记录
    async getRecords() {
        const userId = this.getUserId();
        if (!userId) return [];
        
        try {
            const { data, error } = await this.db()
                .from('records')
                .select('*')
                .order('date', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error('Get records error:', e);
            return [];
        }
    },

    // 添加记录
    async addRecord(record) {
        const userId = this.getUserId();
        if (!userId) return false;
        
        try {
            const { data, error } = await this.db()
                .from('records')
                .insert([{
                    user_id: userId,
                    type: record.type,
                    amount: record.amount,
                    category: record.category,
                    date: record.date,
                    remark: record.remark
                }]);
            
            if (error) throw error;
            return true;
        } catch (e) {
            console.error('Add record error:', e);
            return false;
        }
    },

    // 删除记录
    async deleteRecord(id) {
        try {
            const { error } = await this.db()
                .from('records')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        } catch (e) {
            console.error('Delete record error:', e);
            return false;
        }
    },

    // 更新记录
    async updateRecord(id, updates) {
        try {
            const { error } = await this.db()
                .from('records')
                .update(updates)
                .eq('id', id);
            
            if (error) throw error;
            return true;
        } catch (e) {
            console.error('Update record error:', e);
            return false;
        }
    },

    // ========== 分类操作 ==========
    
    // 获取分类
    async getCategories(type) {
        const userId = this.getUserId();
        if (!userId) {
            // 返回默认分类
            return type === 'expense' 
                ? ['餐饮', '交通', '购物', '娱乐', '居住', '医疗', '教育', '其他']
                : ['工资', '奖金', '投资', '兼职', '红包', '其他'];
        }
        
        try {
            let query = this.db()
                .from('categories')
                .select('name')
                .order('created_at');
            
            if (type) {
                query = query.eq('type', type);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            if (type) {
                return data.map(c => c.name);
            }
            
            return {
                expense: data.filter(c => c.type === 'expense').map(c => c.name),
                income: data.filter(c => c.type === 'income').map(c => c.name)
            };
        } catch (e) {
            console.error('Get categories error:', e);
            return type === 'expense' 
                ? ['餐饮', '交通', '购物', '娱乐', '居住', '医疗', '教育', '其他']
                : ['工资', '奖金', '投资', '兼职', '红包', '其他'];
        }
    },

    // 添加分类
    async addCategory(type, name) {
        const userId = this.getUserId();
        if (!userId) return false;
        
        try {
            const { error } = await this.db()
                .from('categories')
                .insert([{
                    user_id: userId,
                    type: type,
                    name: name
                }]);
            
            if (error) {
                if (error.code === '23505') {
                    alert('分类已存在');
                    return false;
                }
                throw error;
            }
            return true;
        } catch (e) {
            console.error('Add category error:', e);
            return false;
        }
    },

    // 删除分类
    async deleteCategory(type, name) {
        try {
            const { error } = await this.db()
                .from('categories')
                .delete()
                .eq('type', type)
                .eq('name', name);
            
            if (error) throw error;
            return true;
        } catch (e) {
            console.error('Delete category error:', e);
            return false;
        }
    },

    // ========== 统计操作 ==========
    
    // 获取统计数据
    async getStats() {
        const records = await this.getRecords();
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

    // ========== 数据导出/导入 ==========
    
    // 导出数据
    async exportData() {
        const records = await this.getRecords();
        const categories = await this.getCategories();
        
        const data = {
            records,
            categories,
            exportDate: new Date().toISOString(),
            version: '2.0'
        };
        
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

    // 导入数据（批量插入）
    async importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (!data.records || !Array.isArray(data.records)) {
                return false;
            }
            
            // 批量导入记录
            for (const record of data.records) {
                await this.addRecord({
                    type: record.type,
                    amount: record.amount,
                    category: record.category,
                    date: record.date,
                    remark: record.remark || ''
                });
            }
            
            return true;
        } catch (e) {
            console.error('Import error:', e);
            return false;
        }
    },

    // 清除所有数据
    async clearAllData() {
        const userId = this.getUserId();
        if (!userId) return false;
        
        try {
            // 删除所有记录
            await this.db()
                .from('records')
                .delete()
                .eq('user_id', userId);
            
            // 删除自定义分类（保留默认分类）
            await this.db()
                .from('categories')
                .delete()
                .eq('user_id', userId);
            
            return true;
        } catch (e) {
            console.error('Clear data error:', e);
            return false;
        }
    }
};
