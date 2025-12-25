import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = {
    'Shop': [
      { name: 'Products', path: '/products' },
      { name: 'Categories', path: '/products' },
      { name: 'Seasonal', path: '/products' },
      { name: 'Deals', path: '/products' },
    ],
    'Customer Service': [
      { name: 'Track Order', path: '/orders' },
      { name: 'Delivery Info', path: '/profile' },
      { name: 'Returns', path: '/profile' },
      { name: 'Contact Us', path: '/profile' },
    ],
    'About': [
      { name: 'Our Story', path: '/' },
      { name: 'Sustainability', path: '/' },
      { name: 'Local Farms', path: '/' },
      { name: 'Blog', path: '/' },
    ],
    'Legal': [
      { name: 'Privacy Policy', path: '/' },
      { name: 'Terms of Service', path: '/' },
      { name: 'Cookie Policy', path: '/' },
      { name: 'GDPR', path: '/' },
    ],
  };

  return (
    <footer className="bg-organic-green-900 text-organic-green-100 mt-auto">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-organic-green-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <span className="text-xl font-display font-bold text-white">
                Organic Veg
              </span>
            </div>
            <p className="text-organic-green-200 text-sm leading-relaxed">
              Fresh organic produce delivered straight from local farms to your door. 
              Sustainable, healthy, and always in season.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 bg-organic-green-800 rounded-lg flex items-center justify-center hover:bg-organic-green-700 transition-colors">
                <span className="text-xs font-semibold">f</span>
              </a>
              <a href="#" className="w-8 h-8 bg-organic-green-800 rounded-lg flex items-center justify-center hover:bg-organic-green-700 transition-colors">
                <span className="text-xs font-semibold">t</span>
              </a>
              <a href="#" className="w-8 h-8 bg-organic-green-800 rounded-lg flex items-center justify-center hover:bg-organic-green-700 transition-colors">
                <span className="text-xs font-semibold">i</span>
              </a>
              <a href="#" className="w-8 h-8 bg-organic-green-800 rounded-lg flex items-center justify-center hover:bg-organic-green-700 transition-colors">
                <span className="text-xs font-semibold">w</span>
              </a>
            </div>
          </div>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-display font-semibold text-white mb-4">
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-organic-green-200 hover:text-white text-sm transition-colors duration-200 inline-flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 bg-organic-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-organic-green-800 my-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <p className="text-sm text-organic-green-300">
              © {currentYear} Organic Veg. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <Link to="/" className="text-organic-green-300 hover:text-organic-green-200 transition-colors">
                Privacy
              </Link>
              <Link to="/" className="text-organic-green-300 hover:text-organic-green-200 transition-colors">
                Terms
              </Link>
              <Link to="/" className="text-organic-green-300 hover:text-organic-green-200 transition-colors">
                Cookies
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-organic-green-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
            Made with care for our planet
          </div>
        </div>
      </div>
    </footer>
  );
}