-- Supabase 数据库初始化脚本
-- 在 Supabase SQL Editor 中执行

-- 创建记账记录表
CREATE TABLE IF NOT EXISTS records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(10, 2) NOT NULL,
    category TEXT NOT NULL,
    date DATE NOT NULL,
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建分类表
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, type, name)
);

-- 启用 RLS (Row Level Security)
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己的数据
CREATE POLICY "Users can only access their own records"
    ON records FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own categories"
    ON categories FOR ALL
    USING (auth.uid() = user_id);

-- 创建索引
CREATE INDEX idx_records_user_id ON records(user_id);
CREATE INDEX idx_records_date ON records(date);
CREATE INDEX idx_categories_user_id ON categories(user_id);

-- 插入默认分类（通过触发器在注册用户时自动创建）
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
    -- 支出分类
    INSERT INTO categories (user_id, type, name) VALUES
        (NEW.id, 'expense', '餐饮'),
        (NEW.id, 'expense', '交通'),
        (NEW.id, 'expense', '购物'),
        (NEW.id, 'expense', '娱乐'),
        (NEW.id, 'expense', '居住'),
        (NEW.id, 'expense', '医疗'),
        (NEW.id, 'expense', '教育'),
        (NEW.id, 'expense', '其他');
    
    -- 收入分类
    INSERT INTO categories (user_id, type, name) VALUES
        (NEW.id, 'income', '工资'),
        (NEW.id, 'income', '奖金'),
        (NEW.id, 'income', '投资'),
        (NEW.id, 'income', '兼职'),
        (NEW.id, 'income', '红包'),
        (NEW.id, 'income', '其他');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 用户注册时自动创建默认分类
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_default_categories();
