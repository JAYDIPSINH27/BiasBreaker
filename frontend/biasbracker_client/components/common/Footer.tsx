"use client";

import Link from "next/link";
import { FaFacebook, FaTwitter, FaLinkedin, FaGithub } from "react-icons/fa";
import { motion } from "framer-motion";

const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full bg-gray-900 text-white pt-10 pb-6 mt-16"
    >
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-sm">© {new Date().getFullYear()} BiasBreaker. All rights reserved.</p>
        {/* Social Icons */}
        <div className="flex justify-center space-x-6 mt-4">
          <Link href="#" className="text-gray-400 hover:text-white">
            <FaFacebook size={20} />
          </Link>
          <Link href="#" className="text-gray-400 hover:text-white">
            <FaTwitter size={20} />
          </Link>
          <Link href="#" className="text-gray-400 hover:text-white">
            <FaLinkedin size={20} />
          </Link>
          <Link href="#" className="text-gray-400 hover:text-white">
            <FaGithub size={20} />
          </Link>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
