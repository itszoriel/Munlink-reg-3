import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Building2, Building, MapPin } from 'lucide-react'

export default function RoleSelector() {
  const navigate = useNavigate()

  const roles = [
    {
      id: 'superadmin',
      label: 'Super Admin',
      description: 'Platform-level administration',
      icon: Shield,
      color: 'from-purple-500 to-blue-600',
      hoverColor: 'hover:from-purple-600 hover:to-blue-700',
      path: '/superadmin/login',
    },
    {
      id: 'provincial',
      label: 'Provincial Admin',
      description: 'Province-wide announcements',
      icon: Building2,
      color: 'from-indigo-500 to-violet-600',
      hoverColor: 'hover:from-indigo-600 hover:to-violet-700',
      path: '/provincial/login',
    },
    {
      id: 'municipal',
      label: 'Municipal Admin',
      description: 'Municipality management',
      icon: Building,
      color: 'from-blue-500 to-cyan-600',
      hoverColor: 'hover:from-blue-600 hover:to-cyan-700',
      path: '/login',
    },
    {
      id: 'barangay',
      label: 'Barangay Admin',
      description: 'Barangay-level administration',
      icon: MapPin,
      color: 'from-emerald-500 to-green-600',
      hoverColor: 'hover:from-emerald-600 hover:to-green-700',
      path: '/barangay/login',
    },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-neutral-50 via-ocean-50/30 to-forest-50/20">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-20 w-96 h-96 bg-ocean-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-forest-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
            MunLink Admin Portal
          </h1>
          <p className="text-lg text-gray-600">
            Select your admin role to continue
          </p>
        </motion.div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role, index) => {
            const Icon = role.icon
            return (
              <motion.button
                key={role.id}
                onClick={() => navigate(role.path)}
                className={`group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 text-left overflow-hidden`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                {/* Icon */}
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${role.color} mb-6 shadow-lg group-hover:shadow-xl transition-shadow`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors">
                    {role.label}
                  </h3>
                  <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
                    {role.description}
                  </p>
                </div>

                {/* Arrow indicator */}
                <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Footer */}
        <motion.div
          className="text-center mt-12 text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p>
            Need assistance?{' '}
            <button className="text-ocean-600 hover:text-ocean-700 font-medium">
              Contact support
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
