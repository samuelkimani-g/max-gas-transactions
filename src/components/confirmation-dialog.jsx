"use client"

import { AlertTriangle, CheckCircle } from "lucide-react"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "danger",
  confirmText = "Confirm",
  cancelText = "Cancel",
}) {
  const getIcon = () => {
    switch (type) {
      case "danger":
        return <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      case "warning":
        return <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
      case "success":
        return <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
      default:
        return <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
    }
  }

  const getButtonStyle = () => {
    switch (type) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white"
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700 text-white"
      case "success":
        return "bg-green-600 hover:bg-green-700 text-white"
      default:
        return "bg-red-600 hover:bg-red-700 text-white"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {getIcon()}
            <span className="text-xl font-bold text-gray-900">{title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="text-center py-4">
          <p className="text-gray-600 text-base leading-relaxed">{message}</p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1 border-gray-300 hover:bg-gray-50">
            {cancelText}
          </Button>
          <Button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`flex-1 ${getButtonStyle()}`}
          >
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
