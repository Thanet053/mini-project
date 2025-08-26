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
      
      // เรียก API พร้อมกันสำหรับทุก camera id
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

      // รอให้ทุก request เสร็จ
      const results = await Promise.all(promises);
      
      // รวมข้อมูลทั้งหมด (กรองข้อมูลที่ null ออก)
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

  const chartData = React.useMemo(() => {
    if (!data.length) return null;

    const vehicleTypes = [...new Set(data.flatMap(item =>
      item.details.map(detail => detail.vehicle_type_name)
    ))];

    const directions = [...new Set(data.flatMap(item =>
      item.details.map(detail => detail.direction_type_name)
    ))];

    const colors = [
      "rgba(75, 192, 192, 0.6)",
      "rgba(255, 99, 132, 0.6)",
      "rgba(54, 162, 235, 0.6)",
      "rgba(255, 206, 86, 0.6)",
      "rgba(153, 102, 255, 0.6)",
      "rgba(255, 159, 64, 0.6)",
    ];

    return {
      labels: vehicleTypes,
      datasets: directions.map((direction, index) => ({
        label: direction,
        data: vehicleTypes.map(type => {
          const count = data.reduce((sum, item) => {
            const detail = item.details.find(d =>
              d.vehicle_type_name === type &&
              d.direction_type_name === direction
            );
            return sum + (detail ? detail.count : 0);
          }, 0);
          return count;
        }),
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length].replace("0.6", "1"),
        borderWidth: 1,
      })),
    };
  }, [data]);

  // นับจำนวนกล้องที่มีข้อมูล
  const activeCameras = React.useMemo(() => {
    return [...new Set(data.map(item => item.camera_id))].sort();
  }, [data]);

  return (
    <div className="bg-light">
      {loading && (
        <div className="loading active" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">กำลังโหลด...</span>
          </div>
        </div>
      )}

      <div className="container py-5">
        <h1 className="text-center mb-4">ระบบนับจำนวนยานพาหนะ</h1>

        <div className="card mb-4">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3 justify-content-center">
                <div className="col-md-4">
                  <label className="form-label">วันที่เริ่มต้น</label>
                  <Flatpickr
                    className="form-control"
                    value={startDate}
                    onChange={([date]) => setStartDate(date)}
                    options={{
                      dateFormat: "Y-m-d",
                    }}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">วันที่สิ้นสุด</label>
                  <Flatpickr
                    className="form-control"
                    value={endDate}
                    onChange={([date]) => setEndDate(date)}
                    options={{
                      dateFormat: "Y-m-d",
                    }}
                  />
                </div>
              </div>
              <div className="text-center mt-3">
                <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                  {loading ? "กำลังค้นหา..." : "ค้นหาข้อมูลทุกกล้อง"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3 className="card-title mb-2">ผลการค้นหา - ข้อมูลรวมทุกกล้อง</h3>
            {activeCameras.length > 0 && (
              <p className="text-muted mb-4">
                มีข้อมูลจากกล้อง: {activeCameras.join(', ')} (ทั้งหมด {activeCameras.length} กล้อง)
              </p>
            )}
            <div className="table-responsive mb-4">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>รหัสกล้อง</th>
                    <th>ประเภทยานพาหนะ</th>
                    <th>ทิศทาง</th>
                    <th>จำนวน</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center">
                        ไม่พบข้อมูล
                      </td>
                    </tr>
                  ) : (
                    data
                      .sort((a, b) => parseInt(a.camera_id) - parseInt(b.camera_id))
                      .flatMap((item) =>
                        item.details.map((detail, index) => (
                          <tr key={`${item.camera_id}-${index}`}>
                            <td>{item.camera_id || "ไม่ระบุ"}</td>
                            <td>{detail.vehicle_type_name || "ไม่ระบุ"}</td>
                            <td>{detail.direction_type_name || "ไม่ระบุ"}</td>
                            <td>{detail.count || 0}</td>
                          </tr>
                        ))
                      )
                  )}
                </tbody>
              </table>
            </div>
            {chartData && (
              <div className="mt-4">
                <h4>แผนภูมิแสดงจำนวนยานพาหนะรวมทุกกล้อง</h4>
                <Bar
                  data={chartData}
                  options={{
                    responsive: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: "จำนวน",
                        },
                      },
                      x: {
                        title: {
                          display: true,
                          text: "ประเภทยานพาหนะ",
                        },
                      },
                    },
                    plugins: {
                      title: {
                        display: true,
                        text: "จำนวนยานพาหนะแยกตามประเภทและทิศทาง (รวมทุกกล้อง)",
                      },
                      legend: {
                        position: "top",
                      },
                    },
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}