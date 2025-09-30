import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select } from './ui/select';
import { Table } from './ui/table';
import { Dialog } from './ui/dialog';
import { Tabs } from './ui/tabs';
import { Badge } from './ui/badge';
import { useStore } from '../lib/store';
import { apiCall } from '../lib/api';

const InventoryDashboard = () => {
  const { user, setToast } = useStore();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    cylinder_type: '',
    quantity_kg: '',
    supplier_place: '',
    cost_per_kg: '',
    total_amount_paid: '',
    branch_id: ''
  });
  const [filters, setFilters] = useState({
    cylinderType: '',
    branchId: ''
  });

  // Check if user has admin role
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchInventory();
    }
  }, [isAdmin, filters]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.cylinderType) params.append('cylinderType', filters.cylinderType);
      if (filters.branchId) params.append('branchId', filters.branchId);

      const response = await apiCall(`/inventory?${params.toString()}`);
      if (response.success) {
        setInventory(response.data);
      } else {
        setToast('Failed to fetch inventory data', 'error');
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setToast('Error fetching inventory data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      const response = await apiCall('/inventory/add', 'POST', formData);
      if (response.success) {
        setToast('Stock added successfully', 'success');
        setShowAddForm(false);
        setFormData({
          cylinder_type: '',
          quantity_kg: '',
          supplier_place: '',
          cost_per_kg: '',
          total_amount_paid: '',
          branch_id: ''
        });
        fetchInventory();
      } else {
        setToast(response.message || 'Failed to add stock', 'error');
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      setToast('Error adding stock', 'error');
    }
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    try {
      const response = await apiCall(`/inventory/update/${editingItem.id}`, 'PUT', formData);
      if (response.success) {
        setToast('Stock updated successfully', 'success');
        setEditingItem(null);
        setFormData({
          cylinder_type: '',
          quantity_kg: '',
          supplier_place: '',
          cost_per_kg: '',
          total_amount_paid: '',
          branch_id: ''
        });
        fetchInventory();
      } else {
        setToast(response.message || 'Failed to update stock', 'error');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      setToast('Error updating stock', 'error');
    }
  };

  const handleDeleteStock = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inventory item?')) return;

    try {
      const response = await apiCall(`/inventory/${id}`, 'DELETE');
      if (response.success) {
        setToast('Stock deleted successfully', 'success');
        fetchInventory();
      } else {
        setToast(response.message || 'Failed to delete stock', 'error');
      }
    } catch (error) {
      console.error('Error deleting stock:', error);
      setToast('Error deleting stock', 'error');
    }
  };

  const openEditForm = (item) => {
    setEditingItem(item);
    setFormData({
      cylinder_type: item.cylinder_type,
      quantity_kg: item.available_stock_kg,
      supplier_place: item.supplier_place,
      cost_per_kg: item.cost_per_kg,
      total_amount_paid: item.total_amount_paid,
      branch_id: item.branchId || ''
    });
  };

  const getStatusBadge = (item) => {
    const stockKg = parseFloat(item.available_stock_kg);
    if (stockKg < 100) return <Badge variant="destructive">Low Stock</Badge>;
    if (stockKg < 500) return <Badge variant="secondary">Medium Stock</Badge>;
    return <Badge variant="default">Good Stock</Badge>;
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-600">Access Denied</h2>
          <p className="text-gray-500 mt-2">You need admin privileges to access inventory management.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <Button onClick={() => setShowAddForm(true)}>
          Add Stock
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="cylinderType">Cylinder Type</Label>
            <Select
              value={filters.cylinderType}
              onValueChange={(value) => setFilters({ ...filters, cylinderType: value })}
            >
              <option value="">All Types</option>
              <option value="6KG">6KG</option>
              <option value="13KG">13KG</option>
              <option value="50KG">50KG</option>
              <option value="LPG Bulk">LPG Bulk</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="branchId">Branch</Label>
            <Select
              value={filters.branchId}
              onValueChange={(value) => setFilters({ ...filters, branchId: value })}
            >
              <option value="">All Branches</option>
              {/* Add branch options here */}
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={fetchInventory} variant="outline">
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card>
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Current Inventory</h2>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Cylinder Type</th>
                  <th>Available Stock (kg)</th>
                  <th>Available Stock (tons)</th>
                  <th>Supplier</th>
                  <th>Cost/kg</th>
                  <th>Total Value</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item.id}>
                    <td className="font-medium">{item.cylinder_type}</td>
                    <td>{parseFloat(item.available_stock_kg).toFixed(2)} kg</td>
                    <td>{parseFloat(item.available_stock_tons).toFixed(3)} tons</td>
                    <td>{item.supplier_place}</td>
                    <td>KSh {parseFloat(item.cost_per_kg).toFixed(2)}</td>
                    <td>KSh {parseFloat(item.total_value || 0).toFixed(2)}</td>
                    <td>{getStatusBadge(item)}</td>
                    <td>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditForm(item)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteStock(item.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      </Card>

      {/* Add Stock Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">Add New Stock</h2>
            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <Label htmlFor="cylinder_type">Cylinder Type</Label>
                <Select
                  value={formData.cylinder_type}
                  onValueChange={(value) => setFormData({ ...formData, cylinder_type: value })}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="6KG">6KG</option>
                  <option value="13KG">13KG</option>
                  <option value="50KG">50KG</option>
                  <option value="LPG Bulk">LPG Bulk</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="quantity_kg">Quantity (kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.quantity_kg}
                  onChange={(e) => setFormData({ ...formData, quantity_kg: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="supplier_place">Supplier Place</Label>
                <Input
                  value={formData.supplier_place}
                  onChange={(e) => setFormData({ ...formData, supplier_place: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cost_per_kg">Cost per kg (KSh)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cost_per_kg}
                  onChange={(e) => setFormData({ ...formData, cost_per_kg: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="total_amount_paid">Total Amount Paid (KSh)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.total_amount_paid}
                  onChange={(e) => setFormData({ ...formData, total_amount_paid: e.target.value })}
                  required
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="flex-1">
                  Add Stock
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </Dialog>

      {/* Edit Stock Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">Edit Stock</h2>
            <form onSubmit={handleUpdateStock} className="space-y-4">
              <div>
                <Label htmlFor="cylinder_type">Cylinder Type</Label>
                <Input
                  value={formData.cylinder_type}
                  onChange={(e) => setFormData({ ...formData, cylinder_type: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="quantity_kg">Quantity (kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.quantity_kg}
                  onChange={(e) => setFormData({ ...formData, quantity_kg: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="supplier_place">Supplier Place</Label>
                <Input
                  value={formData.supplier_place}
                  onChange={(e) => setFormData({ ...formData, supplier_place: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cost_per_kg">Cost per kg (KSh)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cost_per_kg}
                  onChange={(e) => setFormData({ ...formData, cost_per_kg: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="total_amount_paid">Total Amount Paid (KSh)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.total_amount_paid}
                  onChange={(e) => setFormData({ ...formData, total_amount_paid: e.target.value })}
                  required
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="flex-1">
                  Update Stock
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingItem(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </Dialog>
    </div>
  );
};

export default InventoryDashboard;
