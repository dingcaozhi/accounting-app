/**
 * Supabase Auth 认证模块
 */

const Auth = {
    // 初始化
    async init() {
        const supabase = getSupabase();
        if (!supabase) return;
        
        // 监听认证状态变化
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                console.log('User signed in:', session.user.email);
                if (window.app && window.app.onAuthChange) {
                    window.app.onAuthChange(true);
                }
            } else if (event === 'SIGNED_OUT') {
                console.log('User signed out');
                if (window.app && window.app.onAuthChange) {
                    window.app.onAuthChange(false);
                }
            }
        });
        
        // 检查当前会话
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            console.log('Existing session found');
        }
    },

    // 获取当前用户
    getCurrentUser() {
        const supabase = getSupabase();
        if (!supabase) return null;
        
        const user = supabase.auth.user();
        if (user) {
            return {
                id: user.id,
                email: user.email,
                username: user.user_metadata?.username || user.email?.split('@')[0] || 'User'
            };
        }
        return null;
    },

    // 获取用户ID
    getUserId() {
        const user = this.getCurrentUser();
        return user ? user.id : null;
    },

    // 检查是否已登录
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    },

    // 注册
    async register(email, password, username) {
        const supabase = getSupabase();
        if (!supabase) return { success: false, message: 'Supabase 未初始化，请检查网络连接' };
        
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: username || email.split('@')[0]
                    }
                }
            });
            
            if (error) throw error;
            
            return { success: true, message: '注册成功！请检查邮箱验证邮件' };
        } catch (e) {
            console.error('Register error:', e);
            // 网络错误特殊处理
            if (e.message?.includes('fetch') || e.message?.includes('network') || !navigator.onLine) {
                return { success: false, message: '网络连接失败，请检查网络或尝试使用 VPN/代理访问' };
            }
            return { success: false, message: e.message || '注册失败，请稍后重试' };
        }
    },

    // 登录
    async login(email, password) {
        const supabase = getSupabase();
        if (!supabase) return { success: false, message: 'Supabase 未初始化，请检查网络连接' };
        
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            return { success: true, message: '登录成功' };
        } catch (e) {
            console.error('Login error:', e);
            // 网络错误特殊处理
            if (e.message?.includes('fetch') || e.message?.includes('network') || !navigator.onLine) {
                return { success: false, message: '网络连接失败，请检查网络或尝试使用 VPN/代理访问' };
            }
            return { success: false, message: e.message || '登录失败，请稍后重试' };
        }
    },

    // 退出登录
    async logout() {
        const supabase = getSupabase();
        if (!supabase) return;
        
        await supabase.auth.signOut();
    },

    // 发送密码重置邮件
    async resetPassword(email) {
        const supabase = getSupabase();
        if (!supabase) return { success: false, message: 'Supabase 未初始化' };
        
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin
            });
            
            if (error) throw error;
            
            return { success: true, message: '密码重置邮件已发送' };
        } catch (e) {
            return { success: false, message: e.message };
        }
    }
};

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});
