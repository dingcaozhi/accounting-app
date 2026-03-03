/**
 * 用户认证模块 - Auth Module
 * 简单的本地用户管理系统
 */

const Auth = {
    // 获取所有用户列表
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

    // 注册用户
    register(username, password) {
        const users = this.getAllUsers();
        
        // 检查用户名是否已存在
        if (users.find(u => u.username === username)) {
            return { success: false, message: '用户名已存在' };
        }
        
        // 验证密码强度
        if (password.length < 6) {
            return { success: false, message: '密码至少需要6位' };
        }
        
        // 创建新用户（密码使用简单加密）
        const user = {
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
    login(username, password) {
        const users = this.getAllUsers();
        const user = users.find(u => u.username === username);
        
        if (!user) {
            return { success: false, message: '用户不存在' };
        }
        
        if (user.password !== this.hashPassword(password)) {
            return { success: false, message: '密码错误' };
        }
        
        // 设置当前用户
        this.setCurrentUser(user);
        
        return { success: true, message: '登录成功' };
    },

    // 退出登录
    logout() {
        localStorage.removeItem('accounting_current_user');
        return true;
    },

    // 获取当前登录用户
    getCurrentUser() {
        try {
            const user = localStorage.getItem('accounting_current_user');
            return user ? JSON.parse(user) : null;
        } catch (e) {
            return null;
        }
    },

    // 设置当前用户
    setCurrentUser(user) {
        // 不保存密码到当前会话
        const sessionUser = {
            username: user.username,
            loginAt: new Date().toISOString()
        };
        localStorage.setItem('accounting_current_user', JSON.stringify(sessionUser));
    },

    // 检查是否已登录
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    },

    // 简单密码哈希（实际应用应使用更安全的算法）
    hashPassword(password) {
        // 使用简单的字符串操作作为基础哈希
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'hash_' + Math.abs(hash).toString(16);
    },

    // 修改密码
    changePassword(oldPassword, newPassword) {
        const user = this.getCurrentUser();
        if (!user) {
            return { success: false, message: '未登录' };
        }
        
        const users = this.getAllUsers();
        const userIndex = users.findIndex(u => u.username === user.username);
        
        if (userIndex === -1) {
            return { success: false, message: '用户不存在' };
        }
        
        if (users[userIndex].password !== this.hashPassword(oldPassword)) {
            return { success: false, message: '原密码错误' };
        }
        
        if (newPassword.length < 6) {
            return { success: false, message: '新密码至少需要6位' };
        }
        
        users[userIndex].password = this.hashPassword(newPassword);
        this.saveUsers(users);
        
        return { success: true, message: '密码修改成功' };
    },

    // 删除账户
    deleteAccount(password) {
        const user = this.getCurrentUser();
        if (!user) {
            return { success: false, message: '未登录' };
        }
        
        const users = this.getAllUsers();
        const targetUser = users.find(u => u.username === user.username);
        
        if (!targetUser || targetUser.password !== this.hashPassword(password)) {
            return { success: false, message: '密码错误' };
        }
        
        // 删除用户数据
        const filteredUsers = users.filter(u => u.username !== user.username);
        this.saveUsers(filteredUsers);
        
        // 删除用户的数据
        localStorage.removeItem(`accounting_${user.username}`);
        
        // 清除登录状态
        this.logout();
        
        return { success: true, message: '账户已删除' };
    }
};
