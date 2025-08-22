import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format SOL amount with proper decimals
export function formatSOL(lamports: number | bigint): string {
  const sol = Number(lamports) / 1e9
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(sol)
}

// Truncate wallet address
export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

// Generate avatar URL from address
export function getAvatarUrl(address: string): string {
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`
}

// Calculate win rate percentage
export function calculateWinRate(wins: number, total: number): string {
  if (total === 0) return '0'
  return ((wins / total) * 100).toFixed(1)
}

// Format time ago
export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// Generate random match ID
export function generateMatchId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// RPS game logic
export type Choice = 'rock' | 'paper' | 'scissors'

export function determineWinner(p1: Choice, p2: Choice): 'player1' | 'player2' | 'draw' {
  if (p1 === p2) return 'draw'
  
  const winConditions = {
    rock: 'scissors',
    paper: 'rock',
    scissors: 'paper',
  }
  
  return winConditions[p1] === p2 ? 'player1' : 'player2'
}

// Animation variants for Framer Motion
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export const scaleIn = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
}

export const slideIn = {
  initial: { x: -100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 100, opacity: 0 },
}

// Sound effect URLs
export const SOUNDS = {
  click: '/sounds/click.mp3',
  win: '/sounds/win.mp3',
  lose: '/sounds/lose.mp3',
  draw: '/sounds/draw.mp3',
  countdown: '/sounds/countdown.mp3',
  notification: '/sounds/notification.mp3',
}

// Play sound effect
export function playSound(sound: keyof typeof SOUNDS, volume = 0.5) {
  if (typeof window === 'undefined') return
  
  const audio = new Audio(SOUNDS[sound])
  audio.volume = volume
  audio.play().catch(console.error)
}