import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select } from './ui/select';
import { Tabs } from './ui/tabs';
import { Badge } from './ui/badge';
import { useStore } from '../lib/store';
import { apiCall } from '../lib/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const ForecastDashboard = () => {
  const { user, setToast } = useStore();
  const [demandForecast, setDemandForecast] = useState(null);
  const [inventoryForecast, setInventoryForecast] = useState([]);
  const [salesForecast, setSalesForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    cylinderType: 'all',
    days: 30,
    branchId: ''
  });

  // Check if user has admin role
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchAllForecasts();
    }
  }, [isAdmin, filters]);

  const fetchAllForecasts = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDemandForecast(),
        fetchInventoryForecast(),
        fetchSalesForecast()
      ]);
    } catch (error) {
      console.error('Error fetching forecasts:', error);
      setToast('Error fetching forecast data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDemandForecast = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.cylinderType) params.append('cylinderType', filters.cylinderType);
      if (filters.days) params.append('days', filters.days);
      if (filters.branchId) params.append('branchId', filters.branchId);

      const response = await apiCall(`/forecast/demand?${params.toString()}`);
      if (response.success) {
        setDemandForecast(response.data);
      }
    } catch (error) {
      console.error('Error fetching demand forecast:', error);
    }
  };

  const fetchInventoryForecast = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.days) params.append('days', filters.days);
      if (filters.branchId) params.append('branchId', filters.branchId);

      const response = await apiCall(`/forecast/inventory?${params.toString()}`);
      if (response.success) {
        setInventoryForecast(response.data);
      }
    } catch (error) {
      console.error('Error fetching inventory forecast:', error);
    }
  };

  const fetchSalesForecast = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.days) params.append('days', filters.days);
      if (filters.branchId) params.append('branchId', filters.branchId);

      const response = await apiCall(`/forecast/sales?${params.toString()}`);
      if (response.success) {
        setSalesForecast(response.data);
      }
    } catch (error) {
      console.error('Error fetching sales forecast:', error);
    }
  };

  const prepareChartData = (historical, forecast) => {
    const historicalData = historical.map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      value: item.value,
      type: 'Historical'
    }));

    const forecastData = forecast.map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      value: item.value,
      type: 'Forecast'
    }));

    return [...historicalData, ...forecastData];
  };

  const prepareInventoryChartData = () => {
    return inventoryForecast.map(item => ({
      name: item.cylinder_type,
      currentStock: parseFloat(item.current_stock_kg),
      projectedDemand: parseFloat(item.projected_demand),
      recommendedOrder: parseFloat(item.recommended_order)
    }));
  };

  const prepareSalesChartData = () => {
    if (!salesForecast) return [];
    return prepareChartData(salesForecast.historical, salesForecast.forecast);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'LOW': return '#ef4444';
      case 'MEDIUM': return '#f59e0b';
      case 'GOOD': return '#10b981';
      default: return '#6b7280';
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-600">Access Denied</h2>
          <p className="text-gray-500 mt-2">You need admin privileges to access forecasting.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Forecasting & Analytics</h1>
        <Button onClick={fetchAllForecasts} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh Forecasts'}
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="cylinderType">Cylinder Type</Label>
            <Select
              value={filters.cylinderType}
              onValueChange={(value) => setFilters({ ...filters, cylinderType: value })}
            >
              <option value="all">All Types</option>
              <option value="6KG">6KG</option>
              <option value="13KG">13KG</option>
              <option value="50KG">50KG</option>
              <option value="LPG Bulk">LPG Bulk</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="days">Forecast Days</Label>
            <Input
              type="number"
              value={filters.days}
              onChange={(e) => setFilters({ ...filters, days: parseInt(e.target.value) || 30 })}
              min="7"
              max="365"
            />
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
            <Button onClick={fetchAllForecasts} variant="outline" className="w-full">
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="demand" className="space-y-4">
        <div className="flex space-x-1">
          <Button
            variant="outline"
            onClick={() => document.querySelector('[data-value="demand"]').click()}
          >
            Demand Forecast
          </Button>
          <Button
            variant="outline"
            onClick={() => document.querySelector('[data-value="inventory"]').click()}
          >
            Inventory Forecast
          </Button>
          <Button
            variant="outline"
            onClick={() => document.querySelector('[data-value="sales"]').click()}
          >
            Sales Forecast
          </Button>
        </div>

        {/* Demand Forecast Tab */}
        <div data-value="demand" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Demand Forecast</h2>
            {demandForecast && Object.keys(demandForecast).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(demandForecast).map(([cylinderType, data]) => (
                  <div key={cylinderType}>
                    <h3 className="text-lg font-medium mb-2">{cylinderType} Demand</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={prepareChartData(data.historical, data.forecast)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#8884d8"
                            name="Demand"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Trend</p>
                        <p className="font-semibold">{data.trend?.toFixed(2)}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Confidence</p>
                        <p className="font-semibold">{(data.confidence * 100)?.toFixed(1)}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Avg Daily</p>
                        <p className="font-semibold">
                          {data.historical.length > 0 
                            ? (data.historical.reduce((sum, item) => sum + item.value, 0) / data.historical.length).toFixed(1)
                            : 0
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No demand forecast data available
              </div>
            )}
          </Card>
        </div>

        {/* Inventory Forecast Tab */}
        <div data-value="inventory" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Inventory Forecast</h2>
            {inventoryForecast.length > 0 ? (
              <div className="space-y-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareInventoryChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="currentStock" fill="#8884d8" name="Current Stock (kg)" />
                      <Bar dataKey="projectedDemand" fill="#82ca9d" name="Projected Demand (kg)" />
                      <Bar dataKey="recommendedOrder" fill="#ffc658" name="Recommended Order (kg)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inventoryForecast.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{item.cylinder_type}</h3>
                        <Badge style={{ backgroundColor: getStatusColor(item.status) }}>
                          {item.status}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Current Stock:</span>
                          <span>{parseFloat(item.current_stock_kg).toFixed(1)} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg Daily Demand:</span>
                          <span>{parseFloat(item.avg_daily_demand).toFixed(1)} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Days Remaining:</span>
                          <span>{item.days_remaining} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Recommended Order:</span>
                          <span className="font-semibold">
                            {parseFloat(item.recommended_order).toFixed(1)} kg
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No inventory forecast data available
              </div>
            )}
          </Card>
        </div>

        {/* Sales Forecast Tab */}
        <div data-value="sales" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Sales Forecast</h2>
            {salesForecast ? (
              <div className="space-y-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={prepareSalesChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`KSh ${value.toFixed(2)}`, 'Sales']} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#8884d8"
                        name="Sales"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="p-4 text-center">
                    <p className="text-sm text-gray-600">Average Daily Sales</p>
                    <p className="text-2xl font-bold text-green-600">
                      KSh {salesForecast.summary?.avg_daily_sales?.toFixed(2) || 0}
                    </p>
                  </Card>
                  <Card className="p-4 text-center">
                    <p className="text-sm text-gray-600">Projected Revenue</p>
                    <p className="text-2xl font-bold text-blue-600">
                      KSh {salesForecast.summary?.projected_revenue?.toFixed(2) || 0}
                    </p>
                  </Card>
                  <Card className="p-4 text-center">
                    <p className="text-sm text-gray-600">Growth Rate</p>
                    <p className={`text-2xl font-bold ${salesForecast.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {salesForecast.trend?.toFixed(2) || 0}%
                    </p>
                  </Card>
                  <Card className="p-4 text-center">
                    <p className="text-sm text-gray-600">Confidence</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {(salesForecast.confidence * 100)?.toFixed(1) || 0}%
                    </p>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No sales forecast data available
              </div>
            )}
          </Card>
        </div>
      </Tabs>
    </div>
  );
};

export default ForecastDashboard;
