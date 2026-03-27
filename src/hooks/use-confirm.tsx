"use client"

import { useState, useCallback } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmOptions {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
}

export function useConfirm() {
  const [config, setConfig] = useState<{
    isOpen: boolean
    options: ConfirmOptions
    resolve: ((value: boolean) => void) | null
  }>({
    isOpen: false,
    options: {},
    resolve: null,
  })

  const confirm = useCallback((options: ConfirmOptions = {}): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfig({
        isOpen: true,
        options,
        resolve,
      })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    config.resolve?.(true)
    setConfig({ isOpen: false, options: {}, resolve: null })
  }, [config])

  const handleCancel = useCallback(() => {
    config.resolve?.(false)
    setConfig({ isOpen: false, options: {}, resolve: null })
  }, [config])

  const ConfirmDialog = useCallback(() => (
    <AlertDialog open={config.isOpen} onOpenChange={(open: boolean) => !open && handleCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{config.options.title || "Konfirmasi"}</AlertDialogTitle>
          <AlertDialogDescription>
            {config.options.description || "Apakah Anda yakin?"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {config.options.cancelText || "Batal"}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            {config.options.confirmText || "Ya"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ), [config, handleConfirm, handleCancel])

  return { confirm, ConfirmDialog }
}