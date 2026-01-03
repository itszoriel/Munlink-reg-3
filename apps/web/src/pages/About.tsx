import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Building, Heart, Shield, Globe, ArrowRight, Mail, Phone, Bug, Info, ChevronDown } from 'lucide-react';

// Province data with their municipalities and capitals
const provinceData: Record<string, { capital: string; municipalities: string[] }> = {
  'Aurora': {
    capital: 'Baler',
    municipalities: ['Baler', 'Casiguran', 'Dilasag', 'Dinalungan', 'Dingalan', 'Dipaculao', 'Maria Aurora', 'San Luis']
  },
  'Bataan': {
    capital: 'Balanga',
    municipalities: ['Abucay', 'Bagac', 'Balanga', 'Dinalupihan', 'Hermosa', 'Limay', 'Mariveles', 'Morong', 'Orani', 'Orion', 'Pilar', 'Samal']
  },
  'Bulacan': {
    capital: 'Malolos',
    municipalities: ['Angat', 'Balagtas', 'Baliuag', 'Bocaue', 'Bulakan', 'Bustos', 'Calumpit', 'Doña Remedios Trinidad', 'Guiguinto', 'Hagonoy', 'Malolos', 'Marilao', 'Meycauayan', 'Norzagaray', 'Obando', 'Pandi', 'Paombong', 'Plaridel', 'Pulilan', 'San Ildefonso', 'San Jose del Monte', 'San Miguel', 'San Rafael', 'Santa Maria']
  },
  'Nueva Ecija': {
    capital: 'Palayan',
    municipalities: ['Aliaga', 'Bongabon', 'Cabanatuan', 'Cabiao', 'Carranglan', 'Cuyapo', 'Gabaldon', 'Gapan', 'General Mamerto Natividad', 'General Tinio', 'Guimba', 'Jaen', 'Laur', 'Licab', 'Llanera', 'Lupao', 'Muñoz', 'Nampicuan', 'Palayan', 'Pantabangan', 'Peñaranda', 'Quezon', 'Rizal', 'San Antonio', 'San Isidro', 'San Jose', 'San Leonardo', 'Santa Rosa', 'Santo Domingo', 'Talavera', 'Talugtug', 'Zaragoza']
  },
  'Pampanga': {
    capital: 'San Fernando',
    municipalities: ['Apalit', 'Arayat', 'Bacolor', 'Candaba', 'Floridablanca', 'Guagua', 'Lubao', 'Mabalacat', 'Macabebe', 'Magalang', 'Masantol', 'Mexico', 'Minalin', 'Porac', 'San Fernando', 'San Luis', 'San Simon', 'Santa Ana', 'Santa Rita', 'Santo Tomas', 'Sasmuan', 'Angeles']
  },
  'Tarlac': {
    capital: 'Tarlac City',
    municipalities: ['Anao', 'Bamban', 'Camiling', 'Capas', 'Concepcion', 'Gerona', 'La Paz', 'Mayantoc', 'Moncada', 'Paniqui', 'Pura', 'Ramos', 'San Clemente', 'San Jose', 'San Manuel', 'Santa Ignacia', 'Tarlac City', 'Victoria']
  },
  'Zambales': {
    capital: 'Iba',
    municipalities: ['Botolan', 'Cabangan', 'Candelaria', 'Castillejos', 'Iba', 'Masinloc', 'Palauig', 'San Antonio', 'San Felipe', 'San Marcelino', 'San Narciso', 'Santa Cruz', 'Subic']
  }
};

