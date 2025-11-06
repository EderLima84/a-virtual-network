import { Home, Users, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FriendshipLevel = 'conhecido' | 'vizinho' | 'amigo_varanda';

interface FriendshipLevelBadgeProps {
  level: FriendshipLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const levelConfig = {
  conhecido: {
    icon: Home,
    label: 'Conhecido da Praça',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    description: 'Vocês se cruzam pela praça',
    emoji: '🏡'
  },
  vizinho: {
    icon: Users,
    label: 'Vizinho Próximo',
    color: 'text-accent',
    bgColor: 'bg-accent/20',
    description: 'Amizade confirmada',
    emoji: '🌳'
  },
  amigo_varanda: {
    icon: Star,
    label: 'Amigo da Varanda',
    color: 'text-primary',
    bgColor: 'bg-primary/20',
    description: 'Amizade especial',
    emoji: '🌟'
  }
};

export const FriendshipLevelBadge = ({ level, showLabel = true, size = 'md' }: FriendshipLevelBadgeProps) => {
  const config = levelConfig[level];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium transition-all',
        config.color,
        config.bgColor,
        sizeClasses[size]
      )}
    >
      <span>{config.emoji}</span>
      <Icon className={iconSizes[size]} />
      {showLabel && <span>{config.label}</span>}
    </div>
  );
};

export const getLevelProgress = (level: FriendshipLevel, interactionCount: number, affinityScore: number) => {
  if (level === 'conhecido') {
    return {
      progress: Math.min((interactionCount / 3) * 100, 100),
      nextLevel: 'Vizinho Próximo',
      requirement: `${interactionCount}/3 interações`
    };
  } else if (level === 'vizinho') {
    const interactionProgress = (interactionCount / 15) * 50;
    const affinityProgress = (affinityScore / 70) * 50;
    return {
      progress: Math.min(interactionProgress + affinityProgress, 100),
      nextLevel: 'Amigo da Varanda',
      requirement: `${interactionCount}/15 interações • ${affinityScore}/70 afinidade`
    };
  } else {
    return {
      progress: 100,
      nextLevel: 'Nível máximo',
      requirement: 'Amizade consolidada! 🎉'
    };
  }
};
