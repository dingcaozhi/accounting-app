/**
 * 分类管理模块 - Categories Module
 */

const Categories = {
    // 分类图标映射
    icons: {
        // 支出分类
        '餐饮': '🍽️',
        '交通': '🚗',
        '购物': '🛍️',
        '娱乐': '🎮',
        '居住': '🏠',
        '医疗': '🏥',
        '教育': '📚',
        '通讯': '📱',
        '服装': '👔',
        '美容': '💄',
        '宠物': '🐱',
        '旅行': '✈️',
        '礼物': '🎁',
        '捐赠': '💝',
        '投资': '📈',
        '保险': '🛡️',
        '税务': '📋',
        '其他': '📦',
        
        // 收入分类
        '工资': '💰',
        '奖金': '🎉',
        '投资': '📊',
        '兼职': '💼',
        '红包': '🧧',
        '退款': '💸',
        '利息': '🏦',
        '租金': '🏘️',
        '分红': '📈',
        '稿酬': '✍️',
        '中奖': '🎯',
        '二手': '🔄',
        '补贴': '🎫'
    },

    // 获取分类图标
    getIcon(categoryName) {
        return this.icons[categoryName] || '📝';
    },

    // 获取所有分类（带图标）
    getAllCategoriesWithIcons() {
        const categories = Storage.getCategories();
        return {
            expense: categories.expense.map(name => ({
                name,
                icon: this.getIcon(name)
            })),
            income: categories.income.map(name => ({
                name,
                icon: this.getIcon(name)
            }))
        };
    },

    // 添加新分类
    add(type, name) {
        if (!name || name.trim() === '') {
            return { success: false, message: '分类名称不能为空' };
        }
        
        name = name.trim();
        
        // 检查是否已存在
        const existing = Storage.getCategories(type);
        if (existing.includes(name)) {
            return { success: false, message: '分类已存在' };
        }
        
        if (Storage.addCategory(type, name)) {
            return { success: true, message: '添加成功' };
        }
        
        return { success: false, message: '添加失败' };
    },

    // 删除分类
    remove(type, name) {
        const categories = Storage.getCategories(type);
        
        // 至少保留一个分类
        if (categories.length <= 1) {
            return { success: false, message: '至少需要保留一个分类' };
        }
        
        if (Storage.deleteCategory(type, name)) {
            return { success: true, message: '删除成功' };
        }
        
        return { success: false, message: '删除失败' };
    },

    // 渲染分类选择器
    renderCategorySelector(type) {
        const select = document.getElementById('category');
        const categories = Storage.getCategories(type);
        
        select.innerHTML = categories.map(cat => 
            `\u003coption value="${cat}">${this.getIcon(cat)} ${cat}\u003c/option\u003e`
        ).join('');
    },

    // 渲染分类管理列表
    renderCategoryList(type) {
        const container = document.getElementById('categoryList');
        const categories = Storage.getCategories(type);
        
        if (categories.length === 0) {
            container.innerHTML = '\u003cp class="empty-text">暂无分类\u003c/p\u003e';
            return;
        }
        
        container.innerHTML = categories.map(cat => `
            \u003cspan class="category-tag">
                ${this.getIcon(cat)} ${cat}
                \u003cbutton onclick="app.deleteCategory('${type}', '${cat}')" title="删除">\u0026times;\u003c/button\u003e
            \u003c/span\u003e
        `).join('');
    }
};
