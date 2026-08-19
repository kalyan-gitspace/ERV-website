import React from 'react';
import {
  ArrowRight,
  Building2,
  Compass,
  Cpu,
  Gauge,
  Layers3,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import logoImage from '../../assets/logo.png';

const expertiseSections = [
  {
    title: 'Pavement Engineering & Asset Management',
    items: [
      'Pavement Condition Assessment',
      'Pavement Thickness Evaluation',
      'Network Survey Vehicle (NSV) Surveys',
      'Airport Runway Assessment',
      'Highway Pavement Evaluation',
      'Pavement Distress Mapping',
      'Surface Roughness Measurement',
      'Longitudinal Profile Analysis',
      'Cross-sectional Survey',
      'Road Inventory Collection',
      'Pavement Rehabilitation Planning',
      'Pavement Asset Management',
      'Engineering Data Analysis & Reporting',
    ],
  },
  {
    title: 'Bridge Engineering Solutions',
    items: [
      'Bridge Health Monitoring (BHM)',
      'Structural Performance Assessment',
      'Structural Integrity Evaluation',
      'Long-Term Bridge Monitoring',
      'Sensor-Based Structural Monitoring',
      'Preventive Maintenance Planning',
      'Bridge Inspection Support',
    ],
  },
  {
    title: 'Intelligent Transportation Solutions',
    items: [
      'Automatic Vehicle Counting & Classification (AVCC)',
      'Traffic Volume Analysis',
      'Vehicle Classification Reports',
      'Intelligent Traffic Monitoring',
      'Traffic Data Analytics',
      'Road Usage Assessment',
      'Transportation Planning Support',
    ],
  },
  {
    title: 'Digital Survey & Mapping',
    items: [
      'High-Resolution Road Imaging',
      'GIS-Based Infrastructure Mapping',
      'GNSS-Based Positioning',
      'Inertial Measurement Unit (IMU) Surveys',
      'Distance Measurement Instrument (DMI) Integration',
      'Digital Road Asset Inventory',
      'Spatial Data Management',
      'Engineering GIS Solutions',
    ],
  },
  {
    title: 'AI-Driven Engineering Solutions',
    items: [
      'AI-Based Infrastructure Inspection',
      'AI-Powered Data Processing',
      'Intelligent Image Analysis',
      'Automated Defect Detection',
      'AI-Assisted Asset Monitoring',
      'Predictive Infrastructure Analytics',
      'Engineering Dashboard Solutions',
      'Custom AI Software Development',
      'Intelligent Reporting Systems',
      'Decision Support Systems',
      'Digital Engineering Platforms',
    ],
  },
];

const industries = [
  'Airports & Aviation Infrastructure',
  'National Highways',
  'State Highways',
  'Smart City Projects',
  'Municipal Corporations',
  'Road Development Authorities',
  'Bridge Authorities',
  'Industrial Corridors',
  'Government Organizations',
  'Infrastructure Consultants',
  'Construction Companies',
  'Private Infrastructure Developers',
];

const whyChoose = [
  'Advanced Engineering Expertise',
  'AI-Driven Infrastructure Solutions',
  'Non-Destructive Survey Technologies',
  'High-Speed Data Collection',
  'Accurate Engineering Analysis',
  'Intelligent Software Platforms',
  'Bridge Health Monitoring Solutions',
  'Automatic Vehicle Counting & Classification Systems',
  'GIS-Based Infrastructure Management',
  'Customized Engineering & AI Solutions',
  'Comprehensive Technical Reporting',
  'Reliable Project Execution',
  'Commitment to Safety, Quality, and Innovation',
];

const coreValues = [
  {
    title: 'Innovation',
    text: 'We continuously embrace emerging technologies, Artificial Intelligence, and modern engineering practices to deliver future-ready solutions.',
    icon: Sparkles,
  },
  {
    title: 'Engineering Excellence',
    text: 'We maintain the highest standards of technical accuracy, quality, and professional integrity.',
    icon: Gauge,
  },
  {
    title: 'Customer Commitment',
    text: 'We build lasting relationships by understanding our clients’ challenges and delivering practical, value-driven solutions.',
    icon: ShieldCheck,
  },
  {
    title: 'Integrity',
    text: 'We conduct every project with honesty, transparency, and accountability.',
    icon: Layers3,
  },
  {
    title: 'Quality',
    text: 'Precision, reliability, and consistency define every service we provide.',
    icon: Building2,
  },
  {
    title: 'Sustainability',
    text: 'We support infrastructure development that is efficient, resilient, and environmentally responsible.',
    icon: Compass,
  },
];

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div className="max-w-3xl space-y-3">
      {eyebrow && (
        <p className="section-eyebrow">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      {subtitle && <p className="text-lg leading-8 text-slate-300">{subtitle}</p>}
    </div>
  );
}

export function AboutPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-black text-white">
      <SEO
        title="About Edge Route Vision"
        description="Edge Route Vision Pvt. Ltd. specializes in advanced infrastructure assessment, intelligent transportation solutions, pavement engineering, bridge health monitoring, and AI-powered asset management."
        path="/about"
      />
      <Navbar />

      <section className="border-b border-white/10 bg-black">
        <div className="mx-auto flex min-h-[260px] max-w-[1480px] items-center justify-center px-5 py-8 sm:min-h-[300px] sm:px-8 sm:py-10 lg:min-h-[340px] lg:px-10 lg:py-12">
          <img
            src={logoImage}
            alt="Edge Route Vision Pvt. Ltd. logo"
            className="h-auto w-full max-w-[360px] object-contain sm:max-w-[420px] lg:max-w-[500px]"
          />
        </div>
      </section>

      <section className="mx-auto max-w-[1480px] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="space-y-4">
          <p className="section-eyebrow">About Edge Route Vision Pvt. Ltd.</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Engineering Smarter Roads. Empowering Infrastructure with Intelligence.
          </h1>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="space-y-6 text-lg leading-8 text-slate-300">
            <p>
              Edge Route Vision Pvt. Ltd. is a technology-driven engineering company specializing in advanced infrastructure assessment, intelligent transportation solutions, pavement engineering, bridge health monitoring, and AI-powered asset management systems. We combine cutting-edge engineering technologies with Artificial Intelligence (AI), advanced data analytics, and intelligent software solutions to help organizations make informed decisions for safer, smarter, and more sustainable infrastructure.
            </p>
            <p>
              Our expertise lies in delivering accurate, non-destructive, and data-driven engineering solutions for highways, airports, bridges, urban roads, industrial corridors, and transportation networks. By integrating advanced survey technologies with AI-driven software platforms, we enable our clients to efficiently inspect, monitor, analyze, and manage critical infrastructure throughout its lifecycle.
            </p>
            <p>
              At Edge Route Vision, innovation is at the heart of everything we do. We continuously invest in modern technologies and intelligent engineering methodologies to provide reliable, scalable, and future-ready solutions for infrastructure development and maintenance.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black p-8 shadow-[0_30px_90px_rgba(0,0,0,0.24)]">
            <div className="flex items-center gap-3 text-[#38BDF8]">
              <Cpu className="h-6 w-6" />
              <p className="section-eyebrow">Who We Are</p>
            </div>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Edge Route Vision Pvt. Ltd. is a multidisciplinary team of experienced civil engineers, transportation specialists, AI developers, software engineers, and survey experts committed to transforming infrastructure management through technology.
            </p>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Our engineering solutions are built around precision, automation, and intelligent data analysis. We utilize state-of-the-art survey equipment, AI-driven software applications, cloud-based data platforms, and advanced visualization tools to deliver comprehensive infrastructure intelligence.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black">
        <div className="mx-auto max-w-[1480px] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
          <SectionHeading
            eyebrow="Our Expertise"
            title="Specialized capabilities for modern infrastructure challenges"
            subtitle="We deliver integrated engineering and intelligent technology services that support decision-making at every stage of an asset's lifecycle."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {expertiseSections.map((section) => (
              <div key={section.title} className="rounded-[24px] border border-white/10 bg-[#050505] p-7">
                <h3 className="text-xl font-semibold text-white">{section.title}</h3>
                <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[#38BDF8]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1480px] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <SectionHeading
          eyebrow="Advanced Technology"
          title="Integrated engineering systems built for accuracy and speed"
          subtitle="Edge Route Vision integrates modern engineering equipment with intelligent software platforms to provide highly accurate infrastructure data."
        />

        <div className="mt-10 rounded-[28px] border border-white/10 bg-[#050505] p-8 sm:p-10">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="space-y-4 text-lg leading-8 text-slate-300">
              <p>
                Our technology ecosystem includes advanced Network Survey Vehicles (NSV), high-resolution imaging systems, GNSS positioning technology, Inertial Measurement Units (IMU), Distance Measurement Instruments (DMI), laser-based measurement technologies, GIS mapping platforms, cloud-based engineering applications, AI-powered image processing, machine learning-based analytics, intelligent data visualization tools, and engineering management dashboards.
              </p>
              <p>
                These technologies enable rapid, safe, and efficient infrastructure assessment while significantly reducing manual effort and operational disruptions.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                'Advanced Network Survey Vehicles (NSV)',
                'High-Resolution Imaging Systems',
                'GNSS Positioning Technology',
                'Inertial Measurement Units (IMU)',
                'Distance Measurement Instruments (DMI)',
                'Laser-Based Measurement Technologies',
                'GIS Mapping Platforms',
                'Cloud-Based Engineering Applications',
                'AI-Powered Image Processing',
                'Machine Learning-Based Analytics',
                'Intelligent Data Visualization Tools',
                'Engineering Management Dashboards',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-cyan-400/20 bg-white/[0.03] p-4 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black">
        <div className="mx-auto max-w-[1480px] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
          <SectionHeading
            eyebrow="Industries We Serve"
            title="Trusted by public and private infrastructure stakeholders"
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {industries.map((industry) => (
              <div key={industry} className="rounded-[20px] border border-white/10 bg-[#050505] p-6 text-lg font-medium text-slate-200">
                {industry}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1480px] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <SectionHeading
          eyebrow="Why Choose Edge Route Vision?"
          title="A dependable partner for intelligent infrastructure delivery"
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {whyChoose.map((item) => (
            <div key={item} className="rounded-[20px] border border-white/10 bg-[#050505] p-6 text-lg text-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0F172A] text-[#38BDF8]">
                  <ArrowRight className="h-4 w-4" />
                </div>
                <span>{item}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-black">
        <div className="mx-auto grid max-w-[1480px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:px-10 lg:py-24">
          <div className="rounded-[28px] border border-white/10 bg-[#050505] p-8">
            <p className="section-eyebrow">Vision</p>
            <h3 className="mt-4 text-3xl font-semibold text-white">Our Vision</h3>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              To become a globally recognized leader in intelligent infrastructure engineering by delivering innovative technologies, AI-powered software solutions, and advanced engineering services that enable safer, smarter, and more sustainable transportation infrastructure.
            </p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-[#050505] p-8">
            <p className="section-eyebrow">Mission</p>
            <h3 className="mt-4 text-3xl font-semibold text-white">Our Mission</h3>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Our mission is to transform infrastructure management through advanced engineering, intelligent automation, and AI-driven technologies. We strive to provide reliable, accurate, and data-centric solutions that help clients optimize asset performance, improve operational safety, reduce maintenance costs, and make informed engineering decisions.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1480px] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <SectionHeading
          eyebrow="Core Values"
          title="Principles that guide our work and partnerships"
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {coreValues.map(({ title, text, icon: Icon }) => (
            <div key={title} className="rounded-[24px] border border-white/10 bg-[#050505] p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0F172A] text-[#38BDF8]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-white">{title}</h3>
              <p className="mt-3 text-base leading-7 text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-black">
        <div className="mx-auto max-w-[1480px] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
          <div className="rounded-[32px] border border-white/10 bg-[#050505] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.24)] sm:p-10 lg:p-12">
            <p className="section-eyebrow">Closing</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Building Intelligent Infrastructure for Tomorrow
            </h2>
            <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-300">
              At <span className="font-semibold text-white">Edge Route Vision Pvt. Ltd.</span>, we believe the future of infrastructure lies at the intersection of engineering excellence and intelligent technology. Through advanced survey systems, Bridge Health Monitoring solutions, Automatic Vehicle Counting & Classification systems, AI-powered software, and intelligent engineering services, we empower organizations to build safer roads, stronger bridges, smarter transportation networks, and more resilient infrastructure.
            </p>
            <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-300">
              We are committed to delivering innovative engineering solutions that address today’s infrastructure challenges while preparing our clients for the demands of tomorrow through precision, reliability, and technological excellence.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

export default AboutPage;
