"use client"

import { useMemo } from "react"
import { useAppStore } from "@/state/atoms"
import { TOKEN_CAPS } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface TokenMeterProps {
  className?: string
}

export function TokenMeter({ className = "" }: TokenMeterProps) {
  const { tokenState } = useAppStore()

  // Calculate percentages and status
  const { totalTokens, softCap, hardCap } = tokenState
  
  const softCapPercentage = (totalTokens / softCap) * 100
  const hardCapPercentage = (totalTokens / hardCap) * 100
  
  // Determine status
  const status = useMemo(() => {
    if (totalTokens >= hardCap) {
      return {
        level: 'danger' as const,
        message: 'Hard limit reached',
        icon: <XCircle className="h-4 w-4" />,
        color: 'text-destructive'
      }
    } else if (totalTokens >= softCap) {
      return {
        level: 'warning' as const,
        message: 'Approaching limit',
        icon: <AlertTriangle className="h-4 w-4" />,
        color: 'text-warning'
      }
    } else {
      return {
        level: 'good' as const,
        message: 'Within limits',
        icon: <CheckCircle className="h-4 w-4" />,
        color: 'text-green-600'
      }
    }
  }, [totalTokens, softCap, hardCap])

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  // Format as k/M notation
  const formatCompact = (num: number) => {
    if (num === 0) return "0"
    if (num < 1000) return num.toString()
    if (num < 1000000) return `${(num / 1000).toFixed(1)}k`
    return `${(num / 1000000).toFixed(1)}M`
  }

  // Get progress bar color based on status
  const getProgressColor = () => {
    switch (status.level) {
      case 'danger':
        return 'bg-destructive'
      case 'warning':
        return 'bg-yellow-500'
      default:
        return 'bg-primary'
    }
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <span>Token Usage</span>
          <div className={cn("flex items-center gap-1", status.color)}>
            {status.icon}
            <span className="text-sm font-normal">{status.message}</span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current usage */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span>Current Usage</span>
            <span className="font-mono">
              {formatCompact(totalTokens)} / {formatCompact(hardCap)}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="relative">
            <Progress 
              value={Math.min(hardCapPercentage, 100)} 
              className="h-3"
            />
            
            {/* Soft cap indicator line */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-yellow-500 opacity-60"
              style={{ left: `${Math.min((softCap / hardCap) * 100, 100)}%` }}
            />
          </div>
          
          {/* Detailed numbers */}
          <div className="text-xs text-muted-foreground text-center">
            {formatNumber(totalTokens)} tokens used
          </div>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant={softCapPercentage >= 100 ? "destructive" : "secondary"}
            className="text-xs"
          >
            Soft Cap: {formatCompact(softCap)}
          </Badge>
          <Badge 
            variant={hardCapPercentage >= 100 ? "destructive" : "outline"}
            className="text-xs"
          >
            Hard Cap: {formatCompact(hardCap)}
          </Badge>
        </div>

        {/* File count */}
        <div className="text-sm text-muted-foreground">
          {tokenState.tokenCounts.size} files selected
        </div>

        {/* Warning message if close to limit */}
        {status.level !== 'good' && (
          <div className={cn(
            "p-3 rounded-md text-sm",
            status.level === 'danger' 
              ? "bg-destructive/10 text-destructive" 
              : "bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200"
          )}>
            {status.level === 'danger' 
              ? "Cannot select additional files. Remove some files to stay within the token limit." 
              : "Consider removing some files to stay well within the token limit."
            }
          </div>
        )}
      </CardContent>
    </Card>
  )
} 