    1→'use client'
    2→
    3→import { useEffect, useState, useRef, useCallback } from 'react'
    4→import { useRouter } from 'next/navigation'
    5→import Image from 'next/image'
    6→import { Button } from '@/components/ui/button'
    7→import { Slider } from '@/components/ui/slider'
    8→import { Switch } from '@/components/ui/switch'
    9→import { Card, CardContent } from '@/components/ui/card'
   10→import {
   11→  ChevronLeft,
   12→  ChevronRight,
   13→  Settings,
   14→  Maximize,
   15→  Minimize,
   16→  Volume2,
   17→  VolumeX,
   18→  Image as ImageIcon,
   19→  Grid,
   20→  List,
   21→  Keyboard,
   22→  Moon,
   23→  Sun,
   24→} from 'lucide-react'
   25→
   26→// Reader modes
   27→enum ReaderMode {
   28→  VERTICAL = 'VERTICAL',
   29→  PAGED = 'PAGED',
   30→}
   31→
   32→export default function ReaderPage({
   33→  params,
   34→}: {
   35→  params: {
   36→    seriesSlug: string
   37→    chapter: string
   38→  }
   39→}) {
   40→  const router = useRouter()
   41→  const { seriesSlug, chapter } = params
   42→  const [mode, setMode] = useState<ReaderMode>(ReaderMode.VERTICAL)
   43→  const [hideUI, setHideUI] = useState(false)
   44→  const [imageQuality, setImageQuality] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('HIGH')
   45→  const [backgroundColor, setBackgroundColor] = useState('#1a1a1a')
   46→  const [pageGap, setPageGap] = useState(0)
   47→  const [autoScroll, setAutoScroll] = useState(false)
   48→  [showSettings, setShowSettings] = useState(false)
   49→  [progress, setProgress] = useState(0)
   50→  [isLoading, setIsLoading] = useState(true)
