-- ========================================================
-- BLACKLINE BARBER CLUB — Supabase PostgreSQL Schema
-- ========================================================
-- Выполните этот SQL-скрипт в Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql

-- 1. Таблица администраторов (хэшированные пароли bcrypt)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Таблица услуг (Прайс-лист)
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  price INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('hair', 'beard', 'combo', 'care')),
  is_visible BOOLEAN DEFAULT true,
  order_num INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Таблица мастеров
CREATE TABLE IF NOT EXISTS masters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  specialization TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  is_visible BOOLEAN DEFAULT true,
  order_num INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Таблица расписания
CREATE TABLE IF NOT EXISTS schedule_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  work_days JSONB NOT NULL DEFAULT '[1,2,3,4,5,6,0]',
  open_time TEXT NOT NULL DEFAULT '10:00',
  close_time TEXT NOT NULL DEFAULT '22:00',
  interval_minutes INTEGER NOT NULL DEFAULT 60,
  break_start TEXT DEFAULT '14:00',
  break_end TEXT DEFAULT '15:00',
  blocked_dates JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Таблица настроек сайта и контактов
CREATE TABLE IF NOT EXISTS site_info (
  id TEXT PRIMARY KEY DEFAULT 'default',
  brand_name TEXT NOT NULL DEFAULT 'BLACKLINE BARBER CLUB',
  city TEXT NOT NULL DEFAULT 'Москва',
  address TEXT NOT NULL DEFAULT 'ул. Большая Дмитровка, 12, стр. 1',
  metro TEXT DEFAULT 'м. Театральная / Охотный ряд',
  lat DOUBLE PRECISION DEFAULT 55.760884,
  lng DOUBLE PRECISION DEFAULT 37.616355,
  zoom INTEGER DEFAULT 16,
  phone TEXT NOT NULL DEFAULT '+7 (495) 120-40-50',
  phone_raw TEXT NOT NULL DEFAULT '+74951204050',
  working_hours TEXT DEFAULT 'Ежедневно с 10:00 до 22:00',
  route_url TEXT DEFAULT 'https://yandex.ru/maps/?rtext=~55.760884,37.616355&rtt=auto',
  social_vk TEXT DEFAULT 'https://vk.com',
  social_telegram TEXT DEFAULT 'https://t.me',
  hero_title_line1 TEXT DEFAULT 'ТВОЙ СТИЛЬ.',
  hero_title_line2 TEXT DEFAULT 'ТВОИ ПРАВИЛА.',
  hero_subtitle TEXT DEFAULT 'Мужские стрижки, оформление бороды и внимание к деталям. Без спешки. С характером.',
  about_title TEXT DEFAULT 'Больше, чем просто стрижка',
  about_text TEXT DEFAULT 'BLACKLINE BARBER CLUB — пространство, где ценят индивидуальный стиль, точность и комфорт.',
  about_pillars JSONB DEFAULT '[]',
  hero_facts JSONB DEFAULT '[]',
  advantages JSONB DEFAULT '[]',
  theme_color TEXT DEFAULT '#c59b67',
  disclaimer_text TEXT DEFAULT 'Официальный сайт BLACKLINE BARBER CLUB.',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Таблица записей клиентов (Бронирования)
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  service_id TEXT NOT NULL,
  service_title TEXT NOT NULL,
  price INTEGER NOT NULL,
  master_id TEXT NOT NULL,
  master_name TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('card_offline', 'cash_offline')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'completed', 'cancelled')),
  comment TEXT DEFAULT '',
  admin_notes TEXT DEFAULT ''
);

-- ========================================================
-- НАСТРОЙКА БЕЗОПАСНОСТИ НА УРОВНЕ СТРОК (Row Level Security - RLS)
-- ========================================================

-- Включаем RLS на всех таблицах
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 1. admin_users: Закрыта от любого прямого публичного чтения. Доступна только серверу (service_role).
CREATE POLICY "Deny public access to admin_users" ON admin_users
  FOR ALL TO public USING (false);

-- 2. services: Публичное чтение видимых услуг
CREATE POLICY "Allow public read visible services" ON services
  FOR SELECT TO public USING (is_visible = true);

