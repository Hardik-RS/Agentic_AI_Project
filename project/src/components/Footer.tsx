import { Link } from 'react-router-dom';
import { Mail, Github, Twitter, Linkedin } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export function Footer() {
  return (
    <footer className="bg-navy-900 text-navy-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <BrandLogo compact inverse />
            </Link>
            <p className="text-sm text-navy-300 max-w-md leading-relaxed">
              AI-powered resume analysis, ATS scoring, job matching, and mock interview
              preparation. Land your next role with confidence.
            </p>
            <div className="flex items-center gap-4 mt-6">
              {[Twitter, Linkedin, Github, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-navy-800 hover:bg-brand-600 flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4 text-navy-200" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2">
              <li><a href="/#features" className="text-sm text-navy-300 hover:text-white transition-colors">Features</a></li>
              <li><a href="/#how-it-works" className="text-sm text-navy-300 hover:text-white transition-colors">How it Works</a></li>
              <li><a href="/#faq" className="text-sm text-navy-300 hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><Link to="/login" className="text-sm text-navy-300 hover:text-white transition-colors">Log in</Link></li>
              <li><Link to="/register" className="text-sm text-navy-300 hover:text-white transition-colors">Sign up</Link></li>
              <li><a href="#" className="text-sm text-navy-300 hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-navy-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-navy-400">© 2026 ResumeAI. All rights reserved.</p>
          <p className="text-xs text-navy-400">Built for job seekers who want an edge.</p>
        </div>
      </div>
    </footer>
  );
}
