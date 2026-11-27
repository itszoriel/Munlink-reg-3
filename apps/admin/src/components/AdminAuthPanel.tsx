import type { LucideIcon } from 'lucide-react'

export type AdminAuthFeature = { icon: LucideIcon; label: string; desc: string }

type Props = {
  image: string
  office: string
  title: string
  description: string
  features: AdminAuthFeature[]
  wide?: boolean
}

/** Left-hand context panel shared by every staff sign-in page. */
export default function AdminAuthPanel({ image, office, title, description, features, wide }: Props) {
  return (
    <div className={`hidden lg:flex ${wide ? 'lg:w-1/2 xl:w-[55%]' : 'lg:w-1/2'} relative isolate overflow-hidden bg-navy-900`}>
      <img src={image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover object-center" />
      <div className="absolute inset-0 -z-10 bg-navy-950/80" aria-hidden="true" />
      <div className="flex w-full flex-col justify-center px-12 xl:px-16">
        <div className="flex items-center gap-3">
          <img src="/logos/munlink-logo.png" alt="" className="h-11 w-11 rounded-full object-cover" />
          <div>
            <p className="text-base font-semibold text-white">MunLink Zambales</p>
            <p className="text-sm text-slate-300">{office}</p>
          </div>
        </div>
        <h1 className="mt-10 max-w-md text-3xl font-semibold leading-tight text-white">{title}</h1>
        <p className="mt-3 max-w-md text-base leading-relaxed text-slate-300">{description}</p>
        <ul className="mt-8 max-w-md space-y-4">
          {features.map(({ icon: Icon, label, desc }) => (
            <li key={label} className="flex gap-3">
              <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-navy-200" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-sm text-slate-300">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
