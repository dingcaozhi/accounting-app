/**
 * 本地用户认证模块 - Local Auth
 */

const Auth = {
    // 获取所有用户
    getAllUsers() {
        try {
            const users = localStorage.getItem('accounting_users');
            return users ? JSON.parse(users) : [];
        } catch (e) {
            return [];
        }
    },

    // 保存用户列表
    saveUsers(users) {
        localStorage.setItem('accounting_users', JSON.stringify(users));
    },

    // 简单密码哈希
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'hash_' + Math.abs(hash).toString(16);
    },

    // 注册
    register(email, password, username) {
        const users = this.getAllUsers();
        
        // 检查邮箱是否已存在
        if (users.find(u => u.email === email)) {
            return { success: false, message: '邮箱已注册' };
        }
        
        // 检查用户名是否已存在
        if (users.find(u => u.username === username)) {
            return { success: false, message: '用户名已存在' };
        }
        
        if (password.length < 6) {
            return { success: false, message: '密码至少需要6位' };
        }
        
        // 创建用户
        const user = {
            id: 'user_' + Date.now(),
            email,
            username,
            password: this.hashPassword(password),
            createdAt: new Date().toISOString()
        };
        
        users.push(user);
        this.saveUsers(users);
        
        // 自动登录
        this.setCurrentUser(user);
        
        return { success: true, message: '注册成功' };
    },

    // 登录
    login(email, password) {
        const users = this.getAllUsers();
        
        // 支持用邮箱或用户名登录
        const user = users.find(u => u.email === email || u.username === email);
        
        if (!user) {
            return { success: false, message: '用户不存在' };
        }
        
        if (user.password !== this.hashPassword(password)) {
            return { success: false, message: '密码错误' };
        }
        
        this.setCurrentUser(user);
        
        return { success: true, message: '登录成功' };
    },

    // 退出登录
    logout() {
        localStorage.removeItem('accounting_current_user');
        return true;
    },

    // 获取当前用户
    getCurrentUser() {
        try {
            const user = localStorage.getItem('accounting_current_user');
            return user ? JSON.parse(user) : null;
        } catch (e) {
            return null;
        }
    },

    // 获取用户ID
    getUserId() {
        const user = this.getCurrentUser();
        return user ? user.id : null;
    },

    // 设置当前用户
    setCurrentUser(user) {
        const sessionUser = {
            id: user.id,
            email: user.email,
            username: user.username
        };
        localStorage.setItem('accounting_current_user', JSON.stringify(sessionUser));
    },

    // 检查是否已登录
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    },

    // 初始化
    init() {
        // 本地认证无需额外初始化
        return Promise.resolve();
    }
};
