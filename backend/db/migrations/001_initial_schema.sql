CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION uuid_generate_v7() RETURNS uuid AS $$
DECLARE
  unix_ts_ms bytea;
  uuid_bytes bytea;
BEGIN
  unix_ts_ms := decode(lpad(to_hex(floor(extract(epoch from clock_timestamp()) * 1000)::bigint), 12, '0'), 'hex');
  uuid_bytes := gen_random_bytes(16);
  uuid_bytes := overlay(uuid_bytes placing unix_ts_ms from 1 for 6);
  uuid_bytes := set_byte(uuid_bytes, 6, (get_byte(uuid_bytes, 6) & 15) | 112);
  uuid_bytes := set_byte(uuid_bytes, 8, (get_byte(uuid_bytes, 8) & 63) | 128);
  RETURN encode(uuid_bytes, 'hex')::uuid;
END;
$$ LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_roles_updated_at'
    ) THEN
        CREATE TRIGGER update_roles_updated_at
        BEFORE UPDATE ON roles
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_admins_updated_at'
    ) THEN
        CREATE TRIGGER update_admins_updated_at
        BEFORE UPDATE ON admins
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    employee_id VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    gender VARCHAR(20) CHECK (gender IN ('Male', 'Female')),
    basic_salary NUMERIC(12, 2) CHECK (basic_salary IS NULL OR basic_salary >= 0),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    role VARCHAR(150),
    department VARCHAR(150),
    joining_date DATE,
    profile_picture VARCHAR(2048),
    id_proof_path VARCHAR(2048),
    id_proof_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Resigned')),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_id_registry (
    employee_id VARCHAR(100) PRIMARY KEY,
    sequence_number INTEGER UNIQUE NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS employee_id_sequence START WITH 1;

CREATE TABLE IF NOT EXISTS employee_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Present', 'Absent', 'WFH', 'Halfday', 'On Site Work', 'Paid Holiday', 'Paid Leave')),
    login_time TIME,
    logout_time TIME,
    work_hours TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (employee_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS office_festivals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    festival_date DATE UNIQUE NOT NULL,
    name VARCHAR(255) DEFAULT 'Festival',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    requested_days INTEGER NOT NULL CHECK (requested_days > 0),
    leave_type VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (leave_type IN ('unpaid', 'paid')),
    request_key VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leave_request_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    leave_request_id UUID NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
    leave_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    UNIQUE (leave_request_id, leave_date)
);