-- 3. masters: Публичное чтение видимых мастеров
CREATE POLICY "Allow public read visible masters" ON masters
  FOR SELECT TO public USING (is_visible = true);

-- 4. schedule_config & site_info: Публичное чтение настроек
CREATE POLICY "Allow public read schedule" ON schedule_config
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow public read site_info" ON site_info
  FOR SELECT TO public USING (true);

-- 5. bookings (КРИТИЧЕСКИ ВАЖНО):
-- Публичные гости могут ТОЛЬКО вставлять новую запись.
CREATE POLICY "Allow public insert bookings" ON bookings
  FOR INSERT TO public WITH CHECK (
    length(customer_name) >= 2 AND
    length(customer_phone) >= 10 AND
    status = 'new'
  );

-- Гости НЕ ИМЕЮТ ПРАВА просматривать чужие записи или телефоны:
CREATE POLICY "Deny public select bookings" ON bookings
  FOR SELECT TO public USING (false);

CREATE POLICY "Deny public update bookings" ON bookings
  FOR UPDATE TO public USING (false);

CREATE POLICY "Deny public delete bookings" ON bookings
  FOR DELETE TO public USING (false);

-- 6. Полный доступ для сервера по сервисному ключу (service_role bypasses RLS)
-- Netlify Functions / Express backend использует SUPABASE_SERVICE_ROLE_KEY для административных действий.

-- ========================================================
-- 7. НАЧАЛЬНЫЕ ДАННЫЕ (SEEDS)
-- ========================================================

-- Начальный администратор: логин admin, пароль admin123 (хэш bcrypt, 10 раундов)
-- Сразу после первого входа рекомендуется сменить пароль в панели управления!
INSERT INTO admin_users (username, password_hash)
VALUES ('admin', '$2b$10$kJ/uxjDfkbrt60gt3Xx/he1m3g/o/yMAaqV775LZPbpePUJIdvcja')
ON CONFLICT (username) DO NOTHING;

-- Начальные услуги
INSERT INTO services (id, title, price, duration_minutes, category, description, is_visible, order_num)
VALUES
  ('srv-1', 'Мужская стрижка', 2200, 50, 'hair', 'Мытьё головы, консультация, точная стрижка с учётом формы головы и текстуры волос, сушка и естественная укладка.', true, 1),
  ('srv-2', 'Моделирование и стрижка бороды', 1600, 40, 'beard', 'Подбор геометрии бороды под черты лица, распаривание, стрижка ножницами и триммером, чёткие контуры и уход маслом.', true, 2),
  ('srv-3', 'Комплекс: Стрижка + Борода', 3400, 80, 'combo', 'Полный комплекс для уверенного образа: стрижка волос любой сложности и ювелирное моделирование бороды с распариванием.', true, 3),
  ('srv-4', 'Стрижка машинкой (Fade)', 1500, 35, 'hair', 'Стрижка одной или несколькими насадками с плавным и чистым градиентом перехода (skin fade / taper fade), окантовка шейной зоны.', true, 4),
  ('srv-5', 'Королевское бритьё', 2000, 45, 'beard', 'Традиционный мужской ритуал: горячие и холодные компрессы, нанесение пены помазком, гладкое бритьё шаветтом и успокаивающий бальзам.', true, 5),
  ('srv-6', 'Камуфляж седины (волосы или борода)', 1400, 30, 'care', 'Мягкое тонирование без эффекта окрашенных волос. Натуральный оттенок, незаметное отрастание корней, быстрое время выдержки.', true, 6),
  ('srv-7', 'Премиальный уход за кожей головы', 1200, 25, 'care', 'Очищающий скраб для кожи головы, восстанавливающая сыворотка, тонизирующий массаж и укрепляющий уход для волос.', true, 7),
  ('srv-8', 'Отец и сын (две стрижки)', 3800, 90, 'combo', 'Совместный визит в клуб: две полноценные классические или современные мужские стрижки в комфортной клубной атмосфере.', true, 8)
ON CONFLICT (id) DO NOTHING;