const About: React.FC = () => {
  const [expandedProvince, setExpandedProvince] = useState<string | null>(null);

  const features = [
    {
      icon: Building,
      title: 'Municipal Services',
      description: 'Access official documents, permits, and certificates from your municipality online.'
    },
    {
      icon: Users,
      title: 'Community Marketplace',
      description: 'Connect with neighbors across Central Luzon through our cross-municipal marketplace.'
    },
    {
      icon: Heart,
      title: 'Issue Reporting',
      description: 'Report municipal issues and track their resolution progress in real-time.'
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Your data is protected with enterprise-grade security and privacy measures.'
    }
  ];

  const provinces = Object.keys(provinceData);
  const totalMunicipalities = Object.values(provinceData).reduce((sum, p) => sum + p.municipalities.length, 0);

  return (
    <div className="min-h-screen bg-gray-50 -mt-24">
      {/* Hero Section */}
      <section className="relative w-full min-h-[70vh] sm:min-h-[80vh] md:min-h-screen flex items-center justify-center overflow-hidden pt-24">
        <img
          src="/assets/about.jpg"
          alt="About MunLink"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/40" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-16 sm:py-20 md:py-24">
          <div className="text-center">
            <motion.div 
              className="flex justify-center gap-3 mb-6 sm:mb-8 flex-wrap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {provinces.map((province, idx) => (
                <motion.img
                  key={province}
                  src={`/logos/provinces/${province.toLowerCase().replace(/\s+/g, '-')}.png`}
                  alt={`${province} Seal`}
                  className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 object-contain rounded-full bg-white/10 p-1"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ))}
            </motion.div>
            <motion.h1 
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-3 sm:mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              About MunLink Region III
            </motion.h1>
            <motion.p 
              className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 max-w-3xl mx-auto drop-shadow-lg px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              A comprehensive digital governance platform connecting all {provinces.length} provinces 
              and {totalMunicipalities} local government units (municipalities and cities) of Central Luzon 
              for seamless municipal services and community engagement.
            </motion.p>
          </div>
        </div>
      </section>


      {/* Mission Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                To modernize municipal governance across Central Luzon (Region III) by providing 
                a unified digital platform that enhances citizen engagement, streamlines 
                municipal services, and fosters cross-provincial community connections.
              </p>
              <p className="text-lg text-gray-600">
                We believe that technology should bridge the gap between government 
                and citizens, making municipal services more accessible, transparent, 
                and efficient for all residents of Region III.
              </p>
            </div>
            <div className="bg-ocean-50 rounded-2xl p-8">
              <div className="text-center">
                <Globe className="h-16 w-16 text-ocean-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Digital Transformation</h3>
                <p className="text-gray-600">
                  Bringing Central Luzon's municipalities into the digital age with 
                  modern, user-friendly solutions for municipal governance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Platform Features</h2>
            <p className="text-xl text-gray-600">
              Comprehensive tools for municipal governance and community engagement
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="bg-ocean-100 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:bg-ocean-200 transition-colors">
                    <Icon className="h-8 w-8 text-ocean-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Provinces Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Serving All of Central Luzon</h2>
            <p className="text-xl text-gray-600">
              MunLink connects all {provinces.length} provinces of Region III
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {provinces.map((province) => {
              const data = provinceData[province];
              const isExpanded = expandedProvince === province;
              
              return (
                <div 
                  key={province} 
                  className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => setExpandedProvince(isExpanded ? null : province)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={`/logos/provinces/${province.toLowerCase().replace(/\s+/g, '-')}.png`}
                        alt={`${province} Seal`}
                        className="w-10 h-10 object-contain"
                        onError={(e) => { 
                          (e.target as HTMLImageElement).src = '/logos/provinces/placeholder.png';
                        }}
                      />
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">{province}</div>
                        <div className="text-sm text-gray-500">{data.municipalities.length} municipalities</div>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t bg-gray-50">
                      <div className="py-2 text-xs font-medium text-ocean-600 uppercase tracking-wide">
                        Capital: {data.capital}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {data.municipalities.map((mun) => (
                          <span
                            key={mun}
                            className={`text-xs px-2 py-1 rounded-full ${
                              mun === data.capital 
                                ? 'bg-ocean-100 text-ocean-700 font-medium' 
                                : 'bg-white text-gray-600 border'
                            }`}
                          >
                            {mun}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left: Contact Actions */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Found a Bug? We're Here to Help</h2>
              <p className="text-lg text-gray-600 mb-6">
                Contact Paul directly — we'll investigate and fix issues as quickly as possible.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className="inline-flex items-center text-gray-800">
                  <Mail className="h-5 w-5 mr-2 text-ocean-600" />
                  <span>Pauljohn.antigo@gmail.com</span>
                </div>
                <div className="inline-flex items-center text-gray-800">
                  <Phone className="h-5 w-5 mr-2 text-ocean-600" />
                  <span>09764859463</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">Urgent issue or outage? Text or call for the fastest response.</p>
            </div>

            {/* Right: What to include */}
            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center"><Bug className="h-6 w-6 text-ocean-600 mr-2" /> Help Us Reproduce the Issue</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start"><div className="w-2 h-2 bg-ocean-500 rounded-full mr-3 mt-2"></div><span>Clear steps to reproduce the problem</span></li>
                <li className="flex items-start"><div className="w-2 h-2 bg-ocean-500 rounded-full mr-3 mt-2"></div><span>What you expected vs. what actually happened</span></li>
                <li className="flex items-start"><div className="w-2 h-2 bg-ocean-500 rounded-full mr-3 mt-2"></div><span>Page URL and approximate time it occurred</span></li>
                <li className="flex items-start"><div className="w-2 h-2 bg-ocean-500 rounded-full mr-3 mt-2"></div><span>Your browser and device (e.g., Chrome on Android)</span></li>
                <li className="flex items-start"><div className="w-2 h-2 bg-ocean-500 rounded-full mr-3 mt-2"></div><span>Screenshots or a short screen recording</span></li>
              </ul>
              <div className="mt-4 flex items-start text-sm text-gray-600">
                <Info className="h-4 w-4 text-gray-500 mr-2 mt-0.5" />
                <span>Please avoid sharing sensitive personal information in screenshots or recordings.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-ocean-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Experience Digital Municipal Services?
          </h2>
          <p className="text-xl text-ocean-100 mb-8 max-w-2xl mx-auto">
            Be among the first Central Luzon residents to try MunLink for your municipal service needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-ocean-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Get Started
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
            <Link
              to="/announcements"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white rounded-lg hover:bg-white hover:text-ocean-600 transition-colors font-medium"
            >
              Latest Announcements
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <section className="py-12 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600">
              MunLink Region III - Connecting Communities, Empowering Citizens Across Central Luzon
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
