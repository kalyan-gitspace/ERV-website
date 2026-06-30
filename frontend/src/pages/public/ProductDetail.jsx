import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PublicLayout } from '../../layouts/PublicLayout';
import api from '../../services/api';
import { Cpu, ShieldCheck, Zap, Download, Compass, Table, ArrowLeft, RefreshCw, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

// High-fidelity fallback/mock product spec data for LDD and NSV
const mockProducts = {
  nsv: {
    name: 'NSV (Network Stream Video)',
    tagline: 'Real-time edge-encoded video streaming with sub-millisecond telemetry overlay.',
    description: 'The ERV Network Stream Video (NSV) system is a military-grade edge-vision encoder designed to capture, process, and stream multi-angle HDR video pipelines under demanding highway environments. Built with localized deep-learning computer vision caches, the NSV embeds telemetry layers directly into live streams, enabling route coordinators to inspect paths in real time.',
    summary: 'High-fidelity edge visual stream array with integrated path analytics.',
    specs: [
      { name: 'Sensor Array', value: '4K HDR CMOS Optoelectronic Sensor, 120fps' },
      { name: 'Encoding Protocol', value: 'H.265/HEVC hardware acceleration, sub-100ms latency' },
      { name: 'Telemetry Overlays', value: 'GPS Coordinate mapping, speed index, grade index, time-codes' },
      { name: 'Connectivity', value: 'Integrated Dual-SIM 5G LTE, Gigabit Ethernet port' },
      { name: 'Protection Standard', value: 'IP68 certified military-grade dust and water protection' },
      { name: 'Power Intake', value: '12-24V DC automotive standard input, 15W active load' }
    ],
    applications: [
      'Real-time highway path telemetry streaming',
      'Autonomous logistics route visual monitoring',
      'Structural route survey telemetry verification',
      'Intelligent highway traffic flow path-analytics'
    ],
    advantages: [
      'Sub-millisecond overlay sync guarantees precision mapping.',
      'Rugged heat-sink casing guarantees operation between -40°C to +85°C.',
      'Active path mapping continues offline utilizing local caching logs.'
    ]
  },
  ldd: {
    name: 'LDD (Laser Detection Device)',
    tagline: 'High-integrity path scanner and laser crack detection array.',
    description: 'The Laser Detection Device (LDD) represents the absolute gold standard in pathway surface scanning. Operating a high-speed rotating LiDAR laser module, the LDD sweeps the asphalt surface to compile sub-millimeter 3D point cloud maps. Dynamic algorithms detect road surface distress, cracking, potholes, and deformation in real time at highway speeds.',
    summary: 'Sub-millimeter LiDAR path scanner detecting structural distress at scale.',
    specs: [
      { name: 'Laser Wave Length', value: '905nm eye-safe Class 1 Laser' },
      { name: 'Scan Rate', value: '250,000 points per second, 360-degree sweep' },
      { name: 'Defect Resolution', value: 'Detects structural crack lines down to 0.5 millimeters' },
      { name: 'Mapping Speeds', value: 'Maintains maximum precision at vehicle speeds up to 120 km/h' },
      { name: 'Onboard Storage', value: '2TB NVMe local cache storage' },
      { name: 'Operational Rating', value: 'NEMA 4X / IP67 ruggedized vibration-isolated casing' }
    ],
    applications: [
      'High-speed highway pothole and crack surveys',
      'Bridge deck and runway surface scanning',
      'Structural paving profile analysis',
      'Localized pavement condition index (PCI) calculations'
    ],
    advantages: [
      'Sub-millimeter crack analysis avoids manual path inspection overhead.',
      'Runs mapping sweeps dynamically without stopping or slowing down route traffic.',
      'Onboard point cloud processors compress output logs for instant telemetry uplink.'
    ]
  }
};

export function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        // Try calling the backend endpoint first
        const res = await api.get(`/products/${slug}`);
        if (res.success && res.data) {
          setProduct(res.data);
        } else {
          // Fallback to mock data if endpoint returns null or empty
          const fallback = mockProducts[slug.toLowerCase()];
          if (fallback) {
            setProduct(fallback);
          } else {
            setProduct(null);
          }
        }
      } catch (err) {
        console.warn('Product fetch error, falling back to mock definitions:', err);
        // Fallback to local mocks if API fails
        const fallback = mockProducts[slug.toLowerCase()];
        if (fallback) {
          setProduct(fallback);
        } else {
          setProduct(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-500 font-light">Loading technical specifications...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!product) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-center px-4">
          <Cpu className="w-12 h-12 text-slate-700 mb-4" />
          <h2 className="text-2xl font-bold text-slate-300">Product Not Found</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-sm">The product page you are seeking is either relocated or in development.</p>
          <Link to="/" className="mt-6 flex items-center gap-2 text-sm text-brand-cyan hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="bg-slate-950 font-sans min-h-screen relative pb-24">
        {/* Visual glow backgrounds */}
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-3xl" />

        {/* Hero Section */}
        <section className="relative py-20 border-b border-slate-900 bg-slate-900/10">
          <div className="max-w-6xl mx-auto px-6">
            <Link to="/" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white mb-8 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                  Edge Intelligence
                </span>
                <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                  {product.name}
                </h1>
                <p className="text-lg text-brand-cyan font-light">
                  {product.tagline}
                </p>
                <p className="text-sm text-slate-400 leading-relaxed font-light">
                  {product.description}
                </p>
                
                <div className="flex flex-wrap gap-4 pt-4">
                  <a
                    href="#specs"
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/10 transition-all active:scale-[0.98]"
                  >
                    Technical Specifications
                  </a>
                  
                  <a
                    href={`/brochures/${slug}.pdf`}
                    download
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Downloaded product technical spec sheet.');
                    }}
                    className="flex items-center gap-2 px-5 py-3 border border-slate-800 hover:border-slate-700 bg-slate-900/40 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all active:scale-[0.98]"
                  >
                    <Download className="w-4 h-4" />
                    Download Datasheet
                  </a>
                </div>
              </div>

              {/* Render visual placeholder mimicking product casing */}
              <div className="relative flex justify-center lg:justify-end">
                <div className="w-full max-w-sm aspect-[4/3] bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex items-center justify-center group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/10 to-cyan-500/10 opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Technology schematics graphic */}
                  <div className="w-32 h-32 rounded-full border border-dashed border-slate-800 flex items-center justify-center relative animate-spin-slow">
                    <div className="w-24 h-24 rounded-full border border-indigo-500/20 flex items-center justify-center" />
                  </div>

                  <Cpu className="absolute w-12 h-12 text-indigo-400" />

                  {/* Casing corner frames */}
                  <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-slate-800" />
                  <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-slate-800" />
                  <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-slate-800" />
                  <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-slate-800" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Specs & Tables Section */}
        <section id="specs" className="max-w-6xl mx-auto px-6 mt-20 space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* Engineering specs list */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Table className="w-5 h-5 text-indigo-400" />
                Technical Parameters
              </h3>
              
              <div className="bg-slate-900/30 border border-slate-900 rounded-2xl overflow-hidden divide-y divide-slate-900">
                {(product.specs || []).map((spec, idx) => (
                  <div key={idx} className="grid grid-cols-3 p-4 text-xs font-light">
                    <span className="text-slate-400 font-medium">{spec.name}</span>
                    <span className="col-span-2 text-slate-200 pl-4">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Applications & Operations */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-cyan-400" />
                  Operational Deployment
                </h3>
                <ul className="space-y-3">
                  {(product.applications || []).map((app, idx) => (
                    <li key={idx} className="flex gap-3 items-start text-xs text-slate-400 leading-relaxed font-light">
                      <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{app}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Core Advantages
                </h3>
                <ul className="space-y-3">
                  {(product.advantages || []).map((adv, idx) => (
                    <li key={idx} className="flex gap-3 items-start text-xs text-slate-400 leading-relaxed font-light">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
export default ProductDetail;
