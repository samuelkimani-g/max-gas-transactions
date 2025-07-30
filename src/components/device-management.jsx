import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useToast } from '../hooks/use-toast';

const DeviceManagement = () => {
  const [devices, setDevices] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registerDialog, setRegisterDialog] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    device_identifier: '',
    userId: '',
    role: '',
    notes: ''
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const { toast } = useToast();

  const apiBase = process.env.REACT_APP_API_URL || 'https://max-gas-backend.onrender.com/api';

  useEffect(() => {
    loadDevices();
    loadUsers();
    loadStats();
  }, []);

  const loadDevices = async () => {
    try {
      const token = localStorage.getItem('maxgas_jwt_token');
      const response = await fetch(`${apiBase}/devices`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
      } else {
        console.error('Failed to load devices');
      }
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('maxgas_jwt_token');
      const response = await fetch(`${apiBase}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('maxgas_jwt_token');
      const response = await fetch(`${apiBase}/devices/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleRegisterDevice = async (e) => {
    e.preventDefault();
    setIsRegistering(true);

    try {
      const token = localStorage.getItem('maxgas_jwt_token');
      const response = await fetch(`${apiBase}/devices/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(registerForm)
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message,
        });
        setRegisterDialog(false);
        setRegisterForm({ device_identifier: '', userId: '', role: '', notes: '' });
        loadDevices();
        loadStats();
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRevokeDevice = async (deviceId) => {
    if (!confirm('Are you sure you want to revoke access for this device?')) {
      return;
    }

    try {
      const token = localStorage.getItem('maxgas_jwt_token');
      const response = await fetch(`${apiBase}/devices/${deviceId}/revoke`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message,
        });
        loadDevices();
        loadStats();
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'operator': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trusted Devices</h1>
          <p className="text-gray-600">Manage device access to MaxGas system</p>
        </div>
        
        <Dialog open={registerDialog} onOpenChange={setRegisterDialog}>
          <DialogTrigger asChild>
            <Button>Register New Device</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Register Trusted Device</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRegisterDevice} className="space-y-4">
              <div>
                <Label htmlFor="device_identifier">Device ID</Label>
                <Input
                  id="device_identifier"
                  value={registerForm.device_identifier}
                  onChange={(e) => setRegisterForm({ ...registerForm, device_identifier: e.target.value })}
                  placeholder="Enter device UUID"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="userId">User</Label>
                <Select value={registerForm.userId} onValueChange={(value) => setRegisterForm({ ...registerForm, userId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.username} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={registerForm.role} onValueChange={(value) => setRegisterForm({ ...registerForm, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="operator">Operator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={registerForm.notes}
                  onChange={(e) => setRegisterForm({ ...registerForm, notes: e.target.value })}
                  placeholder="Device description or location"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setRegisterDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isRegistering}>
                  {isRegistering ? 'Registering...' : 'Register Device'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total_devices}</div>
              <div className="text-sm text-gray-600">Total Devices</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.active_devices}</div>
              <div className="text-sm text-gray-600">Active Devices</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.inactive_devices}</div>
              <div className="text-sm text-gray-600">Inactive Devices</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {stats.last_device_activity ? formatDate(stats.last_device_activity).split(',')[0] : 'Never'}
              </div>
              <div className="text-sm text-gray-600">Last Activity</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Devices List */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Devices</CardTitle>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No devices registered yet
            </div>
          ) : (
            <div className="space-y-4">
              {devices.map((device) => (
                <div key={device.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge className={getRoleColor(device.role)}>
                          {device.role}
                        </Badge>
                        <Badge variant={device.is_active ? "default" : "secondary"}>
                          {device.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="text-sm">
                        <strong>Device ID:</strong> {device.device_identifier}
                      </div>
                      <div className="text-sm">
                        <strong>User:</strong> {device.username}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Created:</strong> {formatDate(device.created_at)}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Last Access:</strong> {formatDate(device.last_accessed_at)}
                      </div>
                      {device.notes && (
                        <div className="text-sm text-gray-600">
                          <strong>Notes:</strong> {device.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRevokeDevice(device.id)}
                        disabled={!device.is_active}
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeviceManagement; 