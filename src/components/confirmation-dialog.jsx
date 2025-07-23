"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog"
import { AlertTriangle, Trash2, User, Receipt } from "lucide-react"

export default function ConfirmationDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  title, 
  description, 
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "default", // "default", "customer", "transaction"
  customerName = "",
  transactionCount = 0,
  isDestructive = false
}) {
  const [step, setStep] = useState(1)
  const [typedName, setTypedName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    if (type === "customer" && step === 2) {
      if (typedName.toLowerCase() !== customerName.toLowerCase()) {
        return // Don't proceed if name doesn't match
      }
    }
    
    setIsLoading(true)
    try {
      await onConfirm()
      handleClose()
    } catch (error) {
      console.error('Confirmation error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setTypedName("")
    setIsLoading(false)
    onOpenChange(false)
  }

  const getStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <h4 className="font-semibold text-red-800">Warning</h4>
                <p className="text-sm text-red-700">{description}</p>
              </div>
            </div>
            
            {type === "customer" && transactionCount > 0 && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="w-4 h-4 text-orange-600" />
                  <span className="font-medium text-orange-800">Transaction Impact</span>
                </div>
                <p className="text-sm text-orange-700">
                  This customer has <strong>{transactionCount} transaction(s)</strong>. 
                  Deleting the customer will also permanently delete all associated transactions.
                </p>
              </div>
            )}
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Trash2 className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-red-800">Final Confirmation</span>
              </div>
              <p className="text-sm text-red-700 mb-4">
                To confirm deletion, please type the exact name: <strong>"{customerName}"</strong>
              </p>
              <div className="space-y-2">
                <Label htmlFor="confirm-name" className="text-sm font-medium text-red-800">
                  Type the customer name:
                </Label>
                <Input
                  id="confirm-name"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Enter customer name exactly as shown"
                  className="border-red-300 focus:border-red-500 focus:ring-red-200"
                />
              </div>
              {typedName && typedName.toLowerCase() !== customerName.toLowerCase() && (
                <p className="text-xs text-red-600 mt-1">
                  Names don't match. Please type exactly: "{customerName}"
                </p>
              )}
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  const getStepActions = () => {
    const canProceed = type === "customer" && step === 2 
      ? typedName.toLowerCase() === customerName.toLowerCase()
      : true

    return (
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleClose}
          disabled={isLoading}
          className="flex-1"
        >
          {cancelText}
        </Button>
        <Button
          onClick={step === 1 ? () => setStep(2) : handleConfirm}
          disabled={!canProceed || isLoading}
          className={`flex-1 ${isDestructive ? 'bg-red-600 hover:bg-red-700' : ''}`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </div>
          ) : (
            <>
              {type === "customer" && step === 1 ? (
                <>
                  <User className="w-4 h-4 mr-2" />
                  Continue to Final Step
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {confirmText}
                </>
              )}
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "customer" ? <User className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
            {title}
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? "This action cannot be undone." : "Final verification required."}
          </DialogDescription>
        </DialogHeader>
        
        {getStepContent()}
        
        <DialogFooter>
          {getStepActions()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