CREATE TABLE IF NOT EXISTS media_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    filename VARCHAR(255) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    public_id VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by UUID REFERENCES admins(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_media_library_updated_at'
    ) THEN
        CREATE TRIGGER update_media_library_updated_at
        BEFORE UPDATE ON media_library
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    name VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    sub_heading VARCHAR(255),
    introduction TEXT,
    content JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'enabled',
    hero_image VARCHAR(2048),
    short_description TEXT NOT NULL,
    full_description TEXT NOT NULL,
    specifications JSONB DEFAULT '{}'::jsonb,
    applications TEXT[] DEFAULT '{}',
    benefits TEXT[] DEFAULT '{}',
    features TEXT[] DEFAULT '{}',
    thumbnail_media_id UUID REFERENCES media_library(id) ON DELETE SET NULL,
    hero_media_id UUID REFERENCES media_library(id) ON DELETE SET NULL,
    brochure_media_id UUID REFERENCES media_library(id) ON DELETE SET NULL,
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_products_updated_at'
    ) THEN
        CREATE TRIGGER update_products_updated_at
        BEFORE UPDATE ON products
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_media_id UUID NOT NULL REFERENCES media_library(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_product_images_updated_at'
    ) THEN
        CREATE TRIGGER update_product_images_updated_at
        BEFORE UPDATE ON product_images
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    video_media_id UUID NOT NULL REFERENCES media_library(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_enabled BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_videos_updated_at'
    ) THEN
        CREATE TRIGGER update_videos_updated_at
        BEFORE UPDATE ON videos
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS gallery_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    name VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_gallery_categories_updated_at'
    ) THEN
        CREATE TRIGGER update_gallery_categories_updated_at
        BEFORE UPDATE ON gallery_categories
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    category_id UUID NOT NULL REFERENCES gallery_categories(id) ON DELETE RESTRICT,
    image_media_id UUID NOT NULL REFERENCES media_library(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    alt_text VARCHAR(255),
    tags TEXT[] DEFAULT '{}',
    display_order INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_gallery_updated_at'
    ) THEN
        CREATE TRIGGER update_gallery_updated_at
        BEFORE UPDATE ON gallery
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS careers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    title VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    experience VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    employment_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    responsibilities TEXT[] DEFAULT '{}',
    requirements TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'Open',
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_careers_updated_at'
    ) THEN
        CREATE TRIGGER update_careers_updated_at
        BEFORE UPDATE ON careers
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    name VARCHAR(255) NOT NULL,
    logo VARCHAR(2048) NOT NULL,
    website VARCHAR(2048),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_clients_updated_at'
    ) THEN
        CREATE TRIGGER update_clients_updated_at
        BEFORE UPDATE ON clients
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    job_id UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    notice_period VARCHAR(100) NOT NULL,
    total_experience VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    resume_path VARCHAR(2048) NOT NULL,
    resume_original_name VARCHAR(255),
    resume_mime_type VARCHAR(255),
    resume_size INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    short_description TEXT NOT NULL,
    rich_description TEXT DEFAULT '',
    main_image VARCHAR(2048),
    gallery_images JSONB DEFAULT '[]'::jsonb,
    location VARCHAR(255),
    completion_date VARCHAR(100),
    category VARCHAR(255),
    status VARCHAR(50) DEFAULT 'enabled',
    display_order INTEGER DEFAULT 0,
    seo_title VARCHAR(255),
    seo_description TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_projects_cms_updated_at'
    ) THEN
        CREATE TRIGGER update_projects_cms_updated_at
        BEFORE UPDATE ON projects
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS company_information (
    key VARCHAR(100) PRIMARY KEY,
    content JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_company_info_updated_at'
    ) THEN
        CREATE TRIGGER update_company_info_updated_at
        BEFORE UPDATE ON company_information
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_settings_updated_at'
    ) THEN
        CREATE TRIGGER update_settings_updated_at
        BEFORE UPDATE ON settings
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_contact_messages_updated_at'
    ) THEN
        CREATE TRIGGER update_contact_messages_updated_at
        BEFORE UPDATE ON contact_messages
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(100) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_type VARCHAR(20) DEFAULT 'admin';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_notifications_updated_at'
    ) THEN
        CREATE TRIGGER update_notifications_updated_at
        BEFORE UPDATE ON notifications
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_activity_logs_updated_at'
    ) THEN
        CREATE TRIGGER update_activity_logs_updated_at
        BEFORE UPDATE ON activity_logs
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    page_path VARCHAR(500) NOT NULL,
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_page_views_updated_at'
    ) THEN
        CREATE TRIGGER update_page_views_updated_at
        BEFORE UPDATE ON page_views
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    device_name VARCHAR(255),
    browser VARCHAR(255),
    platform VARCHAR(255),
    ip_address VARCHAR(50),
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_refresh_tokens_updated_at'
    ) THEN
        CREATE TRIGGER update_refresh_tokens_updated_at
        BEFORE UPDATE ON refresh_tokens
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(
    (to_tsvector('english', name || ' ' || short_description || ' ' || full_description))
) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_careers_search ON careers USING gin(
    (to_tsvector('english', title || ' ' || department || ' ' || location || ' ' || description))
) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_gallery_categories_slug ON gallery_categories(slug);
CREATE INDEX IF NOT EXISTS idx_gallery_search ON gallery USING gin(
    (to_tsvector('english', title || ' ' || coalesce(description, '')))
) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_gallery_tags ON gallery USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_company_info_search ON company_information USING gin(
    (to_tsvector('english', content::text))
);
CREATE INDEX IF NOT EXISTS idx_settings_search ON settings USING gin(
    (to_tsvector('english', value::text))
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(is_read) WHERE is_read = FALSE;
