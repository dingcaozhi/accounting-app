/**
 * Supabase 配置
 */

const SUPABASE_URL = 'https://fztanxumyotluclcrsab.supabase.co';
const SUPABASE_KEY = 'sb_publishable_dxloDtNrtjgqSznILWRFlA_hziH27_1';

// 初始化 Supabase 客户端
let supabaseClient = null;

function initSupabase() {
    if (!window.supabase) {
        console.error('Supabase library not loaded');
        return null;
    }
    
    if (!supabaseClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
    return supabaseClient;
}

// 获取 Supabase 客户端
function getSupabase() {
    return initSupabase();
}
