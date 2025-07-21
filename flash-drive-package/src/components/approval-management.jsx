"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Textarea } from "./ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { CheckCircle, XCircle, Clock, User, FileText, AlertTriangle } from "lucide-react"
import { useStore } from "../lib/store"
import { useRBAC } from "../lib/rbac"
import { useToast } from "../hooks/use-toast"

export default function ApprovalManagement() {
  const { getApprovals, approveRequest, rejectRequest, user } = useStore()
  const rbac = useRBAC(user)
  const { toast } = useToast()
  const [approvals, setApprovals] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedApproval, setSelectedApproval] = useState(null)
  const [managerNotes, setManagerNotes] = useState("")
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)

  useEffect(() => {
    loadApprovals()
  }, [])

  const loadApprovals = async () => {
    try {
      setLoading(true)
      const data = await getApprovals()
      setApprovals(data)
    } catch (error) {
      console.error('Failed to load approvals:', error)
      toast({
        title: "Error",
        description: "Failed to load approval requests",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedApproval) return

    try {
      await approveRequest(selectedApproval.id, managerNotes)
      toast({
        title: "Success",
        description: "Request approved successfully"
      })
      setShowApproveDialog(false)
      setManagerNotes("")
      setSelectedApproval(null)
      loadApprovals() // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive"
      })
    }
  }

  const handleReject = async () => {
    if (!selectedApproval || !managerNotes.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive"
      })
      return
    }

    try {
      await rejectRequest(selectedApproval.id, managerNotes)
      toast({
        title: "Success",
        description: "Request rejected successfully"
      })
      setShowRejectDialog(false)
      setManagerNotes("")
      setSelectedApproval(null)
      loadApprovals() // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getRequestTypeIcon = (requestType) => {
    switch (requestType) {
      case 'customer_edit':
      case 'customer_delete':
        return <User className="w-4 h-4" />
      case 'transaction_edit':
      case 'transaction_delete':
        return <FileText className="w-4 h-4" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getRequestTypeLabel = (requestType) => {
    switch (requestType) {
      case 'customer_edit':
        return 'Edit Customer'
      case 'customer_delete':
        return 'Delete Customer'
      case 'transaction_edit':
        return 'Edit Transaction'
      case 'transaction_delete':
        return 'Delete Transaction'
      default:
        return requestType
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!rbac?.permissions?.canApproveRequests) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">You don't have permission to manage approvals.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="spinner mx-auto mb-4"></div>
        <h3 className="text-sm font-medium text-gray-900">Loading approvals...</h3>
      </div>
    )
  }

  const pendingApprovals = approvals.filter(a => a.status === 'pending')
  const processedApprovals = approvals.filter(a => a.status !== 'pending')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Approval Management</h2>
          <p className="text-gray-600">Review and manage operator requests</p>
        </div>
        <Button onClick={loadApprovals} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              Pending Approvals ({pendingApprovals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <Card key={approval.id} className="border-l-4 border-l-yellow-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getRequestTypeIcon(approval.requestType)}
                          <h4 className="font-medium">{getRequestTypeLabel(approval.requestType)}</h4>
                          {getStatusBadge(approval.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Requested by: <span className="font-medium">{approval.RequestedByUser?.fullName}</span>
                        </p>
                        {approval.reason && (
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Reason:</span> {approval.reason}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Requested on: {formatDate(approval.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedApproval(approval)
                            setShowApproveDialog(true)
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedApproval(approval)
                            setShowRejectDialog(true)
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processed Approvals */}
      {processedApprovals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processed Approvals ({processedApprovals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {processedApprovals.map((approval) => (
                <Card key={approval.id} className={`border-l-4 ${
                  approval.status === 'approved' ? 'border-l-green-500' : 'border-l-red-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getRequestTypeIcon(approval.requestType)}
                          <h4 className="font-medium">{getRequestTypeLabel(approval.requestType)}</h4>
                          {getStatusBadge(approval.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Requested by: <span className="font-medium">{approval.RequestedByUser?.fullName}</span>
                        </p>
                        {approval.ApprovedByUser && (
                          <p className="text-sm text-gray-600 mb-2">
                            Processed by: <span className="font-medium">{approval.ApprovedByUser.fullName}</span>
                          </p>
                        )}
                        {approval.managerNotes && (
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Notes:</span> {approval.managerNotes}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {approval.processedAt ? 
                            `Processed on: ${formatDate(approval.processedAt)}` : 
                            `Requested on: ${formatDate(approval.createdAt)}`
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {approvals.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No approval requests</h3>
            <p className="mt-1 text-sm text-gray-500">There are no pending or processed approval requests.</p>
          </CardContent>
        </Card>
      )}

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to approve this request?</p>
            <div>
              <label className="text-sm font-medium">Notes (optional):</label>
              <Textarea
                value={managerNotes}
                onChange={(e) => setManagerNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                Approve
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to reject this request?</p>
            <div>
              <label className="text-sm font-medium">Reason for rejection: *</label>
              <Textarea
                value={managerNotes}
                onChange={(e) => setManagerNotes(e.target.value)}
                placeholder="Please provide a reason for rejecting this request..."
                className="mt-1"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleReject} variant="destructive">
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 