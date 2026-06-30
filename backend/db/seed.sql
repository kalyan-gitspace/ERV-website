-- ==========================================
-- EDGE ROUTE VISION (ERV) - DATABASE SEEDS
-- ==========================================

-- 1. Insert Roles
INSERT INTO roles (name) VALUES 
('superadmin'),
('editor');


-- 2. Insert Gallery Categories
INSERT INTO gallery_categories (name, slug) VALUES 
('Vehicles', 'vehicles'),
('Survey', 'survey'),
('Projects', 'projects'),
('Team', 'team'),
('Events', 'events'),
('Others', 'others');


-- 3. Insert Company Information (About Us Content)
INSERT INTO company_information (key, content) VALUES
('about_intro', '{
    "title": "About Edge Route Vision",
    "subtitle": "Leading High-Tech Systems Engineering & Visual Intelligence Solutions",
    "text": "Edge Route Vision (ERV) is a premier global innovator in visual intelligence, route inspection systems, and advanced telemetry analytics. Since our inception, we have built rugged, high-fidelity monitoring and imaging systems that allow transportation networks, aerospace structures, and autonomous vehicle platforms to perceive and map their routes in real time under the most demanding environments."
}'::jsonb),

('mission', '{
    "title": "Our Mission",
    "text": "To pioneer unmatched visual intelligence and path-analytical solutions that maximize security, optimize route efficiency, and secure critical infrastructure networks worldwide."
}'::jsonb),

('vision', '{
    "title": "Our Vision",
    "text": "To be the ultimate benchmark in edge computer vision, equipping the next generation of smart infrastructure and autonomous pathways with cognitive spatial intelligence."
}'::jsonb),

('values', '{
    "title": "Core Values",
    "items": [
        {
            "name": "Innovation & Vision",
            "description": "We continuously push the boundaries of what vision systems can achieve at the Edge."
        },
        {
            "name": "Uncompromising Quality",
            "description": "Our hardware and software are certified to operate under extreme environmental stress."
        },
        {
            "name": "Absolute Security",
            "description": "We secure route metadata, ensuring robust data pipelines and privacy validation."
        },
        {
            "name": "Customer Co-Development",
            "description": "We work hand-in-hand with leading enterprises to build customized route intelligence layouts."
        }
    ]
}'::jsonb),

('journey', '{
    "title": "Our Journey",
    "milestones": [
        {
            "year": "2018",
            "title": "Founding & Core Research",
            "description": "ERV established by top computer vision scientists, developing low-latency edge encoders."
        },
        {
            "year": "2020",
            "title": "Launch of LDD (Laser Detection Device)",
            "description": "Released LDD platform, tracking high-velocity sub-millimeter cracks on transportation routes."
        },
        {
            "year": "2022",
            "title": "Launch of NSV (Network Stream Video)",
            "description": "Debuted the NSV network array, permitting multi-angle edge-to-cloud streams with dynamic telemetry."
        },
        {
            "year": "2025",
            "title": "Global Deployment & Enterprise Suite",
            "description": "Expanded operations globally, managing over 50,000 km of active route tracking data daily."
        }
    ]
}'::jsonb),

('strengths', '{
    "title": "Company Strengths",
    "items": [
        "In-house optoelectronic hardware engineering",
        "Proprietary deep-learning computer vision models",
        "Military-grade casing and IP68 protection standards",
        "Fully offline operations capability with localized database caches",
        "API-first architecture for seamless ERP/GIS integrations"
    ]
}'::jsonb),

('leadership', '{
    "title": "Our Leadership",
    "members": [
        {
            "name": "Dr. Aris Vance",
            "role": "CEO & Founder",
            "bio": "18+ years of expertise in robotic perception and spatial vision. Former Lead Scientist at Global Spatial Systems."
        },
        {
            "name": "Sarah Jenkins",
            "role": "Chief Technology Officer",
            "bio": "Distinguished architect in optical hardware, formerly managing aerospace monitoring clusters at Axiom Optical."
        },
        {
            "name": "Marcus Kane",
            "role": "VP of Engineering",
            "bio": "Specialist in industrial IoT architectures and embedded systems with 15 years scaling robust manufacturing telemetry."
        }
    ]
}'::jsonb);


-- 4. Insert Default System Settings
INSERT INTO settings (key, value) VALUES
('company_name', '"Edge Route Vision"'::jsonb),

('address', '{
    "street": "400 Innovation Plaza, Suite 850",
    "city": "Tech City",
    "state": "CA",
    "zip": "94016",
    "country": "United States"
}'::jsonb),

('phone', '"+1 (800) 555-0188"'::jsonb),

('email', '"info@edgeroutevision.com"'::jsonb),

('social_media', '{
    "linkedin": "https://linkedin.com/company/edge-route-vision",
    "twitter": "https://twitter.com/edgeroutevision",
    "youtube": "https://youtube.com/c/edgeroutevision"
}'::jsonb),

('global_seo', '{
    "meta_title": "Edge Route Vision (ERV) | Enterprise Edge Vision & Survey Solutions",
    "meta_description": "Edge Route Vision (ERV) engineers and develops high-integrity route inspection scanners, sensory arrays, and deep-learning software solutions.",
    "meta_keywords": "Edge Route Vision, ERV, NSV, LDD, route survey, automated visual inspection, smart telemetry"
}'::jsonb),

('branding', '{
    "logo_media_id": null,
    "favicon_media_id": null
}'::jsonb);