-- Начальные мастера
INSERT INTO masters (id, name, specialization, bio, photo_url, is_visible, order_num)
VALUES
  ('mst-1', 'Артём', 'Стрижки Fade & Текстура', 'Специализируется на современных текстурных стрижках и безупречных градиентах Fade. Точность линий и чистый срез.', '/images/stock_master_artem.jpg', true, 1),
  ('mst-2', 'Максим', 'Стрижки и оформление бороды', 'Мастер комплексных преображений. Умеет подчинить любую непослушную бороду, подчеркнуть мужественные черты и подобрать идеальный домашний уход.', '/images/stock_master_maxim.jpg', true, 2),
  ('mst-3', 'Кирилл', 'Классические стрижки и бритьё', 'Приверженец строгой академической классики и безупречного традиционного влажного бритья. Сдержанный стиль, симметрия и премиальный комфорт.', '/images/stock_master_kirill.jpg', true, 3)
ON CONFLICT (id) DO NOTHING;

-- Начальное расписание работы
INSERT INTO schedule_config (id, work_days, open_time, close_time, interval_minutes, break_start, break_end, blocked_dates)
VALUES (
  'default',
  '[1, 2, 3, 4, 5, 6, 0]'::jsonb,
  '10:00',
  '22:00',
  60,
  '14:00',
  '15:00',
  '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Начальные контакты и настройки
INSERT INTO site_info (
  id, brand_name, city, address, metro, lat, lng, zoom, phone, phone_raw, working_hours, route_url, social_vk, social_telegram,
  hero_title_line1, hero_title_line2, hero_subtitle, about_title, about_text, about_pillars, hero_facts, advantages, theme_color, disclaimer_text
)
VALUES (
  'default',
  'BLACKLINE BARBER CLUB',
  'Москва',
  'ул. Большая Дмитровка, 12, стр. 1',
  'м. Театральная / Охотный ряд',
  55.760884,
  37.616355,
  16,
  '+7 (495) 120-40-50',
  '+74951204050',
  'Ежедневно с 10:00 до 22:00',
  'https://yandex.ru/maps/?rtext=~55.760884,37.616355&rtt=auto',
  'https://vk.com',
  'https://t.me',
  'ТВОЙ СТИЛЬ.',
  'ТВОИ ПРАВИЛА.',
  'Мужские стрижки, оформление бороды и внимание к деталям. Без спешки. С характером.',
  'Больше, чем просто стрижка',
  'BLACKLINE BARBER CLUB — пространство, где ценят индивидуальный стиль, точность и комфорт. Мы уделяем внимание форме, деталям и тому, как стрижка работает в повседневной жизни.',
  '[{"title":"Индивидуальный подбор формы","description":"Учитываем особенности роста волос, форму черепа и ваш повседневный ритм жизни."},{"title":"Внимание к деталям","description":"Чистые линии окантовки, аккуратный срез и косметика, которая действительно работает."},{"title":"Комфортная атмосфера","description":"Никакой суеты и навязчивого сервиса. Сдержанная мужская эстетика, премиальный чай и свежий кофе."}]'::jsonb,
  '[{"id":"hf-1","title":"Профессиональные мастера","description":"Опытные барберы со знанием геометрии мужских стрижек"},{"id":"hf-2","title":"Индивидуальный подход","description":"Подбор формы под черты лица и образ жизни"},{"id":"hf-3","title":"Предварительная запись","description":"Комфортное планирование времени без ожидания в очереди"}]'::jsonb,
  '[{"id":"adv-1","title":"Понятные цены","description":"Фиксированный прайс-лист без скрытых доплат за мытьё, сушку или стайлинг."},{"id":"adv-2","title":"Выбор мастера","description":"Вы можете записаться к конкретному специалисту, оценив его специализацию."},{"id":"adv-3","title":"Предварительная запись","description":"Точное соблюдение тайминга визита без утомительного ожидания."},{"id":"adv-4","title":"Рекомендации по уходу","description":"Подскажем правильный домашний уход и средства стайлинга именно для ваших волос."}]'::jsonb,
  '#c59b67',
  'Официальный сайт BLACKLINE BARBER CLUB. Все услуги оказываются по предварительной записи.'
)
ON CONFLICT (id) DO NOTHING;
