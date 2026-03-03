/**
 * Netlify Identity 认证模块
 */

const Auth = {
    // 初始化
    init() {
        // 监听Netlify Identity事件
        if (window.netlifyIdentity) {
            netlifyIdentity.on('init', user => {
                if (user) {
                    console.log('Netlify Identity initialized with user:', user.email);
                }
            });

            netlifyIdentity.on('login', user => {
                console.log('User logged in:', user.email);
                this.onLogin(user);
            });

            netlifyIdentity.on('logout', () => {
                console.log('User logged out');
                this.onLogout();
            });

            netlifyIdentity.on('error', err => {
                console.error('Netlify Identity error:', err);
            });
        }
    },

    // 获取当前用户
    getCurrentUser() {
        if (window.netlifyIdentity) {
            const user = netlifyIdentity.currentUser();
            if (user) {
                return {
                    id: user.id,
                    email: user.email,
                    username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
                };
            }
        }
        return null;
    },

    // 检查是否已登录
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    },

    // 获取用户ID（用于数据存储隔离）
    getUserId() {
        const user = this.getCurrentUser();
        return user ? user.id : null;
    },

    // 登录回调
    onLogin(user) {
        // 关闭Identity弹窗
        netlifyIdentity.close();
        
        // 触发应用登录成功事件
        if (window.app && window.app.onNetlifyLogin) {
            window.app.onNetlifyLogin(this.getCurrentUser());
        }
    },

    // 退出回调
    onLogout() {
        // 触发应用退出事件
        if (window.app && window.app.onNetlifyLogout) {
            window.app.onNetlifyLogout();
        }
    },

    // 退出登录
    logout() {
        if (window.netlifyIdentity) {
            netlifyIdentity.logout();
        }
    },

    // 打开登录弹窗
    openLogin() {
        if (window.netlifyIdentity) {
            netlifyIdentity.open('login');
        } else {
            alert('Netlify Identity 加载中，请稍后再试');
        }
    },

    // 打开注册弹窗
    openSignup() {
        if (window.netlifyIdentity) {
            netlifyIdentity.open('signup');
        } else {
            alert('Netlify Identity 加载中，请稍后再试');
        }
    }
};

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});
