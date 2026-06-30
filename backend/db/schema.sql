-- ==========================================
-- EDGE ROUTE VISION (ERV) - DATABASE SCHEMA
-- ==========================================

-- Enable pgcrypto (required for gen_random_bytes in older PG versions)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. UUID v7 Generator Function (RFC 9562 Compliant)
CREATE OR REPLACE FUNCTION uuid_generate_v7() RETURNS uuid AS $$
DECLARE
  unix_ts_ms bytea;
  uuid_bytes bytea;
BEGIN
  -- Get unix epoch milliseconds
  unix_ts_ms := decode(lpad(to_hex(floor(extract(epoch from clock_timestamp()) * 1000)::bigint), 12, '0'), 'hex');
  
  -- Generate 16 random bytes
  uuid_bytes := gen_random_bytes(16);
  
  -- Overlay timestamp (first 6 bytes)
  uuid_bytes := overlay(uuid_bytes placing unix_ts_ms from 1 for 6);
  
  -- Set version to 7 (bits 4-7 of byte 6 to '0111')
  uuid_bytes := set_byte(uuid_bytes, 6, (get_byte(uuid_bytes, 6) & 15) | 112);
  
  -- Set variant to 1 (bits 6-7 of byte 8 to '10')
  uuid_bytes := set_byte(uuid_bytes, 8, (get_byte(uuid_bytes, 8) & 63) | 128);
  
  RETURN encode(uuid_bytes, 'hex')::uuid;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 2. Automatic update_updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 3. Tables Definition

-- Roles Table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for roles
CREATE TRIGGER update_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Admins Table
CREATE TABLE admins (
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

-- Trigger for admins
CREATE TRIGGER update_admins_updated_at
BEFORE UPDATE ON admins
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Media Library Table (Central Asset Management)
CREATE TABLE media_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    filename VARCHAR(255) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    public_id VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'pdf'
    file_size INTEGER NOT NULL, -- in bytes
    uploaded_by UUID REFERENCES admins(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for media_library
CREATE TRIGGER update_media_library_updated_at
BEFORE UPDATE ON media_library
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    name VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    short_description TEXT NOT NULL,
    full_description TEXT NOT NULL,
    specifications JSONB DEFAULT '{}'::jsonb, -- dynamic key-value specifications
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

-- Trigger for products
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Product Images Table (Multi-gallery images for products)
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_media_id UUID NOT NULL REFERENCES media_library(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for product_images
CREATE TRIGGER update_product_images_updated_at
BEFORE UPDATE ON product_images
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Videos Table (Homepage Hero background sequential video manager)
CREATE TABLE videos (
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

-- Trigger for videos
CREATE TRIGGER update_videos_updated_at
BEFORE UPDATE ON videos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Gallery Categories Table
CREATE TABLE gallery_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    name VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for gallery_categories
CREATE TRIGGER update_gallery_categories_updated_at
BEFORE UPDATE ON gallery_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Gallery Table
CREATE TABLE gallery (
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

-- Trigger for gallery
CREATE TRIGGER update_gallery_updated_at
BEFORE UPDATE ON gallery
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Careers Table
CREATE TABLE careers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    title VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    experience VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    employment_type VARCHAR(100) NOT NULL, -- e.g., 'Full-time', 'Contract', 'Internship'
    description TEXT NOT NULL,
    responsibilities TEXT[] DEFAULT '{}',
    requirements TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'Open', -- 'Open', 'Closed'
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for careers
CREATE TRIGGER update_careers_updated_at
BEFORE UPDATE ON careers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Company Information Table (About Us sections storage)
CREATE TABLE company_information (
    key VARCHAR(100) PRIMARY KEY,
    content JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for company_information
CREATE TRIGGER update_company_info_updated_at
BEFORE UPDATE ON company_information
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Settings Table (System level styling, contacts, metadata config)
CREATE TABLE settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for settings
CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Contact Messages Table
CREATE TABLE contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for contact_messages
CREATE TRIGGER update_contact_messages_updated_at
BEFORE UPDATE ON contact_messages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Notifications Table (Dashboard System Alert Center)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(100) NOT NULL, -- e.g., 'contact_message', 'upload_status', 'login_alert', 'system_alert'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for notifications
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Activity Logs Table (System Audit Logs)
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for activity_logs
CREATE TRIGGER update_activity_logs_updated_at
BEFORE UPDATE ON activity_logs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Page Views Table (Dashboard Analytics Metrics)
CREATE TABLE page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    page_path VARCHAR(500) NOT NULL,
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for page_views
CREATE TRIGGER update_page_views_updated_at
BEFORE UPDATE ON page_views
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Refresh Tokens Table (For sliding session token renewals and active device sessions)
CREATE TABLE refresh_tokens (
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

-- Trigger for refresh_tokens
CREATE TRIGGER update_refresh_tokens_updated_at
BEFORE UPDATE ON refresh_tokens
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 4. PostgreSQL Indexes for Query Optimization & Full-Text Search

-- Index for Refresh Tokens
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- Index for Admins Search
CREATE INDEX idx_admins_email ON admins(email) WHERE is_deleted = FALSE;

-- Index for Products Search & Slug
CREATE INDEX idx_products_slug ON products(slug) WHERE is_deleted = FALSE;
CREATE INDEX idx_products_search ON products USING gin(
    (to_tsvector('english', name || ' ' || short_description || ' ' || full_description))
) WHERE is_deleted = FALSE;

-- Index for Careers Search
CREATE INDEX idx_careers_search ON careers USING gin(
    (to_tsvector('english', title || ' ' || department || ' ' || location || ' ' || description))
) WHERE is_deleted = FALSE;

-- Index for Gallery Categories Slug
CREATE INDEX idx_gallery_categories_slug ON gallery_categories(slug);

-- Index for Gallery Title & Description Search
CREATE INDEX idx_gallery_search ON gallery USING gin(
    (to_tsvector('english', title || ' ' || coalesce(description, '')))
) WHERE is_deleted = FALSE;

-- Index for Gallery Tags Array
CREATE INDEX idx_gallery_tags ON gallery USING gin(tags);

-- Index for Company Information FTS
CREATE INDEX idx_company_info_search ON company_information USING gin(
    (to_tsvector('english', content::text))
);

-- Index for Settings FTS
CREATE INDEX idx_settings_search ON settings USING gin(
    (to_tsvector('english', value::text))
);

-- Index for Activity Logs
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Index for Notifications Status
CREATE INDEX idx_notifications_unread ON notifications(is_read) WHERE is_read = FALSE;
