"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Flatpickr from "react-flatpickr";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import React from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface VehicleDetail {
  vehicle_type_name: string;
  direction_type_name: string;
  count: number;
}

interface VehicleData {
  camera_id: string;
  details: VehicleDetail[];
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VehicleData[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cameraIds = [1, 2, 3, 4];
      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];
      
      const promises = cameraIds.map(async (id) => {
        try {
          const response = await fetch(
            `http://localhost:5678/webhook/vehicle_count/all?type=camera&id=${id}&start=${startDateStr}&stop=${endDateStr}`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            console.warn(`HTTP error for camera ${id}! status: ${response.status}`);
            return null;
          }

          const text = await response.text();
          if (!text) {
            console.warn(`No data from server for camera ${id}`);
            return null;
          }

          const responseData = JSON.parse(text);
          if (!responseData || !Array.isArray(responseData) || !responseData[0]?.data) {
            console.warn(`Invalid data format for camera ${id}`);
            return null;
          }

          return responseData[0].data;
        } catch (error) {
          console.warn(`Error fetching data for camera ${id}:`, error);
          return null;
        }
      });

      const results = await Promise.all(promises);
      const allData = results
        .filter(result => result !== null)
        .flat();

      setData(allData);
      
      if (allData.length === 0) {
        alert("ไม่พบข้อมูลในช่วงเวลาที่เลือก");
      }

    } catch (error: any) {
      console.error("Error:", error);
      alert("เกิดข้อผิดพลาดในการดึงข้อมูล");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const getCameraChartData = (cameraId: string) => {
    const cameraData = data.filter(item => item.camera_id === cameraId);
    if (!cameraData.length) return null;

    const vehicleTypes = [...new Set(cameraData.flatMap(item =>
      item.details.map(detail => detail.vehicle_type_name)
    ))];

    const directions = [...new Set(cameraData.flatMap(item =>
      item.details.map(detail => detail.direction_type_name)
    ))];

    const colors = [
      "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4",
    ];

    return {
      labels: vehicleTypes,
      datasets: directions.map((direction, index) => ({
        label: direction,
        data: vehicleTypes.map(type => {
          const count = cameraData.reduce((sum, item) => {
            const detail = item.details.find(d =>
              d.vehicle_type_name === type &&
              d.direction_type_name === direction
            );
            return sum + (detail ? detail.count : 0);
          }, 0);
          return count;
        }),
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length],
        borderWidth: 2,
        borderRadius: 8,
      })),
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11,
            weight: '600',
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#e5e7eb',
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 10,
          },
          color: '#6b7280',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 10,
          },
          color: '#6b7280',
        },
      },
    },
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid #fff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      )}

      <div className="container-fluid">
        {/* Header Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '30px',
          marginBottom: '30px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            textAlign: 'center',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            <h1 style={{
              fontSize: '3.5rem',
              fontWeight: '800',
              marginBottom: '10px',
              textShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              background: 'linear-gradient(135deg, #1e3a8a, #7c3aed)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              🚗 Vehicle Counter System
            </h1>
            <p style={{
              color: '#000',
              fontSize: '1.2rem',
              opacity: 0.9,
              fontWeight: '500'
            }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              marginBottom: '10px',
              textShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              background: 'linear-gradient(135deg, #1e3a8a, #7c3aed)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              ระบบนับจำนวนยานพาหนะอัจฉริยะ
            </h1>
            <p style={{
              color: '#000',
              fontSize: '1.2rem',
              opacity: 0.9,
              fontWeight: '500'
            }}>
              </p>  
            </p>
          </div>
        </div>

        {/* Control Panel */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '25px',
          marginBottom: '30px',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}>
          <div className="row g-4 align-items-end">
            {/* Start Date */}
            <div className="col-md-4">
              <div style={{
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                borderRadius: '16px',
                padding: '20px',
                color: 'white',
                boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)'
              }}>
                <label style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '10px',
                  display: 'block'
                }}>
                  📅 วันที่เริ่มต้น
                </label>
                <Flatpickr
                  className="form-control"
                  value={startDate}
                  onChange={([date]) => setStartDate(date)}
                  options={{
                    dateFormat: "Y-m-d",
                  }}
                  style={{
                    borderRadius: '12px',
                    border: 'none',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                />
              </div>
            </div>
            
            {/* End Date */}
            <div className="col-md-4">
              <div style={{
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                borderRadius: '16px',
                padding: '20px',
                color: 'white',
                boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)'
              }}>
                <label style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '10px',
                  display: 'block'
                }}>
                  📅 วันที่สิ้นสุด
                </label>
                <Flatpickr
                  className="form-control"
                  value={endDate}
                  onChange={([date]) => setEndDate(date)}
                  options={{
                    dateFormat: "Y-m-d",
                  }}
                  style={{
                    borderRadius: '12px',
                    border: 'none',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                />
              </div>
            </div>
            
            {/* Search Button */}
            <div className="col-md-4">
              <button 
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '18px 30px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  width: '100%',
                  cursor: 'pointer',
                  boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.3s ease',
                  transform: loading ? 'scale(0.95)' : 'scale(1)'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = loading ? 'scale(0.95)' : 'scale(1.05)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = loading ? 'scale(0.95)' : 'scale(1)';
                }}
              >
                {loading ? '🔄 กำลังค้นหา...' : '🔍 ค้นหาข้อมูล'}
              </button>
            </div>
          </div>
        </div>

        {/* Camera Grid */}
        <div className="row g-4">
          {[1, 2, 3, 4].map((cameraNum) => {
            const cameraId = cameraNum.toString();
            const cameraData = data.filter(item => item.camera_id === cameraId);
            const chartData = getCameraChartData(cameraId);
            const hasData = cameraData.length > 0;

            const gradients = [
              'linear-gradient(135deg, #667eea, #764ba2)',
              'linear-gradient(135deg, #f093fb, #f5576c)',
              'linear-gradient(135deg, #4facfe, #00f2fe)',
              'linear-gradient(135deg, #43e97b, #38f9d7)'
            ];

            return (
              <div key={cameraNum} className="col-md-6">
                <div style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  height: '500px',
                  transition: 'all 0.3s ease'
                }}>
                  {/* Camera Header */}
                  <div style={{
                    background: gradients[cameraNum - 1],
                    padding: '20px',
                    color: 'white',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '-50%',
                      left: '-50%',
                      width: '200%',
                      height: '200%',
                      background: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
                      animation: 'float 20s ease-in-out infinite'
                    }}></div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <h2 style={{
                        fontSize: '2.5rem',
                        fontWeight: '800',
                        margin: '0',
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                      }}>
                        📹 Camera {cameraNum}
                      </h2>
                      <div style={{
                        display: 'inline-block',
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '20px',
                        padding: '5px 15px',
                        marginTop: '10px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {hasData ? `✅ Active` : `⭕ No Data`}
                      </div>
                    </div>
                  </div>
                  
                  {/* Camera Content */}
                  <div style={{ padding: '20px', height: 'calc(100% - 100px)', overflow: 'auto' }}>
                    {hasData ? (
                      <>
                        {/* Stats Cards */}
                        <div style={{ marginBottom: '20px' }}>
                          <div className="row g-2">
                            {cameraData.flatMap(item => item.details).slice(0, 4).map((detail, index) => (
                              <div key={index} className="col-6">
                                <div style={{
                                  background: `linear-gradient(135deg, ${['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'][index]}, ${['#4f46e5', '#7c3aed', '#db2777', '#d97706'][index]})`,
                                  borderRadius: '12px',
                                  padding: '12px',
                                  color: 'white',
                                  textAlign: 'center',
                                  fontSize: '11px'
                                }}>
                                  <div style={{ fontWeight: '800', fontSize: '18px' }}>{detail.count}</div>
                                  <div style={{ opacity: 0.9 }}>{detail.vehicle_type_name}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Chart */}
                        {chartData && (
                          <div style={{ 
                            height: '240px',
                            background: 'rgba(248, 250, 252, 0.8)',
                            borderRadius: '16px',
                            padding: '15px'
                          }}>
                            <Bar data={chartData} options={chartOptions} />
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        flexDirection: 'column'
                      }}>
                        <div style={{
                          fontSize: '4rem',
                          marginBottom: '20px',
                          opacity: 0.3
                        }}>
                          📊
                        </div>
                        <p style={{
                          color: '#6b7280',
                          fontSize: '16px',
                          fontWeight: '500',
                          textAlign: 'center'
                        }}>
                          ไม่มีข้อมูลสำหรับกล้องนี้
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
        }
        
        .form-control:focus {
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
          border-color: #6366f1 !important;
        }
      `}</style>
    </div>
  );
}