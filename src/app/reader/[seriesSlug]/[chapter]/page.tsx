'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Grid,
  List,
  Keyboard,
  Moon,
  Sun,
} from 'lucide-react'

// Reader modes
enum ReaderMode {
  VERTICAL = 'VERTICAL',
  PAGED = 'PAGED',
}

export default function ReaderPage({
  params,
}: {
  params: {
    seriesSlug: string
    chapter: string
  }
}) {
  const router = useRouter()
  const { seriesSlug, chapter } = await params
  const [mode, setMode] = useState<ReaderMode>(ReaderMode.VERTICAL)
  const [hideUI, setHideUI] = useState(false)
  const [imageQuality, setImageQuality] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('HIGH')
  const [backgroundColor, setBackgroundColor] = useState('#1a1a1a')
  const [pageGap, setPageGap] = useState(0)
  const [autoScroll, setAutoScroll] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Chapter data (mock for now - in real app would fetch from API)
  const [pages, setPages] = useState<any[]>([])

  // Refs for scrolling and image loading
  const readerRef = useRef<HTMLDivElement>(null)
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch chapter data
  useEffect(() => {
    async function fetchChapterData() {
      setIsLoading(true)
      try {
        // In real app, this would be:
        // const response = await fetch(`/api/chapters/${chapter}`)
        // const data = await response.json()
        // setPages(data.pages)

        // For now, simulate pages
        const mockPages = Array.from({ length: 20 }, (_, i) => ({
          id: `page-${i + 1}`,
          url: `/uploads/chapters/${seriesSlug}/${chapter}/${i + 1}.jpg`,
          order: i + 1,
        }))

        setPages(mockPages)
      } catch (error) {
        console.error('Error fetching chapter:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchChapterData()

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current)
      }
    }
  }, [seriesSlug, chapter])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          handlePreviousChapter()
          break
        case 'ArrowRight':
          e.preventDefault()
          handleNextChapter()
          break
        case 'ArrowUp':
          if (mode === ReaderMode.VERTICAL) {
            e.preventDefault()
            handleScrollUp()
          }
          break
        case 'ArrowDown':
          if (mode === ReaderMode.VERTICAL) {
            e.preventDefault()
            handleScrollDown()
          }
          break
        case 'f':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'h':
          e.preventDefault()
          setHideUI(!hideUI)
          break
        case 's':
          e.preventDefault()
          setShowSettings(!showSettings)
          break
        case 'Escape':
          if (showSettings || hideUI) {
            e.preventDefault()
            setShowSettings(false)
            setHideUI(false)
          }
          break
        case 'a':
          e.preventDefault()
          setAutoScroll(!autoScroll)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mode, hideUI, showSettings, autoScroll])

  // Auto scroll
  useEffect(() => {
    if (autoScroll && mode === ReaderMode.VERTICAL) {
      autoScrollIntervalRef.current = setInterval(() => {
        if (readerRef.current) {
          readerRef.current.scrollTop += 1
        }
      }, 50) // Scroll down every 50ms
    } else if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current)
      autoScrollIntervalRef.current = null
    }

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current)
        autoScrollIntervalRef.current = null
      }
    }
  }, [autoScroll, mode])

  // Track reading progress
  useEffect(() => {
    const scrollHandler = () => {
      if (!readerRef.current) return

      const { scrollTop, scrollHeight, clientHeight } = readerRef.current
      const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100

      setProgress(Math.round(scrollPercentage))

      // Auto-save progress (debounced in real app)
      if (Math.random() > 0.95) { // Debounce simulation
        saveProgress(scrollPercentage, scrollTop, scrollHeight)
      }
    }

    readerRef.current?.addEventListener('scroll', scrollHandler)
    return () => {
      readerRef.current?.removeEventListener('scroll', scrollHandler)
    }
  }, [pages])

  // Save progress to API
  const saveProgress = useCallback(async (percentage: number, scrollOffset: number, scrollHeight: number) => {
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: chapter,
          pageIndex: Math.floor(percentage / 100 * pages.length),
          scrollOffset: scrollOffset / scrollHeight,
          isCompleted: percentage >= 95,
        }),
      })
    } catch (error) {
      console.error('Error saving progress:', error)
    }
  }, [chapter, pages])

  // Navigation handlers
  const handlePreviousChapter = () => {
    const currentChapter = parseInt(chapter)
    if (currentChapter > 1) {
      router.push(`/reader/${seriesSlug}/${currentChapter - 1}`)
    }
  }

  const handleNextChapter = () => {
    const currentChapter = parseInt(chapter)
    // In real app, check if next chapter exists
    router.push(`/reader/${seriesSlug}/${currentChapter + 1}`)
  }

  const handleScrollUp = () => {
    if (readerRef.current) {
      readerRef.current.scrollBy({ top: -300, behavior: 'smooth' })
    }
  }

  const handleScrollDown = () => {
    if (readerRef.current) {
      readerRef.current.scrollBy({ top: 300, behavior: 'smooth' })
    }
  }

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen()
    }
  }

  const handlePageClick = (index: number) => {
    // Scroll to page
    const pageElements = readerRef.current?.querySelectorAll('[data-page-index]')
    if (pageElements && pageElements[index]) {
      pageElements[index].scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Get image quality URL
  const getImageUrl = (url: string) => {
    if (imageQuality === 'LOW') {
      return url.replace('.jpg', '-low.jpg')
    } else if (imageQuality === 'MEDIUM') {
      return url.replace('.jpg', '-medium.jpg')
    }
    return url
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ backgroundColor }}>
      {/* Top Bar */}
      {!hideUI && (
        <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousChapter}
          >
            <ChevronLeft className="h-5 w-5" />
            Previous
          </Button>

          <div className="flex items-center gap-4">
            <div className="text-sm font-medium">
              Chapter {chapter}
            </div>
            <div className="text-xs text-muted-foreground">
              Page {Math.ceil(progress / 100 * pages.length)} / {pages.length}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextChapter}
            >
              Next
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <Card className="fixed top-20 right-4 z-50 w-80 max-h-[calc(100vh-6rem)] overflow-auto">
          <CardContent className="space-y-6">
            <h3 className="text-lg font-semibold">Reader Settings</h3>

            {/* Mode Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Reading Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={mode === ReaderMode.VERTICAL ? 'default' : 'outline'}
                  onClick={() => setMode(ReaderMode.VERTICAL)}
                  className="w-full"
                >
                  <List className="h-4 w-4 mr-2" />
                  Vertical
                </Button>
                <Button
                  variant={mode === ReaderMode.PAGED ? 'default' : 'outline'}
                  onClick={() => setMode(ReaderMode.PAGED)}
                  className="w-full"
                >
                  <Grid className="h-4 w-4 mr-2" />
                  Paged
                </Button>
              </div>
            </div>

            {/* Image Quality */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Image Quality</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={imageQuality === 'LOW' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageQuality('LOW')}
                  className="w-full"
                >
                  Low
                </Button>
                <Button
                  variant={imageQuality === 'MEDIUM' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageQuality('MEDIUM')}
                  className="w-full"
                >
                  Medium
                </Button>
                <Button
                  variant={imageQuality === 'HIGH' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageQuality('HIGH')}
                  className="w-full"
                >
                  High
                </Button>
              </div>
            </div>

            {/* Page Gap */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Page Gap</label>
                <span className="text-sm text-muted-foreground">{pageGap}px</span>
              </div>
              <Slider
                value={[pageGap]}
                onValueChange={([value]) => setPageGap(value)}
                min={0}
                max={50}
                step={1}
                className="w-full"
              />
            </div>

            {/* Background Color */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Background</label>
              <div className="grid grid-cols-6 gap-2">
                {['#1a1a1a', '#0f0f0f', '#ffffff', '#f5f5f5', '#f0f0f0', '#000000'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setBackgroundColor(color)}
                    className={`w-full h-10 rounded-md border-2 ${
                      backgroundColor === color ? 'border-primary' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Auto Scroll */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Auto Scroll</label>
                <p className="text-xs text-muted-foreground">
                  Press 'A' to toggle
                </p>
              </div>
              <Switch
                checked={autoScroll}
                onCheckedChange={setAutoScroll}
              />
            </div>

            {/* Hide UI */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Hide UI</label>
                <p className="text-xs text-muted-foreground">
                  Press 'H' to toggle
                </p>
              </div>
              <Switch
                checked={hideUI}
                onCheckedChange={setHideUI}
              />
            </div>

            {/* Keyboard Shortcuts Help */}
            <div className="border-t pt-4 space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                Keyboard Shortcuts
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>← / → : Previous/Next Chapter</div>
                <div>↑ / ↓ : Scroll Up/Down</div>
                <div>F : Toggle Fullscreen</div>
                <div>H : Toggle UI</div>
                <div>S : Settings</div>
                <div>A : Toggle Auto Scroll</div>
                <div>Esc : Close Settings</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reader Content */}
      <div
        ref={readerRef}
        className={`flex-1 ${mode === ReaderMode.VERTICAL ? 'overflow-y-auto' : 'overflow-hidden'} scroll-smooth`}
        style={{
          scrollBehavior: 'smooth',
          backgroundColor,
        }}
      >
        {mode === ReaderMode.VERTICAL ? (
          // Vertical scroll mode
          <div className="flex flex-col items-center max-w-6xl mx-auto py-4 gap-4">
            {pages.map((page, index) => (
              <div
                key={page.id}
                data-page-index={index}
                className="w-full"
              >
                <Image
                  src={getImageUrl(page.url)}
                  alt={`Page ${index + 1}`}
                  width={800}
                  height={1200}
                  className="w-full h-auto"
                  priority={index < 3}
                  placeholder="none"
                />
              </div>
            ))}
          </div>
        ) : (
          // Paged mode (scroll snap horizontal)
          <div className="flex overflow-x-auto snap-x snap-mandatory" style={{ gap: `${pageGap}px` }}>
            {pages.map((page, index) => (
              <div
                key={page.id}
                data-page-index={index}
                className="flex-shrink-0 snap-center h-screen w-auto"
                onClick={() => handlePageClick(index)}
              >
                <Image
                  src={getImageUrl(page.url)}
                  alt={`Page ${index + 1}`}
                  width={800}
                  height={1200}
                  className="max-h-full w-auto object-contain"
                  priority={index < 3}
                  placeholder="none"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
