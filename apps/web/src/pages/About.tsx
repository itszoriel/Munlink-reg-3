import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Building, Heart, Shield, Globe, ArrowRight, Mail, Phone, Bug, Info, FileText, Clock } from 'lucide-react';

// Zambales municipalities (excluding Olongapo City)
const zambalesMunicipalities = [
  'Botolan', 'Cabangan', 'Candelaria', 'Castillejos', 'Iba', 'Masinloc', 
  'Palauig', 'San Antonio', 'San Felipe', 'San Marcelino', 'San Narciso', 
  'Santa Cruz', 'Subic'
];

const About: React.FC = () => {
  const features = [
    {
      icon: Building,
      title: 'Municipal Services',
      description: 'Access official documents, permits, and certificates from your municipality online.'
    },
    {
      icon: Users,
      title: 'Community Marketplace',
      description: 'Connect with neighbors across Zambales through our municipal marketplace.'
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative w-full min-h-[70vh] sm:min-h-[80vh] flex items-center justify-center overflow-hidden">
        <img
          src="/assets/about.jpg"
          alt="About MunLink Zambales"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/15 to-black/30" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src="/logos/provinces/zambales.png"
            alt=""
            aria-hidden="true"
            className="w-[51vw] max-w-[440px] sm:w-[42vw] md:w-[36vw] lg:w-[31vw] opacity-10 object-contain drop-shadow"
          />
        </div>

        <div className="relative z-10 container-responsive py-20 text-center px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6">
              About MunLink Zambales
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg md:text-xl text-white/95 max-w-3xl mx-auto leading-relaxed">
              A comprehensive digital governance platform connecting all 13 municipalities of Zambales
              for seamless municipal services and community engagement.
            </p>
          </div>
        </div>
      </section>


      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div className="space-y-4 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Our Mission</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                To modernize municipal governance across Zambales province by providing
                a unified digital platform that enhances citizen engagement, streamlines
                municipal services, and fosters community connections.
              </p>
            </div>

            <div className="bg-gradient-to-br from-ocean-50 to-cyan-50 rounded-2xl p-8 lg:p-10 shadow-sm border border-ocean-100">
              <div className="flex flex-col items-center text-center space-y-3">
                <Globe className="h-16 w-16 text-ocean-600" />
                <h3 className="text-2xl font-bold text-gray-900">Digital Transformation</h3>
                <p className="text-gray-700 leading-relaxed">
                  Bringing Zambales municipalities into the digital age with modern,
                  user-friendly solutions for municipal governance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Public Records Access Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ocean-50 text-ocean-700 text-sm font-semibold">
                <Shield className="h-4 w-4" />
                Public Records Access
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Know your rights</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                MunLink guides Zambales residents through requesting municipal and barangay documents.
                We ground the process on the 1987 Constitution (Art. III Sec. 7), RA 6713, RA 7160,
                DILG Full Disclosure Policy, EO 02 (FOI, where adopted), RA 9184, RA 11032, and the
                Data Privacy Act for redactions.
              </p>
              <div className="p-4 rounded-xl bg-ocean-50 border border-ocean-100 text-sm text-ocean-900 space-y-2">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5" />
                  <span><strong>Free digital by default:</strong> Ask for PDFs/Excel. Paper or certified copies may have minimal reproduction/cert fees.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5" />
                  <span><strong>Timing:</strong> Target 15 working days (RA 6713 / EO 02), or faster if the LGU Citizen's Charter says so.</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="h-6 w-6 text-ocean-600" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Barangay-handled</h3>
                    <p className="text-sm text-gray-600">Barangay Secretary/Treasurer; Captain approval as needed</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-ocean-600" />Ordinances/resolutions (free digital; cert fee if certified)</li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-ocean-600" />Assembly minutes/attendance (free digital; paper fee possible)</li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-ocean-600" />Annual/Supplemental budget and use (20% DF, BDRRM, SK) (free digital)</li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-ocean-600" />DRRM plan and utilization (free digital)</li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-ocean-600" />Project status reports (free digital)</li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-ocean-600" />Citizen's Charter/service standards (free digital)</li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-ocean-600" />Permit/clearance logs if maintained (free to inspect; copy fee possible)</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Building className="h-6 w-6 text-ocean-600" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Municipal/City-handled</h3>
                    <p className="text-sm text-gray-600">Records/PIO, Sanggunian, Budget, Accounting, Treasurer, BAC</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-ocean-600" />Ordinances/resolutions/journals; appropriation and revenue measures (free digital; cert fee if certified)</li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-ocean-600" />Annual/Supplemental Budget, AIP, 20% DF, SEF, GAD Plan & AR, 5% DRRM, Trust Fund, SRE/Quarterly Cash Flow (free digital)</li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-ocean-600" />Annual Procurement Plan/PPMPs; ITB/RFQ, Abstract of Bids, Minutes, NOA/NTP/Contracts (free digital)</li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-ocean-600" />Infrastructure project list/status and contract details (free digital)</li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-ocean-600" />Local tax/fee schedule (free digital)</li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-ocean-600" />Citizen's Charter/service standards (free digital)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Platform Features</h2>
            <p className="text-lg text-gray-600">
              Comprehensive tools for municipal governance and community engagement
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="bg-ocean-100 rounded-xl w-14 h-14 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-7 w-7 text-ocean-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Municipalities Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Serving Zambales Province</h2>
            <p className="text-lg text-gray-600">
              MunLink connects all 13 municipalities of Zambales
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
              <img
                src="/logos/provinces/zambales.png"
                alt="Zambales Provincial Seal"
                className="w-16 h-16 object-contain"
              />
              <div>
                <div className="font-bold text-xl text-gray-900">Zambales</div>
                <div className="text-sm text-gray-600">13 municipalities - Capital: Iba</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {zambalesMunicipalities.map((mun) => (
                <span
                  key={mun}
                  className={`text-sm px-4 py-2 rounded-full ${
                    mun === 'Iba'
                      ? 'bg-ocean-600 text-white font-medium'
                      : 'bg-white text-gray-700 border border-gray-200'
                  }`}
                >
                  {mun}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Need Help?</h2>
            <p className="text-lg text-gray-600">
              Found a bug or need assistance? Contact us directly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Mail className="h-6 w-6 text-ocean-600" />
                Contact Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-ocean-600" />
                  <span className="text-gray-800">Pauljohn.antigo@gmail.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-ocean-600" />
                  <span className="text-gray-800">09764859463</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-6 p-3 bg-blue-50 rounded-lg">
                <Info className="h-4 w-4 inline mr-1 text-ocean-600" />
                Urgent issue? Call or text for the fastest response.
              </p>
            </div>

            {/* Bug Report Tips */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Bug className="h-6 w-6 text-ocean-600" />
                Reporting Issues
              </h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-ocean-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Clear steps to reproduce the problem</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-ocean-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>What you expected vs. what happened</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-ocean-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Page URL and time it occurred</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-ocean-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Browser and device (e.g., Chrome on Android)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-ocean-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Screenshots if possible</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-ocean-600 to-ocean-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-white/90 mb-8">
            Join Zambales residents in experiencing modern digital municipal services.
          </p>
          <div className="flex flex-col xs:flex-row gap-4 justify-center max-w-md mx-auto">
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-ocean-700 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all"
            >
              <span>Get Started</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/announcements"
              className="flex items-center justify-center gap-2 px-8 py-4 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-all"
            >
              <span>Announcements</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
