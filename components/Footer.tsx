import { Heart, ExternalLink } from "lucide-react";

function Footer() {
  return (
    <footer className="bg-linear-to-r from-gray-900 via-purple-900 to-gray-900 text-white py-6 sm:py-8 mt-auto relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent"></div>
      <div className="hidden sm:block absolute top-0 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="hidden sm:block absolute bottom-0 right-1/4 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
          <span className="text-gray-300 text-xs sm:text-sm font-medium">
            Crafted with
          </span>
          <Heart className="w-4 h-4 text-pink-500 fill-pink-500 animate-pulse" />
          <span className="text-gray-300 text-xs sm:text-sm font-medium">
            by
          </span>
        </div>

        <a
          href="https://famtrixsolutions.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 text-sm sm:text-base"
        >
          <span className="text-sm sm:text-lg">famtrixsolutions.com</span>
          <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </a>

        <div className="mt-4 text-gray-400 text-xs">
          © {new Date().getFullYear()} Bilal Poultry Traders. All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
