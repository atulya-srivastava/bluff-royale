import React from 'react';

/**
 * Reusable Button component for Bluff Royale landing page.
 * Golden background with brown hover for primary actions.
 * Timeless, classic casino look.
 */
const Button = ({
  children,
  variant = 'primary',
  onClick,
  className = '',
  icon: Icon,
  size = 'md',
  type = 'button',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg font-bold',
  };

  const variantClasses = {
    primary:
      'bg-gradient-to-b from-[#f59e0b] via-[#d4af37] to-[#b45309] text-[#1c1008] border border-[#fef08a] shadow-md hover:bg-gradient-to-b hover:from-[#b45309] hover:to-[#3b2314] hover:text-[#f5e6d3] hover:border-[#d4af37]',
    secondary:
      'bg-gradient-to-b from-[#3b2314] to-[#24140b] text-[#f5e6d3] border border-[#5c3b1e] shadow-md hover:border-[#d4af37] hover:text-[#fbbf24] hover:from-[#4a2d18] hover:to-[#2d1a0e]',
    gold:
      'bg-[#d4af37] text-[#1c1008] border border-[#fef08a] hover:bg-[#3b2314] hover:text-[#f5e6d3] hover:border-[#d4af37]',
    brown:
      'bg-[#3b2314] text-[#f5e6d3] border border-[#5c3b1e] hover:bg-[#d4af37] hover:text-[#1c1008] hover:border-[#fef08a]',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-bold tracking-wide transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.primary} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
      <span>{children}</span>
    </button>
  );
};

export default Button;
