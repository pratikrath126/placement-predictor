import { useEffect, useRef, useState } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement)

function EDASection() {
    const [chartData, setChartData] = useState(null)

    useEffect(() => {
        // ACCURATE data from actual dataset analysis
        // Total: 5000 students, Placed: 866 (17.3%), Not Placed: 4134 (82.7%)
        setChartData({
            placement: {
                labels: ['Not Placed (82.7%)', 'Placed (17.3%)'],
                datasets: [{
                    data: [4134, 866],
                    backgroundColor: ['rgba(239, 68, 68, 0.8)', 'rgba(16, 185, 129, 0.8)'],
                    borderColor: ['rgb(239, 68, 68)', 'rgb(16, 185, 129)'],
                    borderWidth: 2
                }]
            },
            // Feature importance from Logistic Regression (normalized percentages)
            featureImportance: {
                labels: ['Backlogs', 'Tech Skills', 'CGPA', 'Soft Skills', 'Others'],
                datasets: [{
                    label: 'Feature Importance (%)',
                    data: [37.5, 23.6, 23.5, 16.2, 3.2],
                    backgroundColor: [
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(118, 75, 162, 0.8)',
                        'rgba(245, 158, 11, 0.8)'
                    ],
                    borderRadius: 8
                }]
            },
            // Backlogs distribution vs placement (KEY INSIGHT from actual data)
            backlogsDistribution: {
                labels: ['0 Backlogs', '1 Backlog', '2 Backlogs', '3 Backlogs', '4 Backlogs', '5 Backlogs'],
                datasets: [
                    {
                        label: 'Placed',
                        data: [293, 272, 301, 0, 0, 0],
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderRadius: 8
                    },
                    {
                        label: 'Not Placed',
                        data: [563, 522, 513, 829, 852, 855],
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderRadius: 8
                    }
                ]
            },
            // CGPA distribution by placement
            cgpaDistribution: {
                labels: ['Placed Students', 'Not Placed Students'],
                datasets: [{
                    label: 'Average CGPA',
                    data: [8.43, 7.52],
                    backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(239, 68, 68, 0.8)'],
                    borderRadius: 8
                }]
            }
        })
    }, [])

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: 'rgba(255, 255, 255, 0.8)',
                    font: { family: 'Inter' }
                }
            }
        },
        scales: {
            x: {
                ticks: { color: 'rgba(255, 255, 255, 0.6)' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            y: {
                ticks: { color: 'rgba(255, 255, 255, 0.6)' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
        }
    }

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: 'rgba(255, 255, 255, 0.8)',
                    font: { family: 'Inter', size: 14 },
                    padding: 20
                }
            }
        }
    }

    if (!chartData) return null

    return (
        <section id="eda">
            <div className="section-header">
                <h2>Data Analytics & Insights</h2>
                <p>
                    Analysis of 5,000 student records revealing key factors that influence placement outcomes.
                </p>
            </div>
            <div className="eda-container">
                <div className="chart-grid">
                    <div className="chart-card">
                        <h3>📊 Placement Distribution (5,000 Students)</h3>
                        <div className="chart-wrapper">
                            <Doughnut data={chartData.placement} options={doughnutOptions} />
                        </div>
                    </div>

                    <div className="chart-card">
                        <h3>🎯 Feature Importance (Logistic Regression)</h3>
                        <div className="chart-wrapper">
                            <Bar data={chartData.featureImportance} options={chartOptions} />
                        </div>
                    </div>

                    <div className="chart-card">
                        <h3>⚠️ Backlogs vs Placement Outcome</h3>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '15px' }}>
                            Students with &gt;2 backlogs have significantly lower placement rates
                        </p>
                        <div className="chart-wrapper">
                            <Bar
                                data={chartData.backlogsDistribution}
                                options={chartOptions}
                            />
                        </div>
                    </div>

                    <div className="chart-card">
                        <h3>📈 Average CGPA Comparison</h3>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '15px' }}>
                            Placed students have higher average CGPA (8.43 vs 7.52)
                        </p>
                        <div className="chart-wrapper">
                            <Bar data={chartData.cgpaDistribution} options={chartOptions} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default EDASection
