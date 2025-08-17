import Image from 'next/image'

interface CryptoIconProps {
  symbol: string
  size?: number
  className?: string
}

const cryptoIcons: Record<string, string> = {
  'USDT': '/crypto-icons/USDT.png',
  'USDC': '/crypto-icons/USDC.png', 
  'ETH': '/crypto-icons/ETH.png',
  'ARB': '/crypto-icons/ARB.png',
  'BASE': '/crypto-icons/BASE.png',
  'UNISWAP': '/crypto-icons/UNISWAP.png',
  'OP': '/crypto-icons/optimism.webp',
  'MATIC': '/crypto-icons/MATIC.png',
}

export default function CryptoIcon({ symbol, size = 24, className = '' }: CryptoIconProps) {
  const iconSrc = cryptoIcons[symbol.toUpperCase()]
  
  if (!iconSrc) {
    // Fallback to text-based icon if image not found
    return (
      <div 
        className={`flex items-center justify-center bg-gradient-to-br from-gray-600 to-gray-800 rounded-full text-white font-bold text-xs ${className}`}
        style={{ width: size, height: size }}
      >
        {symbol.slice(0, 3).toUpperCase()}
      </div>
    )
  }

  return (
    <div className={`rounded-full overflow-hidden ${className}`} style={{ width: size, height: size }}>
      <Image 
        src={iconSrc} 
        alt={symbol} 
        width={size} 
        height={size} 
        className="w-full h-full object-cover"
      />
    </div>
  )
}
