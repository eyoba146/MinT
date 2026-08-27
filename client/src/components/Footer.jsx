import { Link } from "react-router-dom";
import { Globe2, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-slate-950 via-slate-950 to-teal-950 text-slate-400 border-t border-slate-800/80 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-800 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-teal-900/40">
                MinT
              </div>
              <div>
                <div className="text-sm font-extrabold text-white">
                  MinT Digital Hub
                </div>
                <div className="text-xs font-bold text-teal-300">
                  Ministry of Innovation & Technology
                </div>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              National platform connecting Ethiopian startups, investors, and ecosystem builders with official designation, opportunities, and trusted collaboration tools.
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-white">
              Services
            </div>
            <ul className="space-y-2">
              <li>
                <Link to="/register" className="hover:text-teal-300 transition-colors">
                  Startup Designation
                </Link>
              </li>
              <li>
                <Link to="/directory" className="hover:text-teal-300 transition-colors">
                  Designated Registry
                </Link>
              </li>
              <li>
                <Link to="/builders" className="hover:text-teal-300 transition-colors">
                  Ecosystem Builders
                </Link>
              </li>
              <li>
                <Link to="/opportunities" className="hover:text-teal-300 transition-colors">
                  Opportunities
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-white">
              Benefits
            </div>
            <ul className="space-y-2">
              <li>
                <span className="text-slate-300">Official MinT designation</span>
              </li>
              <li>
                <span className="text-slate-400">Tax & incentive pathways</span>
              </li>
              <li>
                <span className="text-slate-400">Investor visibility</span>
              </li>
              <li>
                <span className="text-slate-400">Secure data rooms</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-white">
              Contact
            </div>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>Churchill Road, Addis Ababa, Ethiopia</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-400 shrink-0" />
                <span>mint.dih.ethiopia@gmail.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                <span>+251 (0) 11 126 5737</span>
              </li>
              <li className="flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>mint.gov.et</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} Ministry of Innovation and Technology (MinT), Ethiopia. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Digital Innovation Hub</span>
            <span>·</span>
            <span>Official Portal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}